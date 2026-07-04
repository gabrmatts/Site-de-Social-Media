/* =====================================================================
   GS COMPANY — SCRIPT PRINCIPAL
   JavaScript puro, modular, sem bibliotecas externas.
   Módulos: Loader, ScrollReveal, Navbar, MobileMenu, BackToTop,
            TestimonialSlider, CursorGlow, HeroNetworkCanvas
   ===================================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  /* -------------------------------------------------------------------
     MÓDULO: Loading Screen
     Exibe o loader até a página estar pronta, depois some suavemente.
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

      window.addEventListener('load', () => {
        setTimeout(hide, 900);
      });

      // Fallback: caso o evento load demore demais, força o fim do loader.
      setTimeout(hide, 3500);
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Scroll Reveal
     Observa elementos com [data-reveal] e adiciona a classe is-visible
     quando entram na viewport. Também dispara a timeline do processo.
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
              // Pequeno atraso escalonado para cards no mesmo grupo
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
      );

      items.forEach((el) => observer.observe(el));

      // Timeline: ativa o preenchimento da linha quando visível
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
     MÓDULO: Navbar Dinâmica
     Adiciona fundo/blur na navbar conforme o scroll.
     ------------------------------------------------------------------- */
  const NavbarModule = {
    init() {
      const navbar = document.getElementById('navbar');
      if (!navbar) return;

      const toggleScrollState = () => {
        if (window.scrollY > 40) {
          navbar.classList.add('is-scrolled');
        } else {
          navbar.classList.remove('is-scrolled');
        }
      };

      toggleScrollState();
      window.addEventListener('scroll', toggleScrollState, { passive: true });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Menu Mobile
     Abre/fecha o menu em telas pequenas e fecha ao clicar em um link.
     ------------------------------------------------------------------- */
  const MobileMenuModule = {
    init() {
      const toggle = document.getElementById('navbarToggle');
      const menu = document.getElementById('navbarMenu');
      if (!toggle || !menu) return;

      const closeMenu = () => {
        toggle.classList.remove('is-open');
        menu.classList.remove('is-open');
      };

      toggle.addEventListener('click', () => {
        toggle.classList.toggle('is-open');
        menu.classList.toggle('is-open');
      });

      menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
      });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Botão Voltar ao Topo
     ------------------------------------------------------------------- */
  const BackToTopModule = {
    init() {
      const btn = document.getElementById('backToTop');
      if (!btn) return;

      const toggleVisibility = () => {
        if (window.scrollY > 600) {
          btn.classList.add('is-visible');
        } else {
          btn.classList.remove('is-visible');
        }
      };

      toggleVisibility();
      window.addEventListener('scroll', toggleVisibility, { passive: true });

      btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Slider de Depoimentos
     Slider automático com controle manual via dots, pausa no hover.
     ------------------------------------------------------------------- */
  const TestimonialSliderModule = {
    init() {
      const track = document.getElementById('sliderTrack');
      const dotsWrapper = document.getElementById('sliderDots');
      if (!track || !dotsWrapper) return;

      const slides = Array.from(track.children);
      let current = 0;
      let intervalId = null;
      const AUTOPLAY_DELAY = 5500;

      // Cria os dots dinamicamente
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        dot.setAttribute('aria-label', `Ir para depoimento ${index + 1}`);
        if (index === 0) dot.classList.add('is-active');
        dot.addEventListener('click', () => goTo(index));
        dotsWrapper.appendChild(dot);
      });

      const dots = Array.from(dotsWrapper.children);

      function goTo(index) {
        current = index;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
      }

      function next() {
        goTo((current + 1) % slides.length);
      }

      function startAutoplay() {
        if (prefersReducedMotion) return;
        stopAutoplay();
        intervalId = setInterval(next, AUTOPLAY_DELAY);
      }

      function stopAutoplay() {
        if (intervalId) clearInterval(intervalId);
      }

      const sliderEl = document.getElementById('testimonialSlider');
      sliderEl.addEventListener('mouseenter', stopAutoplay);
      sliderEl.addEventListener('mouseleave', startAutoplay);

      startAutoplay();
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Cursor Glow
     Brilho discreto que segue o cursor. Desativado em dispositivos
     de toque, onde não há cursor.
     ------------------------------------------------------------------- */
  const CursorGlowModule = {
    init() {
      const glow = document.getElementById('cursorGlow');
      if (!glow || isTouchDevice || prefersReducedMotion) return;

      let targetX = 0, targetY = 0;
      let currentX = 0, currentY = 0;

      window.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
        glow.classList.add('is-active');
      });

      // Suaviza o movimento com interpolação (lerp) via requestAnimationFrame
      function animate() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        glow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
        requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }
  };

  /* -------------------------------------------------------------------
     MÓDULO: Rede de Nós no Hero (elemento de assinatura visual)
     Canvas leve com pontos conectados por linhas finas, representando
     a interligação entre Marketing, Social Media e Web Design.
     Reage sutilmente à posição do mouse (paralaxe suave).
     ------------------------------------------------------------------- */
  const HeroNetworkModule = {
    init() {
      const canvas = document.getElementById('heroCanvas');
      const hero = document.querySelector('.hero');
      if (!canvas || !hero || prefersReducedMotion) return;

      const ctx = canvas.getContext('2d');
      let width, height, nodes;
      let mouseX = 0, mouseY = 0;

      const NODE_COUNT = 46;
      const MAX_DISTANCE = 150;

      function resize() {
        width = canvas.width = hero.offsetWidth;
        height = canvas.height = hero.offsetHeight;
      }

      function createNodes() {
        nodes = Array.from({ length: NODE_COUNT }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        }));
      }

      function step() {
        ctx.clearRect(0, 0, width, height);

        // Leve deslocamento influenciado pelo mouse (paralaxe suave)
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

        requestAnimationFrame(step);
      }

      resize();
      createNodes();
      requestAnimationFrame(step);

      window.addEventListener('resize', () => {
        resize();
        createNodes();
      });

      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });
    }
  };

  /* -------------------------------------------------------------------
     Inicialização geral
     ------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    LoaderModule.init();
    ScrollRevealModule.init();
    NavbarModule.init();
    MobileMenuModule.init();
    BackToTopModule.init();
    TestimonialSliderModule.init();
    CursorGlowModule.init();
    HeroNetworkModule.init();
  });

})();
