/* =====================================================================
   MAIN.JS — funcionalidades: scroll, menu ativo, menu mobile,
   comparador antes/depois, FAQ e pop-up de certificados
   ===================================================================== */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // o <html> tem overflow-x oculto, então travar o <body> não basta: travamos o <html>
  const lockScroll = (on) => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

  /* ---------- Barra de progresso, navbar e "voltar ao topo" ---------- */
  function initScrollState() {
    const navbar = $('#navbar'), toTop = $('#backToTop'), bar = $('#scrollProgress');
    if (!navbar && !toTop && !bar) return;
    let ticking = false, lastY = 0;
    if (navbar) navbar.addEventListener('focusin', () => navbar.classList.remove('is-hidden'));

    const update = () => {
      const y = window.scrollY;
      if (navbar) navbar.classList.toggle('is-scrolled', y > 40);
      if (navbar && Math.abs(y - lastY) > 6) {
        const menuOpen = document.documentElement.style.overflow === 'hidden';
        if (!menuOpen) navbar.classList.toggle('is-hidden', y > 500 && y > lastY);
        lastY = y;
      }
      if (toTop) toTop.classList.toggle('is-visible', y > 600);
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    if (toTop) toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------- Link ativo do menu (limpa ao voltar para o hero) ---------- */
  function initActiveNav() {
    const links = $$('.nav-link[href^="#"], .tab[href^="#"]');       // menu do topo + menu inferior
    const sections = $$('section[id]');
    if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) =>
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Menu mobile ---------- */
  function initMobileMenu() {
    const toggle = $('#navbarToggle'), menu = $('#navbarMenu');
    if (!toggle || !menu) return;
    const mobile = matchMedia('(max-width: 768px)');
    let lastFocus = null;
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    const focusables = () => $$('a[href], button:not([disabled])', menu);
    const isOpen = () => menu.classList.contains('is-open');
    // no celular o menu fechado fica fora da tela: impede o foco do teclado nele
    const syncInert = () => { menu.inert = mobile.matches && !isOpen(); };

    function onKey(e) {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function open() {
      lastFocus = document.activeElement;
      toggle.classList.add('is-open'); menu.classList.add('is-open'); backdrop.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Fechar menu');
      lockScroll(true); syncInert();
      document.addEventListener('keydown', onKey);
      const f = focusables(); if (f.length) f[0].focus();
    }

    function close(restoreFocus = true) {
      toggle.classList.remove('is-open'); menu.classList.remove('is-open'); backdrop.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      lockScroll(false); syncInert();
      document.removeEventListener('keydown', onKey);
      if (restoreFocus && lastFocus) lastFocus.focus();
    }

    backdrop.addEventListener('click', () => close());
    toggle.addEventListener('click', () => (isOpen() ? close() : open()));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => close(false)));
    mobile.addEventListener('change', () => { if (!mobile.matches && isOpen()) close(false); syncInert(); });
    syncInert();
  }

  /* ---------- Comparador antes/depois (arrasta em qualquer ponto) ---------- */
  function initCompare() {
    const wrap = $('#compareSlider'), frame = $('#compareFrame'), handle = $('#compareHandle');
    if (!wrap || !frame || !handle) return;
    let dragging = false, raf = 0, nextX = 0;

    const setPos = (pct) => {
      const p = Math.min(100, Math.max(0, pct));
      wrap.style.setProperty('--pos', p + '%');
      handle.setAttribute('aria-valuenow', Math.round(p));
    };
    const pctFromX = (x) => {
      const r = frame.getBoundingClientRect();
      return ((x - r.left) / r.width) * 100;
    };

    frame.style.touchAction = 'pan-y';      // rolagem vertical continua funcionando no celular

    wrap.addEventListener('pointerdown', (e) => {
      dragging = true;
      wrap.classList.add('is-dragging');
      try { wrap.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
      setPos(pctFromX(e.clientX));
    });

    wrap.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      nextX = e.clientX;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; setPos(pctFromX(nextX)); });
    });

    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove('is-dragging');
      try { wrap.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    };
    wrap.addEventListener('pointerup', stop);
    wrap.addEventListener('pointercancel', stop);

    handle.addEventListener('keydown', (e) => {
      const cur = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      const step = e.shiftKey ? 10 : 5;
      const map = { ArrowLeft: cur - step, ArrowRight: cur + step, Home: 0, End: 100 };
      if (e.key in map) { setPos(map[e.key]); e.preventDefault(); }
    });

    setPos(50);
  }

  /* ---------- FAQ (uma pergunta aberta por vez) ---------- */
  function initFaq() {
    const items = $$('.faq-item');
    items.forEach((item) => {
      const q = $('.faq-question', item);
      if (!q) return;
      q.addEventListener('click', () => {
        const wasOpen = item.classList.contains('is-open');
        items.forEach((o) => {
          o.classList.remove('is-open');
          const oq = $('.faq-question', o); if (oq) oq.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) { item.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ---------- Pop-up dos certificados ---------- */
  function initCertModal() {
    const modal = $('#certModal');
    const triggers = $$('[data-cert]');
    if (!modal || !triggers.length) return;
    const img = $('img', modal), closeBtn = $('.modal-close', modal);
    let last = null;

    function hide() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      document.removeEventListener('keydown', onKey);
      if (last) last.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') hide();
      else if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }   // só há um elemento focável
    }

    triggers.forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();                       // sem JS, o link abre a imagem em nova aba
      last = a;
      img.onerror = () => { hide(); window.open(a.href, '_blank', 'noopener'); };   // plano B
      img.src = a.getAttribute('href');
      img.alt = a.getAttribute('data-cert') || '';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      lockScroll(true);
      document.addEventListener('keydown', onKey);
      closeBtn.focus();
    }));

    $$('[data-close]', modal).forEach((el) => el.addEventListener('click', hide));
  }

  /* ---------- Portfólio: card clicável só se tiver link real do cliente ---------- */
  function initPortfolio() {
    $$('.pf-card').forEach((card) => {
      const stretch = $('.pf-stretch', card);
      if (stretch && !/seu-link/i.test(stretch.href)) return;       // tem site: card inteiro vira link
      if (stretch) stretch.remove();
      const visit = $('.pf-visit', card); if (visit) visit.remove();
      card.classList.add('no-site');
    });

    // a grade se reorganiza conforme o número de cards (cards sem imagem são removidos)
    const grid = $('.pf-grid');
    if (!grid) return;
    const count = () => grid.setAttribute('data-count', $$('.pf-card', grid).length);
    count();
    new MutationObserver(count).observe(grid, { childList: true });
  }

  /* ---------- Faixa de logos: cria a cópia para o loop infinito ---------- */
  function initMarquee() {
    const track = $('.trilha-parceiros');
    if (!track) return;
    const items = Array.from(track.children);
    items.forEach((el) => {
      const copy = el.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      $$('img', copy).forEach((i) => { i.alt = ''; });
      track.appendChild(copy);
    });
    track.style.animationDuration = Math.max(24, items.length * 4) + 's';   // velocidade constante
  }

  /* ---------- Dica única no botão de orçamento (celular) ---------- */
  function initCtaTip() {
    const cta = $('.tab-center');
    const mobile = matchMedia('(max-width: 768px)');
    const KEY = 'gg_cta_tip_seen';
    if (!cta) return;
    try { if (localStorage.getItem(KEY)) return; } catch (_) { /* segue sem lembrar */ }

    let tip = null, hideTimer = 0;

    function finish() {
      clearTimeout(hideTimer);
      document.removeEventListener('pointerdown', finish, true);
      try { localStorage.setItem(KEY, '1'); } catch (_) { /* noop */ }
      if (!tip) return;
      const el = tip; tip = null;
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 400);
    }

    function show() {
      if (tip || !mobile.matches || document.hidden) return;
      tip = document.createElement('div');
      tip.className = 'tab-tip';
      tip.setAttribute('role', 'status');
      tip.textContent = 'Peça seu orçamento no WhatsApp';
      cta.appendChild(tip);
      requestAnimationFrame(() => tip && tip.classList.add('is-visible'));
      hideTimer = setTimeout(finish, 5500);                       // some sozinho
      document.addEventListener('pointerdown', finish, true);     // ou ao primeiro toque
    }

    setTimeout(show, 8000);                                       // aparece uma única vez
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCtaTip();
    initMarquee();
    initPortfolio();
    initScrollState();
    initActiveNav();
    initMobileMenu();
    initCompare();
    initFaq();
    initCertModal();
  });
})();