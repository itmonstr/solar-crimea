/* ==========================================================================
   ДЭМ (Дом · Энергия · Монтаж) — интерактивная логика
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initMarquee();
  initReveal();
  initCounters();
  initCalculator();
  initPortfolio();
  initCatalog();
  initFAQ();
  initModals();
  initPhoneMask();
  initDepthEffects();
  initMobileKitRail();
  initHeroVideo();
});

function initHeroVideo() {
  const video = document.getElementById('heroVideo');
  const toggle = document.getElementById('heroVideoToggle');
  if (!video || !toggle) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || navigator.connection?.saveData) return;

  let inView = true;
  let manuallyPaused = false;
  const play = () => {
    if (manuallyPaused || !inView || document.hidden) return;
    video.play().catch(() => { toggle.hidden = true; });
  };
  video.addEventListener('playing', () => {
    video.classList.add('is-ready');
    toggle.hidden = false;
  });
  video.addEventListener('error', () => {
    video.classList.remove('is-ready');
    toggle.hidden = true;
  });
  toggle.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    if (manuallyPaused) video.pause();
    else play();
    toggle.innerHTML = manuallyPaused ? 'Включить <span aria-hidden="true">▶</span>' : 'Пауза <span aria-hidden="true">Ⅱ</span>';
    toggle.setAttribute('aria-label', manuallyPaused ? 'Включить фоновое видео' : 'Остановить фоновое видео');
    toggle.setAttribute('aria-pressed', String(manuallyPaused));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) play(); else video.pause();
    }, { threshold: .05 }).observe(video);
  }
  video.src = video.dataset.src;
  video.load();
  play();
}

function initMobileKitRail() {
  const rail = document.querySelector('#kits .menu');
  if (!rail) return;
  const cards = [...rail.children];
  const controls = document.createElement('div');
  controls.className = 'mobile-rail-nav';
  controls.innerHTML = '<span>Выберите мощность <span class="rail-count">01 / 03</span></span><div><button type="button" aria-label="Предыдущий комплект">←</button><button type="button" aria-label="Следующий комплект">→</button></div>';
  rail.before(controls);
  rail.tabIndex = 0;
  rail.setAttribute('aria-label', 'Готовые комплекты: прокрутите, чтобы сравнить');
  const [prev, next] = controls.querySelectorAll('button');
  const count = controls.querySelector('.rail-count');
  const update = () => {
    const position = Math.max(0, rail.scrollLeft);
    const end = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const index = end - position < 3 ? cards.length - 1 : Math.min(cards.length - 1, Math.round(position / (cards[0].offsetWidth + 14)));
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    prev.disabled = position < 3;
    next.disabled = end - position < 3;
  };
  const move = direction => rail.scrollBy({ left: direction * (cards[0].offsetWidth + 14), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  rail.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  rail.addEventListener('keydown', event => {
    if (event.target !== rail || !window.matchMedia('(max-width: 600px)').matches) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  update();
}

function initDepthEffects() {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('[data-depth]').forEach(surface => {
    surface.addEventListener('pointermove', event => {
      if (motion.matches || !pointer.matches) return;
      const bounds = surface.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      surface.style.setProperty('--tilt-x', `${-y * 5}deg`);
      surface.style.setProperty('--tilt-y', `${x * 7}deg`);
    }, { passive: true });
    surface.addEventListener('pointerleave', () => {
      surface.style.removeProperty('--tilt-x');
      surface.style.removeProperty('--tilt-y');
    });
  });
  const sculpture = document.querySelector('.energy-scene');
  if (sculpture && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      sculpture.classList.toggle('is-paused', !entries[0].isIntersecting);
    }).observe(sculpture);
  }
}

/* ============================ 1. ШАПКА ============================ */
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ============================ 2. МОБИЛЬНОЕ МЕНЮ ============================ */
function initMobileMenu() {
  const burger = document.getElementById('burgerToggle');
  const menu = document.getElementById('navMenu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

/* ============================ 3. БЕГУЩАЯ СТРОКА ============================ */
function initMarquee() {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  // Дублируем содержимое для бесшовного зацикливания
  track.innerHTML += track.innerHTML;
}

/* ============================ 4. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ ============================ */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
}

/* ============================ 5. СЧЁТЧИКИ ============================ */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ============================ 6. КАЛЬКУЛЯТОР ============================ */
function initCalculator() {
  const propTabs = document.querySelectorAll('#propTypeTabs .calc-tab');
  const taskTabs = document.querySelectorAll('#taskTabs .calc-tab');
  const slider = document.getElementById('sliderArea');
  const areaCounter = document.getElementById('areaCounter');

  if (!propTabs.length) return;

  const kitDisplay = document.getElementById('calcKitDisplay');
  const inverterDisplay = document.getElementById('calcInverterDisplay');
  const panelsDisplay = document.getElementById('calcPanelsDisplay');
  const batteryDisplay = document.getElementById('calcBatteryDisplay');
  const noteDisplay = document.getElementById('calcNoteDisplay');
  const ctaBtn = document.getElementById('calcCtaBtn');

  let currentType = 'cottage';
  let currentTask = 'autonomy';
  let currentArea = 160;

  function update() {
    let kitName = 'Комплект №2 (8 кВт)';
    let invPower = '8 кВт';
    let panelsCount = '16 шт.';
    let batteryCap = '314 А·ч';
    let note = 'Оптимальное решение для постоянного проживания семьи: питание котла, холодильников, кондиционеров и насосов.';

    if (currentType === 'dacha' || (currentArea <= 80 && currentTask !== 'autonomy')) {
      kitName = 'Комплект №1 (6 кВт)';
      invPower = '6 кВт';
      panelsCount = '8 шт.';
      batteryCap = '100 А·ч';
      note = 'Экономичный стартовый комплект для дачи или сезонного отдыха: надёжный резерв и покрытие основных нагрузок.';
    } else if (currentArea >= 220 || currentType === 'hotel') {
      kitName = 'Комплект №3 (15 кВт, 3 фазы)';
      invPower = '15 кВт';
      panelsCount = '24 шт.';
      batteryCap = '314 А·ч';
      note = 'Трёхфазная станция повышенной мощности для больших резиденций, мини-отелей и коттеджей с электроотоплением.';
    }

    if (kitDisplay) kitDisplay.textContent = kitName;
    if (inverterDisplay) inverterDisplay.textContent = invPower;
    if (panelsDisplay) panelsDisplay.textContent = panelsCount;
    if (batteryDisplay) batteryDisplay.textContent = batteryCap;
    if (noteDisplay) noteDisplay.textContent = note;

    if (ctaBtn) {
      ctaBtn.onclick = () => openLeadModal(`Заказ по калькулятору: ${kitName}`);
    }
  }

  propTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      propTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.getAttribute('data-type');
      update();
    });
  });

  taskTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      taskTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTask = tab.getAttribute('data-task');
      update();
    });
  });

  if (slider && areaCounter) {
    slider.addEventListener('input', (e) => {
      currentArea = parseInt(e.target.value, 10);
      areaCounter.textContent = `${currentArea} м²`;
      update();
    });
  }

  update();
}

/* ============================ 7. ПОРТФОЛИО ============================ */
function initPortfolio() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tiles = document.querySelectorAll('.gallery-tile');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const closeBtn = document.getElementById('closeLightbox');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.getAttribute('data-filter');

      tiles.forEach(tile => {
        const cat = tile.getAttribute('data-cat');
        tile.style.display = (f === 'all' || cat === f) ? 'block' : 'none';
      });
    });
  });

  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const src = tile.getAttribute('data-full');
      const name = tile.getAttribute('data-name');
      if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        if (lightboxTitle) lightboxTitle.textContent = name;
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

/* ============================ 8. КАТАЛОГ ============================ */
function initCatalog() {
  const tabBtns = document.querySelectorAll('.catalog-tab');
  const cards = document.querySelectorAll('.product-row');

  const categoryCopy = {
    panels: 'Высокоэффективная солнечная панель для стационарной электростанции. Подходит для установки на кровле и наземной конструкции.',
    inverters: 'Гибридный инвертор управляет солнечной генерацией, аккумулятором и сетью. Подбирается по мощности и числу фаз объекта.',
    batteries: 'Аккумуляторный блок сохраняет выработанную энергию для вечернего потребления и резервного питания.',
    pecron: 'Портативное решение для автономного питания. Удобно для поездок, дачи и резервного использования.'
  };
  const productCopy = [
    ['JINKO', 'Панель мощностью 640 Вт с технологией N-Type TOPCon. Основа для стационарной солнечной станции на кровле или наземной конструкции.'],
    ['PECRON 300', 'Портативная солнечная панель мощностью 300 Вт. Помогает заряжать совместимую станцию вдали от розетки.'],
    ['PECRON 200', 'Компактная портативная панель мощностью 200 Вт для поездок, дачи и мобильной системы питания.'],
    ['E3800LFP', 'Портативная электростанция мощностью 4200 Вт с запасом энергии 3840 Вт·ч для автономного и резервного питания.'],
    ['E2400LFP', 'Портативная электростанция мощностью 2400 Вт с ёмкостью 2048 Вт·ч для дома, дачи и выездных задач.'],
    ['E1500LFP', 'Портативная электростанция мощностью 2200 Вт с ёмкостью 1536 Вт·ч для питания техники при отключениях.'],
    ['Deye на 6', 'Однофазный гибридный инвертор 6 кВт для управления солнечной генерацией, аккумулятором и резервным питанием дома.'],
    ['Deye на 8', 'Однофазный гибридный инвертор 8 кВт для станции с увеличенной нагрузкой и аккумуляторным резервом.'],
    ['Deye на 15', 'Трёхфазный гибридный инвертор 15 кВт для крупного дома или объекта с трёхфазным подключением.'],
    ['Dyness 5.12', 'Аккумуляторный блок 5,12 кВт·ч, 100 А·ч. Сохраняет дневную генерацию для вечернего потребления и резерва.'],
    ['Dyness 16.076', 'Аккумуляторный блок 16,076 кВт·ч, 314 А·ч для системы с большим запасом автономной энергии.']
  ];
  const categoryNames = { panels: 'Солнечные панели', inverters: 'Гибридные инверторы', batteries: 'Аккумуляторы', pecron: 'Портативные станции' };

  const detail = document.createElement('div');
  detail.className = 'product-detail-modal';
  detail.setAttribute('role', 'dialog');
  detail.setAttribute('aria-modal', 'true');
  detail.setAttribute('aria-label', 'Описание товара');
  detail.innerHTML = '<div class="product-detail-panel"><button class="product-detail-close" type="button" aria-label="Закрыть описание">×</button><div class="product-detail-image"><img alt=""></div><div class="product-detail-copy"><span class="product-detail-category"></span><h3 class="product-detail-title"></h3><p class="product-detail-model"></p><p class="product-detail-description"></p><div class="product-detail-bottom"><strong class="product-detail-price"></strong><button class="btn btn-primary product-detail-order" type="button">Оставить заявку</button></div></div></div>';
  document.body.appendChild(detail);
  const closeDetail = () => { detail.classList.remove('open'); document.body.style.overflow = ''; };
  detail.querySelector('.product-detail-close').addEventListener('click', closeDetail);
  detail.addEventListener('click', e => { if (e.target === detail) closeDetail(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && detail.classList.contains('open')) closeDetail(); });

  cards.forEach(card => {
    const name = card.querySelector('.pl-name')?.textContent || '';
    const model = card.querySelector('.pl-model')?.textContent || '';
    const price = card.querySelector('.pl-price')?.textContent || '';
    const img = card.querySelector('.pl-thumb');
    const group = card.dataset.group;
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'product-details-btn';
    detailsBtn.type = 'button';
    detailsBtn.textContent = 'Подробнее ↗';
    detailsBtn.setAttribute('aria-label', `Подробнее о ${name}`);
    card.appendChild(detailsBtn);

    const showDetail = () => {
      detail.querySelector('.product-detail-image img').src = img?.src || '';
      detail.querySelector('.product-detail-image img').alt = name;
      detail.querySelector('.product-detail-category').textContent = categoryNames[group] || 'Оборудование';
      detail.querySelector('.product-detail-title').textContent = name;
      detail.querySelector('.product-detail-model').textContent = model;
      detail.querySelector('.product-detail-description').textContent = productCopy.find(([key]) => name.includes(key))?.[1] || categoryCopy[group] || '';
      detail.querySelector('.product-detail-price').textContent = price;
      detail.querySelector('.product-detail-order').onclick = () => { closeDetail(); openLeadModal(`Заказ: ${name}`); };
      detail.classList.add('open');
      document.body.style.overflow = 'hidden';
      detail.querySelector('.product-detail-close').focus();
    };
    detailsBtn.addEventListener('click', showDetail);
    img?.addEventListener('click', showDetail);
  });

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.getAttribute('data-tab');

      cards.forEach(card => {
        const group = card.getAttribute('data-group');
        card.style.display = (tab === 'all' || group === tab) ? 'grid' : 'none';
      });
    });
  });
}

/* ============================ 9. FAQ ============================ */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;

    q.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Закрываем остальные
      items.forEach(other => {
        other.classList.remove('active');
        const otherA = other.querySelector('.faq-a');
        if (otherA) otherA.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });
}

/* ============================ 10. МОДАЛКИ ============================ */
function initModals() {
  const modal = document.getElementById('leadModal');
  const closeBtn = document.getElementById('closeLeadModal');
  const openBtns = document.querySelectorAll('.open-lead-modal');

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-title') || 'Оставить заявку';
      openLeadModal(title);
    });
  });

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      const lightbox = document.getElementById('lightbox');
      if (lightbox) lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

function openLeadModal(title) {
  const modal = document.getElementById('leadModal');
  const modalTitle = document.getElementById('modalLeadTitle');
  if (modalTitle) modalTitle.textContent = title;
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function handleLead(e) {
  e.preventDefault();
  showToast('Заявка успешно отправлена! Инженер ДЭМ перезвонит вам.');
  e.target.reset();
}

function handleLeadSubmit(e) {
  e.preventDefault();
  const modal = document.getElementById('leadModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  showToast('Спасибо! Ваша заявка принята инженерами ДЭМ.');
  e.target.reset();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ============================ 11. МАСКА ТЕЛЕФОНА ============================ */
function initPhoneMask() {
  const inputs = document.querySelectorAll('.phone-mask');

  inputs.forEach(input => {
    input.addEventListener('input', () => {
      let v = input.value.replace(/\D/g, '');
      if (!v) { input.value = ''; return; }
      if (v[0] === '9') v = '7' + v;
      let formatted = (v[0] === '8') ? '8 ' : '+7 ';

      if (v.length > 1) formatted += '(' + v.substring(1, 4);
      if (v.length >= 5) formatted += ') ' + v.substring(4, 7);
      if (v.length >= 8) formatted += '-' + v.substring(7, 9);
      if (v.length >= 10) formatted += '-' + v.substring(9, 11);

      input.value = formatted;
    });
  });
}
