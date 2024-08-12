
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