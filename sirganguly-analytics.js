/**
 * ============================================================
 *  Sir Ganguly — Unified Analytics & Tag Manager Core  v1.0
 *  sirganguly-analytics.js
 *
 *  Responsibilities:
 *  1. Load GA4 (G-TLYCKMSYK5) & GTM (GTM-T8L8R2S) asynchronously.
 *  2. Maintain cross-subdomain user tracking via cookie sharing.
 *  3. Ensure strict GDPR & privacy compliance (PII filtering).
 *  4. Auto-track pageviews, outclicks, downloads, forms, and scrolls.
 *  5. Expose public JS API for custom portal-specific tracking.
 * ============================================================
 */

(function () {
  'use strict';

  // 1. Configuration & Constants
  const DEFAULT_GA4_ID = 'G-B8ZXHFVS1B';
  const DEFAULT_GTM_ID = 'GTM-T8L8R2S';

  const GA4_MEASUREMENT_ID = window.SIRGANGULY_GA4_ID || DEFAULT_GA4_ID;
  const GTM_CONTAINER_ID = window.SIRGANGULY_GTM_ID || DEFAULT_GTM_ID;

  // Global variables
  window.dataLayer = window.dataLayer || [];

  // Helper to push to GTM Data Layer
  function pushEvent(name, params) {
    const enrichedParams = Object.assign({
      event: name,
      subdomain: getSubdomain(),
      timestamp: new Date().toISOString(),
      hostname: window.location.hostname,
      page_path: window.location.pathname
    }, params);

    window.dataLayer.push(enrichedParams);
  }

  // Safe wrapper for standard GA4 gtag
  function gtag() {
    window.dataLayer.push(arguments);
  }

  // 2. Privacy & GDPR Compliance Checking
  function isTrackingAllowed() {
    // Respect browser "Do Not Track" headers
    const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') {
      console.warn('📊 Sir Ganguly Analytics: Tracking disabled due to browser Do-Not-Track header.');
      return false;
    }

    // Respect custom GDPR Cookie Consent if defined in the ecosystem
    if (window.SIRGANGULY_CONSENT_DECLINED === true) {
      console.warn('📊 Sir Ganguly Analytics: Tracking disabled due to cookie consent denial.');
      return false;
    }

    return true;
  }

  // Helper to extract subdomain reliably
  function getSubdomain() {
    const hostname = window.location.hostname.toLowerCase();

    // Check if it is a local environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }

    // Check if it is a classic root host
    const rootHosts = [
      'sirganguly.com',
      'www.sirganguly.com',
      'susanto68.github.io',
      'gangulys-notes.vercel.app',
      'edu.gangulys.com'
    ];

    if (rootHosts.includes(hostname)) {
      return 'home';
    }

    // Parse subdomains under sirganguly.com or github.io
    const match = hostname.match(/^([^.]+)\.sirganguly\.com$/) || hostname.match(/^([^.]+)\.github\.io$/);
    return match ? match[1] : hostname;
  }

  // 3. Sanitizers to prevent PII leakage (Passwords, Auth keys, Private text inputs)
  function sanitizeValue(text, fieldName) {
    if (!text || typeof text !== 'string') return '';

    const lowerName = (fieldName || '').toLowerCase();

    // Ignore password inputs, credentials, credit card details, security codes, and social security numbers
    const sensitiveFields = [
      'pass', 'password', 'pwd', 'secret', 'token', 'key', 'auth', 'pin', 'cvv',
      'card', 'cc', 'ssn', 'phone', 'mobile', 'email', 'mail', 'username', 'login'
    ];

    if (sensitiveFields.some(field => lowerName.includes(field))) {
      return '[REDACTED_SENSITIVE_FIELD]';
    }

    // Filter potential emails or phone numbers from free-text using standard regex patterns
    let clean = text
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');

    // Limit length to avoid bloating telemetry databases
    if (clean.length > 250) {
      clean = clean.substring(0, 247) + '...';
    }

    return clean;
  }

  function sanitizeUrl(url) {
    if (!url) return '';
    try {
      const parsedUrl = new URL(url);
      const searchParams = parsedUrl.searchParams;

      const sensitiveKeys = ['token', 'password', 'pass', 'key', 'auth', 'code', 'session', 'id', 'user'];
      let modified = false;

      sensitiveKeys.forEach(key => {
        if (searchParams.has(key)) {
          searchParams.set(key, '[REDACTED]');
          modified = true;
        }
      });

      return modified ? parsedUrl.toString() : url;
    } catch (_) {
      return '[INVALID_OR_SENSITIVE_URL]';
    }
  }

  // 4. Loader Scripts
  function injectScripts() {
    if (!isTrackingAllowed()) return;

    console.log(`📊 Sir Ganguly Analytics: Initializing GA4 (${GA4_MEASUREMENT_ID}) & GTM (${GTM_CONTAINER_ID}) under subdomain: "${getSubdomain()}"`);

    // GTM dataLayer initialization
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // A. Load GTM Container Script
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
    document.head.appendChild(gtmScript);

    // B. Load GA4 gtag Script
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    // C. Configure GA4 defaults
    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID, {
      cookie_domain: 'auto', // Natively preserves session across all subdomains
      anonymize_ip: true,    // Complies with GDPR IP guidelines
      send_page_view: false, // Page view fired manually below to include custom params
      custom_map: {
        'dimension1': 'subdomain',
        'dimension2': 'viewport_size',
        'dimension3': 'page_category'
      }
    });

    // D. Fire initial Page View with enriched parameters
    firePageView();
  }

  function firePageView() {
    if (!isTrackingAllowed()) return;

    const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    const screenResolution = `${window.screen.width}x${window.screen.height}`;

    // GA4 config tracking
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: sanitizeUrl(window.location.href),
      page_path: window.location.pathname,
      referrer: sanitizeUrl(document.referrer),
      subdomain: getSubdomain(),
      viewport_size: viewportSize,
      screen_resolution: screenResolution
    });

    // GTM trigger
    pushEvent('page_view_enriched', {
      page_title: document.title,
      page_location: sanitizeUrl(window.location.href),
      viewport_size: viewportSize,
      screen_resolution: screenResolution,
      referrer: sanitizeUrl(document.referrer)
    });
  }

  // 5. Automatic Event Trackers (Captures interactions instantly)
  function initAutoTrackers() {
    if (!isTrackingAllowed()) return;

    // A. Outbound link clicks & File downloads
    document.addEventListener('click', function (event) {
      const anchor = event.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Handle downloads
      const downloadRegex = /\.(zip|pdf|docx|xlsx|pptx|mp3|wav|dmg|pkg|tar|gz|txt|csv)$/i;
      const downloadMatch = href.match(downloadRegex);

      if (downloadMatch) {
        const fileName = href.substring(href.lastIndexOf('/') + 1) || 'file';
        const fileExt = downloadMatch[1].toLowerCase();

        // Track GA4 file download
        gtag('event', 'file_download', {
          file_name: fileName,
          file_extension: fileExt,
          link_url: sanitizeUrl(anchor.href)
        });

        // Push to GTM
        pushEvent('download_completed', {
          file_name: fileName,
          file_extension: fileExt,
          link_url: sanitizeUrl(anchor.href)
        });
        return;
      }

      // Handle outbound clicks
      try {
        const url = new URL(anchor.href);
        const currentHostname = window.location.hostname.replace('www.', '');
        const targetHostname = url.hostname.replace('www.', '');

        const isEcosystemSite = targetHostname.endsWith('sirganguly.com') || targetHostname === currentHostname;

        if (!isEcosystemSite) {
          // Track Outbound Click
          gtag('event', 'click', {
            outbound: true,
            link_classes: anchor.className || '',
            link_id: anchor.id || '',
            link_url: sanitizeUrl(anchor.href),
            target_domain: url.hostname
          });

          pushEvent('outbound_click', {
            link_classes: anchor.className || '',
            link_id: anchor.id || '',
            link_url: sanitizeUrl(anchor.href),
            target_domain: url.hostname
          });
        }
      } catch (_) {
        // Safe catch for relative hashes, javascript:void(0) links
      }
    }, true);

    // B. Scroll Depth Tracker (efficiency-optimized)
    let scrollDepthFired = { '25': false, '50': false, '75': false, '100': false };
    let scrollTimeout = null;

    function trackScrollDepth() {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      const totalScrollable = scrollHeight - clientHeight;
      if (totalScrollable <= 0) return;

      const percentage = Math.round((scrollTop / totalScrollable) * 100);

      const thresholds = ['25', '50', '75', '100'];
      thresholds.forEach(threshold => {
        const numericVal = parseInt(threshold, 10);
        if (percentage >= numericVal && !scrollDepthFired[threshold]) {
          scrollDepthFired[threshold] = true;

          // Track Scroll Depth
          gtag('event', 'scroll', {
            percent_scrolled: numericVal
          });

          pushEvent('scroll_depth_reached', {
            percent_scrolled: numericVal
          });
        }
      });
    }

    window.addEventListener('scroll', function () {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        trackScrollDepth();
        scrollTimeout = null;
      }, 250); // Throttled to 250ms for smooth animations and low CPU load
    }, { passive: true });

    // C. Form Submission Tracker (With automatic PII extraction filters)
    document.addEventListener('submit', function (event) {
      const form = event.target;
      if (!form) return;

      const formId = form.id || 'anonymous_form';
      const formName = form.name || form.getAttribute('aria-label') || 'form';

      // Scan and count fields, skip values to protect user PII
      let inputFieldCount = 0;
      let textInputFieldNames = [];

      Array.from(form.elements).forEach(element => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
          inputFieldCount++;
          if (element.name && element.type !== 'password' && element.type !== 'hidden') {
            textInputFieldNames.push(element.name);
          }
        }
      });

      // Track Form Submission (Send metadata, NEVER track values inputted)
      gtag('event', 'form_submit', {
        form_id: formId,
        form_name: formName,
        fields_count: inputFieldCount,
        field_names: textInputFieldNames.join(',')
      });

      pushEvent('form_submitted', {
        form_id: formId,
        form_name: formName,
        fields_count: inputFieldCount
      });
    }, true);

    // D. Button & Call to Action Clicks
    document.addEventListener('click', function (event) {
      const target = event.target;
      const button = target.closest('button') || target.closest('.btn') || target.closest('.sg-btn') || target.closest('[role="button"]');
      if (!button) return;

      const buttonText = sanitizeValue(button.innerText || button.getAttribute('aria-label') || button.value || '', 'button_label');
      const buttonId = button.id || '';
      const buttonClass = button.className || '';

      // Skip clicks on links since they are already audited
      if (button.tagName === 'A') return;

      // Track Button Click
      gtag('event', 'button_click', {
        button_id: buttonId,
        button_text: buttonText,
        button_classes: buttonClass
      });

      pushEvent('button_clicked', {
        button_id: buttonId,
        button_text: buttonText,
        button_classes: buttonClass
      });
    }, true);
  }

  // 6. Bootstrap Analytics Core
  function bootstrap() {
    injectScripts();
    initAutoTrackers();
  }

  // Safe execution on loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // 7. Public API Definitions (Exposed globally for subdomain developers)
  window.SirGangulyAnalytics = {
    // Core details
    version: '1.0.0',
    getSubdomain: getSubdomain,
    firePageView: firePageView,
    pushCustomEvent: function (eventName, eventParams) {
      if (!isTrackingAllowed()) return;
      gtag('event', eventName, eventParams);
      pushEvent(eventName, eventParams);
    },

    // A. Job Portal Tracking Events
    trackJobSearch: function (searchTerm) {
      this.pushCustomEvent('job_search', {
        search_term: sanitizeValue(searchTerm, 'search_term')
      });
    },

    trackJobView: function (jobId, jobTitle) {
      this.pushCustomEvent('job_view', {
        job_id: jobId,
        job_title: sanitizeValue(jobTitle, 'job_title')
      });
    },

    trackApplyClick: function (jobId, jobTitle) {
      this.pushCustomEvent('apply_click', {
        job_id: jobId,
        job_title: sanitizeValue(jobTitle, 'job_title')
      });
    },

    trackRegistration: function () {
      this.pushCustomEvent('registration', {});
    },

    trackLogin: function () {
      this.pushCustomEvent('login', {});
    },

    // B. AI Voice Assistant & Avatar Portal Events
    trackAvatarConversationStart: function (avatarType) {
      this.pushCustomEvent('avatar_conversation_start', {
        avatar_type: avatarType || 'computer-teacher'
      });
    },

    trackAvatarVoiceInteraction: function (inputType) {
      this.pushCustomEvent('avatar_voice_interaction', {
        input_type: inputType || 'voice'
      });
    },

    trackAvatarQuestionAsked: function (avatarType, questionLength) {
      this.pushCustomEvent('avatar_question_asked', {
        avatar_type: avatarType || 'computer-teacher',
        question_length: questionLength || 0
      });
    },

    trackAvatarSessionComplete: function (interactionCount) {
      this.pushCustomEvent('avatar_session_complete', {
        interaction_count: interactionCount || 0
      });
    },

    // C. Bhagavad Gita Portal Events
    trackGitaChapterOpen: function (chapterNumber) {
      this.pushCustomEvent('gita_chapter_open', {
        chapter_number: chapterNumber
      });
    },

    trackGitaShlokaRead: function (chapterNumber, shlokaNumber) {
      this.pushCustomEvent('gita_shloka_read', {
        chapter_number: chapterNumber,
        shloka_number: shlokaNumber
      });
    },

    trackGitaAudioPlayed: function (chapterNumber, shlokaNumber) {
      this.pushCustomEvent('gita_audio_played', {
        chapter_number: chapterNumber,
        shloka_number: shlokaNumber
      });
    },

    trackGitaTranslationViewed: function (chapterNumber, shlokaNumber, translationAuthor) {
      this.pushCustomEvent('gita_translation_viewed', {
        chapter_number: chapterNumber,
        shloka_number: shlokaNumber,
        translation_author: translationAuthor || 'Swami Sivananda'
      });
    },

    // D. Mock Test Portal Events
    trackMockTestStart: function (testId, subject) {
      this.pushCustomEvent('mock_test_start', {
        test_id: testId,
        subject: subject
      });
    },

    trackMockTestQuestionAttempt: function (testId, questionNumber) {
      this.pushCustomEvent('mock_test_question_attempt', {
        test_id: testId,
        question_number: questionNumber
      });
    },

    trackMockTestComplete: function (testId, score, percentage) {
      this.pushCustomEvent('mock_test_complete', {
        test_id: testId,
        score: score,
        percentage: percentage
      });
    },

    trackMockTestCertificateGenerated: function (testId, certificateId) {
      this.pushCustomEvent('mock_test_certificate_generated', {
        test_id: testId,
        certificate_id: certificateId
      });
    }
  };

})();
