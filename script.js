// ==========================================
// ARCHIVE CONFIG
// ==========================================
const ARCHIVE_CONFIG = {
  siteName: "أرشيف الأثر النافع",
  archivePeriod: "2025 — 2026",

  imagePrefix: "صورة (",
  imageSuffix: ").jpg",

  totalImages: 94,

  heroImages: [
    "صورة (1).jpg",
    "صورة (2).jpg",
    "صورة (3).jpg",
    "صورة (4).jpg",
    "صورة (5).jpg",
    "صورة (6).jpg"
  ],

  telegram: "@Mq12qm",
  telegramUrl: "https://t.me/Mq12qm",

  instagram: "@mm22.qq",
  instagramUrl: "https://www.instagram.com/mm22.qq",

  logoPath: "assets/logo.png",
  faviconPath: "assets/favicon.png",
  ogImagePath: "assets/og-image.jpg"
};

// ==========================================
// DATA & STATE
// ==========================================

// بناء مصفوفة الرسائل ديناميكيًا بناءً على إجمالي الصور
const messages = Array.from({ length: ARCHIVE_CONFIG.totalImages }, (_, index) => {
  const number = index + 1;
  return {
    number: number,
    filename: `${ARCHIVE_CONFIG.imagePrefix}${number}${ARCHIVE_CONFIG.imageSuffix}`,
    src: encodeURI(`${ARCHIVE_CONFIG.imagePrefix}${number}${ARCHIVE_CONFIG.imageSuffix}`)
  };
});

// حالة التطبيق في الذاكرة الحية (بدون تخزين محلي/Session-only)
const state = {
  sessionFavorites: [], // مصفوفة أرقام الرسائل المفضلة
  currentLightboxIndex: -1,
  lastRandomIndex: -1,
  isLightboxOpen: false,
  isDrawerOpen: false,
  zoomScale: 1,
  panPosition: { x: 0, y: 0 },
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  touchStartX: 0,
  touchStartY: 0,
  logoClickCount: 0,
  logoClickTimeout: null,
  viewedMessagesCount: new Set(),
  controlsHideTimeout: null,
  renderedCount: 0,
  batchSize: 16
};

// ==========================================
// DOM REFERENCES
// ==========================================
const DOM = {
  loader: document.getElementById('loader'),
  scrollProgress: document.getElementById('scroll-progress'),
  customCursor: document.querySelector('.custom-cursor'),
  customCursorDot: document.querySelector('.custom-cursor-dot'),
  siteHeader: document.querySelector('header.site-header'),
  headerLogo: document.getElementById('header-logo'),
  favTriggerBtn: document.getElementById('fav-trigger-btn'),
  favCountBadge: document.getElementById('fav-count-badge'),
  heroStage: document.getElementById('hero-stage'),
  heroCardsContainer: document.getElementById('hero-cards-container'),
  btnExplore: document.getElementById('btn-explore'),
  btnSurpriseHero: document.getElementById('btn-surprise-hero'),
  btnSurpriseFloat: document.getElementById('btn-surprise-float'),
  btnSurpriseEnding: document.getElementById('btn-surprise-ending'),
  galleryGrid: document.getElementById('gallery-grid'),
  gallerySentinel: document.getElementById('gallery-sentinel'),
  backToTopBtn: document.getElementById('back-to-top-btn'),
  footerElement: document.querySelector('footer.site-footer'),
  footerCount: document.getElementById('footer-count'),
  currentYear: document.getElementById('current-year'),
  
  // Drawer
  drawerBackdrop: document.getElementById('drawer-backdrop'),
  drawerCloseBtn: document.getElementById('drawer-close-btn'),
  drawerCount: document.getElementById('drawer-count'),
  favList: document.getElementById('fav-list'),
  drawerEmptyState: document.getElementById('drawer-empty-state'),
  btnClearFav: document.getElementById('btn-clear-fav'),

  // Lightbox
  lightboxBackdrop: document.getElementById('lightbox-backdrop'),
  lightboxBgBlur: document.getElementById('lightbox-bg-blur'),
  lightboxContainer: document.getElementById('lightbox-container'),
  lightboxImgWrapper: document.getElementById('lightbox-img-wrapper'),
  lightboxImg: document.getElementById('lightbox-img'),
  lightboxControls: document.getElementById('lightbox-controls'),
  lightboxCounter: document.getElementById('lightbox-counter'),
  lightboxCloseBtn: document.getElementById('lightbox-close-btn'),
  lightboxFavBtn: document.getElementById('lightbox-fav-btn'),
  lightboxFullscreenBtn: document.getElementById('lightbox-fullscreen-btn'),
  lightboxPrevBtn: document.getElementById('lightbox-prev-btn'),
  lightboxNextBtn: document.getElementById('lightbox-next-btn'),
  lightboxErrorBox: document.getElementById('lightbox-error-box'),
  lightboxErrorCloseBtn: document.getElementById('lightbox-error-close-btn'),

  // Easter Egg Modal
  easterModal: document.getElementById('easter-modal'),
  easterText: document.getElementById('easter-text'),
  easterCloseBtn: document.getElementById('easter-close-btn')
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// إنشاء مسار آمن للصورة يدعم الحروف العربية والأقواس
function getSafeImagePath(filename) {
  return encodeURI(filename);
}

// تحديث عدادات الواجهة ديناميكيًا من مصفوفة الرسائل
function updateDynamicCounts() {
  if (DOM.footerCount) {
    DOM.footerCount.textContent = `${messages.length} رسالة موثقة`;
  }
  if (DOM.currentYear) {
    DOM.currentYear.textContent = new Date().getFullYear();
  }
}

// عرض رسالة Easter Egg هادئة
function showEasterEgg(message) {
  if (!DOM.easterModal || !DOM.easterText) return;
  DOM.easterText.textContent = message;
  DOM.easterModal.classList.add('open');
}

function closeEasterEgg() {
  if (DOM.easterModal) {
    DOM.easterModal.classList.remove('open');
  }
}

// ==========================================
// HERO GALLERY RENDERING & PARALLAX
// ==========================================
function initHeroGallery() {
  if (!DOM.heroCardsContainer) return;
  DOM.heroCardsContainer.innerHTML = '';

  const heroItems = ARCHIVE_CONFIG.heroImages.slice(0, 5);
  heroItems.forEach((imgFile, idx) => {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `رسالة مميزة ${idx + 1}`);

    const img = document.createElement('img');
    img.src = getSafeImagePath(imgFile);
    img.alt = `رسالة مميزة من الأرشيف`;
    img.draggable = false;
    img.loading = 'eager';

    // العثور على رقم الرسالة لفتحها في الـ Lightbox
    const match = imgFile.match(/\((\d+)\)/);
    const num = match ? parseInt(match[1], 10) : (idx + 1);

    card.addEventListener('click', () => {
      openLightboxByNumber(num);
    });

    card.appendChild(img);
    DOM.heroCardsContainer.appendChild(card);
  });

  // تأثير الماوس اللطيف للـ Parallax (سطح المكتب فقط)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      if (state.isLightboxOpen || state.isDrawerOpen) return;
      const { innerWidth, innerHeight } = window;
      const xOffset = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const yOffset = (e.clientY - innerHeight / 2) / (innerHeight / 2);

      requestAnimationFrame(() => {
        DOM.heroCardsContainer.style.transform = `translate3d(${xOffset * 15}px, ${yOffset * 10}px, 0) rotateX(${-yOffset * 5}deg) rotateY(${xOffset * 5}deg)`;
      });
    });
  }
}

// ==========================================
// GALLERY RENDERING (Lazy Batches & Observer)
// ==========================================
function renderNextGalleryBatch() {
  if (state.renderedCount >= messages.length) return;

  const fragment = document.createDocumentFragment();
  const nextSlice = messages.slice(state.renderedCount, state.renderedCount + state.batchSize);

  nextSlice.forEach((msg) => {
    const item = document.createElement('article');
    item.className = 'gallery-item';
    item.id = `card-msg-${msg.number}`;
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `رسالة رقم ${msg.number}`);

    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-img-wrapper';

    const img = document.createElement('img');
    img.src = msg.src;
    img.alt = `رسالة رقم ${msg.number}`;
    img.loading = 'lazy';
    img.draggable = false;

    // تجاوز الخطأ بصمت في حالة فقدان الملف وعدم كسر الشبكة
    img.onerror = () => {
      // إخفاء البطاقة بهدوء في حال عدم توفر الصورة
      item.style.display = 'none';
    };

    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';

    const numberBadge = document.createElement('span');
    numberBadge.className = 'card-number-badge';
    numberBadge.textContent = msg.number;

    const favBtn = document.createElement('button');
    favBtn.className = 'card-fav-btn';
    favBtn.type = 'button';
    favBtn.setAttribute('aria-label', `إضافة رسالة ${msg.number} للمفضلة`);
    favBtn.innerHTML = '🤍';

    if (state.sessionFavorites.includes(msg.number)) {
      favBtn.classList.add('is-favorited');
      favBtn.innerHTML = '❤️';
    }

    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(msg.number);
    });

    wrapper.appendChild(img);
    item.appendChild(wrapper);
    item.appendChild(overlay);
    item.appendChild(numberBadge);
    item.appendChild(favBtn);

    // النقر على البطاقة يفتح الـ Lightbox
    item.addEventListener('click', () => {
      openLightboxByNumber(msg.number);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightboxByNumber(msg.number);
      }
    });

    fragment.appendChild(item);
  });

  DOM.galleryGrid.appendChild(fragment);
  state.renderedCount += nextSlice.length;
}

function initGalleryObserver() {
  renderNextGalleryBatch(); // الدفعة الأولى

  if ('IntersectionObserver' in window && DOM.gallerySentinel) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && state.renderedCount < messages.length) {
        renderNextGalleryBatch();
      }
    }, {
      rootMargin: '400px'
    });

    observer.observe(DOM.gallerySentinel);
  }
}

// ==========================================
// FAVORITES SYSTEM (Session-Only In-Memory)
// ==========================================
function toggleFavorite(messageNumber) {
  const index = state.sessionFavorites.indexOf(messageNumber);
  if (index > -1) {
    state.sessionFavorites.splice(index, 1);
  } else {
    state.sessionFavorites.push(messageNumber);
  }

  updateFavoritesUI();
}

function clearAllFavorites() {
  state.sessionFavorites = [];
  updateFavoritesUI();
}

function updateFavoritesUI() {
  const count = state.sessionFavorites.length;

  // تحديث عداد الهيدر
  if (DOM.favCountBadge) {
    DOM.favCountBadge.textContent = count;
  }
  if (DOM.drawerCount) {
    DOM.drawerCount.textContent = count;
  }

  // تحديث أزرار البطاقات في المعرض
  document.querySelectorAll('.card-fav-btn').forEach((btn) => {
    const card = btn.closest('.gallery-item');
    if (!card) return;
    const num = parseInt(card.id.replace('card-msg-', ''), 10);
    if (state.sessionFavorites.includes(num)) {
      btn.classList.add('is-favorited');
      btn.innerHTML = '❤️';
    } else {
      btn.classList.remove('is-favorited');
      btn.innerHTML = '🤍';
    }
  });

  // تحديث زر المفضلة في الـ Lightbox إذا كان مفتوحًا
  if (state.isLightboxOpen && state.currentLightboxIndex >= 0) {
    const currentMsg = messages[state.currentLightboxIndex];
    if (currentMsg && DOM.lightboxFavBtn) {
      if (state.sessionFavorites.includes(currentMsg.number)) {
        DOM.lightboxFavBtn.classList.add('active-fav');
        DOM.lightboxFavBtn.innerHTML = '❤️';
      } else {
        DOM.lightboxFavBtn.classList.remove('active-fav');
        DOM.lightboxFavBtn.innerHTML = '🤍';
      }
    }
  }

  // تحديث عناصر القائمة في الـ Drawer
  renderFavoritesDrawerList();
}

function renderFavoritesDrawerList() {
  if (!DOM.favList || !DOM.drawerEmptyState) return;

  if (state.sessionFavorites.length === 0) {
    DOM.favList.innerHTML = '';
    DOM.drawerEmptyState.style.display = 'flex';
    if (DOM.btnClearFav) DOM.btnClearFav.style.display = 'none';
    return;
  }

  DOM.drawerEmptyState.style.display = 'none';
  if (DOM.btnClearFav) DOM.btnClearFav.style.display = 'block';
  DOM.favList.innerHTML = '';

  state.sessionFavorites.forEach((num) => {
    const msg = messages.find(m => m.number === num);
    if (!msg) return;

    const item = document.createElement('div');
    item.className = 'fav-item';

    const info = document.createElement('div');
    info.className = 'fav-item-info';

    const thumb = document.createElement('img');
    thumb.className = 'fav-item-thumb';
    thumb.src = msg.src;
    thumb.alt = `رسالة رقم ${msg.number}`;
    thumb.loading = 'lazy';

    const title = document.createElement('span');
    title.className = 'fav-item-title';
    title.textContent = `رسالة رقم ${msg.number}`;

    info.appendChild(thumb);
    info.appendChild(title);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'fav-item-remove-btn';
    removeBtn.type = 'button';
    removeBtn.setAttribute('aria-label', `إزالة رسالة ${msg.number} من المفضلة`);
    removeBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(msg.number);
    });

    item.addEventListener('click', () => {
      closeDrawer();
      openLightboxByNumber(msg.number);
    });

    item.appendChild(info);
    item.appendChild(removeBtn);
    DOM.favList.appendChild(item);
  });
}

function openDrawer() {
  state.isDrawerOpen = true;
  DOM.drawerBackdrop.classList.add('open');
  DOM.favTriggerBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  state.isDrawerOpen = false;
  DOM.drawerBackdrop.classList.remove('open');
  DOM.favTriggerBtn.setAttribute('aria-expanded', 'false');
  if (!state.isLightboxOpen) {
    document.body.style.overflow = '';
  }
}

// ==========================================
// RANDOM MESSAGE (فاجئني برسالة)
// ==========================================
function openRandomMessage() {
  if (messages.length === 0) return;

  let randomIndex;
  if (messages.length === 1) {
    randomIndex = 0;
  } else {
    do {
      randomIndex = Math.floor(Math.random() * messages.length);
    } while (randomIndex === state.lastRandomIndex && messages.length > 1);
  }

  state.lastRandomIndex = randomIndex;
  openLightboxByIndex(randomIndex);
}

// ==========================================
// LIGHTBOX ENGINE (Zoom, Pan, Swipe, Fullscreen, Auto-Hide)
// ==========================================
function openLightboxByNumber(number) {
  const index = messages.findIndex(m => m.number === number);
  if (index !== -1) {
    openLightboxByIndex(index);
  }
}

function openLightboxByIndex(index) {
  if (index < 0 || index >= messages.length) return;

  state.currentLightboxIndex = index;
  state.isLightboxOpen = true;
  resetZoomAndPan();

  const msg = messages[index];

  // تتبع الرسائل المستعرضة لـ Easter Egg 3
  state.viewedMessagesCount.add(msg.number);
  if (state.viewedMessagesCount.size === 10) {
    showEasterEgg("أثرٌ طيّب يتردد بين السطور… شكرًا لاهتمامك بكل تفصيل من هذه الرحلة. 🤍");
  }

  // Easter Egg 2 عند الوصول إلى آخر رسالة مضافة في الأرشيف
  if (index === messages.length - 1) {
    setTimeout(() => {
      showEasterEgg("وآخر الذكريات… ليست بالضرورة نهاية الحكاية. 🤍");
    }, 600);
  }

  // تحديث عداد Lightbox
  if (DOM.lightboxCounter) {
    DOM.lightboxCounter.textContent = `${msg.number} / ${messages.length}`;
  }

  // إخفاء صندوق الخطأ إن وجد
  DOM.lightboxErrorBox.style.display = 'none';
  DOM.lightboxImg.style.display = 'block';

  // تحميل الصورة
  DOM.lightboxImg.src = msg.src;
  DOM.lightboxImg.alt = `رسالة رقم ${msg.number}`;
  DOM.lightboxBgBlur.style.backgroundImage = `url('${msg.src}')`;

  DOM.lightboxImg.onerror = () => {
    DOM.lightboxImg.style.display = 'none';
    DOM.lightboxErrorBox.style.display = 'flex';
  };

  // تحديث زر المفضلة
  if (DOM.lightboxFavBtn) {
    if (state.sessionFavorites.includes(msg.number)) {
      DOM.lightboxFavBtn.classList.add('active-fav');
      DOM.lightboxFavBtn.innerHTML = '❤️';
    } else {
      DOM.lightboxFavBtn.classList.remove('active-fav');
      DOM.lightboxFavBtn.innerHTML = '🤍';
    }
  }

  // تحديث History Hash مؤقتًا
  window.history.replaceState({ lightboxOpen: true, messageNumber: msg.number }, '', `#message-${msg.number}`);

  // قفل الـ Scroll للصفحة الخلفية
  document.body.style.overflow = 'hidden';

  // إظهار الـ Lightbox
  DOM.lightboxBackdrop.classList.add('open');

  // إخفاء زر Random العائم أثناء عرض Lightbox
  if (DOM.btnSurpriseFloat) {
    DOM.btnSurpriseFloat.classList.add('hidden');
  }

  // إعادة ضبط عداد الإخفاء التلقائي للأدوات
  scheduleControlsAutoHide();
}

function closeLightbox() {
  if (!state.isLightboxOpen) return;

  state.isLightboxOpen = false;
  DOM.lightboxBackdrop.classList.remove('open');
  resetZoomAndPan();

  // تنظيف Hash من الرابط
  if (window.location.hash.startsWith('#message-')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // إعادة التمرير إذا لم يكن الـ Drawer مفتوحًا
  if (!state.isDrawerOpen) {
    document.body.style.overflow = '';
  }

  // إظهار زر Random العائم إن لم نكن في نهاية الصفحة
  checkFloatingButtonVisibility();

  // استعادة Focus إلى البطاقة المقابلة
  if (state.currentLightboxIndex >= 0) {
    const cardId = `card-msg-${messages[state.currentLightboxIndex]?.number}`;
    const card = document.getElementById(cardId);
    if (card) card.focus();
  }

  state.currentLightboxIndex = -1;
}

function navigateLightbox(direction) {
  if (!state.isLightboxOpen) return;

  let newIndex = state.currentLightboxIndex + direction;
  if (newIndex < 0) {
    newIndex = messages.length - 1; // الدوران التلقائي
  } else if (newIndex >= messages.length) {
    newIndex = 0;
  }

  openLightboxByIndex(newIndex);
}

// التحكم في Zoom و Pan
function resetZoomAndPan() {
  state.zoomScale = 1;
  state.panPosition = { x: 0, y: 0 };
  applyImageTransform();
  if (DOM.lightboxImgWrapper) {
    DOM.lightboxImgWrapper.classList.remove('is-zoomed', 'is-dragging');
  }
}

function applyImageTransform() {
  if (!DOM.lightboxImgWrapper) return;
  DOM.lightboxImgWrapper.style.transform = `translate3d(${state.panPosition.x}px, ${state.panPosition.y}px, 0) scale(${state.zoomScale})`;
  if (state.zoomScale > 1.05) {
    DOM.lightboxImgWrapper.classList.add('is-zoomed');
  } else {
    DOM.lightboxImgWrapper.classList.remove('is-zoomed');
  }
}

function handleZoomWheel(e) {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
  const newScale = Math.min(Math.max(state.zoomScale * zoomFactor, 1), 4);

  if (newScale === 1) {
    state.panPosition = { x: 0, y: 0 };
  }
  state.zoomScale = newScale;
  applyImageTransform();
  scheduleControlsAutoHide();
}

// تشغيل الشاشة الكاملة (Fullscreen API)
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    DOM.lightboxBackdrop.requestFullscreen?.().catch(() => {});
  } else {
    document.exitFullscreen?.().catch(() => {});
  }
}

// إخفاء الأدوات تلقائيًا بعد فترة من عدم التفاعل
function scheduleControlsAutoHide() {
  if (!DOM.lightboxControls) return;
  DOM.lightboxControls.classList.remove('autohide');

  clearTimeout(state.controlsHideTimeout);
  state.controlsHideTimeout = setTimeout(() => {
    if (state.isLightboxOpen && state.zoomScale <= 1.05) {
      DOM.lightboxControls.classList.add('autohide');
    }
  }, 3500);
}

// ==========================================
// SCROLL, HEADER, BACK-TO-TOP & FLOATING BTN
// ==========================================
function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

  // 1. Progress Bar
  const progress = docHeight > 0 ? (scrollTop / docHeight) : 0;
  if (DOM.scrollProgress) {
    DOM.scrollProgress.style.transform = `scaleX(${progress})`;
  }

  // 2. Sticky Glass Header
  if (DOM.siteHeader) {
    if (scrollTop > 40) {
      DOM.siteHeader.classList.add('scrolled');
    } else {
      DOM.siteHeader.classList.remove('scrolled');
    }
  }

  // 3. Back To Top Button
  if (DOM.backToTopBtn) {
    if (scrollTop > 400) {
      DOM.backToTopBtn.classList.add('visible');
    } else {
      DOM.backToTopBtn.classList.remove('visible');
    }
  }

  // 4. Floating Random Button Visibility
  checkFloatingButtonVisibility();
}

function checkFloatingButtonVisibility() {
  if (!DOM.btnSurpriseFloat) return;
  if (state.isLightboxOpen) {
    DOM.btnSurpriseFloat.classList.add('hidden');
    return;
  }

  if (DOM.footerElement) {
    const footerRect = DOM.footerElement.getBoundingClientRect();
    if (footerRect.top < window.innerHeight - 50) {
      DOM.btnSurpriseFloat.classList.add('hidden');
      return;
    }
  }

  DOM.btnSurpriseFloat.classList.remove('hidden');
}

// ==========================================
// CUSTOM CURSOR (Desktop Only)
// ==========================================
function initCustomCursor() {
  if (!DOM.customCursor || !DOM.customCursorDot) return;
  if (window.matchMedia('(pointer: coarse), (hover: none)').matches) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    DOM.customCursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function renderCursor() {
    cursorX += (mouseX - cursorX) * 0.2;
    cursorY += (mouseY - cursorY) * 0.2;
    DOM.customCursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // تضخيم المؤشر فوق العناصر التفاعلية
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('button, a, .gallery-item, .hero-card, .fav-item')) {
      DOM.customCursor.classList.add('hovering');
    } else {
      DOM.customCursor.classList.remove('hovering');
    }
  });
}

// ==========================================
// EASTER EGGS LISTENERS
// ==========================================
function initEasterEggs() {
  // Easter Egg 1: 5 نقرات على اللوجو
  if (DOM.headerLogo) {
    DOM.headerLogo.addEventListener('click', () => {
      state.logoClickCount++;
      clearTimeout(state.logoClickTimeout);
      
      if (state.logoClickCount >= 5) {
        state.logoClickCount = 0;
        showEasterEgg("بعض الأشياء لا تُحفظ في الملفات… بل في الذاكرة. وهذه واحدة منها. 🤍");
      } else {
        state.logoClickTimeout = setTimeout(() => {
          state.logoClickCount = 0;
        }, 1500);
      }
    });
  }

  if (DOM.easterCloseBtn) {
    DOM.easterCloseBtn.addEventListener('click', closeEasterEgg);
  }
  if (DOM.easterModal) {
    DOM.easterModal.addEventListener('click', (e) => {
      if (e.target === DOM.easterModal) closeEasterEgg();
    });
  }
}

// ==========================================
// EVENT LISTENERS BINDING
// ==========================================
function setupEventListeners() {
  // التمرير
  window.addEventListener('scroll', handleScroll, { passive: true });

  // أزرار فاجئني برسالة
  if (DOM.btnSurpriseHero) DOM.btnSurpriseHero.addEventListener('click', openRandomMessage);
  if (DOM.btnSurpriseFloat) DOM.btnSurpriseFloat.addEventListener('click', openRandomMessage);
  if (DOM.btnSurpriseEnding) DOM.btnSurpriseEnding.addEventListener('click', openRandomMessage);

  // زر استكشف الرسائل
  if (DOM.btnExplore) {
    DOM.btnExplore.addEventListener('click', () => {
      const gallery = document.getElementById('gallery');
      if (gallery) {
        gallery.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // زر العودة للأعلى
  if (DOM.backToTopBtn) {
    DOM.backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // أزرار المفضلة و الـ Drawer
  if (DOM.favTriggerBtn) DOM.favTriggerBtn.addEventListener('click', openDrawer);
  if (DOM.drawerCloseBtn) DOM.drawerCloseBtn.addEventListener('click', closeDrawer);
  if (DOM.drawerBackdrop) {
    DOM.drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === DOM.drawerBackdrop) closeDrawer();
    });
  }
  if (DOM.btnClearFav) DOM.btnClearFav.addEventListener('click', clearAllFavorites);

  // أدوات الـ Lightbox
  if (DOM.lightboxCloseBtn) DOM.lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (DOM.lightboxErrorCloseBtn) DOM.lightboxErrorCloseBtn.addEventListener('click', closeLightbox);

  // RTL Aware Navigation (السهم اليمين = التالي في الترتيب، اليسار = السابق)
  if (DOM.lightboxPrevBtn) DOM.lightboxPrevBtn.addEventListener('click', () => navigateLightbox(1));
  if (DOM.lightboxNextBtn) DOM.lightboxNextBtn.addEventListener('click', () => navigateLightbox(-1));

  if (DOM.lightboxFullscreenBtn) DOM.lightboxFullscreenBtn.addEventListener('click', toggleFullscreen);

  if (DOM.lightboxFavBtn) {
    DOM.lightboxFavBtn.addEventListener('click', () => {
      if (state.currentLightboxIndex >= 0) {
        const msg = messages[state.currentLightboxIndex];
        if (msg) toggleFavorite(msg.number);
      }
    });
  }

  if (DOM.lightboxBackdrop) {
    DOM.lightboxBackdrop.addEventListener('click', (e) => {
      if (e.target === DOM.lightboxContainer || e.target === DOM.lightboxBackdrop) {
        closeLightbox();
      }
    });
  }

  // تفاعل الماوس والـ Zoom في Lightbox
  if (DOM.lightboxContainer) {
    DOM.lightboxContainer.addEventListener('wheel', handleZoomWheel, { passive: false });

    DOM.lightboxContainer.addEventListener('mousemove', () => {
      scheduleControlsAutoHide();
    });

    // Pan Dragging
    DOM.lightboxContainer.addEventListener('mousedown', (e) => {
      if (state.zoomScale > 1) {
        state.isDragging = true;
        state.dragStart = { x: e.clientX - state.panPosition.x, y: e.clientY - state.panPosition.y };
        DOM.lightboxImgWrapper.classList.add('is-dragging');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isDragging && state.zoomScale > 1) {
        state.panPosition.x = e.clientX - state.dragStart.x;
        state.panPosition.y = e.clientY - state.dragStart.y;
        applyImageTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      state.isDragging = false;
      if (DOM.lightboxImgWrapper) {
        DOM.lightboxImgWrapper.classList.remove('is-dragging');
      }
    });

    // Touch Swipe & Pinch Support
    DOM.lightboxContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        state.touchStartX = e.touches[0].clientX;
        state.touchStartY = e.touches[0].clientY;
      }
      scheduleControlsAutoHide();
    }, { passive: true });

    DOM.lightboxContainer.addEventListener('touchend', (e) => {
      if (state.zoomScale <= 1.05 && e.changedTouches.length === 1) {
        const diffX = e.changedTouches[0].clientX - state.touchStartX;
        const diffY = e.changedTouches[0].clientY - state.touchStartY;

        // السحب الأفقي للانتقال بين الرسائل
        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 80) {
          if (diffX > 0) {
            navigateLightbox(1); // سحب لليمين
          } else {
            navigateLightbox(-1); // سحب لليسار
          }
        }
      }
    }, { passive: true });
  }

  // Keyboard Shortcuts (Accessibility)
  window.addEventListener('keydown', (e) => {
    if (state.isLightboxOpen) {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        navigateLightbox(1);
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox(-1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    } else if (state.isDrawerOpen) {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    }
  });

  // History Popstate (زر الرجوع في المتصفح يغلق الـ Lightbox دون مغادرة الموقع)
  window.addEventListener('popstate', () => {
    if (state.isLightboxOpen) {
      closeLightbox();
    }
  });

  // فحص عنوان الرابط الأولي لوجود Hash
  if (window.location.hash.startsWith('#message-')) {
    const num = parseInt(window.location.hash.replace('#message-', ''), 10);
    if (!isNaN(num)) {
      setTimeout(() => openLightboxByNumber(num), 300);
    }
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
function initArchive() {
  updateDynamicCounts();
  initHeroGallery();
  initGalleryObserver();
  setupEventListeners();
  initCustomCursor();
  initEasterEggs();
  updateFavoritesUI();

  // إخفاء شاشة التحميل فور جاهزية الواجهة
  if (DOM.loader) {
    DOM.loader.classList.add('hidden');
  }
}

// تشغيل الموقع عند اكتمال تحميل الـ DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArchive);
} else {
  initArchive();
}
