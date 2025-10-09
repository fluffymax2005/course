// Визуальные функции

function showNavigationMenu() {
    const leftDropDown = document.querySelector('.left-dropdown');
    console.log('Opening menu');
    leftDropDown.classList.add('open');
}

function hideNavigationMenu() {
    const leftDropDown = document.querySelector('.left-dropdown');
    console.log('Closing menu');
    leftDropDown.classList.remove('open');
}

// Перемещение для входа в систему
function showAuthorizeForm() {
    window.location.href = '/authorize-form/authorize.html#authorize';
}

function showRegisterForm() {
    setTimeout(() => {
        window.location.href = '/authorize-form/authorize.html#register';
    }, 1000);   
}

function quitSystem() {

}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
    
    // Обработчик для кнопки меню
    const menuButton = document.getElementById('menu-nav-image');
    menuButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Menu button clicked');
        showNavigationMenu();
    });
    
    // Обработчик для кнопки закрытия
    const closeButton = document.getElementById('menu-nav-cancel-icon');
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Close button clicked');
        hideNavigationMenu();
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(event) {
        const leftDropDown = document.querySelector('.left-dropdown');
        const menuButton = document.getElementById('menu-nav-image');
        const closeButton = document.getElementById('menu-nav-cancel-icon');
        
        if (leftDropDown && leftDropDown.classList.contains('open')) {
            if (!leftDropDown.contains(event.target) && 
                !menuButton.contains(event.target) && 
                !closeButton.contains(event.target)) {
                console.log('Closing menu by outside click');
                hideNavigationMenu();
            }
        }
    });
});