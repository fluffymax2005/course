/* Инициализация формы проверяет авторизацию пользователя */

document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('load', function() {
        // Компоненты, стиль которых меняется в зависимости от свежести токена
        const quitItem = this.document.getElementById('quitItem');
        
        const tokenExpireTime = getCookie('tokenExpireTime'); // время жизни токена из куки
        if (tokenExpireTime === undefined) {
            quitItem.style.display = 'none';
            return;
        }

        const tokenExpireDateTime = new Date(tokenExpireTime); //  время жизни токена типа js
        
        

        if (tokenExpireDateTime < new Date().getDate()) { // Если токен просрочен то автоматически выходим из системы
            quitItem.style.display = 'none';
        } else {
            quitItem.style.display = 'block';
        }

    })
});

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
    deleteCookie('token');
    deleteCookie('tokenExpireTime');

    setTimeout(() => {
        const quitItem = this.document.getElementById('quitItem');
        quitItem.style.display = 'none';
    }, 100);    
}

function test() {
    const token = getCookie('token');
    const timeExpire = getCookie('tokenExpireTime');
    console.log(token);
    console.log(timeExpire);
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