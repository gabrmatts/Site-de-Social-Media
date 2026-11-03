/* =====================================================================
   ANIMATIONS.JS — movimento: reveal ao rolar, brilho do cursor,
   contador dos números, botões magnéticos, tilt dos cards e ripple
   ===================================================================== */
(function () {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;   // só mouse de verdade
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Texto "embaralhando" nos rótulos de seção ---------- */
  function scramble(el) {
    if (!el || el.dataset.scrambled) return;
    el.dataset.scrambled = 'true';
    const original = el.textContent, len = original.length, total = 26;
    const chars = '!<>-_\\/[]{}—=+*^?#';
    let frame = 0;
    (function tick() {
      let out = '';
      for (let i = 0; i < len; i++) {
        const start = Math.floor((i / len) * total * 0.55);
        if (frame >= start + 7) out += original[i];
        else if (frame >= start) out += original[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
        else out += '\u00A0';
      }
      el.textContent = out;
      if (++frame <= total + 7) requestAnimationFrame(tick); else el.textContent = original;
    })();
  }

  /* ---------- Reveal ao rolar ---------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    // escalonamento entre irmãos (o atraso é removido depois, para não atrasar o hover dos cards)
    items.forEach((el) => {
      const sibs = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
      el.style.transitionDelay = Math.min(sibs.indexOf(el) * 90, 360) + 'ms';
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('is-visible');
        io.unobserve(el);
        setTimeout(() => { el.style.transitionDelay = ''; }, 1400);
        const label = el.classList.contains('section-label') ? el : el.querySelector('.section-label');
        scramble(label);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    items.forEach((el) => io.observe(el));
  }

  /* ---------- Pausa as animações do hero quando ele sai da tela ---------- */
  function initHeroPause() {
    const hero = document.querySelector('.hero');
    if (!hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([en]) => hero.classList.toggle('is-paused', !en.isIntersecting))
      .observe(hero);
  }

  /* ---------- Contador dos números (+3, +5, +10) ---------- */
  function initCountUp() {
    const els = $$('.hero-stat strong, .quem-stat strong');
    if (!els.length || reduceMotion || !('IntersectionObserver' in window)) return;

    function run(el) {
      const m = el.textContent.trim().match(/^(\D*)(\d+(?:[.,]\d+)?)(\D*)$/);
      if (!m) return;
      const target = parseFloat(m[2].replace(',', '.'));
      const dec = (m[2].split(/[.,]/)[1] || '').length;
      const dur = 1400; let t0 = null;
      (function tick(t) {
        if (!t0) t0 = t;
        const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = m[1] + (target * e).toFixed(dec).replace('.', ',') + m[3];
        if (p < 1) requestAnimationFrame(tick); else el.textContent = m[1] + m[2] + m[3];
      })(performance.now());
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Brilho que segue o cursor (só anima enquanto se move) ---------- */
  function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    if (!glow || !fineHover || reduceMotion) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;

    function frame() {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      raf = (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(frame) : 0;
    }
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.classList.add('is-active');
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });
    document.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
  }

  /* ---------- Botões magnéticos ---------- */
  function initMagnetic() {
    if (!fineHover || reduceMotion) return;
    [{ sel: '.btn', k: 0.25, cap: 10, lift: -3 }, { sel: '.nav-cta', k: 0.2, cap: 6, lift: 0 }]
      .forEach(({ sel, k, cap, lift }) => $$(sel).forEach((el) => {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect();
          const x = Math.max(-cap, Math.min(cap, (e.clientX - r.left - r.width / 2) * k));
          const y = Math.max(-cap, Math.min(cap, (e.clientY - r.top - r.height / 2) * k));
          el.style.transform = `translate(${x}px, ${y + lift}px)`;
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      }));
  }

  /* ---------- Tilt 3D dos cards ---------- */
  function initTilt() {
    if (!fineHover || reduceMotion) return;
    const EASE = 'cubic-bezier(.16,1,.3,1)';

    $$('.service-card').forEach((el) => {
      const max = 4, lift = -6;
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, active = false;

      function frame() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        el.style.transform = `perspective(700px) rotateX(${cx}deg) rotateY(${cy}deg) translateY(${lift}px)`;
        if (!active && Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) {
          el.style.transform = ''; el.style.transition = ''; raf = 0; return;
        }
        raf = requestAnimationFrame(frame);
      }

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        ty = ((e.clientX - r.left) / r.width - 0.5) * max * 2;
        tx = (0.5 - (e.clientY - r.top) / r.height) * max * 2;
        if (!active) {
          active = true;
          // o CSS já anima transform; durante o tilt só sombra/fundo mantêm transição (evita "dupla suavização")
          el.style.transition = `box-shadow .6s ${EASE}, background .6s ${EASE}`;
        }
        if (!raf) raf = requestAnimationFrame(frame);
      });
      el.addEventListener('pointerleave', () => {
        active = false; tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(frame);
      });
    });
  }

  /* ---------- Ripple nos botões ---------- */
  function initRipple() {
    if (reduceMotion) return;
    $$('.btn').forEach((btn) => btn.addEventListener('pointerdown', (e) => {
      const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height);
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      btn.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initHeroPause();
    initCountUp();
    initCursorGlow();
    initMagnetic();
    initTilt();
    initRipple();
  });
})();