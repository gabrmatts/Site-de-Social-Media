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
     Utilitário: debounce
     Evita que funções pesadas (ex: recalcular o canvas do hero) rodem
     dezenas de vezes por segundo durante um resize. Isso importa
     especialmente no mobile, onde o Safari/Chrome disparam "resize"
     toda vez que a barra de endereço aparece/some durante o scroll.
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

      // Se a página já terminou de carregar antes deste script rodar
      // (ex: recursos em cache carregando muito rápido), o evento 'load'
      // já teria disparado e o listener abaixo nunca seria chamado.
      // Este check cobre esse caso.
      if (document.readyState === 'complete') {
        setTimeout(hide, 400);
      } else {
        window.addEventListener('load', () => setTimeout(hide, 900));
      }

      // Fallback: caso o carregamento demore demais, força o fim do loader
      // para nunca travar o usuário numa tela preta.
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
     MÓDULO: Navbar Dinâmica + Botão Voltar ao Topo
     Os dois dependem de scrollY, então dividem um único listener de
     scroll (throttled via requestAnimationFrame) em vez de dois
     listeners separados — menos trabalho por frame no mobile.
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
     Abre/fecha o menu em telas pequenas, fecha ao clicar em um link,
     e trava o scroll do conteúdo por trás enquanto o menu está aberto.
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
     Slider automático com controle manual via dots, pausa no hover
     (desktop) e também ao tocar/arrastar (mobile).
     ------------------------------------------------------------------- */
  const TestimonialSliderModule = {
    init() {
      const track = document.getElementById('sliderTrack');
      const dotsWrapper = document.getElementById('sliderDots');
      if (!track || !dotsWrapper) return;

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
      // No touch, mouseenter/mouseleave não disparam — pausa ao tocar
      // e retoma a autoplay depois de um tempo parado.
      sliderEl.addEventListener('touchstart', stopAutoplay, { passive: true });
      sliderEl.addEventListener('touchend', () => setTimeout(startAutoplay, 2000), { passive: true });

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

      // Pausa quando a aba não está visível, economizando CPU/bateria.
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
     MÓDULO: Rede de Nós no Hero (elemento de assinatura visual)
     Canvas leve com pontos conectados por linhas finas, representando
     a interligação entre Marketing, Social Media e Web Design.

     Otimizações para mobile:
     - Menos nós em telas estreitas (custo O(n²) cresce rápido)
     - Pausa completamente quando o hero sai da viewport (IntersectionObserver)
     - Pausa quando a aba fica em segundo plano (visibilitychange)
     - Resize com debounce, para não recriar os nós dezenas de vezes
       durante o scroll no iOS Safari (onde a barra de endereço
       recolher/expandir dispara "resize")
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
        // Menos partículas em telas pequenas: o custo por par de nós
        // é O(n²), então reduzir de 46 para 18 corta o trabalho por
        // frame em quase 85%, o que é sensível em CPUs de celular.
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

      // Só roda a animação enquanto o hero estiver de fato visível na tela.
      // Assim que o usuário rola para as próximas seções, o canvas para
      // completamente de consumir CPU/bateria.
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

      // Pausa também quando a aba do navegador está em segundo plano.
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
     Arraste com mouse, toque (Pointer Events cobre os dois) e teclado
     (setas esquerda/direita), com suporte a leitor de tela via
     role="slider" + aria-valuenow atualizado em tempo real.
     ------------------------------------------------------------------- */
  const CompareSliderModule = {
    init() {
      const wrapper = document.getElementById('compareSlider');
      const frame = document.getElementById('compareFrame');
      const handle = document.getElementById('compareHandle');
      if (!wrapper || !frame || !handle) return;

      let isDragging = false;

      function setPosition(percent) {
        const clamped = Math.min(100, Math.max(0, percent));
        wrapper.style.setProperty('--pos', `${clamped}%`);
        handle.setAttribute('aria-valuenow', Math.round(clamped));
      }

      function percentFromClientX(clientX) {
        const rect = frame.getBoundingClientRect();
        return ((clientX - rect.left) / rect.width) * 100;
      }

      // Pointer Events unifica mouse, caneta e toque num único fluxo,
      // evitando duplicar listeners de mouse e de touch separadamente.
      handle.addEventListener('pointerdown', (e) => {
        isDragging = true;
        handle.setPointerCapture(e.pointerId);
      });

      handle.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        setPosition(percentFromClientX(e.clientX));
      });

      const stopDragging = (e) => {
        isDragging = false;
        if (handle.hasPointerCapture && e && e.pointerId !== undefined) {
          try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
        }
      };
      handle.addEventListener('pointerup', stopDragging);
      handle.addEventListener('pointercancel', stopDragging);

      // Clicar em qualquer ponto do quadro também move o controle até lá,
      // sem precisar acertar exatamente a alça.
      frame.addEventListener('pointerdown', (e) => {
        if (e.target === handle || handle.contains(e.target)) return;
        setPosition(percentFromClientX(e.clientX));
      });

      // Acessibilidade: setas do teclado movem o controle em passos de 5%.
      handle.addEventListener('keydown', (e) => {
        const current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
        if (e.key === 'ArrowLeft') {
          setPosition(current - 5);
          e.preventDefault();
        } else if (e.key === 'ArrowRight') {
          setPosition(current + 5);
          e.preventDefault();
        }
      });

      setPosition(50);
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