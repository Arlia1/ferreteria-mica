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
});

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