/**
 * Agência Digital — script.js
 * Melhorias: acessibilidade, performance, robustez, UX
 */

document.addEventListener("DOMContentLoaded", () => {

    // ─────────────────────────────────────────────
    // 1. NAVBAR — sticky com efeito scrolled
    // ─────────────────────────────────────────────
    const navbar = document.querySelector(".navbar");

    if (navbar) {
        const onScroll = () => {
            navbar.classList.toggle("scrolled", window.scrollY > 50);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // estado inicial caso já esteja rolado
    }


    // ─────────────────────────────────────────────
    // 2. MENU MOBILE — toggle acessível
    // ─────────────────────────────────────────────
    const menuToggle = document.querySelector(".mobile-menu-toggle");
    const navContent = document.querySelector(".nav-content");

    if (menuToggle && navContent) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navContent.classList.toggle("menu-open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"
            );
        });

        // Fecha o menu ao clicar num link
        navContent.querySelectorAll(".nav-links a").forEach(link => {
            link.addEventListener("click", () => {
                navContent.classList.remove("menu-open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Abrir menu de navegação");
            });
        });

        // Fecha o menu ao pressionar Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && navContent.classList.contains("menu-open")) {
                navContent.classList.remove("menu-open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Abrir menu de navegação");
                menuToggle.focus();
            }
        });
    }


    // ─────────────────────────────────────────────
    // 3. SCROLL REVEAL — Intersection Observer
    // ─────────────────────────────────────────────
    const revealElements = document.querySelectorAll(".reveal");

    if (revealElements.length) {
        // Respeita preferência por redução de movimento
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            // Revela tudo imediatamente sem animação
            revealElements.forEach(el => el.classList.add("active"));
        } else {
            const revealObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("active");
                            revealObserver.unobserve(entry.target); // para de observar após revelar
                        }
                    });
                },
                { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
            );
            revealElements.forEach(el => revealObserver.observe(el));
        }
    }


    // ─────────────────────────────────────────────
    // 4. COUNT-UP — animação dos números
    // ─────────────────────────────────────────────
    const counters = document.querySelectorAll(".count-up");

    if (counters.length) {
        const formatValue = (el, value) => {
            const target = +el.getAttribute("data-target");
            const isPercent = el.getAttribute("data-suffix") === "%" ||
                              el.closest(".stat-item")?.querySelector(".stat-label")
                                ?.textContent.includes("Satisfação");

            if (target >= 1_000_000) {
                // Exibe como "1M" quando chegar ao final
                const millions = value / 1_000_000;
                return "+" + (millions >= 1 ? "1M" : millions.toFixed(1) + "M");
            }

            return isPercent ? value + "%" : "+" + value;
        };

        const animateCounter = (el) => {
            const target = +el.getAttribute("data-target");
            const duration = 1800; // ms
            const steps = 60;
            const interval = duration / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += target / steps;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = formatValue(el, Math.ceil(current));
            }, interval);
        };

        const counterObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach(counter => counterObserver.observe(counter));
    }


    // ─────────────────────────────────────────────
    // 5. DRAG CAROUSEL — mouse e touch
    // ─────────────────────────────────────────────
    document.querySelectorAll(".drag-slider").forEach(carousel => {
        let isDragging = false;
        let startX = 0;
        let scrollOrigin = 0;
        let hasDragged = false;

        const dragStart = (x) => {
            isDragging = true;
            hasDragged = false;
            startX = x - carousel.offsetLeft;
            scrollOrigin = carousel.scrollLeft;
            carousel.style.cursor = "grabbing";
        };

        const dragMove = (x) => {
            if (!isDragging) return;
            const currentX = x - carousel.offsetLeft;
            const walk = (currentX - startX) * 1.8;
            if (Math.abs(walk) > 5) hasDragged = true;
            carousel.scrollLeft = scrollOrigin - walk;
        };

        const dragEnd = () => {
            isDragging = false;
            carousel.style.cursor = "grab";
        };

        // Mouse
        carousel.addEventListener("mousedown", (e) => dragStart(e.pageX));
        carousel.addEventListener("mousemove", (e) => { if (isDragging) { e.preventDefault(); dragMove(e.pageX); } });
        carousel.addEventListener("mouseup", dragEnd);
        carousel.addEventListener("mouseleave", dragEnd);

        // Evita que cliques após drag ativem links/botões
        carousel.addEventListener("click", (e) => {
            if (hasDragged) e.preventDefault();
        }, true);

        // Touch
        carousel.addEventListener("touchstart", (e) => {
            dragStart(e.touches[0].pageX);
        }, { passive: true });

        carousel.addEventListener("touchmove", (e) => {
            dragMove(e.touches[0].pageX);
        }, { passive: true });

        carousel.addEventListener("touchend", dragEnd);
    });


    // ─────────────────────────────────────────────
    // 6. FAQ ACCORDION — acessível com aria
    // ─────────────────────────────────────────────
    const accordionTriggers = document.querySelectorAll(".accordion-trigger");

    accordionTriggers.forEach(trigger => {
        // Estado inicial: garante que todos fechados
        const panel = document.getElementById(trigger.getAttribute("aria-controls"));
        if (panel) {
            panel.style.maxHeight = "0";
            panel.style.overflow = "hidden";
            panel.removeAttribute("hidden"); // remove hidden — usamos CSS para animar
        }

        trigger.addEventListener("click", () => {
            const isExpanded = trigger.getAttribute("aria-expanded") === "true";
            const parentItem = trigger.closest(".accordion-item");

            // Fecha todos os outros
            accordionTriggers.forEach(other => {
                if (other === trigger) return;
                other.setAttribute("aria-expanded", "false");
                other.closest(".accordion-item")?.classList.remove("active");
                const otherPanel = document.getElementById(other.getAttribute("aria-controls"));
                if (otherPanel) otherPanel.style.maxHeight = "0";
            });

            // Alterna o atual
            const nextState = !isExpanded;
            trigger.setAttribute("aria-expanded", String(nextState));
            parentItem?.classList.toggle("active", nextState);

            if (panel) {
                panel.style.maxHeight = nextState ? panel.scrollHeight + "px" : "0";
            }
        });

        // Navegar com teclado: setas entre perguntas
        trigger.addEventListener("keydown", (e) => {
            const items = [...accordionTriggers];
            const idx = items.indexOf(trigger);
            if (e.key === "ArrowDown") {
                e.preventDefault();
                items[(idx + 1) % items.length]?.focus();
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                items[(idx - 1 + items.length) % items.length]?.focus();
            } else if (e.key === "Home") {
                e.preventDefault();
                items[0]?.focus();
            } else if (e.key === "End") {
                e.preventDefault();
                items[items.length - 1]?.focus();
            }
        });
    });


    // ─────────────────────────────────────────────
    // 7. PORTFOLIO FILTER — com animação de saída
    // ─────────────────────────────────────────────
    const filterBtns = document.querySelectorAll(".filter-btn");
    const portfolioCards = document.querySelectorAll(".portfolio-card");

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Atualiza botões
            filterBtns.forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-pressed", "false");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");

            const filter = btn.getAttribute("data-filter");

            portfolioCards.forEach(card => {
                const matches = filter === "all" || card.classList.contains("item-" + filter);

                // Transição suave de opacidade
                card.style.transition = "opacity 0.3s ease, transform 0.3s ease";

                if (matches) {
                    card.style.display = "block";
                    // Pequeno delay para o display:block pegar antes de animar
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            card.style.opacity = "1";
                            card.style.transform = "scale(1)";
                        });
                    });
                } else {
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.96)";
                    const onEnd = () => {
                        card.style.display = "none";
                        card.removeEventListener("transitionend", onEnd);
                    };
                    card.addEventListener("transitionend", onEnd);
                }
            });
        });
    });


    // ─────────────────────────────────────────────
    // 8. TILT 3D — somente em dispositivos com mouse
    // ─────────────────────────────────────────────
    const hasPointer = window.matchMedia("(pointer: fine)").matches;
    const prefersNoMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (hasPointer && !prefersNoMotion) {
        document.querySelectorAll(".tilt-3d").forEach(el => {
            el.addEventListener("mousemove", (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = ((x / rect.width) - 0.5) * 8;
                const rotateX = ((y / rect.height) - 0.5) * -8;
                el.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
            });

            el.addEventListener("mouseleave", () => {
                el.style.transition = "transform 0.5s ease";
                el.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg)";
            });

            el.addEventListener("mouseenter", () => {
                el.style.transition = "transform 0.1s ease";
            });
        });
    }


    // ─────────────────────────────────────────────
    // 9. FORMULÁRIO — envio via WhatsApp com validação
    // ─────────────────────────────────────────────
    const contactForm = document.getElementById("contactForm");

    if (contactForm) {
        // Feedback visual em tempo real
        const showError = (input, msg) => {
            let err = input.parentElement.querySelector(".field-error");
            if (!err) {
                err = document.createElement("span");
                err.className = "field-error";
                err.setAttribute("role", "alert");
                err.style.cssText = "color:#E85002;font-size:0.8rem;margin-top:4px;display:block;";
                input.parentElement.appendChild(err);
            }
            err.textContent = msg;
            input.setAttribute("aria-invalid", "true");
            input.style.borderColor = "#E85002";
        };

        const clearError = (input) => {
            const err = input.parentElement.querySelector(".field-error");
            if (err) err.remove();
            input.removeAttribute("aria-invalid");
            input.style.borderColor = "";
        };

        // Validação ao sair do campo
        contactForm.querySelectorAll("input, select, textarea").forEach(field => {
            field.addEventListener("blur", () => {
                if (field.required && !field.value.trim()) {
                    showError(field, "Este campo é obrigatório.");
                } else if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                    showError(field, "Informe um e-mail válido.");
                } else if (field.type === "tel" && field.value && !/^\+?[\d\s\(\)\-]{8,}$/.test(field.value)) {
                    showError(field, "Informe um número válido.");
                } else {
                    clearError(field);
                }
            });
        });

        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Valida todos antes de enviar
            let hasErrors = false;
            contactForm.querySelectorAll("[required]").forEach(field => {
                if (!field.value.trim()) {
                    showError(field, "Este campo é obrigatório.");
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                // Foca o primeiro campo com erro
                const firstError = contactForm.querySelector("[aria-invalid='true']");
                firstError?.focus();
                return;
            }

            const nome    = contactForm.querySelector("#nome")?.value.trim() ?? "";
            const servico = contactForm.querySelector("#servico")?.value ?? "";
            const msg     = contactForm.querySelector("#mensagem")?.value.trim() ?? "";

            const servicoLabel = {
                web:    "Desenvolvimento Web",
                social: "Gestão de Mídias Sociais",
                pack:   "Pack de Postagens",
            }[servico] ?? servico;

            const whatsappMsg =
                `Olá! Me chamo *${nome}* e tenho interesse em: *${servicoLabel}*.\n` +
                (msg ? `\nMensagem: ${msg}` : "");

            // Feedback visual de envio
            const submitBtn = contactForm.querySelector("[type='submit']");
            if (submitBtn) {
                submitBtn.textContent = "Redirecionando...";
                submitBtn.disabled = true;
                setTimeout(() => {
                    submitBtn.textContent = "Enviar Solicitação";
                    submitBtn.disabled = false;
                }, 3000);
            }

            window.open(
                `https://wa.me/5500000000000?text=${encodeURIComponent(whatsappMsg)}`,
                "_blank",
                "noopener,noreferrer"
            );
        });
    }


    // ─────────────────────────────────────────────
    // 10. ANO DINÂMICO no footer
    // ─────────────────────────────────────────────
    const yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();


    // ─────────────────────────────────────────────
    // 11. SMOOTH SCROLL para links âncora
    //     (fallback para browsers sem suporte nativo)
    // ─────────────────────────────────────────────
    if (!CSS.supports("scroll-behavior", "smooth")) {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener("click", (e) => {
                const target = document.querySelector(anchor.getAttribute("href"));
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        });
    }

}); // fim DOMContentLoaded