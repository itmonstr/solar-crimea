(() => {
  const state = {
    name: '', phone: '', email: '', pain: [], painOther: '', objectType: '',
    apartmentLoads: [], apartmentOther: '', apartmentTime: '', apartmentFull: '', apartmentSimplicity: '',
    houseLoads: [], houseOther: '', houseDuration: '', houseComfort: '', housePowerful: [], housePowerfulOther: '', housePhase: '', houseGenerator: '', houseGeneratorConnect: '',
    businessImpact: [], businessOther: '', businessCritical: '', businessCriticalOther: '', businessDuration: '', businessGenerator: ''
  };
  const quizBody = document.getElementById('quizBody');
  const question = document.getElementById('question');
  const next = document.getElementById('nextBtn');
  const back = document.getElementById('backBtn');
  const actionBar = quizBody.querySelector(':scope > .test-quiz-actions');
  const aside = document.querySelector('#quiz .test-quiz-aside');
  const asideIntro = aside.innerHTML;
  const progress = document.getElementById('progressBar');
  const stepLabel = document.getElementById('stepLabel');
  let steps = [], index = 0;

  const pain = ['Остаёмся без света','Останавливается отопление','Нельзя пользоваться водой / насосами','Пропадают интернет и связь','Нельзя нормально готовить','Не работают ворота / бытовые системы','Останавливается работа','Портятся продукты / отключается холодильное оборудование','Другое'];
  const apartmentLoads = ['Холодильник','Газовый котёл','Освещение','Интернет / Wi-Fi','Телевизор','Компьютер / ноутбук','Зарядка телефонов','Небольшие бытовые приборы','Другое'];
  const houseLoads = ['Отопление / газовый котёл','Холодильник / морозильник','Скважина','Насосы','Освещение','Интернет / Wi-Fi','Ворота','Розетки на кухне','Телевизор','Компьютер','Кондиционеры','Бойлер','Электрическая плита','Бассейн / насосное оборудование','Система видеонаблюдения','Другое'];
  const powerful = ['Электрическая плита','Электрокотёл','Бойлер','Кондиционеры','Бассейн','Тепловой насос','Электромобиль','Сварочное оборудование','Другое','Нет'];
  const businessImpact = ['Остановится производство','Остановится кухня','Отключится холодильное оборудование','Остановятся насосы','Перестанет работать оборудование','Сотрудники не смогут работать','Потеряем клиентов','Возможна порча продукции','Возникнут финансовые потери','Другое'];
  const durations = ['2–4 часа','4–8 часов','Более 12 часов'];
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function buildSteps() {
    steps = ['object','pain'];
    if (state.objectType === 'Квартира') { steps.push('apartmentLoads','apartmentTime'); if (state.apartmentTime === 'Более 12 часов') steps.push('apartmentFull'); steps.push('apartmentSimplicity','result'); }
    if (state.objectType === 'Частный дом') { steps.push('houseLoads','houseDuration','houseComfort','housePowerful'); if (state.housePowerful.some(x => x !== 'Нет')) steps.push('housePhase'); steps.push('houseGenerator'); if (['Да','Планируем установить'].includes(state.houseGenerator)) steps.push('houseGeneratorConnect'); steps.push('result'); }
    if (state.objectType === 'Бизнес') steps.push('businessImpact','businessCritical','businessDuration','businessGenerator','result');
  }
  function setValue(key, value) { state[key] = value; render(); }
  function toggle(key, value) {
    const current = state[key];
    if (key === 'housePowerful' && value === 'Нет') state[key] = current.includes('Нет') ? [] : ['Нет'];
    else state[key] = (key === 'housePowerful' ? current.filter(x => x !== 'Нет') : current).includes(value) ? current.filter(x => x !== value) : [...(key === 'housePowerful' ? current.filter(x => x !== 'Нет') : current), value];
    render();
  }
  function valid() {
    const key = steps[index];
    if (key === 'contact') return state.name.trim().length > 1 && state.phone.replace(/\D/g,'').length >= 10 && /\S+@\S+\.\S+/.test(state.email);
    if (key === 'object') return !!state.objectType;
    if (key === 'pain' || key === 'apartmentLoads' || key === 'houseLoads' || key === 'businessImpact') {
      const otherKey = {pain:'painOther',apartmentLoads:'apartmentOther',houseLoads:'houseOther',businessImpact:'businessOther'}[key];
      return state[key].length > 0 && (!state[key].includes('Другое') || !!state[otherKey].trim());
    }
    if (['apartmentTime','apartmentFull','apartmentSimplicity','houseDuration','houseComfort','housePhase','houseGenerator','houseGeneratorConnect','businessDuration','businessGenerator'].includes(key)) return !!state[key];
    if (key === 'housePowerful') return state.housePowerful.length > 0 && (!state.housePowerful.includes('Другое') || !!state.housePowerfulOther.trim());
    if (key === 'businessCritical') return !!state.businessCritical && (state.businessCritical !== 'Другое' || !!state.businessCriticalOther.trim());
    return true;
  }
  function options(title, copy, key, values, multi = false) {
    const selected = multi ? state[key] : [state[key]];
    const otherKey = {pain:'painOther',apartmentLoads:'apartmentOther',houseLoads:'houseOther',housePowerful:'housePowerfulOther',businessImpact:'businessOther',businessCritical:'businessCriticalOther'}[key];
    const otherField = otherKey && selected.includes('Другое') ? `<label class="other-field">Уточните свой вариант<input class="text-field" data-other-input="${otherKey}" value="${esc(state[otherKey])}" placeholder="Опишите своими словами"></label>` : '';
    return `<h2 class="question-title">${title}</h2><p class="question-copy">${copy}</p><div class="options-list">${values.map(v => `<button class="option-button ${selected.includes(v) ? 'selected' : ''}" type="button" aria-pressed="${selected.includes(v)}" data-key="${key}" data-value="${esc(v)}" data-multi="${multi}"><span class="option-indicator"></span><span><b>${esc(v)}</b></span></button>`).join('')}</div>${otherField}`;
  }
  function result() {
    let r;
    if (state.objectType === 'Квартира') {
      if (state.apartmentTime === '2–4 часа') r = {
        badge:'Готовое автономное решение', title:'PECRON E1500LFP',
        why:'Вам нужен простой способ сохранить работу основных приборов во время короткого отключения. Для такого сценария стационарная система может быть избыточной.',
        cfg:['Мощность — 2 200 Вт','Ёмкость — 1 536 Вт·ч','Подключил и пользуйся — без сложного монтажа'],
        note:'Фактическое время работы зависит от суммарной мощности подключённых приборов.'
      };
      else if (state.apartmentTime === '4–8 часов') r = {
        badge:'Увеличенная автономность', title:'PECRON E2400LFP',
        why:'Вам важно сохранить работу выбранных приборов не только при коротком отключении, поэтому предварительно подходит более ёмкая автономная станция.',
        cfg:['Мощность — 2 400 Вт','Ёмкость — 2 048 Вт·ч','Подходит для длительного питания базового набора нагрузок'],
        note:'Окончательная модель подтверждается после проверки мощности выбранных приборов.'
      };
      else if (state.apartmentFull !== 'Нет' || state.apartmentSimplicity === 'Готов рассмотреть стационарную систему ради большей автономности') r = {
        badge:'Стационарная система без солнечных панелей', title:'Deye 6 кВт + аккумулятор',
        why:'При автономности более 12 часов портативной станции может быть недостаточно. Стационарная гибридная система с аккумулятором даст больший запас и возможность последующего расширения.',
        cfg:['Инвертор Deye SUN-6K-SG05LP1-EU-AM2-P','1 аккумулятор Deye SE-G5.1 Pro-B — 5,12 кВт·ч','Солнечные панели в стартовую конфигурацию не входят'],
        note:'Количество аккумуляторов и перечень резервируемых линий определяются после расчёта нагрузки.'
      };
      else r = {
        badge:'Максимум в портативном формате', title:'PECRON E3800LFP',
        why:'Вы хотите длительную автономность, но пока не рассматриваете стационарную систему. Поэтому стартовым решением может стать станция повышенной мощности и ёмкости.',
        cfg:['Мощность — 4 200 Вт','Ёмкость — 3 840 Вт·ч','Высокий запас для нескольких бытовых нагрузок'],
        note:'Для работы более 12 часов может потребоваться дополнительная ёмкость или переход на стационарную систему.'
      };
    } else if (state.objectType === 'Частный дом') {
      const powerfulCount = state.housePowerful.filter(x => x !== 'Нет').length;
      if (state.houseComfort === 'Не хочу замечать отключение' || state.houseDuration === 'Более 12 часов' || (powerfulCount >= 3 && state.houseComfort === 'Хочу продолжать жить практически как обычно')) r = {
        badge:'Высокий уровень резервирования', title:'Система на базе Deye 15 кВт',
        why:'Вы хотите сохранить высокий уровень комфорта и/или отметили мощные потребители. Для такого сценария требуется серьёзная система с обязательным инженерным расчётом.',
        cfg:['Трёхфазный инвертор SUN-15K-SG05LP3-EU-SM2','24 панели JINKO Tiger NEO III по 640 Вт','3 аккумулятора Deye SE-G5.1 Pro-B по 5,12 кВт·ч'],
        note:state.housePhase === '1 фаза' ? 'У вас указан однофазный ввод: итоговую конфигурацию необходимо скорректировать после обследования.' : 'Точный состав системы определяется после анализа фазности, нагрузок и технических условий.'
      };
      else if (state.houseDuration === '4–8 часов' || state.houseComfort === 'Хочу продолжать жить практически как обычно' || powerfulCount > 0) r = {
        badge:'Комфортный резерв для дома', title:'Система на базе Deye 8 кВт',
        why:'Вы хотите сохранить не только критические системы, но и привычный бытовой сценарий. Этот уровень позволяет рассматривать более широкий набор домашних нагрузок.',
        cfg:['Однофазный инвертор SUN-8K-SG05LP1-EU-AM2-P','16 панелей JINKO Tiger NEO III по 640 Вт','2 аккумулятора Deye SE-G5.1 Pro-B по 5,12 кВт·ч'],
        note:'Состав панелей и аккумуляторов может быть изменён после расчёта фактической нагрузки.'
      };
      else r = {
        badge:'Критические нагрузки без переплаты', title:'Система на базе Deye 6 кВт',
        why:'Ваша основная задача — сохранить отопление, холодильник, насосы, освещение, интернет и другие необходимые системы на время отключения.',
        cfg:['Однофазный инвертор SUN-6K-SG05LP1-EU-AM2-P','8 панелей JINKO Tiger NEO III по 640 Вт','1 аккумулятор Deye SE-G5.1 Pro-B — 5,12 кВт·ч'],
        note:'Систему можно расширить аккумуляторами, генератором или дополнительной солнечной генерацией.'
      };
    } else r = {
      badge:'Решение для бизнеса', title:'Индивидуальная система резервного электроснабжения',
      why:'Для бизнеса универсальный комплект подобрать невозможно: необходимо учесть стоимость простоя, мощность оборудования, режим работы и требования к непрерывности.',
      cfg:['Гибридный инвертор и автоматика','Расчёт аккумуляторной ёмкости','При необходимости — солнечные панели и генератор','Обследование объекта и инженерный расчёт'],
      note:'Следующий шаг — уточнение критических нагрузок и технических условий на объекте.'
    };
    const labels = state.objectType === 'Частный дом'
      ? ['Инвертор', 'Солнечные панели', 'Аккумуляторы']
      : state.objectType === 'Бизнес'
        ? ['Оборудование', 'Запас энергии', 'Дополнительно', 'Следующий шаг']
        : r.title.startsWith('PECRON')
          ? ['Мощность', 'Ёмкость', 'Формат использования']
          : ['Инвертор', 'Аккумулятор', 'Солнечные панели'];
    return `<div class="result-card"><span class="result-badge">${esc(r.badge)}</span><h2>${esc(r.title)}</h2><p class="result-why">${esc(r.why)}</p><h3 class="result-section-title">Состав решения</h3><div class="result-config">${r.cfg.map((item, i) => `<div class="result-config-row"><span class="result-config-index">${String(i + 1).padStart(2, '0')}</span><span class="result-config-label">${esc(labels[i])}</span><strong class="result-config-value">${esc(r.title.startsWith('PECRON') && i < 2 ? item.replace(/^[^—]+—\s*/, '') : item)}</strong></div>`).join('')}</div><p class="result-note">${esc(r.note)}</p><div class="test-quiz-actions"><button class="test-back-button" type="button" id="backResult">← Изменить ответы</button><button class="test-primary-button" type="button" id="printResult">Сохранить в PDF <span>↗</span></button></div></div>`;
  }
  function render() {
    buildSteps(); const key = steps[index]; const total = Math.max(steps.length - 1, 1); progress.style.width = `${Math.max(30,index/total*100)}%`; stepLabel.textContent = key === 'result' ? 'Результат' : `Шаг ${index + 1}`; back.disabled = index === 0;
    document.getElementById('quiz').classList.toggle('is-result', key === 'result');
    actionBar.hidden = key === 'result';
    const selectedLoads = state.objectType === 'Квартира' ? state.apartmentLoads : state.objectType === 'Частный дом' ? state.houseLoads : state.businessImpact;
    const loadHeading = state.objectType === 'Бизнес' ? 'Последствия отключения' : 'Что важно сохранить';
    const loadItems = selectedLoads.slice(0, 5).map(item => `<li>${esc(item)}</li>`).join('');
    const remainingLoads = selectedLoads.length > 5 ? `<li class="result-loads-more">И ещё ${selectedLoads.length - 5}</li>` : '';
    aside.innerHTML = key === 'result' ? `<span class="test-aside-label">ВАШИ ОТВЕТЫ</span><dl><div><dt>Объект</dt><dd>${esc(state.objectType)}</dd></div><div><dt>Нужная автономность</dt><dd>${esc(state.apartmentTime || state.houseDuration || state.businessDuration || 'Уточняется')}</dd></div><div><dt>${loadHeading}</dt><dd><ul class="result-loads">${loadItems}${remainingLoads}</ul></dd></div></dl>` : asideIntro;
    if (key === 'contact') question.innerHTML = `<h2 class="question-title">Расскажите, как с вами связаться</h2><p class="question-copy">Контакты останутся только в этой форме. Рекомендация появится на экране после ответов.</p><div class="options-list"><label class="contact-field">Ваше имя<input class="text-field" id="name" autocomplete="name" placeholder="Имя" value="${esc(state.name)}"></label><label class="contact-field">Номер телефона<input class="text-field" id="phone" autocomplete="tel" inputmode="tel" placeholder="+7 900 000-00-00" value="${esc(state.phone)}"></label><label class="contact-field">Электронная почта<input class="text-field" id="email" autocomplete="email" inputmode="email" placeholder="name@example.ru" value="${esc(state.email)}"></label></div>`;
    else if (key === 'pain') question.innerHTML = options('Какие последствия отключения наиболее критичны?','Выберите один или несколько вариантов.',key,pain,true);
    else if (key === 'object') question.innerHTML = options('Где нужно обеспечить резерв?','После выбора покажем только нужные вопросы.','objectType',['Квартира','Частный дом','Бизнес']);
    else if (key === 'apartmentLoads') question.innerHTML = options('Что нужно сохранить в квартире?','Можно выбрать несколько вариантов.',key,apartmentLoads,true);
    else if (key === 'apartmentTime') question.innerHTML = options('На сколько часов нужна автономность?','Укажите желаемое время работы.',key,durations);
    else if (key === 'apartmentFull') question.innerHTML = options('Нужно запитать всю квартиру?','Или только выбранные приборы?',key,['Да','Нет']);
    else if (key === 'apartmentSimplicity') question.innerHTML = options('Готовы рассмотреть стационарную систему?','Она требует монтажа, но даёт больший запас.',key,['Готов рассмотреть стационарную систему ради большей автономности','Хочу готовую портативную станцию']);
    else if (key === 'houseLoads') question.innerHTML = options('Что важно сохранить в доме?','Можно выбрать несколько вариантов.',key,houseLoads,true);
    else if (key === 'houseDuration') question.innerHTML = options('На сколько часов нужна автономность?', 'Выберите желаемый сценарий.',key,durations);
    else if (key === 'houseComfort') question.innerHTML = options('Какой уровень комфорта нужен?', 'От критических нагрузок до привычной жизни.',key,['Достаточно критических нагрузок','Хочу продолжать жить практически как обычно','Не хочу замечать отключение']);
    else if (key === 'housePowerful') question.innerHTML = options('Есть ли мощные потребители?', 'Можно выбрать несколько вариантов или «Нет».',key,powerful,true);
    else if (key === 'housePhase') question.innerHTML = options('Какая фазность на вводе?', 'Это важно для выбора инвертора.',key,['1 фаза','3 фазы','Не знаю']);
    else if (key === 'houseGenerator') question.innerHTML = options('Есть ли генератор?', 'Это повлияет на конфигурацию.',key,['Нет','Да','Планируем установить','Не знаю']);
    else if (key === 'houseGeneratorConnect') question.innerHTML = options('Нужно подключить генератор к системе?', 'Уточним способ резервирования.',key,['Да','Нет','Не знаю']);
    else if (key === 'businessImpact') question.innerHTML = options('Что произойдёт при отключении?', 'Можно выбрать несколько последствий.',key,businessImpact,true);
    else if (key === 'businessCritical') question.innerHTML = options('Что критично сохранить?', 'Опишите главный процесс или оборудование.',key,['Производство','Холодильное оборудование','Насосы и вентиляция','Серверы и связь','Другое']);
    else if (key === 'businessDuration') question.innerHTML = options('На сколько часов нужен резерв?', 'Выберите минимально необходимое время.',key,durations);
    else if (key === 'businessGenerator') question.innerHTML = options('Есть ли генератор?', 'Это повлияет на возможную конфигурацию.',key,['Нет','Да','Планируем установить','Не знаю']);
    else question.innerHTML = result();
    next.hidden = key === 'result';
    question.querySelectorAll('[data-key]').forEach(btn => btn.addEventListener('click', () => btn.dataset.multi === 'true' ? toggle(btn.dataset.key, btn.dataset.value) : setValue(btn.dataset.key, btn.dataset.value)));
    question.querySelectorAll('[data-other-input]').forEach(input => input.addEventListener('input', e => { state[input.dataset.otherInput] = e.target.value; next.disabled = !valid(); }));
    ['name','phone','email'].forEach(id => $(id)?.addEventListener('input', e => { state[id] = e.target.value; next.disabled = !valid(); }));
    next.disabled = !valid();
    $('printResult')?.addEventListener('click', () => window.print());
    $('backResult')?.addEventListener('click', () => { index = Math.max(0,index-1); render(); });
  }
  next.addEventListener('click', () => { if (valid() && index < steps.length - 1) { index++; render(); if (steps[index] === 'result') requestAnimationFrame(() => document.getElementById('quiz').scrollIntoView({ block: 'start', behavior: 'smooth' })); } });
  back.addEventListener('click', () => { index = Math.max(0,index-1); render(); });
  render();
})();
