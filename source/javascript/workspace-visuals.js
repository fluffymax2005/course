import { getCookie } from "./cookie.js";
import { messageBoxShow } from "./index.js";
import { hideTableInterface } from "./database.js";

// Визуальные функции

window.showNavigationMenu = function showNavigationMenu() {
    const leftDropDown = document.querySelector('.left-dropdown');
    console.log('Opening menu');
    leftDropDown.classList.add('open');
}

window.hideNavigationMenu = function hideNavigationMenu() {
    const leftDropDown = document.querySelector('.left-dropdown');
    console.log('Closing menu');
    leftDropDown.classList.remove('open');
}

// Функция для переключения между разделами
window.showSection = async function showSection(sectionName = null, isLoadListener = false) {
    if (isLoadListener) {
        return;
    }

    if (sectionName !== 'main') {
        // Получаем из куки роль пользователя для ограничения доступа и его срок жизни
        const userRights = getCookie('userRights');
        const tokenExpireTime = getCookie('tokenExpireTime'); // время жизни токена из куки
        if (tokenExpireTime === undefined) {
            console.error('Не удалось извлечь срок жизни токена, либо пользователь вышел из системы самостоятельно');
            messageBoxShow('Авторизуйтесь в системе', 'red', '44%', 'translateY(50px)');
            return;
        }

        const tokenExpireDateTime = new Date(tokenExpireTime); //  время жизни токена типа js

        // Проверяем жизнь токена
        if (userRights === undefined) {
            console.error('Не удалось извлечь права пользователя');
            messageBoxShow('Внутренняя ошибка', 'red', '45%', 'translateY(50px)');
            return;
        } else if (tokenExpireDateTime < new Date()) {
            console.error('Время сессии истекло');
            messageBoxShow('Время вашей сессии истекло. Авторизуйтесь повторно', 'red', '37%', 'translateY(50px)');
            return;
        }

        if (userRights === '0' && (sectionName === 'statistics' || sectionName === 'admin-panel')) {
            messageBoxShow('У вашего аккаунта отсутствуют права на переход в выбранную секцию. Для разрешения проблемы обратитесь к системному администратору',
                'red', '35%', 'translateY(50px)');
            return;
        } else if (userRights === '1' && (sectionName === 'admin-panel')) {
            messageBoxShow('У вашего аккаунта отсутствуют права на переход в выбранную секцию. Для разрешения проблемы обратитесь к системному администратору',
                'red', '35%', 'translateY(50px)');
            return;
        }
    }

    // Скрываем все разделы
    const sections = document.querySelectorAll('.main, .database, .statistics, .admin-panel');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });
    
    // Показываем выбранный раздел
    if (sectionName === null) {
        const headerText = document.getElementById('header-text');
        sectionName = headerText.textContent === 'Главная' ? 'main' : 
            headerText.textContent === 'База данных' ? 'database' :
            headerText.textContent === 'Статистика' ? 'statistics' : 'admin-panel';
    }
    const activeSection = document.querySelector(`.${sectionName}`);
    if (activeSection) {
        activeSection.style.display = 'block';
        activeSection.classList.add('active-section');

        // Сменяем название заголовка и его иконку рядом с панелью навигации
        const headerText = document.getElementById('header-text');
        const headerIcon = document.getElementById('page-icon');

        if (sectionName === 'main') {
            headerText.textContent = 'Главная';
            headerIcon.src = 'assets/icons/main-page.svg';
        } else if (sectionName === 'database') {
            headerText.textContent = 'База данных';
            headerIcon.src = 'assets/icons/database-page.svg';

            // Выпадающий список
            const tableSelect = document.getElementById('tableSelect');
            tableSelect.value = "";
            clearSearch();
            hideTableInterface();
        } else if (sectionName === 'statistics') {
            headerIcon.src = 'assets/icons/statistics-page.svg';
            headerText.textContent = 'Статистика';
        } else if (sectionName === 'admin-panel') {
            headerText.textContent = 'Панель администратора';
            headerIcon.src = 'assets/icons/admin-panel.svg';

            // Инициализируем первую вкладку с проверкой авторизации
            const success = await switchTab('users');
            if (!success) {
                // Если не удалось загрузить данные, скрываем панель администратора
                activeSection.style.display = 'none';
                activeSection.classList.remove('active-section');
                return;
            }
        }
    }
    
    // Закрываем меню навигации
    hideNavigationMenu();
}

// Перемещение для входа в систему
window.showAuthorizeForm = function showAuthorizeForm() {
    window.location.href = '/authorize-form/authorize.html#authorize';
}

window.showRegisterForm = function showRegisterForm() {
    setTimeout(() => {
        window.location.href = '/authorize-form/authorize.html#register';
    }, 1000);   
}

/* Инициализация формы проверяет авторизацию пользователя */

document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('load', function() {
        // Компоненты, стиль которых меняется в зависимости от свежести токена
        const authorizeItem = this.document.getElementById('authorizeItem');
        const registerItem = this.document.getElementById('registerItem');
        const quitItem = this.document.getElementById('quitItem');
        
        const tokenExpireTime = getCookie('tokenExpireTime'); // время жизни токена из куки
        if (tokenExpireTime === undefined) {
            quitItem.style.display = 'none';
            return;
        }

        const tokenExpireDateTime = new Date(tokenExpireTime); //  время жизни токена типа js
        
        if (tokenExpireDateTime < new Date()) { // Если токен просрочен то автоматически выходим из системы
            authorizeItem.style.display = 'block';
            registerItem.style.display = 'block';
            quitItem.style.display = 'none';
        } else {
            authorizeItem.style.display = 'none';
            registerItem.style.display = 'none';
            quitItem.style.display = 'block';
        }

    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');

    // По умолчанию отображаем главную страницу
    showSection('main', true);
    
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