/* =====================================================================
   GS COMPANY — MAIN.JS
   Módulos funcionais: Loader, ScrollState, ActiveNav, MobileMenu,
   TestimonialSlider, CompareSlider, BackToTop, TabAttention
   ===================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------------------
     MÓDULO: Loading Screen
     ------------------------------------------------------------------- */
  const LoaderModule = {
    init() {
      const loader = document.getElementById('loader');
      if (!loader) return;

      const ring = document.getElementById('loaderRing');
      const percentEl = document.getElementById('loaderPercent');
      const circumference = 339.292;

      let progress = 0;
      let rafId = null;
      let done = false;

      function paint(p) {
        progress = Math.min(100, Math.max(0, p));
        if (ring) ring.style.strokeDashoffset = circumference * (1 - progress / 100);
        if (percentEl) percentEl.textContent = Math.round(progress) + '%';
      }

      function tick() {
        if (done) return;
        progress += (92 - progress) * 0.02 + 0.12;
        paint(progress);
        rafId = requestAnimationFrame(tick);
      }

      function hide() {
        if (done) return;
        done = true;
        if (rafId) cancelAnimationFrame(rafId);
        paint(100);
        setTimeout(() => {
          loader.classList.add('is-hidden');
          document.body.style.overflow = '';
        }, 280);
      }

      document.body.style.overflow = 'hidden';

      if (prefersReducedMotion) {
        paint(100);
      } else {
        rafId = requestAnimationFrame(tick);
      }

      if (document.readyState === 'complete') {
        setTimeout(hide, 400);
      } else {
        window.addEventListener('load', () => setTimeout(hide, 600));
      }

      setTimeout(hide, 3500);
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Navbar Dinâmica + Barra de Progresso + Voltar ao Topo
     ------------------------------------------------------------------- */
  const ScrollStateModule = {
    init() {
      const navbar = document.getElementById('navbar');
      const backToTop = document.getElementById('backToTop');
      const progressBar = document.getElementById('scrollProgress');
      if (!navbar && !backToTop && !progressBar) return;

      let ticking = false;

      const update = () => {
        const y = window.scrollY;
        if (navbar) navbar.classList.toggle('is-scrolled', y > 40);
        if (backToTop) backToTop.classList.toggle('is-visible', y > 600);

        if (progressBar) {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const pct = scrollable > 0 ? Math.min(100, (y / scrollable) * 100) : 0;
          progressBar.style.width = pct + '%';
        }

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
     MÓDULO: Link Ativo da Navbar (scroll-spy)
     ------------------------------------------------------------------- */
  const ActiveNavModule = {
    init() {
      const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
      if (!navLinks.length) return;

      const linkBySectionId = new Map();
      const sections = [];

      navLinks.forEach((link) => {
        const section = document.querySelector(link.getAttribute('href'));
        if (section) {
          linkBySectionId.set(section.id, link);
          sections.push(section);
        }
      });

      if (!sections.length) return;

      const setActive = (id) => {
        navLinks.forEach((link) => link.classList.remove('is-active'));
        const activeLink = linkBySectionId.get(id);
        if (activeLink) activeLink.classList.add('is-active');
      };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
          });
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
      );

      sections.forEach((section) => observer.observe(section));
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Menu Mobile (com focus trap e fechamento por Esc)
     ------------------------------------------------------------------- */
  const MobileMenuModule = {
    init() {
      const toggle = document.getElementById('navbarToggle');
      const menu = document.getElementById('navbarMenu');
      if (!toggle || !menu) return;

      let lastFocusedEl = null;

      const getFocusableEls = () =>
        Array.from(menu.querySelectorAll('a[href], button:not([disabled])'));

      const closeMenu = () => {
        toggle.classList.remove('is-open');
        menu.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
        toggle.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', onKeydown);
        if (lastFocusedEl) lastFocusedEl.focus();
      };

      const openMenu = () => {
        lastFocusedEl = document.activeElement;
        toggle.classList.add('is-open');
        menu.classList.add('is-open');
        document.body.classList.add('no-scroll');
        toggle.setAttribute('aria-expanded', 'true');
        document.addEventListener('keydown', onKeydown);

        const focusable = getFocusableEls();
        if (focusable.length) focusable[0].focus();
      };

      function onKeydown(e) {
        if (e.key === 'Escape') {
          closeMenu();
          return;
        }

        if (e.key === 'Tab') {
          const focusable = getFocusableEls();
          if (!focusable.length) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

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

      sliderEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          prev();
          restartAutoplayAfterInteraction();
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          next();
          restartAutoplayAfterInteraction();
          e.preventDefault();
        }
      });

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
          goTo(current);
        }
        deltaX = 0;
        restartAutoplayAfterInteraction();
      };

      dragTarget.addEventListener('pointerup', endDrag);
      dragTarget.addEventListener('pointercancel', endDrag);
      dragTarget.addEventListener('pointerleave', () => {
        if (isDragging) endDrag();
      });

      goTo(0);
      startAutoplay();
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
        cachedRect = frame.getBoundingClientRect();
        wrapper.classList.add('is-dragging');
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
     MÓDULO: Título da Aba (chamada quando o usuário sai)
     ------------------------------------------------------------------- */
  const TabAttentionModule = {
    init() {
      const originalTitle = document.title;
      const awayMessages = ['👋 Ei, volte aqui', 'Sua decisão pode esperar?'];
      let intervalId = null;
      let step = 0;

      function startFlashing() {
        if (intervalId) return;
        step = 0;
        intervalId = setInterval(() => {
          document.title = step % 2 === 0 ? awayMessages[(step / 2) % awayMessages.length] : originalTitle;
          step++;
        }, 1400);
      }

      function stopFlashing() {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        document.title = originalTitle;
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          startFlashing();
        } else {
          stopFlashing();
        }
      });
    }
  };

  /* -------------------------------------------------------------------
     Inicialização
     ------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    LoaderModule.init();
    ScrollStateModule.init();
    ActiveNavModule.init();
    MobileMenuModule.init();
    TestimonialSliderModule.init();
    CompareSliderModule.init();
    TabAttentionModule.init();
  });

})();