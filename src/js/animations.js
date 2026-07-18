/* =====================================================================
   GS COMPANY — ANIMATIONS.JS
   Módulos de movimento: ScrollReveal, CursorGlow, HeroNetworkCanvas,
   MagneticButtons, TiltCards, RippleEffect
   ===================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* -------------------------------------------------------------------
     Utilitário: efeito de texto "decodificando" (scramble-in)
     ------------------------------------------------------------------- */
  function scrambleText(el) {
    if (!el || el.dataset.scrambled) return;
    el.dataset.scrambled = 'true';

    const original = el.textContent;
    const chars = '!<>-_\\/[]{}—=+*^?#';
    const length = original.length;
    const totalFrames = 26;
    let frame = 0;

    function update() {
      let output = '';
      for (let i = 0; i < length; i++) {
        const charStart = Math.floor((i / length) * totalFrames * 0.55);
        if (frame >= charStart + 7) {
          output += original[i];
        } else if (frame >= charStart) {
          output += original[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
        } else {
          output += '\u00A0';
        }
      }
      el.textContent = output;
      frame++;
      if (frame <= totalFrames + 7) {
        requestAnimationFrame(update);
      } else {
        el.textContent = original;
      }
    }
    update();
  }

  /* -------------------------------------------------------------------
     MÓDULO: Scroll Reveal (cascata + decodificação de rótulos)
     ------------------------------------------------------------------- */
  const ScrollRevealModule = {
    init() {
      const items = document.querySelectorAll('[data-reveal]');
      if (!items.length) return;

      if (prefersReducedMotion) {
        items.forEach((el) => el.classList.add('is-visible'));
        document.querySelectorAll('.eyebrow, .section-label').forEach((el) => {
          el.dataset.scrambled = 'true';
        });
        return;
      }

      items.forEach((el) => {
        const siblings = Array.from(el.parentElement.children).filter((c) =>
          c.hasAttribute('data-reveal')
        );
        const localIndex = siblings.indexOf(el);
        el.style.transitionDelay = `${Math.min(localIndex * 90, 360)}ms`;
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target;
              target.classList.add('is-visible');
              observer.unobserve(target);

              if (target.classList.contains('eyebrow')) {
                scrambleText(target);
              } else {
                const label = target.querySelector('.section-label');
                if (label) scrambleText(label);
              }
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
      );

      items.forEach((el) => observer.observe(el));

      const timeline = document.querySelector('.timeline');
      if (timeline) {
        const timelineObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                timeline.classList.add('is-visible');
                timelineObserver.unobserve(timeline);
              }
            });
          },
          { threshold: 0.3 }
        );
        timelineObserver.observe(timeline);
      }
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Cursor Glow
     ------------------------------------------------------------------- */
  const CursorGlowModule = {
    init() {
      const glow = document.getElementById('cursorGlow');
      if (!glow || isTouchDevice || prefersReducedMotion) return;

      let targetX = 0, targetY = 0;
      let currentX = 0, currentY = 0;
      let rafId = null;

      window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        glow.classList.add('is-active');
      });

      function animate() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        glow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
        rafId = requestAnimationFrame(animate);
      }
      rafId = requestAnimationFrame(animate);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(rafId);
        } else {
          rafId = requestAnimationFrame(animate);
        }
      });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Rede de Nós no Hero
     Paleta clara: traços em tinta escura translúcida sobre o fundo
     off-white do hero — mesma leitura de "dados conectados", agora
     coerente com o restante da página.
     ------------------------------------------------------------------- */
  const HeroNetworkModule = {
    init() {
      const canvas = document.getElementById('heroCanvas');
      const hero = document.querySelector('.hero');
      if (!canvas || !hero || prefersReducedMotion) return;

      const ctx = canvas.getContext('2d');
      let width, height, nodes;
      let mouseX = 0, mouseY = 0;
      let rafId = null;
      let isRunning = false;

      const MAX_DISTANCE = 150;

      function getNodeCount() {
        if (window.innerWidth < 480) return 14;
        if (window.innerWidth < 768) return 20;
        return 46;
      }

      function resize() {
        width = canvas.width = hero.offsetWidth;
        height = canvas.height = hero.offsetHeight;
      }

      function createNodes() {
        const count = getNodeCount();
        nodes = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        }));
      }

      function step() {
        if (!isRunning) return;

        ctx.clearRect(0, 0, width, height);

        const offsetX = (mouseX - width / 2) * 0.01;
        const offsetY = (mouseY - height / 2) * 0.01;

        nodes.forEach((node) => {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        });

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < MAX_DISTANCE) {
              const opacity = (1 - dist / MAX_DISTANCE) * 0.16;
              ctx.strokeStyle = `rgba(17, 24, 39, ${opacity})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x + offsetX, a.y + offsetY);
              ctx.lineTo(b.x + offsetX, b.y + offsetY);
              ctx.stroke();
            }
          }
        }

        nodes.forEach((node) => {
          ctx.fillStyle = 'rgba(17, 24, 39, 0.32)';
          ctx.beginPath();
          ctx.arc(node.x + offsetX, node.y + offsetY, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });

        rafId = requestAnimationFrame(step);
      }

      function start() {
        if (isRunning) return;
        isRunning = true;
        rafId = requestAnimationFrame(step);
      }

      function stop() {
        isRunning = false;
        if (rafId) cancelAnimationFrame(rafId);
      }

      resize();
      createNodes();

      const visibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              start();
            } else {
              stop();
            }
          });
        },
        { threshold: 0 }
      );
      visibilityObserver.observe(hero);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stop();
        } else if (hero.getBoundingClientRect().top < window.innerHeight) {
          start();
        }
      });

      const onResize = debounce(() => {
        resize();
        createNodes();
      }, 200);
      window.addEventListener('resize', onResize);

      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Botões Magnéticos
     ------------------------------------------------------------------- */
  const MagneticButtonModule = {
    init() {
      if (isTouchDevice || prefersReducedMotion) return;

      const targets = [
        { selector: '.btn', strength: 0.25, cap: 10, lift: -3 },
        { selector: '.nav-cta', strength: 0.2, cap: 6, lift: 0 }
      ];

      targets.forEach(({ selector, strength, cap, lift }) => {
        document.querySelectorAll(selector).forEach((el) => {
          function onMove(e) {
            const rect = el.getBoundingClientRect();
            const relX = e.clientX - (rect.left + rect.width / 2);
            const relY = e.clientY - (rect.top + rect.height / 2);
            const x = Math.max(-cap, Math.min(cap, relX * strength));
            const y = Math.max(-cap, Math.min(cap, relY * strength));
            el.style.transform = `translate(${x}px, ${y + lift}px)`;
          }

          function onLeave() {
            el.style.transform = '';
          }

          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerleave', onLeave);
        });
      });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Tilt 3D nos Cards
     ------------------------------------------------------------------- */
  const TiltCardModule = {
    init() {
      if (isTouchDevice || prefersReducedMotion) return;

      const targets = [
        { selector: '.service-card', lift: -8, maxTilt: 5 },
        { selector: '.dif-card', lift: -8, maxTilt: 5 },
        { selector: '.mini-card', lift: -8, maxTilt: 5 },
        { selector: '.portfolio-item', lift: 0, maxTilt: 4 }
      ];

      targets.forEach(({ selector, lift, maxTilt }) => {
        document.querySelectorAll(selector).forEach((el) => {
          let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
          let rafId = null;
          let active = false;

          function update() {
            currentX += (targetX - currentX) * 0.15;
            currentY += (targetY - currentY) * 0.15;
            el.style.transform =
              `perspective(700px) rotateX(${currentX}deg) rotateY(${currentY}deg) translateY(${lift}px)`;

            if (!active && Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
              el.style.transform = '';
              rafId = null;
              return;
            }
            rafId = requestAnimationFrame(update);
          }

          function onMove(e) {
            const rect = el.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            targetY = (px - 0.5) * maxTilt * 2;
            targetX = (0.5 - py) * maxTilt * 2;
            active = true;
            if (!rafId) rafId = requestAnimationFrame(update);
          }

          function onLeave() {
            active = false;
            targetX = 0;
            targetY = 0;
            if (!rafId) rafId = requestAnimationFrame(update);
          }

          el.addEventListener('pointermove', onMove);
          el.addEventListener('pointerleave', onLeave);
        });
      });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Ripple Effect nos Botões
     Efeito de onda a partir do ponto exato de clique/toque — reforça
     a sensação de "resposta imediata" pedida no briefing, sem depender
     de biblioteca externa.
     ------------------------------------------------------------------- */
  const RippleEffectModule = {
    init() {
      if (prefersReducedMotion) return;

      document.querySelectorAll('.btn').forEach((btn) => {
        btn.addEventListener('pointerdown', (e) => {
          const rect = btn.getBoundingClientRect();
          const size = Math.max(rect.width, rect.height);
          const ripple = document.createElement('span');
          ripple.className = 'ripple';
          ripple.style.width = ripple.style.height = `${size}px`;
          ripple.style.left = `${(e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2}px`;
          ripple.style.top = `${(e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2}px`;
          btn.appendChild(ripple);
          ripple.addEventListener('animationend', () => ripple.remove());
        });
      });
    }
  };

  /* -------------------------------------------------------------------
     Inicialização
     ------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    ScrollRevealModule.init();
    CursorGlowModule.init();
    HeroNetworkModule.init();
    MagneticButtonModule.init();
    TiltCardModule.init();
    RippleEffectModule.init();
  });

})();