'use strict';

/**
 * Ferretería Mica - Main Scripts
 */

document.addEventListener('DOMContentLoaded', function () {
    // Smooth scrolling with navbar offset compensation
    const HEADER_OFFSET = 72;

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href === '#inicio' && window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
                return;
            }
            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - HEADER_OFFSET;

            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: 'smooth'
            });

            // If mobile menu was open, close it
            closeMenu();
        });
    });

    // Close mobile menu on Escape key press
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            closeMenu();
        }
    });

    // Initialize business status (Open/Closed)
    initBusinessStatus();
});

function initBusinessStatus() {
    const badgeContainers = document.querySelectorAll('.business-status-badge');
    if (!badgeContainers.length) return;

    try {
        const now = new Date();
        const argTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' });
        const argDate = new Date(argTimeStr);
        const day = argDate.getDay();
        const hour = argDate.getHours();
        const minute = argDate.getMinutes();
        const timeVal = hour * 60 + minute;

        let isOpen = false;
        let message = '';

        if (day >= 1 && day <= 5) {
            if (timeVal >= 510 && timeVal < 1140) {
                isOpen = true;
                message = 'Abierto ahora · Cierra 19:00 hs';
            } else if (timeVal < 510) {
                isOpen = false;
                message = 'Cerrado · Abre hoy 8:30 hs';
            } else {
                isOpen = false;
                message = day === 5 ? 'Cerrado · Abre mañana sábado a las 8:30 hs' : 'Cerrado · Abre mañana a las 8:30 hs';
            }
        } else if (day === 6) {
            if (timeVal >= 510 && timeVal < 1080) {
                isOpen = true;
                message = 'Abierto ahora · Corrido hasta 18:00 hs';
            } else if (timeVal < 510) {
                isOpen = false;
                message = 'Cerrado · Abre hoy sábado 8:30 hs';
            } else {
                isOpen = false;
                message = 'Cerrado · Abre mañana domingo a las 9:00 hs';
            }
        } else {
            if (timeVal >= 540 && timeVal < 780) {
                isOpen = true;
                message = 'Abierto ahora · Cierra 13:00 hs';
            } else if (timeVal < 540) {
                isOpen = false;
                message = 'Cerrado · Abre hoy domingo 9:00 hs';
            } else {
                isOpen = false;
                message = 'Cerrado · Abre el lunes 8:30 hs';
            }
        }

        badgeContainers.forEach(el => {
            if (isOpen) {
                el.innerHTML = `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span><span>${message}</span></span>`;
            } else {
                el.innerHTML = `<span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"><span class="w-2.5 h-2.5 rounded-full bg-rose-400"></span><span>${message}</span></span>`;
            }
        });
    } catch (err) {
        // Fallback gracefully
    }
}

function toggleMenu() {
    const menu = document.getElementById('menu-container');
    const button = document.getElementById('mobile-menu-btn') || document.querySelector('button[onclick*="toggleMenu"]');
    if (!menu) return;

    const isOpening = menu.classList.contains('hidden');
    menu.classList.toggle('hidden');

    if (button) {
        button.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
    }

    if (isOpening) {
        // Small delay so this opening click doesn't immediately trigger handleClickOutside
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 10);
    } else {
        document.removeEventListener('click', handleClickOutside);
    }
}

function closeMenu() {
    const menu = document.getElementById('menu-container');
    const button = document.getElementById('mobile-menu-btn') || document.querySelector('button[onclick*="toggleMenu"]');
    if (menu && !menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        if (button) {
            button.setAttribute('aria-expanded', 'false');
        }
        document.removeEventListener('click', handleClickOutside);
    }
}

function handleClickOutside(event) {
    const menu = document.getElementById('menu-container');
    const button = document.getElementById('mobile-menu-btn') || document.querySelector('button[onclick*="toggleMenu"]');

    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        closeMenu();
    }
}

/**
 * Handle quick quote submission to WhatsApp
 */
function sendQuoteWhatsApp(event) {
    if (event) event.preventDefault();

    const nameInput = document.getElementById('quote-name');
    const phoneInput = document.getElementById('quote-phone');
    const categoryInput = document.getElementById('quote-category');
    const messageInput = document.getElementById('quote-message');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const category = categoryInput ? categoryInput.value : '';
    const message = messageInput ? messageInput.value.trim() : '';

    if (!name || !message) {
        alert('Por favor, ingresá tu nombre y el detalle de tu consulta.');
        return false;
    }

    let text = 'Hola Ferretería Mica! Quiero consultar presupuesto / stock:\n\n';
    text += '• Nombre: ' + name + '\n';
    if (phone) text += '• Teléfono: ' + phone + '\n';
    if (category) text += '• Rubro: ' + category + '\n';
    text += '• Consulta: ' + message;

    const encoded = encodeURIComponent(text);
    const targetUrl = 'https://wa.me/5491157124625?text=' + encoded;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return false;
}