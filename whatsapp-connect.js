// Shared "Talk to Sir on WhatsApp" button: placed where it will not cover page text,
// animated to catch attention, and opening a small chooser that pre-writes the message.
(function () {
  if (window.__waConnectLoaded) return;
  window.__waConnectLoaded = true;

  const PHONE = '919835379900';
  const TEACHER = 'Sir Ganguly';

  const WA_ICON =
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.04 3C9.4 3 4 8.34 4 14.92c0 2.1.56 4.15 1.62 5.95L4 29l8.35-2.16a12.1 12.1 0 0 0 3.69.57C22.67 27.41 28 22.07 28 15.49 28 8.9 22.67 3 16.04 3Zm0 21.97c-1.18 0-2.34-.2-3.44-.6l-.25-.09-4.95 1.28 1.32-4.8-.16-.26a9.72 9.72 0 0 1-1.5-5.18c0-5.42 4.44-9.83 8.99-9.83 5.32 0 9.55 4.66 9.55 10 0 5.34-4.29 9.48-9.56 9.48Zm5.36-7.12c-.29-.15-1.73-.85-2-.94-.27-.1-.47-.15-.66.14-.2.29-.76.94-.93 1.13-.17.2-.34.22-.63.08-.29-.15-1.24-.46-2.36-1.45a8.8 8.8 0 0 1-1.63-2.02c-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.08-.15-.66-1.58-.9-2.16-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.82 1.2 3.01.14.2 2.06 3.14 5 4.4.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.73-.7 1.97-1.38.25-.68.25-1.26.17-1.38-.07-.12-.27-.2-.56-.34Z"/></svg>';

  const CSS = `
    .wa-anim { position: relative; }
    .wa-anim .wa-ico, .wa-anim i.fa-whatsapp { display: inline-block; animation: waWiggle 4s ease-in-out infinite; transform-origin: 50% 60%; }
    .wa-anim::after {
      content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
      animation: waRing 2.2s ease-out infinite;
    }
    @keyframes waWiggle {
      0%, 70%, 100% { transform: rotate(0) scale(1); }
      74% { transform: rotate(-16deg) scale(1.15); }
      78% { transform: rotate(14deg) scale(1.15); }
      82% { transform: rotate(-10deg) scale(1.1); }
      86% { transform: rotate(6deg) scale(1.05); }
    }
    @keyframes waRing {
      0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
      70%, 100% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); }
    }
    .wa-existing { overflow: visible !important; }
    .wa-existing i.fa-whatsapp { display: none !important; }
    .wa-existing .wa-ico { color: #25d366; margin-right: 2px; }
    .wa-ico { width: 1.25em; height: 1.25em; vertical-align: -0.25em; }
    .wa-ico svg { width: 100%; height: 100%; display: block; }

    .wa-topbar-btn {
      flex: 0 0 auto; width: 38px; height: 38px; border: 0; border-radius: 999px; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      background: #25d366; color: #fff; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .wa-header-btn {
      display: inline-flex; align-items: center; gap: 8px; margin: 10px 0 4px; padding: 9px 16px;
      border: 0; border-radius: 999px; cursor: pointer; font: 700 15px "Segoe UI", Arial, sans-serif;
      color: #fff; background: linear-gradient(135deg, #25d366, #128c7e); box-shadow: 0 4px 14px rgba(18, 140, 126, 0.35);
    }
    .wa-float {
      position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 9998;
      width: 58px; height: 58px; border: 0; border-radius: 999px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      background: #25d366; color: #fff; font-size: 30px; box-shadow: 0 6px 18px rgba(0,0,0,0.3);
    }
    body.wa-has-float { padding-bottom: 90px !important; }

    .wa-tip {
      position: fixed; z-index: 9999; max-width: 220px; padding: 8px 12px; border-radius: 12px;
      background: #fff; color: #0f172a; font: 700 13px "Segoe UI", Arial, sans-serif;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25); pointer-events: none;
      opacity: 0; transform: translateY(6px); transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .wa-tip.show { opacity: 1; transform: translateY(0); }

    .wa-backdrop { position: fixed; inset: 0; z-index: 10000; background: rgba(15, 23, 42, 0.45); display: none; }
    .wa-backdrop.open { display: block; }
    .wa-card {
      position: fixed; z-index: 10001; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: min(92vw, 360px); background: #fff; color: #0f172a; border-radius: 18px; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.35); font-family: "Segoe UI", Arial, sans-serif; display: none;
    }
    .wa-card.open { display: block; animation: waPop 0.22s ease-out; }
    @keyframes waPop { from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); } }
    .wa-card-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: #075e54; color: #fff; }
    .wa-card-head .wa-ico { width: 30px; height: 30px; }
    .wa-card-head b { display: block; font-size: 16px; }
    .wa-card-head small { opacity: 0.85; font-size: 12px; }
    .wa-close { margin-left: auto; background: transparent; border: 0; color: #fff; font-size: 24px; cursor: pointer; line-height: 1; }
    .wa-card-body { padding: 14px 16px 16px; }
    .wa-card-body label { font-size: 13px; font-weight: 700; color: #334155; }
    .wa-card-body input {
      width: 100%; box-sizing: border-box; margin: 4px 0 12px; padding: 9px 11px; font-size: 15px;
      border: 2px solid #cbd5e1; border-radius: 10px;
    }
    .wa-card-body input:focus { outline: none; border-color: #25d366; }
    .wa-opt {
      display: flex; align-items: center; gap: 10px; width: 100%; box-sizing: border-box; margin-top: 8px;
      padding: 11px 12px; border: 2px solid #dcfce7; border-radius: 12px; background: #f0fdf4;
      font: 700 15px "Segoe UI", Arial, sans-serif; color: #065f46; cursor: pointer; text-align: left;
    }
    .wa-opt:hover, .wa-opt:focus-visible { border-color: #25d366; background: #dcfce7; outline: none; }
    .wa-opt span { font-size: 20px; }
    .wa-note { margin-top: 12px; font-size: 12px; color: #64748b; text-align: center; }

    @media (prefers-reduced-motion: reduce) {
      .wa-anim .wa-ico, .wa-anim i.fa-whatsapp, .wa-anim::after { animation: none; }
    }
  `;

  function topic() {
    const t = (document.title || 'Ganguly\'s Notes')
      .replace(/\s*[-|–]\s*(BlueJ Lab|Ganguly'?s.*|SirGanguly.*)$/i, '')
      .trim();
    return t || 'Ganguly\'s Notes';
  }

  function buildMessage(kind, name) {
    const greeting = 'Hello ' + TEACHER + (name ? ', I am ' + name + '.' : '.');
    const t = topic();
    const lines = {
      doubt: 'I have a doubt about "' + t + '".',
      feedback: 'Here is my feedback about "' + t + '": ',
      help: 'Could you please help me with notes / practice for "' + t + '"?'
    };
    return greeting + ' ' + lines[kind] + '\n(Page: ' + location.href.split('#')[0] + ')';
  }

  let card, backdrop, nameInput, lastTrigger;

  function buildCard() {
    backdrop = document.createElement('div');
    backdrop.className = 'wa-backdrop';
    card = document.createElement('div');
    card.className = 'wa-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', 'Contact ' + TEACHER + ' on WhatsApp');
    card.innerHTML =
      '<div class="wa-card-head"><span class="wa-ico">' + WA_ICON + '</span>' +
      '<div><b>Talk to ' + TEACHER + '</b><small>Replies on WhatsApp</small></div>' +
      '<button class="wa-close" type="button" aria-label="Close">&times;</button></div>' +
      '<div class="wa-card-body">' +
      '<label for="waName">Your name (optional)</label>' +
      '<input id="waName" type="text" maxlength="40" autocomplete="name" placeholder="e.g. Anmol, Class 9">' +
      '<button class="wa-opt" type="button" data-kind="doubt"><span>&#10067;</span> Ask a doubt</button>' +
      '<button class="wa-opt" type="button" data-kind="help"><span>&#128218;</span> Ask for notes / practice help</button>' +
      '<button class="wa-opt" type="button" data-kind="feedback"><span>&#128172;</span> Share feedback</button>' +
      '<div class="wa-note">WhatsApp opens with your message ready. Just press Send.</div>' +
      '</div>';
    document.body.appendChild(backdrop);
    document.body.appendChild(card);
    nameInput = card.querySelector('#waName');
    try { nameInput.value = localStorage.getItem('waStudentName') || ''; } catch (e) {}

    backdrop.addEventListener('click', closeCard);
    card.querySelector('.wa-close').addEventListener('click', closeCard);
    card.querySelectorAll('.wa-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        try { localStorage.setItem('waStudentName', name); } catch (e) {}
        const url = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(buildMessage(btn.dataset.kind, name));
        window.open(url, '_blank', 'noopener');
        closeCard();
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && card.classList.contains('open')) closeCard();
    });
  }

  function openCard(e) {
    if (e) e.preventDefault();
    if (!card) buildCard();
    lastTrigger = e && e.currentTarget;
    backdrop.classList.add('open');
    card.classList.add('open');
    setTimeout(() => card.querySelector('.wa-opt').focus(), 50);
  }

  function closeCard() {
    backdrop.classList.remove('open');
    card.classList.remove('open');
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }

  function showTip(anchor) {
    try {
      if (sessionStorage.getItem('waTipShown')) return;
      sessionStorage.setItem('waTipShown', '1');
    } catch (e) {}
    const tip = document.createElement('div');
    tip.className = 'wa-tip';
    tip.textContent = 'Have a doubt? Ask ' + TEACHER + ' on WhatsApp!';
    document.body.appendChild(tip);
    const r = anchor.getBoundingClientRect();
    const w = 220;
    const left = Math.min(window.innerWidth - w - 8, Math.max(8, r.right - w));
    tip.style.left = left + 'px';
    if (r.top > window.innerHeight / 2) tip.style.bottom = (window.innerHeight - r.top + 10) + 'px';
    else tip.style.top = (r.bottom + 10) + 'px';
    requestAnimationFrame(() => tip.classList.add('show'));
    setTimeout(() => { tip.classList.remove('show'); setTimeout(() => tip.remove(), 400); }, 4500);
  }

  function makeButton(className, inner, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = className + ' wa-anim';
    b.setAttribute('aria-label', label);
    b.title = label;
    b.innerHTML = inner;
    b.addEventListener('click', openCard);
    return b;
  }

  function init() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const label = 'Ask ' + TEACHER + ' on WhatsApp';
    let anchor = null;

    const existing = document.querySelectorAll('a.whatsapp-btn, a[href*="wa.me/' + PHONE + '"]');
    if (existing.length) {
      existing.forEach((a) => {
        a.classList.add('wa-anim', 'wa-existing');
        if (!a.querySelector('.wa-ico')) a.insertAdjacentHTML('afterbegin', '<span class="wa-ico">' + WA_ICON + '</span>');
        a.addEventListener('click', openCard);
      });
      anchor = existing[0];
    } else if (document.querySelector('[data-wa-slot]')) {
      anchor = makeButton('wa-topbar-btn', '<span class="wa-ico">' + WA_ICON + '</span>', label);
      document.querySelector('[data-wa-slot]').appendChild(anchor);
    } else if (document.querySelector('.topbar')) {
      anchor = makeButton('wa-topbar-btn', '<span class="wa-ico">' + WA_ICON + '</span>', label);
      document.querySelector('.topbar').appendChild(anchor);
    } else if (document.querySelector('header')) {
      anchor = makeButton('wa-header-btn', '<span class="wa-ico">' + WA_ICON + '</span> Ask ' + TEACHER + ' on WhatsApp', label);
      const header = document.querySelector('header');
      const wrap = document.createElement('div');
      wrap.appendChild(anchor);
      header.appendChild(wrap);
    } else {
      anchor = makeButton('wa-float', '<span class="wa-ico">' + WA_ICON + '</span>', label);
      document.body.appendChild(anchor);
      document.body.classList.add('wa-has-float');
    }

    setTimeout(() => showTip(anchor), 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
