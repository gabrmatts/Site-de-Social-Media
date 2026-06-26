document.addEventListener('DOMContentLoaded', () => {
    
    // 1. LOADING SCREEN
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    });

    // 2. NAVBAR SCROLL EFFECT
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');
    });

    // 3. MOBILE MENU
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');
    hamburger?.addEventListener('click', () => {
        navMenu.classList.toggle('open');
    });

    // Fechar menu ao clicar em links (Mobile)
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => navMenu.classList.remove('open'));
    });

    // 4. COUNTER ANIMATION (Hero Section)
    const counters = document.querySelectorAll('.count');
    const runCounter = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const updateCount = () => {
                const count = +counter.innerText;
                const speed = 100;
                const inc = target / speed;
                if (count < target) {
                    counter.innerText = Math.ceil(count + inc);
                    setTimeout(updateCount, 20);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    };

    // Trigger do contador quando o elemento entra na tela
    const counterObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            runCounter();
            counterObserver.disconnect();
        }
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) counterObserver.observe(statsSection);

    // 5. REVEAL ANIMATIONS (Scroll)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 6. FAQ ACCORDION
    document.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-q').addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // 7. DEPOIMENTOS SLIDER
    const depoCards = document.querySelectorAll('.depo-card');
    const dotBtns = document.querySelectorAll('.dot-btn');

    dotBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            dotBtns.forEach(d => d.classList.remove('active'));
            depoCards.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            depoCards[index].classList.add('active');
        });
    });

    // 8. FORM SUBMISSION (Simulação)
    const ctaForm = document.getElementById('cta-form');
    ctaForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Obrigado! Entraremos em contato em breve.');
        ctaForm.reset();
    });
});