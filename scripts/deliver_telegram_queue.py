import ftplib
import io
import json
import os
import urllib.request


FTP_HOST = os.environ['FTP_HOST']
FTP_USER = os.environ['FTP_USER']
FTP_PASSWORD = os.environ['FTP_PASSWORD']
TELEGRAM_TOKEN = os.environ['TELEGRAM_BOT_TOKEN']
TELEGRAM_CHAT_IDS = [
    chat_id.strip()
    for chat_id in os.environ['TELEGRAM_CHAT_ID'].replace(';', ',').split(',')
    if chat_id.strip()
]
RUN_ID = os.environ.get('GITHUB_RUN_ID', 'manual')
RUN_ATTEMPT = os.environ.get('GITHUB_RUN_ATTEMPT', '1')
PRIVATE_DIR = '/private'
PENDING = PRIVATE_DIR + '/telegram-pending.ndjson'
PROCESSING = PRIVATE_DIR + f'/telegram-processing-{RUN_ID}-{RUN_ATTEMPT}.ndjson'


def send_telegram(message, chat_id):
    payload = json.dumps({
        'chat_id': chat_id,
        'text': message,
    }, ensure_ascii=False).encode('utf-8')
    request = urllib.request.Request(
        f'https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        result = json.loads(response.read().decode('utf-8'))
    if not result.get('ok'):
        raise RuntimeError(result.get('description', 'Telegram rejected the message'))


def download(ftp, path):
    buffer = io.BytesIO()
    ftp.retrbinary('RETR ' + path, buffer.write)
    return buffer.getvalue().decode('utf-8')


ftp = ftplib.FTP_TLS()
ftp.connect(FTP_HOST, 21, timeout=25)
ftp.login(FTP_USER, FTP_PASSWORD)
ftp.prot_p()

try:
    try:
        ftp.rename(PENDING, PROCESSING)
    except ftplib.error_perm as error:
        if not str(error).startswith('550'):
            raise

    names = ftp.nlst(PRIVATE_DIR)
    batches = [
        name if name.startswith('/') else PRIVATE_DIR + '/' + name.rsplit('/', 1)[-1]
        for name in names
        if name.rsplit('/', 1)[-1].startswith('telegram-processing-')
    ]
    delivered = 0
    failed_lines = []

    for batch in batches:
        raw = download(ftp, batch)
        for line in raw.splitlines():
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
                message = str(entry.get('message', '')).strip()
                if not message:
                    continue
                delivered_to = {str(chat_id) for chat_id in entry.get('delivered_to', [])}
                failed = False
                for chat_id in TELEGRAM_CHAT_IDS:
                    if chat_id in delivered_to:
                        continue
                    try:
                        send_telegram(message, chat_id)
                        delivered_to.add(chat_id)
                        delivered += 1
                    except Exception as error:
                        print('Telegram delivery failed: ' + type(error).__name__)
                        failed = True
                if failed:
                    entry['delivered_to'] = sorted(delivered_to)
                    failed_lines.append(json.dumps(entry, ensure_ascii=False))
            except Exception as error:
                print('Telegram delivery failed: ' + type(error).__name__)
                failed_lines.append(line)
        ftp.delete(batch)

    if failed_lines:
        content = ('\n'.join(failed_lines) + '\n').encode('utf-8')
        ftp.storbinary('APPE ' + PENDING, io.BytesIO(content))
        raise RuntimeError(f'{len(failed_lines)} Telegram message(s) returned to queue')

    print(f'Delivered Telegram notifications: {delivered}')
finally:
    ftp.quit()
