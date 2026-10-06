(function () {
  'use strict';

  var html = document.documentElement;
  var themeToggle = document.querySelector('.theme-toggle');
  var mobileToggle = document.querySelector('.mobile-menu-toggle');
  var mainNav = document.querySelector('.main-nav');
  var yearEl = document.getElementById('year');

  var STORAGE_KEY = 'neocn-theme';

  function safeGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      /* ignore: privacy mode */
    }
  }

  function getPreferredTheme() {
    var saved = safeGet(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    safeSet(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    var current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    // View Transitions API 让明暗切换有一层柔和的交叉淡化
    if (document.startViewTransition) {
      document.startViewTransition(function () {
        applyTheme(next);
      });
    } else {
      applyTheme(next);
    }
  }

  function toggleMobileMenu() {
    if (!mainNav || !mobileToggle) return;
    var isOpen = mainNav.classList.toggle('open');
    mobileToggle.classList.toggle('active', isOpen);
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    mobileToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
  }

  function closeMobileMenu() {
    if (!mainNav || !mobileToggle) return;
    mainNav.classList.remove('open');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', '打开菜单');
  }

  // 入场：第一帧就挂载 is-loaded，hero 文字逐级浮现
  function markLoaded() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('is-loaded');
      });
    });
  }

  // 滚动显现：IntersectionObserver + --reveal-delay 交错
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  // 滚动间谍：#projects 进入视口时高亮导航
  function initScrollSpy() {
    var projects = document.getElementById('projects');
    var link = document.querySelector('.main-nav a[href="#projects"]');
    if (!projects || !link || !('IntersectionObserver' in window)) return;
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          link.classList.toggle('is-active', entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );
    spy.observe(projects);
  }

  function initYear() {
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

  // 初始化主题（避免 FOUC：尽可能早执行，本文件 defer 后仍快于首绘感知）
  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleMobileMenu);
  }

  if (mainNav) {
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMobileMenu();
  });

  window.addEventListener(
    'resize',
    function () {
      if (window.innerWidth > 720) closeMobileMenu();
    },
    { passive: true }
  );

  // 跟随系统主题（仅当用户未手动选择时）
  if (window.matchMedia) {
    var media = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (event) {
      if (!safeGet(STORAGE_KEY)) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }

  initYear();
  initReveal();
  initScrollSpy();
  markLoaded();
})();
