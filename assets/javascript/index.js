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

// Функция для переключения между разделами
function showSection(sectionName) {
    // Получаем из куки роль пользователя для ограничения доступа
    const userRights = getCookie('userRights');
    if (userRights === undefined) {
        console.error('Не удалось извлечь права пользователя');
        const messageBox = messageBoxCreate('Внутренняя ошибка', 'red', '20px', '50%', 'translateY(50px)');

        // Добавляем уведомление на страницу
        document.body.appendChild(messageBox);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            messageBox.style.opacity = '0';
            messageBox.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 300);
        }, 3000);

        // Анимация появления
        setTimeout(() => {
            messageBox.style.opacity = '1';
            messageBox.style.transform = 'translateX(0)';
        }, 100);
    }

    if (userRights === '0' && (sectionName === 'statistics' || sectionName === 'admin-panel')) {
        const messageBox = messageBoxCreate('У вашего аккаунта отсутствуют права на переход в выбранную секцию. Для разрешения проблемы обратитесь к системному администратору',
            'red', '20px', '35%', 'translateY(50px)');
        
        // Добавляем уведомление на страницу
        document.body.appendChild(messageBox);

        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            messageBox.style.opacity = '0';
            messageBox.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 300);
        }, 3000);

        // Анимация появления
        setTimeout(() => {
            messageBox.style.opacity = '1';
            messageBox.style.transform = 'translateX(0)';
        }, 100);

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
    // Создаем элемент уведомления
    const toast = messageBoxCreate('Выход из системы успешно выполнен', '#4CAF50', '60px', '20px', 'transform(100px)');

    // Добавляем уведомление на страницу
    document.body.appendChild(toast);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);

    // Анимация появления
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    deleteCookie('token');
    deleteCookie('tokenExpireTime');

    setTimeout(() => {
        const authorizeItem = this.document.getElementById('authorizeItem');
        const registerItem = this.document.getElementById('registerItem');
        const quitItem = this.document.getElementById('quitItem');

        authorizeItem.style.display = 'block';
        registerItem.style.display = 'block';
        quitItem.style.display = 'none';
    }, 1000);
} 
 
// Функция создания окна уведомления
function messageBoxCreate(message, background_color, top_pos, right_pos, transform) {
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
        transition: all 0.3s ease-in-out;
        max-width: 500px;
        text-align: center;
    `;

    return toast;
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
    showSection('main');
    
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