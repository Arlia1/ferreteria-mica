document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const target = document.querySelector(this.getAttribute('href'));
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

    if (!menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.add('hidden');
        document.removeEventListener('click', handleClickOutside);
    }
}

console.log('5910830');