/**
 * GRUPO ALZE — Premium Interactive Scripts v3.0
 * Handles: Sticky Header, Mobile Menu, Infinite Carousel, 
 * Counter Animations, Reveal Animations, and Form Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-ready');

    // === Global UX Enhancements (lightweight) ===
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    const canUseCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cursorDot = null;
    let cursorRing = null;
    let cursorX = 0;
    let cursorY = 0;
    let ringX = 0;
    let ringY = 0;

    if (canUseCustomCursor) {
        cursorDot = document.createElement('div');
        cursorRing = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        cursorRing.className = 'cursor-ring';
        document.body.appendChild(cursorDot);
        document.body.appendChild(cursorRing);

        window.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursorDot.style.transform = `translate(${cursorX - 4}px, ${cursorY - 4}px)`;
        }, { passive: true });

        const hoverTargets = 'a, button, .btn, .nav-link, .nav-cta-btn, input, textarea, select, .service-detail-card';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(hoverTargets)) {
                document.body.classList.add('cursor-hover');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(hoverTargets)) {
                document.body.classList.remove('cursor-hover');
            }
        });
    }

    // === STICKY HEADER + PARALLAX (optimized) ===
    const header = document.querySelector('.main-header');
    const hero = document.querySelector('.hero');
    const heroVideo = hero ? hero.querySelector('.hero-video') : null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let ticking = false;
    const updateOnScroll = () => {
        const scrolled = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min((scrolled / docHeight) * 100, 100) : 0;
        progressBar.style.width = `${progress}%`;

        if (header) {
            header.classList.toggle('scrolled', scrolled > 50);
        }

        if (heroVideo && !prefersReducedMotion && scrolled < window.innerHeight) {
            heroVideo.style.transform = `translate(-50%, calc(-50% + ${scrolled * 0.15}px))`;
        }

        ticking = false;
    };

    const requestTick = () => {
        if (!ticking) {
            window.requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    updateOnScroll();

    if (canUseCustomCursor) {
        const animateCursorRing = () => {
            if (cursorRing) {
                ringX += (cursorX - ringX) * 0.18;
                ringY += (cursorY - ringY) * 0.18;
                cursorRing.style.transform = `translate(${ringX - 14}px, ${ringY - 14}px)`;
            }
            requestAnimationFrame(animateCursorRing);
        };
        requestAnimationFrame(animateCursorRing);
    }

    // === MOBILE MENU ===
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const mobileMenuCloseBtn = document.getElementById('mobileMenuClose');
    const navMenu = document.getElementById('navMenu');

    if (mobileMenuBtn && navMenu) {
        const closeMenu = () => {
            navMenu.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
            document.body.classList.remove('menu-open');
        };

        const openMenu = () => {
            navMenu.classList.add('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
            document.body.classList.add('menu-open');
        };

        mobileMenuBtn.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        if (mobileMenuCloseBtn) {
            mobileMenuCloseBtn.addEventListener('click', closeMenu);
        }

        // Close menu when clicking on a link
        navMenu.querySelectorAll('.nav-link, .nav-cta-btn').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }

    // === ACTIVE LINK HIGHLIGHT ===
    const normalizePath = (value) => {
        if (!value) return '/';
        if (value === '/' || value === '/index' || value === '/index.html') return '/';
        return value.replace(/\/+$/, '').replace(/\.html$/i, '');
    };

    const currentPath = normalizePath(window.location.pathname || '/');
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href') || '/';
        const hrefPath = normalizePath(href.startsWith('/') ? href : `/${href}`);
        if (hrefPath === currentPath) {
            link.classList.add('active');
        }
    });

    // === INFINITE LOGO CAROUSEL (Clone for seamless loop) ===
    const logoTrack = document.querySelector('.logo-track');
    if (logoTrack) {
        const logos = Array.from(logoTrack.children);
        // Clone the full set of logos twice for seamless infinite scrolling
        for (let i = 0; i < 2; i++) {
            logos.forEach(logo => {
                logoTrack.appendChild(logo.cloneNode(true));
            });
        }
    }

    // === REVEAL ON SCROLL (Intersection Observer) ===
    const isServicesPage = document.body.classList.contains('page-services');
    const revealClasses = ['.reveal', '.reveal-left', '.reveal-right', '.reveal-scale'];
    const revealElements = document.querySelectorAll(revealClasses.join(','));

    if (isServicesPage) {
        revealElements.forEach(el => el.classList.add('active'));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // === Services Page: Anchor Nav + Mouse Interaction ===
    if (isServicesPage) {
        const anchorNav = document.querySelector('.service-anchor-nav');
        const anchorToggle = document.getElementById('serviceAnchorToggle');
        const anchorPanel = document.getElementById('serviceAnchorPanel');
        const isMobileView = () => window.matchMedia('(max-width: 768px)').matches;
        const anchorLinks = Array.from(document.querySelectorAll('.service-anchor-link'));
        const serviceCards = Array.from(document.querySelectorAll('.services-detailed .service-detail-card[id]'));

        if (anchorLinks.length > 0 && serviceCards.length > 0) {
            const setActiveAnchor = (id) => {
                anchorLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            };

            const anchorObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveAnchor(entry.target.id);
                    }
                });
            }, {
                threshold: 0.5
            });

            serviceCards.forEach(card => anchorObserver.observe(card));

            anchorLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (anchorNav) {
                        anchorNav.classList.remove('open');
                        if (anchorToggle) {
                            anchorToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
            });
        }

        // Toggle logic for the "bolita"
        if (anchorToggle && anchorNav) {
            anchorToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = !anchorNav.classList.contains('open');
                anchorNav.classList.toggle('open', willOpen);
                anchorToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (anchorNav.classList.contains('open') && !anchorNav.contains(e.target)) {
                    anchorNav.classList.remove('open');
                    anchorToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }

        const footer = document.querySelector('.main-footer');
        if (footer && anchorNav) {
            const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    // Mas agresivo al ocultar cerca del footer
                    anchorNav.classList.toggle('is-hidden', entry.isIntersecting);
                });
            }, {
                threshold: 0.05
            });
            footerObserver.observe(footer);
        }

        const canAnimateCards = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
            window.innerWidth >= 992 &&
            !prefersReducedMotion;

        if (canAnimateCards) {
            serviceCards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const rotateY = ((x / rect.width) - 0.5) * 2.2;
                    const rotateX = (0.5 - (y / rect.height)) * 2.2;
                    card.style.transform = `translateY(-4px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                }, { passive: true });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        }
    }

    // === COUNTER ANIMATION ===
    const counters = document.querySelectorAll('.stat-number');
    let countersAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const suffix = counter.getAttribute('data-suffix') || '';
            const duration = 2000;
            const start = 0;
            const startTime = performance.now();

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * (target - start) + start);
                counter.textContent = current + suffix;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target + suffix;
                }
            };
            requestAnimationFrame(updateCounter);
        });
    };

    if (counters.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersAnimated) {
                    countersAnimated = true;
                    animateCounters();
                }
            });
        }, { threshold: 0.3 });

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            statsObserver.observe(statsSection);
        }
    }

    // === CONTACT FORM ===
    const serviceSelect = document.getElementById('service');
    if (serviceSelect) {
        const params = new URLSearchParams(window.location.search);
        const preselectedService = params.get('servicio');
        if (preselectedService) {
            const optionExists = Array.from(serviceSelect.options).some(opt => opt.value === preselectedService);
            if (optionExists) {
                serviceSelect.value = preselectedService;
            }
        }
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('.form-submit-btn');
            if (!btn) return;

            const formData = new FormData(contactForm);
            if ((formData.get('website') || '').toString().trim() !== '') {
                return;
            }

            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...';
            btn.style.opacity = '0.8';
            btn.disabled = true;

            try {
                const response = await fetch('send_mail.php', {
                    method: 'POST',
                    body: formData
                });

                const raw = await response.text();
                let data = null;
                try {
                    data = JSON.parse(raw);
                } catch (jsonError) {
                    throw new Error('Respuesta inválida del servidor. Verifica que PHP esté activo.');
                }

                if (!response.ok || !data.ok) {
                    throw new Error(data.message || 'No fue posible enviar el formulario.');
                }

                btn.innerHTML = '<i class="fas fa-check-circle"></i> ¡Mensaje Enviado con Éxito!';
                btn.style.background = '#25d366';
                btn.style.opacity = '1';
                contactForm.reset();
            } catch (error) {
                const msg = (error && error.message) ? error.message : 'Error al enviar';
                btn.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${msg}`;
                btn.style.background = '#d9534f';
                btn.style.opacity = '1';
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.disabled = false;
            }, 3500);
        });
    }

    // === HOME GALLERY LIGHTBOX ===
    const galleryShots = Array.from(document.querySelectorAll('.work-gallery-grid .work-shot img'));
    if (galleryShots.length > 0) {
        const lightbox = document.createElement('div');
        lightbox.className = 'gallery-lightbox';
        lightbox.setAttribute('aria-hidden', 'true');
        lightbox.innerHTML = `
            <div class="gallery-lightbox-dialog" role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen">
                <button class="gallery-lightbox-close" type="button" aria-label="Cerrar imagen">
                    <i class="fas fa-times"></i>
                </button>
                <img class="gallery-lightbox-img" alt="">
            </div>
        `;
        document.body.appendChild(lightbox);

        const lightboxImg = lightbox.querySelector('.gallery-lightbox-img');
        const closeBtn = lightbox.querySelector('.gallery-lightbox-close');
        const dialog = lightbox.querySelector('.gallery-lightbox-dialog');

        const openLightbox = (src, alt) => {
            if (!lightboxImg) return;
            lightboxImg.src = src;
            lightboxImg.alt = alt || 'Imagen ampliada';
            lightbox.classList.add('open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('menu-open');
        };

        const closeLightbox = () => {
            lightbox.classList.remove('open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('menu-open');
            if (lightboxImg) {
                lightboxImg.removeAttribute('src');
            }
        };

        galleryShots.forEach((img) => {
            img.addEventListener('click', () => openLightbox(img.currentSrc || img.src, img.alt));
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }

        lightbox.addEventListener('click', (event) => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        if (dialog) {
            dialog.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && lightbox.classList.contains('open')) {
                closeLightbox();
            }
        });
    }

    // === Recalculate lightweight effects on resize ===
    window.addEventListener('resize', requestTick, { passive: true });
});

