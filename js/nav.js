(function () {
  const DEFAULT_ROUTES = [
    {
      label: 'Rating',
      i18nKey: 'nav.rating',
      children: [
        {
          label: 'Optimizer',
          i18nKey: 'nav.optimizer',
          path: '/optimizer',
          file: '/optimizer.html',
        },
        {
          label: 'Calculator',
          i18nKey: 'nav.calculator',
          path: '/calculator',
          file: '/calculator.html',
        },
      ],
    },
    {
      label: 'Tools',
      i18nKey: 'nav.tools',
      children: [
        { label: 'Event OCR', i18nKey: 'nav.eventOCR', path: '/events', file: '/events.html' },
        {
          label: 'Support Hints',
          i18nKey: 'nav.supportHints',
          path: '/hints',
          file: '/hints.html',
        },
        { label: 'Deck Builder', i18nKey: 'nav.deckBuilder', path: '/deck', file: '/deck.html' },
        {
          label: 'Deck Optimizer',
          i18nKey: 'nav.deckOptimizer',
          path: '/collection',
          file: '/collection.html',
        },
        {
          label: 'Stamina Check',
          i18nKey: 'nav.staminaCheck',
          path: '/stamina',
          file: '/stamina.html',
        },
        {
          label: 'Accel Checker',
          path: '/accel',
          file: '/accel.html',
        },
        {
          label: 'Race Scheduler',
          i18nKey: 'nav.raceScheduler',
          href: 'https://race.daftuyda.moe',
        },
      ],
    },
    {
      label: 'Data',
      i18nKey: 'nav.data',
      children: [
        {
          label: 'Skill Library',
          i18nKey: 'nav.skillLibrary',
          path: '/skills',
          file: '/skills.html',
        },
        {
          label: 'Rank Breakdown',
          i18nKey: 'nav.rankBreakdown',
          path: '/rank-breakdown',
          file: '/rank-breakdown.html',
        },
      ],
    },
    {
      label: 'Fun',
      i18nKey: 'nav.fun',
      children: [
        { label: 'Randomizer', i18nKey: 'nav.randomizer', path: '/random', file: '/random.html' },
        { label: 'Umadle', i18nKey: 'nav.umadle', path: '/umadle', file: '/umadle.html' },
      ],
    },
  ];
  const ROUTES =
    Array.isArray(window.NAV_ROUTES) && window.NAV_ROUTES.length
      ? window.NAV_ROUTES
      : DEFAULT_ROUTES;
  const SERVER_PREF_KEY = 'umatoolsServer';
  const SITE_LANG_PREF_KEY = 'umatoolsSiteLanguage';

  function normalizeServer(value) {
    return (value || '').toString().trim().toLowerCase() === 'jp' ? 'jp' : 'en';
  }

  function normalizeSiteLanguage(value) {
    return (value || '').toString().trim().toLowerCase() === 'jp' ? 'jp' : 'en';
  }

  function readPref(key, normalizeFn, fallback) {
    try {
      return normalizeFn(localStorage.getItem(key));
    } catch {
      return fallback;
    }
  }

  function writePref(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  function applySiteLanguage(lang) {
    const normalized = normalizeSiteLanguage(lang);
    document.documentElement.lang = normalized === 'jp' ? 'ja' : 'en';
    document.documentElement.dataset.siteLanguage = normalized;
  }

  // Footer links: override per-page with window.FOOTER_LINKS if you want
  const DEFAULT_FOOTER = [
    {
      label: 'GitHub',
      href: 'https://github.com/daftuyda/UmaTools',
    },
    { label: 'YouTube', href: 'https://youtube.com/@MaybeVoid' },
  ];
  const FOOTER =
    Array.isArray(window.FOOTER_LINKS) && window.FOOTER_LINKS.length
      ? window.FOOTER_LINKS
      : DEFAULT_FOOTER;

  // Build navbar element (not in DOM yet)
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  var _t = function (key) {
    return typeof window.t === 'function' ? window.t(key) : key;
  };
  nav.setAttribute('aria-label', _t('nav.primary'));
  nav.innerHTML = `
    <div class="nav-inner">
      <div class="nav-left">
        <a class="brand" href="/" data-i18n-aria="nav.home" aria-label="${_t('nav.home')}">
          <span class="brand-text">UmaTools</span>
        </a>
        <button class="menu-btn" data-i18n-aria="nav.menu" aria-label="${_t('nav.menu')}" aria-expanded="false">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="nav-links" role="navigation" data-i18n-aria="nav.primary" aria-label="${_t('nav.primary')}"></div>
      </div>
      <div class="nav-right">
        <div class="nav-settings">
          <button
            type="button"
            class="settings-btn"
            id="nav-settings-toggle"
            aria-expanded="false"
            aria-controls="nav-settings-panel"
            aria-haspopup="true"
            data-i18n="nav.settings"
          >
            ${_t('nav.settings')}
          </button>
          <div
            class="nav-settings-panel"
            id="nav-settings-panel"
            role="group"
            data-i18n-aria="nav.globalSettings"
            aria-label="${_t('nav.globalSettings')}"
            hidden
          >
            <div class="nav-settings-title" data-i18n="nav.globalSettings">${_t('nav.globalSettings')}</div>
            <label class="nav-control">
              <span data-i18n="nav.server">${_t('nav.server')}</span>
              <select id="nav-server-select" aria-label="Game server">
                <option value="en">EN</option>
                <option value="jp">JP</option>
              </select>
            </label>
            <label class="nav-control">
              <span data-i18n="nav.siteLanguage">${_t('nav.siteLanguage')}</span>
              <select id="nav-site-lang-select" aria-label="Site language">
                <option value="en">EN</option>
                <option value="jp">JP</option>
              </select>
            </label>
          </div>
        </div>
        <div id="navModeToggleSlot"></div>
      </div>
    </div>
  `;

  const navEl = nav;
  const linksWrap = nav.querySelector('.nav-links');
  const menuBtn = nav.querySelector('.menu-btn');
  const settingsToggleBtn = nav.querySelector('#nav-settings-toggle');
  const settingsPanel = nav.querySelector('#nav-settings-panel');
  let settingsOpen = false;

  function setSettingsOpen(open) {
    if (!settingsToggleBtn || !settingsPanel) return;
    settingsOpen = !!open;
    settingsToggleBtn.setAttribute('aria-expanded', String(settingsOpen));
    settingsPanel.hidden = !settingsOpen;
  }

  function closeAllDropdowns() {
    for (const dd of navEl.querySelectorAll('.nav-group.open')) {
      dd.classList.remove('open');
      const btn = dd.querySelector('.nav-group-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  // Toggle hamburger on mobile
  menuBtn.addEventListener('click', () => {
    setSettingsOpen(false);
    closeAllDropdowns();
    const open = navEl.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  // Close menu when a link is chosen
  linksWrap.addEventListener('click', (e) => {
    if (e.target.closest('.nav-link')) {
      setSettingsOpen(false);
      closeAllDropdowns();
      navEl.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  if (settingsToggleBtn && settingsPanel) {
    settingsToggleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeAllDropdowns();
      setSettingsOpen(!settingsOpen);
    });
    settingsPanel.addEventListener('click', (event) => event.stopPropagation());
    document.addEventListener('click', (event) => {
      if (!settingsOpen) return;
      const target = event.target;
      if (target instanceof Element && target.closest('.nav-settings')) return;
      setSettingsOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        closeAllDropdowns();
      }
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('.nav-group')) return;
    closeAllDropdowns();
  });

  // Collect all leaf links for clean-URL fallback and active marking
  function collectLeaves(routes) {
    const leaves = [];
    for (const r of routes) {
      if (r.children) {
        for (const child of r.children) leaves.push(child);
      } else {
        leaves.push(r);
      }
    }
    return leaves;
  }

  // Inject everything after DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Put navbar at top
    const skipLink = document.querySelector('.skip-link');
    if (skipLink && skipLink.parentNode) {
      skipLink.insertAdjacentElement('afterend', nav);
    } else {
      document.body.prepend(nav);
    }

    // Announcement banner with countdown (auto-hides after giveaway ends)
    const giveawayEnd = new Date('2026-04-10T15:00:00Z');
    const BANNER_DISMISS_KEY = 'giveaway-banner-dismissed';
    let bannerDismissed = false;
    try { bannerDismissed = localStorage.getItem(BANNER_DISMISS_KEY) === '1'; } catch (e) {}
    if (!bannerDismissed && giveawayEnd.getTime() > Date.now()) {
      const banner = document.createElement('div');
      banner.className = 'site-banner';
      let bannerInterval = null;
      function updateBannerCountdown() {
        const now = Date.now();
        const diff = giveawayEnd.getTime() - now;
        if (diff <= 0) {
          banner.remove();
          if (bannerInterval) clearInterval(bannerInterval);
          return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const time = (d > 0 ? d + 'd ' : '') + h + 'h ' + m + 'm ' + s + 's';
        banner.innerHTML = '<a href="https://discord.gg/hsm" target="_blank" rel="noopener">\uD83C\uDF89 10x 1st Anni Ticket Giveaway \u2014 ' + time + ' left \u2014 Join the Discord!</a><button class="banner-dismiss" aria-label="Dismiss">\u00d7</button>';
      }
      updateBannerCountdown();
      bannerInterval = setInterval(updateBannerCountdown, 1000);
      banner.addEventListener('click', function (e) {
        if (e.target.closest('.banner-dismiss')) {
          e.preventDefault();
          banner.remove();
          if (bannerInterval) clearInterval(bannerInterval);
          try { localStorage.setItem(BANNER_DISMISS_KEY, '1'); } catch (e) {}
        }
      });
      nav.insertAdjacentElement('afterend', banner);
    }

    const here = location.pathname.replace(/\/+$/, '') || '/';
    const norm = (s) => (s || '').replace(/\/+$/, '') || '/';
    const allLinks = [];

    // Build links — supports both flat and grouped routes
    for (const route of ROUTES) {
      if (route.children) {
        // Dropdown group
        const group = document.createElement('div');
        group.className = 'nav-group';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nav-group-btn';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-haspopup', 'true');
        const groupLabel = route.i18nKey ? _t(route.i18nKey) : route.label;
        btn.innerHTML =
          '<span' +
          (route.i18nKey ? ' data-i18n="' + route.i18nKey + '"' : '') +
          '>' +
          groupLabel +
          '</span><svg class="nav-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">' +
          '<path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>';

        const menu = document.createElement('div');
        menu.className = 'nav-group-menu';
        menu.setAttribute('role', 'menu');

        let hasActive = false;
        for (const child of route.children) {
          const a = document.createElement('a');
          a.className = 'nav-link';
          a.textContent = child.i18nKey ? _t(child.i18nKey) : child.label;
          if (child.i18nKey) a.setAttribute('data-i18n', child.i18nKey);
          a.href = child.href || child.path || child.file || '#';
          a.setAttribute('role', 'menuitem');
          if (child.href) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
          if (child.file) a.dataset.file = child.file;
          if (child.path) a.dataset.clean = child.path;
          if ((child.path && here === norm(child.path)) || (child.file && here === norm(child.file))) {
            a.classList.add('active');
            hasActive = true;
          }
          menu.appendChild(a);
          allLinks.push(a);
        }
        if (hasActive) group.classList.add('has-active');

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          setSettingsOpen(false);
          const wasOpen = group.classList.contains('open');
          closeAllDropdowns();
          if (!wasOpen) {
            group.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });

        group.appendChild(btn);
        group.appendChild(menu);
        linksWrap.appendChild(group);
      } else {
        // Flat link (backward compat)
        const a = document.createElement('a');
        a.className = 'nav-link';
        a.textContent = route.i18nKey ? _t(route.i18nKey) : route.label;
        if (route.i18nKey) a.setAttribute('data-i18n', route.i18nKey);
        a.href = route.path || route.file || '#';
        if (route.file) a.dataset.file = route.file;
        if (route.path) a.dataset.clean = route.path;
        if (here === norm(route.path) || here === norm(route.file)) {
          a.classList.add('active');
        }
        linksWrap.appendChild(a);
        allLinks.push(a);
      }
    }

    // Prefer clean URLs, fall back to .html if needed
    const leaves = collectLeaves(ROUTES);
    const test = leaves.find((r) => r.path && r.file && r.path !== '/');
    if (test) {
      fetch(test.path, { method: 'HEAD' })
        .then((res) => {
          if (!res.ok) throw 0;
        })
        .catch(() => {
          allLinks.forEach((a) => {
            if (a.dataset.file) a.href = a.dataset.file;
          });
        });
    }

    // Move existing dark-mode toggle into navbar (if present)
    const slot = nav.querySelector('#navModeToggleSlot');
    const toggle = document.getElementById('modeToggleBtn');
    if (toggle && slot) {
      slot.appendChild(toggle);
      toggle.classList.add('in-nav');
    }
    const serverSelect = nav.querySelector('#nav-server-select');
    const siteLangSelect = nav.querySelector('#nav-site-lang-select');
    if (serverSelect) {
      serverSelect.value = readPref(SERVER_PREF_KEY, normalizeServer, 'en');
      serverSelect.addEventListener('change', () => {
        const next = normalizeServer(serverSelect.value);
        serverSelect.value = next;
        writePref(SERVER_PREF_KEY, next);
        window.dispatchEvent(
          new CustomEvent('umatools:server-change', {
            detail: { server: next, source: 'nav' },
          })
        );
      });
      window.addEventListener('umatools:server-change', (event) => {
        const next = normalizeServer(event?.detail?.server);
        if (serverSelect.value !== next) serverSelect.value = next;
      });
      window.dispatchEvent(
        new CustomEvent('umatools:server-change', {
          detail: { server: serverSelect.value, source: 'nav-init' },
        })
      );
    }
    if (siteLangSelect) {
      siteLangSelect.value = readPref(SITE_LANG_PREF_KEY, normalizeSiteLanguage, 'en');
      applySiteLanguage(siteLangSelect.value);
      siteLangSelect.addEventListener('change', () => {
        const next = normalizeSiteLanguage(siteLangSelect.value);
        siteLangSelect.value = next;
        writePref(SITE_LANG_PREF_KEY, next);
        applySiteLanguage(next);
        window.dispatchEvent(
          new CustomEvent('umatools:site-language-change', {
            detail: { language: next, source: 'nav' },
          })
        );
      });
      window.addEventListener('umatools:site-language-change', (event) => {
        const next = normalizeSiteLanguage(event?.detail?.language);
        if (siteLangSelect.value !== next) siteLangSelect.value = next;
        applySiteLanguage(next);
      });
      window.dispatchEvent(
        new CustomEvent('umatools:site-language-change', {
          detail: { language: siteLangSelect.value, source: 'nav-init' },
        })
      );
    }

    // Footer at bottom
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <span><span data-i18n="nav.madeWith">${_t('nav.madeWith')}</span> <span aria-label="love">&#10084;&#65039;</span></span>
      ${FOOTER.map(
        (l) => `<a href="${l.href}" target="_blank" rel="noopener noreferrer">${l.label}</a>`
      ).join('')}
    `;
    document.body.appendChild(footer);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {});
    }

    // Re-apply i18n to nav elements when language changes
    window.addEventListener('i18n:changed', () => {
      if (typeof window.applyI18n === 'function') {
        window.applyI18n(navEl);
        window.applyI18n(footer);
      }
    });

    // Signal that nav is ready so loaders can safely release.
    window.dispatchEvent(new Event('nav:ready'));
  });

  // Close menu/dropdowns if switching to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640 && navEl.classList.contains('open')) {
      navEl.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      closeAllDropdowns();
    }
    if (window.innerWidth <= 640 && settingsOpen) {
      setSettingsOpen(false);
    }
  });
})();

// April Fools — activates only on April 1st (or ?af=1 to test)
(function aprilFools() {
  var now = new Date();
  var forceAF = /[?&]af=1/.test(location.search);
  if (!forceAF && (now.getMonth() !== 3 || now.getDate() !== 1)) return;

  // Check opt-out
  var AF_KEY = 'umafools-off';
  try { if (localStorage.getItem(AF_KEY) === '1' && !forceAF) return; } catch (e) {}

  var active = true;
  var afStyle = null;
  var tipsyObs = null;
  var clickHandler = null;

  function enableAF() {
    active = true;

    // Force light mode
    var root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    var sun = document.querySelector('.sun');
    var moon = document.querySelector('.moon');
    if (sun) sun.style.display = 'inline';
    if (moon) moon.style.display = 'none';

    // "UmaFools" branding
    var brand = document.querySelector('.brand-text');
    if (brand) brand.textContent = 'UmaFools';

    // Tipsy style
    if (!afStyle) {
      afStyle = document.createElement('style');
      afStyle.id = 'af-style';
      afStyle.textContent =
        '@keyframes af-wobble{0%{transform:rotate(var(--af-r,0deg))}50%{transform:rotate(calc(var(--af-r,0deg)*-1))}100%{transform:rotate(var(--af-r,0deg))}}' +
        '.af-active .result-item,.af-active .pill,.af-active .btn,.af-active .nav-link,.af-active .card{--af-r:0deg;animation:af-wobble 3s ease-in-out infinite}';
    }
    document.head.appendChild(afStyle);
    document.body.classList.add('af-active');
    applyTipsy();

    // Start mutation observer
    if (!tipsyObs) {
      tipsyObs = new MutationObserver(applyTipsy);
    }
    tipsyObs.observe(document.documentElement, { childList: true, subtree: true });

    // Horse emoji clicks
    if (!clickHandler) {
      clickHandler = function (e) {
        if (!active) return;
        var horses = ['\uD83D\uDC0E', '\uD83C\uDFC7', '\uD83E\uDD84', '\uD83D\uDC34'];
        var emoji = document.createElement('span');
        emoji.textContent = horses[Math.floor(Math.random() * horses.length)];
        emoji.setAttribute('aria-hidden', 'true');
        emoji.style.cssText =
          'position:fixed;pointer-events:none;font-size:24px;z-index:9999;' +
          'left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
          'transition:all 1s ease-out;opacity:1;';
        document.body.appendChild(emoji);
        requestAnimationFrame(function () {
          emoji.style.top = (e.clientY - 60) + 'px';
          emoji.style.opacity = '0';
        });
        setTimeout(function () { emoji.remove(); }, 1100);
      };
      document.addEventListener('click', clickHandler);
    }

    // Update toggle if it exists
    var toggle = document.getElementById('af-toggle');
    if (toggle) toggle.value = 'on';
  }

  function disableAF() {
    active = false;
    document.body.classList.remove('af-active');
    if (afStyle && afStyle.parentNode) afStyle.parentNode.removeChild(afStyle);
    if (tipsyObs) tipsyObs.disconnect();

    // Restore branding
    var brand = document.querySelector('.brand-text');
    if (brand) brand.textContent = 'UmaTools';

    // Remove tipsy data
    document.querySelectorAll('[data-af-done]').forEach(function (el) {
      el.removeAttribute('data-af-done');
      el.style.removeProperty('--af-r');
      el.style.removeProperty('animation-delay');
    });

    // Restore theme from localStorage
    try {
      var saved = localStorage.getItem('umasearch-darkmode');
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
        var sun = document.querySelector('.sun');
        var moon = document.querySelector('.moon');
        if (sun) sun.style.display = 'none';
        if (moon) moon.style.display = 'inline';
      }
    } catch (e) {}

    var toggle = document.getElementById('af-toggle');
    if (toggle) toggle.value = 'off';
  }

  function applyTipsy() {
    if (!active) return;
    var els = document.querySelectorAll('.result-item,.pill,.btn,.nav-link,.card');
    els.forEach(function (el) {
      if (el.dataset.afDone) return;
      el.dataset.afDone = '1';
      el.style.setProperty('--af-r', (Math.random() * 2 - 1).toFixed(2) + 'deg');
      el.style.animationDelay = (Math.random() * 2).toFixed(2) + 's';
    });
  }

  // Add toggle to settings panel (uses select like the other settings)
  function addToggle() {
    var panel = document.getElementById('nav-settings-panel');
    if (!panel || document.getElementById('af-toggle')) return;
    var label = document.createElement('label');
    label.className = 'nav-control';
    label.innerHTML =
      '<span>\uD83C\uDFC7 April Fools</span>' +
      '<select id="af-toggle">' +
        '<option value="on" selected>On</option>' +
        '<option value="off">Off</option>' +
      '</select>';
    panel.appendChild(label);
    var sel = document.getElementById('af-toggle');
    sel.addEventListener('change', function () {
      if (sel.value === 'on') {
        try { localStorage.removeItem(AF_KEY); } catch (e) {}
        enableAF();
      } else {
        try { localStorage.setItem(AF_KEY, '1'); } catch (e) {}
        disableAF();
      }
    });
  }

  // Block dark mode toggle while AF is active
  function blockDarkMode() {
    var modeBtn = document.getElementById('modeToggleBtn');
    if (modeBtn && !modeBtn.dataset.afBlocked) {
      modeBtn.dataset.afBlocked = '1';
      modeBtn.addEventListener('click', function (e) {
        if (active) { e.stopImmediatePropagation(); e.preventDefault(); }
      }, true);
    }
  }

  // nav:ready fires after the nav is fully in the DOM with settings panel
  window.addEventListener('nav:ready', function () {
    addToggle();
    enableAF();
    blockDarkMode();
  });
})();

// Easter egg: type "oguri" anywhere to make the UI chonky (Oguri Cap's appetite)
(function oguriEgg() {
  var seq = 'oguri';
  var pos = 0;
  var fat = false;
  var eggStyle = null;
  var oguriAudio = null;

  // Preload audio on first user interaction so autoplay policy is satisfied
  function ensureAudio() {
    if (oguriAudio) return;
    oguriAudio = new Audio('/assets/required.mp3');
    oguriAudio.preload = 'auto';
    oguriAudio.volume = 0.5;
    oguriAudio.addEventListener('error', function () {
      console.warn('Oguri audio failed to load', oguriAudio.currentSrc || oguriAudio.src, oguriAudio.error);
    });
    oguriAudio.load();
  }
  document.addEventListener('click', ensureAudio, { once: true });
  document.addEventListener('keydown', ensureAudio, { once: true });

  function toggleFat() {
    fat = !fat;
    if (fat) {
      if (!eggStyle) {
        eggStyle = document.createElement('style');
        eggStyle.id = 'oguri-style';
        eggStyle.textContent =
          '@keyframes oguri-chomp{0%{transform:scaleX(1)}15%{transform:scaleX(1.18)}30%{transform:scaleX(1)}45%{transform:scaleX(1.12)}60%{transform:scaleX(1)}}' +
          'body.oguri-fat{animation:oguri-chomp 0.6s ease-out;transform:scaleX(1.15);transform-origin:center top;transition:transform 0.5s cubic-bezier(.68,-0.55,.27,1.55)}' +
          'body.oguri-fat *{letter-spacing:0.04em}' +
          'body.oguri-fat .pill,body.oguri-fat .btn,body.oguri-fat .result-item,body.oguri-fat .card{padding-left:1.5em;padding-right:1.5em}';
      }
      document.head.appendChild(eggStyle);
      document.body.classList.add('oguri-fat');
      ensureAudio();
      if (oguriAudio) {
        oguriAudio.currentTime = 0;
        var p = oguriAudio.play();
        if (p && p.catch) {
          p.catch(function (err) {
            console.warn('Oguri audio playback failed', err);
          });
        }
      }
    } else {
      document.body.classList.remove('oguri-fat');
      if (eggStyle && eggStyle.parentNode) eggStyle.parentNode.removeChild(eggStyle);
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
    var key = (e.key || '').toLowerCase();
    if (key.length !== 1) return;
    if (key === seq[pos]) {
      pos++;
      if (pos === seq.length) {
        pos = 0;
        toggleFat();
      }
    } else {
      pos = key === seq[0] ? 1 : 0;
    }
  });
})();
