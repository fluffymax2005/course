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

function updateSection() {
    // Скрываем все разделы
    const sections = document.querySelectorAll('.main, .database, .statistics, .admin-panel');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });
    
    // Показываем выбранный раздел
    const activeSection = document.querySelector(`.${sectionName === 'Главная' ? '.main' : 
        sectionName === 'База данных' ? '.database' :
        sectionName === 'Статистика' ? '.statistics' : '.admin-panel'
    }`);
    if (activeSection) {
        activeSection.style.display = 'block';
        activeSection.classList.add('active-section');
    }
}

// Функция для переключения между разделами
function showSection(sectionName, isLoadListener = false) {
    if (isLoadListener) {
        return;
    }

    // Получаем из куки роль пользователя для ограничения доступа и его срок жизни
    const userRights = getCookie('userRights');
    const tokenExpireTime = getCookie('tokenExpireTime'); // время жизни токена из куки
    if (tokenExpireTime === undefined) {
        console.error('Не удалось извлечь срок жизни токена, либо пользователь вышел из системы самостоятельно');
        messageBoxShow('Авторизуйтесь в системе', 'red', '20px', '44%', 'translateY(50px)');
        return;
    }

    const tokenExpireDateTime = new Date(tokenExpireTime); //  время жизни токена типа js

    // Проверяем жизнь токена
    if (userRights === undefined) {
        console.error('Не удалось извлечь права пользователя');
        messageBoxShow('Внутренняя ошибка', 'red', '20px', '50%', 'translateY(50px)');
        return;
    } else if (tokenExpireDateTime < new Date().getDate()) {
        console.error('Время сессии истекло');
        messageBoxShow('Время вашей сессии истекло. Авторизуйтесь повторно', 'red', '20px', '50%', 'translateY(50px)');
        return;
    }

    if (userRights === '0' && (sectionName === 'statistics' || sectionName === 'admin-panel')) {
        messageBoxShow('У вашего аккаунта отсутствуют права на переход в выбранную секцию. Для разрешения проблемы обратитесь к системному администратору',
            'red', '20px', '35%', 'translateY(50px)');
        return;
    } else if (userRights === '1' && (sectionName === 'admin-panel')) {
        messageBoxShow('У вашего аккаунта отсутствуют права на переход в выбранную секцию. Для разрешения проблемы обратитесь к системному администратору',
            'red', '20px', '35%', 'translateY(50px)');
        return;
    }

    // Скрываем все разделы
    const sections = document.querySelectorAll('.main, .database, .statistics, .admin-panel');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });
    
    // Показываем выбранный раздел
    const activeSection = document.querySelector(`.${sectionName}`);
    if (activeSection) {
        activeSection.style.display = 'block';
        activeSection.classList.add('active-section');

        // Сменяем название заголовка рядом с панелью навигации
        const headerText = document.getElementById('header-text');
        if (sectionName === 'main') {
            headerText.textContent = 'Главная';
        } else if (sectionName === 'database') {
            headerText.textContent = 'База данных';
        } else if (sectionName === 'statistics') {
            headerText.textContent = 'Статистика';
        } else if (sectionName === 'admin-panel') {
            headerText.textContent = 'Панель администратора';
        }
    }
    
    // Закрываем меню навигации
    hideNavigationMenu();
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
    deleteCookie('token');
    deleteCookie('tokenExpireTime');

    setTimeout(() => {
        const authorizeItem = this.document.getElementById('authorizeItem');
        const registerItem = this.document.getElementById('registerItem');
        const quitItem = this.document.getElementById('quitItem');

        authorizeItem.style.display = 'block';
        registerItem.style.display = 'block';
        quitItem.style.display = 'none';
    }, 10);

    // Создаем элемент уведомления
    messageBoxShow('Выход из системы успешно выполнен', '#4CAF50', '20px', '40%', 'translateY(-50px)');
}
 
// Функция создания окна уведомления
function messageBoxShow(message, background_color, top_pos, right_pos, transform, duration = 3000) {
    // Создаем окно уведомления
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: ${top_pos};
        right: ${right_pos};
        background: ${background_color};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 16px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        opacity: 0;
        transform: ${transform};
        transition: all 0.5s ease-in-out;
        max-width: 500px;
        text-align: center;
    `;

    // Отображение сообщения
    document.body.appendChild(toast);

    // Появление: сверху вниз
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        toast.style.top = '20px';
    });

    // Исчезновение: снизу вверх через указанное время
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/* Служебные функции */

function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {
    options = {
        path: '/',
        // при необходимости добавьте другие значения по умолчанию
        ...options
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}

function deleteCookie(name) {
    setCookie(name, "", {
        'max-age': -1
    })
}

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
        
        if (tokenExpireDateTime < new Date().getDate()) { // Если токен просрочен то автоматически выходим из системы
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