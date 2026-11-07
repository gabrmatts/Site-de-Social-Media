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

  /* ---------- Galeria em pop-up: arraste para o lado (ou use as setas) ---------- */
  function openGallery(item) {
    if (!item || !item.gallery) return;
    let modal = $('#galModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'galModal'; modal.className = 'gal';
      modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML =
        '<div class="gal-bg" data-gclose></div>' +
        '<button type="button" class="gal-close" data-gclose aria-label="Fechar galeria"><i class="bi bi-x-lg" aria-hidden="true"></i></button>' +
        '<div class="gal-box">' +
          '<div class="gal-track" tabindex="0"></div>' +
          '<button type="button" class="gal-nav gal-prev" aria-label="Anterior"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>' +
          '<button type="button" class="gal-nav gal-next" aria-label="Próxima"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>' +
          '<div class="gal-foot"><span class="gal-title"></span><span class="gal-hint"><i class="bi bi-arrow-left-right" aria-hidden="true"></i> arraste para o lado</span><span class="gal-count"></span></div>' +
          '<div class="gal-dots"></div>' +
        '</div>';
      document.body.appendChild(modal);
    }
    const track = $('.gal-track', modal), dots = $('.gal-dots', modal), count = $('.gal-count', modal);
    const prev = $('.gal-prev', modal), next = $('.gal-next', modal), closeBtn = $('.gal-close', modal);
    const opener = document.activeElement;
    let idx = 0;

    $('.gal-title', modal).textContent = item.title;
    track.innerHTML = item.gallery.map((src, i) =>
      '<figure class="gal-slide"><img src="' + src + '" alt="' + item.title + ' — imagem ' + (i + 1) + '" draggable="false" decoding="async"></figure>').join('');

    const slides = () => $$('.gal-slide', track);
    const width = () => track.clientWidth || 1;
    function refresh() {
      const n = slides().length;
      idx = Math.min(Math.max(Math.round(track.scrollLeft / width()), 0), Math.max(n - 1, 0));
      count.textContent = n ? (idx + 1) + ' / ' + n : '';
      dots.innerHTML = Array.from({ length: n }, (_, i) => '<button type="button" class="gal-dot' + (i === idx ? ' is-active' : '') + '" data-i="' + i + '" aria-label="Ir para a imagem ' + (i + 1) + '"></button>').join('');
      prev.disabled = idx <= 0; next.disabled = idx >= n - 1;
    }
    const goTo = (i) => track.scrollTo({ left: i * width(), behavior: reduceMotion ? 'auto' : 'smooth' });

    // imagem que não existe é ignorada
    $$('img', track).forEach((img) => img.addEventListener('error', () => { img.closest('.gal-slide').remove(); refresh(); }));

    let raf = 0;
    track.onscroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; refresh(); }); };
    prev.onclick = () => goTo(idx - 1);
    next.onclick = () => goTo(idx + 1);
    dots.onclick = (e) => { const d = e.target.closest('.gal-dot'); if (d) goTo(+d.dataset.i); };

    // arrastar com o mouse (no celular o toque já rola nativamente)
    let down = false, startX = 0, startLeft = 0;
    track.onpointerdown = (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; startX = e.clientX; startLeft = track.scrollLeft;
      track.style.scrollSnapType = 'none'; track.classList.add('is-grabbing');
      try { track.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
    };
    track.onpointermove = (e) => { if (down) track.scrollLeft = startLeft - (e.clientX - startX); };
    const endDrag = () => {
      if (!down) return;
      down = false; track.classList.remove('is-grabbing');
      track.style.scrollSnapType = '';
      goTo(Math.round(track.scrollLeft / width()));
    };
    track.onpointerup = endDrag; track.onpointercancel = endDrag;

    function close() {
      modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      document.removeEventListener('keydown', onKey);
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') { goTo(idx - 1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { goTo(idx + 1); e.preventDefault(); }
      else if (e.key === 'Tab') {
        const f = [closeBtn, prev, next].filter((b) => !b.disabled);
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    }
    $$('[data-gclose]', modal).forEach((el) => { el.onclick = close; });

    track.scrollLeft = 0; refresh();
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    document.addEventListener('keydown', onKey);
    closeBtn.focus();
  }

  /* ---------- Portfólio: cards empilhados + galeria ---------- */
  function initPortfolioLayout() {
    const grid = $('.pf-grid');
    if (!grid) return;
    $$('.pf-media img', grid).forEach((i) => { i.loading = 'eager'; });       // imagens que faltam somem logo
    const cta = $('.pf-cta', grid);
    if (cta) grid.after(cta);                                                  // o cartão final fica fora da pilha

    // card/botão com galeria: abre o pop-up
    document.addEventListener('click', (e) => {
      const el = e.target.closest('.pf-galopen'); if (!el) return;
      const card = el.closest('.pf-card'); if (!card) return;
      try { openGallery({ title: $('h3', card).textContent, gallery: JSON.parse(card.dataset.gallery) }); } catch (_) { /* sem galeria */ }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMarquee();
    initPortfolio();
    initPortfolioLayout();
    initScrollState();
    initActiveNav();
    initMobileMenu();
    initCompare();
    initFaq();
    initCertModal();
  });
})();