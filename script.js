/* =====================================================================
   GS COMPANY — SCRIPT PRINCIPAL
   JavaScript puro, modular, sem bibliotecas externas.
   Módulos: Loader, ScrollReveal, Navbar, MobileMenu, BackToTop,
            TestimonialSlider, CursorGlow, HeroNetworkCanvas, CompareSlider
   ===================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  /* -------------------------------------------------------------------
     Utilitário: debounce
     ------------------------------------------------------------------- */
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /* -------------------------------------------------------------------
     MÓDULO: Loading Screen
     ------------------------------------------------------------------- */
  const LoaderModule = {
    init() {
      const loader = document.getElementById('loader');
      if (!loader) return;

      const hide = () => {
        loader.classList.add('is-hidden');
        document.body.style.overflow = '';
      };

      document.body.style.overflow = 'hidden';

      if (document.readyState === 'complete') {
        setTimeout(hide, 400);
      } else {
        window.addEventListener('load', () => setTimeout(hide, 900));
      }

      setTimeout(hide, 3500);
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Scroll Reveal
     ------------------------------------------------------------------- */
  const ScrollRevealModule = {
    init() {
      const items = document.querySelectorAll('[data-reveal]');
      if (!items.length) return;

      if (prefersReducedMotion) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
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
     MÓDULO: Navbar Dinâmica + Botão Voltar ao Topo
     ------------------------------------------------------------------- */
  const ScrollStateModule = {
    init() {
      const navbar = document.getElementById('navbar');
      const backToTop = document.getElementById('backToTop');
      if (!navbar && !backToTop) return;

      let ticking = false;

      const update = () => {
        const y = window.scrollY;
        if (navbar) navbar.classList.toggle('is-scrolled', y > 40);
        if (backToTop) backToTop.classList.toggle('is-visible', y > 600);
        ticking = false;
      };

      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      };

      update();
      window.addEventListener('scroll', onScroll, { passive: true });

      if (backToTop) {
        backToTop.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
      }
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Menu Mobile
     ------------------------------------------------------------------- */
  const MobileMenuModule = {
    init() {
      const toggle = document.getElementById('navbarToggle');
      const menu = document.getElementById('navbarMenu');
      if (!toggle || !menu) return;

      const closeMenu = () => {
        toggle.classList.remove('is-open');
        menu.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
      };

      const openMenu = () => {
        toggle.classList.add('is-open');
        menu.classList.add('is-open');
        document.body.classList.add('no-scroll');
      };

      toggle.addEventListener('click', () => {
        const isOpen = menu.classList.contains('is-open');
        isOpen ? closeMenu() : openMenu();
      });

      menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Slider de Depoimentos
     Autoplay + dots + setas (desktop) + arraste/swipe (mouse e toque,
     via Pointer Events) — o slide acompanha o dedo em tempo real
     durante o arraste, e solta pro lado certo ao final.
     ------------------------------------------------------------------- */
  const TestimonialSliderModule = {
    init() {
      const sliderEl = document.getElementById('testimonialSlider');
      const track = document.getElementById('sliderTrack');
      const viewport = track ? track.closest('.slider-viewport') : null;
      const dotsWrapper = document.getElementById('sliderDots');
      const prevBtn = document.getElementById('sliderPrev');
      const nextBtn = document.getElementById('sliderNext');
      if (!sliderEl || !track || !dotsWrapper) return;

      const slides = Array.from(track.children);
      if (slides.length <= 1) return;

      let current = 0;
      let intervalId = null;
      const AUTOPLAY_DELAY = 5500;

      // Dots dinâmicos
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        dot.setAttribute('aria-label', `Ir para depoimento ${index + 1}`);
        if (index === 0) dot.classList.add('is-active');
        dot.addEventListener('click', () => {
          goTo(index);
          restartAutoplayAfterInteraction();
        });
        dotsWrapper.appendChild(dot);
      });

      const dots = Array.from(dotsWrapper.children);

      function goTo(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
      }

      function next() {
        goTo(current + 1);
      }

      function prev() {
        goTo(current - 1);
      }

      function startAutoplay() {
        if (prefersReducedMotion) return;
        stopAutoplay();
        intervalId = setInterval(next, AUTOPLAY_DELAY);
      }

      function stopAutoplay() {
        if (intervalId) clearInterval(intervalId);
      }

      function restartAutoplayAfterInteraction() {
        stopAutoplay();
        setTimeout(startAutoplay, 2500);
      }

      if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplayAfterInteraction(); });
      if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplayAfterInteraction(); });

      sliderEl.addEventListener('mouseenter', stopAutoplay);
      sliderEl.addEventListener('mouseleave', startAutoplay);

      // --- Arraste / swipe (mouse e toque via Pointer Events) ---
      let isDragging = false;
      let startX = 0;
      let deltaX = 0;

      const dragTarget = viewport || track;

      dragTarget.addEventListener('pointerdown', (e) => {
        isDragging = true;
        startX = e.clientX;
        deltaX = 0;
        stopAutoplay();
        track.style.transition = 'none';
        try { dragTarget.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      });

      dragTarget.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        deltaX = e.clientX - startX;
        track.style.transform = `translateX(calc(-${current * 100}% + ${deltaX}px))`;
      });

      const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = '';

        const threshold = dragTarget.clientWidth * 0.15;
        if (deltaX < -threshold) {
          next();
        } else if (deltaX > threshold) {
          prev();
        } else {
          goTo(current); // volta pro mesmo slide, com transição suave
        }
        deltaX = 0;
        restartAutoplayAfterInteraction();
      };

      dragTarget.addEventListener('pointerup', endDrag);
      dragTarget.addEventListener('pointercancel', endDrag);
      // Se o ponteiro sair da área arrastando, também encerra o arraste
      dragTarget.addEventListener('pointerleave', () => {
        if (isDragging) endDrag();
      });

      goTo(0);
      startAutoplay();
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
              const opacity = (1 - dist / MAX_DISTANCE) * 0.25;
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x + offsetX, a.y + offsetY);
              ctx.lineTo(b.x + offsetX, b.y + offsetY);
              ctx.stroke();
            }
          }
        }

        nodes.forEach((node) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
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
     MÓDULO: Slider Antes/Depois (comparativo de auditoria)
   ------------------------------------------------------------------- */
const CompareSliderModule = {
  init() {
    const wrapper = document.getElementById('compareSlider');
    const frame = document.getElementById('compareFrame');
    const handle = document.getElementById('compareHandle');
    if (!wrapper || !frame || !handle) return;

    let isDragging = false;
    let rafPending = false;
    let currentX = 0;
    let cachedRect = null;

    // Atualiza a tela apenas no tempo certo do navegador (60 FPS)
    function updateUI() {
      if (!cachedRect) return;
      const percent = ((currentX - cachedRect.left) / cachedRect.width) * 100;
      const clamped = Math.min(100, Math.max(0, percent));
      
      wrapper.style.setProperty('--pos', `${clamped}%`);
      handle.setAttribute('aria-valuenow', Math.round(clamped));
      rafPending = false;
    }

    function setPositionDirect(percent) {
      const clamped = Math.min(100, Math.max(0, percent));
      wrapper.style.setProperty('--pos', `${clamped}%`);
      handle.setAttribute('aria-valuenow', Math.round(clamped));
    }

    handle.addEventListener('pointerdown', (e) => {
      isDragging = true;
      cachedRect = frame.getBoundingClientRect(); // Cache para evitar lag
      wrapper.classList.add('is-dragging'); // Remove animações CSS durante o arraste
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      currentX = e.clientX;
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateUI);
      }
    });

    const stopDragging = (e) => {
      if (!isDragging) return;
      isDragging = false;
      wrapper.classList.remove('is-dragging');
      if (handle.hasPointerCapture && e && e.pointerId !== undefined) {
        try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
    };

    handle.addEventListener('pointerup', stopDragging);
    handle.addEventListener('pointercancel', stopDragging);

    // Clique direto na imagem salta para a posição suavemente
    frame.addEventListener('pointerdown', (e) => {
      if (e.target === handle || handle.contains(e.target)) return;
      const rect = frame.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setPositionDirect(percent);
    });

    handle.addEventListener('keydown', (e) => {
      const current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft') {
        setPositionDirect(current - 5);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        setPositionDirect(current + 5);
        e.preventDefault();
      }
    });

    setPositionDirect(50);
  }
};

  /* -------------------------------------------------------------------
     Inicialização geral
     ------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    LoaderModule.init();
    ScrollRevealModule.init();
    ScrollStateModule.init();
    MobileMenuModule.init();
    TestimonialSliderModule.init();
    CursorGlowModule.init();
    HeroNetworkModule.init();
    CompareSliderModule.init();
  });

})();