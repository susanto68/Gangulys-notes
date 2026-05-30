/**
 * ============================================================
 *  Sir Ganguly — Unified Navigation System  v1.0
 *  sirganguly-nav.js
 *
 *  Responsibilities:
 *  1. Inject the <nav> HTML into #sg-nav-root (or before <body> first child)
 *  2. Detect which site is active and add .sg-active to correct button
 *  3. Hamburger menu toggle on mobile
 *  4. Loading progress bar on navigation
 *  5. Keyboard accessibility (Escape to close drawer)
 * ============================================================
 */

(function () {
  'use strict';

  /* ── 1. Navigation Data ─────────────────────────────────── */
  const SG_SITES = [
    {
      id:       'home',
      label:    'Home',
      icon:     '🏠',
      url:      'https://sirganguly.com',
      hostname: ['sirganguly.com', 'www.sirganguly.com'],
      cls:      'sg-btn-home',
    },
    {
      id:       'ai',
      label:    'AI Teacher',
      icon:     '🤖',
      url:      'https://ai.sirganguly.com',
      hostname: ['ai.sirganguly.com'],
      cls:      'sg-btn-ai',
    },
    {
      id:       'questions',
      label:    'Questions',
      icon:     '❓',
      url:      'https://questions.sirganguly.com',
      hostname: ['questions.sirganguly.com'],
      cls:      'sg-btn-questions',
    },
    {
      id:       'books',
      label:    'Books',
      icon:     '📚',
      url:      'https://books.sirganguly.com',
      hostname: ['books.sirganguly.com'],
      cls:      'sg-btn-books',
    },
    {
      id:       'career',
      label:    'Career',
      icon:     '🚀',
      url:      'https://career.sirganguly.com',
      hostname: ['career.sirganguly.com'],
      cls:      'sg-btn-career',
    },
    {
      id:       'mentor',
      label:    'Mentor',
      icon:     '🎯',
      url:      'https://mentor.sirganguly.com',
      hostname: ['mentor.sirganguly.com'],
      cls:      'sg-btn-mentor',
    },
  ];

  /* ── 2. Detect Active Site ──────────────────────────────── */
  function detectActiveSite() {
    const host = window.location.hostname.toLowerCase().replace(/^www\./, '');
    for (const site of SG_SITES) {
      for (const h of site.hostname) {
        if (h.replace(/^www\./, '') === host) return site.id;
      }
    }
    // Fallback: check if URL contains site identifier
    const href = window.location.href;
    for (const site of SG_SITES) {
      if (href.includes(site.id + '.sirganguly.com')) return site.id;
    }
    return null;
  }

  /* ── 3. Build Button HTML ──────────────────────────────── */
  function buildButtons(activeSiteId, isMobile) {
    return SG_SITES.map(site => {
      const isActive = site.id === activeSiteId;
      const activeClass = isActive ? ' sg-active' : '';
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      const ariaLabel = isActive
        ? `${site.label} — you are here`
        : `Go to ${site.label}`;
      return `
        <a
          href="${site.url}"
          class="sg-btn ${site.cls}${activeClass}"
          aria-label="${ariaLabel}"
          ${ariaCurrent}
          data-sg-site="${site.id}"
        >
          <span class="sg-btn-icon" aria-hidden="true">${site.icon}</span>
          <span class="sg-btn-text">${site.label}</span>
        </a>`.trim();
    }).join('\n        ');
  }

  /* ── 4. Determine avatar image URL ─────────────────────── */
  function getAvatarUrl() {
    // Try to use a globally defined override first
    if (window.SG_AVATAR_URL) return window.SG_AVATAR_URL;
    // On the notes portal (GitHub Pages), the image is at root
    if (
      window.location.hostname === 'susanto68.github.io' ||
      window.location.hostname === 'sirganguly.com' ||
      window.location.hostname === 'www.sirganguly.com'
    ) {
      return '/sirganguly.png';
    }
    // CDN fallback — hosted on notes portal GitHub Pages
    return 'https://susanto68.github.io/Gangulys-notes/sirganguly.png';
  }

  /* ── 5. Build Full Nav HTML ─────────────────────────────── */
  function buildNavHTML(activeSiteId) {
    const avatarUrl = getAvatarUrl();
    const buttons   = buildButtons(activeSiteId);

    return `
<!-- Sir Ganguly Unified Navigation v1.0 -->
<div class="sg-progress-bar" id="sgProgressBar" role="progressbar" aria-hidden="true"></div>
<nav
  class="sg-nav"
  id="sgNav"
  role="navigation"
  aria-label="Sir Ganguly Network — Navigate between all sites"
>
  <div class="sg-nav-container">

    <!-- Brand -->
    <a
      href="https://sirganguly.com"
      class="sg-brand"
      aria-label="Sir Ganguly — Home"
    >
      <img
        src="${avatarUrl}"
        alt="Sir Ganguly"
        class="sg-brand-avatar"
        width="34"
        height="34"
        loading="eager"
        onerror="this.style.display='none'"
      >
      <span class="sg-brand-label">Sir <span>Ganguly</span></span>
    </a>

    <!-- Desktop / Tablet / Mobile inline buttons -->
    <div class="sg-nav-links" role="list" aria-label="Network websites">
      ${buttons}
    </div>

  </div><!-- /.sg-nav-container -->
</nav><!-- /.sg-nav -->
    `.trim();
  }

  /* ── 6. Inject Nav into DOM ─────────────────────────────── */
  function injectNav() {
    const activeSiteId = detectActiveSite();
    const html         = buildNavHTML(activeSiteId);

    // Try to find the mount point
    const root = document.getElementById('sg-nav-root');
    if (root) {
      root.insertAdjacentHTML('afterbegin', html);
    } else if (document.body) {
      document.body.insertAdjacentHTML('afterbegin', html);
    } else {
      // DOMContentLoaded hasn't fired yet — queue it
      document.addEventListener('DOMContentLoaded', injectNav);
      return;
    }

    // Adapt layout if brand-visitor-widget exists on the page
    if (document.querySelector('.brand-visitor-widget')) {
      document.body.classList.add('sg-has-visitor-widget');
    }
  }

  /* ── 7. Loading Progress Bar ────────────────────────────── */
  function showProgressBar() {
    const bar = document.getElementById('sgProgressBar');
    if (!bar) return;
    bar.classList.add('sg-loading');
    bar.style.width = '0%';
    // Quickly jump to 70% then pause
    requestAnimationFrame(() => {
      bar.style.width = '70%';
      setTimeout(() => { bar.style.width = '90%'; }, 350);
    });
  }

  function hideProgressBar() {
    const bar = document.getElementById('sgProgressBar');
    if (!bar) return;
    bar.style.width = '100%';
    setTimeout(() => {
      bar.classList.remove('sg-loading');
      bar.style.width = '0%';
    }, 380);
  }

  /* ── 8. Loading bar on navigation clicks ────────────────── */
  function initNavLinks() {
    const nav = document.getElementById('sgNav');
    if (!nav) return;
    nav.querySelectorAll('a.sg-btn').forEach(link => {
      link.addEventListener('click', function (e) {
        // Only show loading bar for cross-origin navigations
        try {
          const target = new URL(this.href);
          if (target.origin !== window.location.origin) {
            showProgressBar();
            window.addEventListener('pagehide', hideProgressBar, { once: true });
          }
        } catch (_) {/* ignore */}
      });
    });
  }

  /* ── 9. Main init ──────────────────────────────────────── */
  function init() {
    injectNav();

    // Wait a tick for the injected HTML to be in the DOM
    requestAnimationFrame(function () {
      initNavLinks();
    });
  }

  /* ── 12. Bootstrap ──────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready (script loaded with defer/async late)
    init();
  }

  // Expose public API in case another script needs it
  window.SirGangulyNav = {
    refresh:        injectNav,
    showProgress:   showProgressBar,
    hideProgress:   hideProgressBar,
    detectSite:     detectActiveSite,
    sites:          SG_SITES,
  };

})();
