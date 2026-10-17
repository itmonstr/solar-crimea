<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$allowedOrigins = [
    'https://itmonstr.github.io',
    'http://sundem.ru',
    'https://sundem.ru',
    'http://www.sundem.ru',
    'https://www.sundem.ru',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['ok' => false, 'message' => 'Метод не поддерживается.']);
}

$configPath = dirname(__DIR__, 2) . '/private/lead-config.php';
if (!is_file($configPath)) {
    error_log('Lead config is missing');
    respond(503, ['ok' => false, 'message' => 'Отправка временно недоступна. Позвоните нам по телефону.']);
}
$config = require $configPath;

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $payload = json_decode((string) file_get_contents('php://input'), true);
    $payload = is_array($payload) ? $payload : [];
} else {
    $payload = $_POST;
}

if (trim((string) ($payload['website'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

$name = clean((string) ($payload['name'] ?? ''), 100);
$phone = clean((string) ($payload['phone'] ?? ''), 40);
$context = clean((string) ($payload['context'] ?? 'Заявка с сайта'), 180);
$page = clean((string) ($payload['page'] ?? ''), 300);

if (mb_strlen($name) < 2 || strlen(preg_replace('/\D+/', '', $phone)) < 10) {
    respond(422, ['ok' => false, 'message' => 'Проверьте имя и номер телефона.']);
}

$rateKey = hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
$rateFile = sys_get_temp_dir() . '/sundem-lead-' . $rateKey;
$lastRequest = is_file($rateFile) ? (int) file_get_contents($rateFile) : 0;
if ($lastRequest > 0 && time() - $lastRequest < 20) {
    respond(429, ['ok' => false, 'message' => 'Заявка уже отправлена. Подождите немного.']);
}
@file_put_contents($rateFile, (string) time(), LOCK_EX);

$createdAt = date('d.m.Y H:i:s');
$lines = [
    'Новая заявка с сайта sundem.ru',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
    'Интерес: ' . $context,
    'Дата: ' . $createdAt,
];
if ($page !== '') {
    $lines[] = 'Страница: ' . $page;
}
$message = implode("\n", $lines);

$emailSent = sendEmail($config, $message, $name, $phone);
$maxSent = sendMax($config, $message, dirname($configPath));

if (!$emailSent && !$maxSent) {
    error_log('Lead delivery failed for all channels');
    respond(502, ['ok' => false, 'message' => 'Не удалось отправить заявку. Позвоните нам по телефону.']);
}

respond(200, ['ok' => true, 'message' => 'Заявка отправлена. Инженер свяжется с вами.']);

function sendEmail(array $config, string $message, string $name, string $phone): bool
{
    $to = (string) ($config['email_to'] ?? '');
    $from = (string) ($config['from_email'] ?? 'noreply@sundem.ru');
    if (!filter_var($to, FILTER_VALIDATE_EMAIL) || !filter_var($from, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    $subject = '=?UTF-8?B?' . base64_encode('Новая заявка — ' . $name . ' — ' . $phone) . '?=';
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'From: ДЭМ <' . $from . '>',
        'Reply-To: ' . $from,
    ];
    return @mail($to, $subject, $message, implode("\r\n", $headers));
}

function sendMax(array $config, string $message, string $privateDir): bool
{
    $token = trim((string) ($config['max_token'] ?? ''));
    if ($token === '' || !function_exists('curl_init')) {
        return false;
    }
    $chatId = trim((string) ($config['max_chat_id'] ?? ''));
    $chatIdFile = $privateDir . '/max-chat-id.txt';
    if ($chatId === '' && is_file($chatIdFile)) {
        $chatId = trim((string) file_get_contents($chatIdFile));
    }
    if ($chatId === '') {
        $chatId = discoverMaxChatId($token);
        if ($chatId !== '') {
            @file_put_contents($chatIdFile, $chatId, LOCK_EX);
        }
    }
    if ($chatId === '') {
        error_log('MAX chat_id is not available; start the bot first');
        return false;
    }

    $url = 'https://platform-api.max.ru/messages?chat_id=' . rawurlencode($chatId);
    $body = json_encode(['text' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $response = maxRequest($url, $token, 'POST', $body);
    return is_array($response) && !isset($response['error']);
}

function discoverMaxChatId(string $token): string
{
    $response = maxRequest('https://platform-api.max.ru/updates?limit=100&timeout=0', $token);
    $updates = is_array($response) && isset($response['updates']) && is_array($response['updates']) ? $response['updates'] : [];
    for ($i = count($updates) - 1; $i >= 0; $i--) {
        $update = $updates[$i];
        $chatId = $update['chat_id'] ?? $update['message']['recipient']['chat_id'] ?? null;
        if ($chatId !== null && $chatId !== '') {
            return (string) $chatId;
        }
    }
    return '';
}

function maxRequest(string $url, string $token, string $method = 'GET', ?string $body = null): ?array
{
    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => ['Authorization: ' . $token, 'Content-Type: application/json'],
    ]);
    if ($body !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if ($raw === false || $status < 200 || $status >= 300) {
        error_log('MAX API request failed: HTTP ' . $status . ' ' . $error);
        return null;
    }
    $decoded = json_decode((string) $raw, true);
    return is_array($decoded) ? $decoded : null;
}

function clean(string $value, int $maxLength): string
{
    $value = trim(preg_replace('/[\x00-\x1F\x7F]/u', ' ', $value) ?? '');
    return mb_substr($value, 0, $maxLength);
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
