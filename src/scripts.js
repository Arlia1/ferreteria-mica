'use strict';

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = target.offsetTop;

            window.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        });
    });
});

function toggleMenu() {
    const menu = document.getElementById('menu-container');
    if (!menu) return;
    menu.classList.toggle('hidden');

    if (!menu.classList.contains('hidden')) {
        document.addEventListener('click', handleClickOutside);
    } else {
        document.removeEventListener('click', handleClickOutside);
    }
}

function handleClickOutside(event) {
    const menu = document.getElementById('menu-container');
    const button = document.querySelector('button[onclick="toggleMenu()"]');

    if (menu && button && !menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
        document.removeEventListener('click', handleClickOutside);
    }
}