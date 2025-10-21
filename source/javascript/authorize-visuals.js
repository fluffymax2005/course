/* Обработчики для компонентов */

function showAuthorizeForm() {
    // Скрываем все формы
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    // Показываем авторизацию
    document.querySelector('.authorize-form').classList.add('active');
}

function showRegisterForm() {
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelector('.register-form').classList.add('active');
}

function showForgotPasswordForm() {
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelector('.recovery-form').classList.add('active');
}

/* Установка события по нажатии на кнопку Enter для всех форм */
document.addEventListener('DOMContentLoaded', function() {
    const authorizeForm = document.querySelector('.authorize-form');
    authorizeForm.addEventListener('keyup', function(event) {
        event.preventDefault();
        if (event.keyCode === 0x0D) { // Enter key is clicked
            AuthService.login();
        }
    });

    const registerForm = document.querySelector('.register-form');
    registerForm.addEventListener('keyup', function(event) {
        event.preventDefault();
        if (event.keyCode === 0x0D) { // Enter key is clicked
            AuthService.register();
        }
    });

    const recoveryForm = document.querySelector('.recovery-form');
    recoveryForm.addEventListener('keyup', function(event) {
        event.preventDefault();
        if (event.keyCode === 0x0D) { // Enter key is clicked
            AuthService.recover();
        }
    });
});

/* Установка событий для формы авторизации */
document.addEventListener('DOMContentLoaded', function() {
    const authInputs = document.querySelectorAll('.authorize-form input');
    const authOutputMessage = document.querySelector('.authorize-form .output-message');

    // Убираем сообщения при наведении на компонент
    function hideAuthErrorMessage() {
        AuthService.hideErrorMessage(authOutputMessage);
    }
    
    authInputs.forEach(input => {
        input.addEventListener('focus', hideAuthErrorMessage);
    });

    // Убираем надпись при нажатии на "Регистрация" или "Забыли пароль?"
    const registerLabel = document.getElementById('registerLabel');
    const forgotPasswordLabel = document.getElementById('forgotPasswordLabel');

    registerLabel.addEventListener('click', hideAuthErrorMessage);
    forgotPasswordLabel.addEventListener('click', hideAuthErrorMessage);
});


/* Установка событий для формы регистрации */
document.addEventListener('DOMContentLoaded', function() {
    const regInputs = document.querySelectorAll('.register-form input');
    const regOutputMessage = document.querySelector('.register-form .output-message');

    // Убираем сообщения при наведении на компонент
    function hideRegErrorMessage() {
        setTimeout(() => {
            AuthService.hideErrorMessage(regOutputMessage);
        }, 500);       
    }
    
    regInputs.forEach(input => {
        input.addEventListener('focus', hideRegErrorMessage);
    });

    // Убираем надписи при нажатии на "Вернуться назад"
    const backLabel = document.getElementById('registerBackLabel');
    const loginInput = document.getElementById('loginRegister');
    const emailInput = document.getElementById('emailRegister');
    const passwordInput = document.getElementById('passwordRegister');
    const confirmPasswordInput = document.getElementById('confirmPasswordRegister');

    backLabel.addEventListener('click', function() {
        setTimeout(() => {
            loginInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
            confirmPasswordInput.value = '';
        }, 500);     
    });
});

/* Установка событий для формы восстановления пароля */
document.addEventListener('DOMContentLoaded', function() {
    // Убираем содержимое input и message по возвращении назад
    const regInputs = document.getElementById('recoverEmail');
    const regOutputMessage = document.querySelector('.recovery-form .output-message');

    // Убираем надписи при нажатии на "Вернуться назад"
    const backLabel = document.getElementById('recoverBackLabel');

    backLabel.addEventListener('click', function() {
        setTimeout(() => {
            regInputs.value = '';
            AuthService.hideErrorMessage(regOutputMessage);
        }, 500);     
    });

    regInputs.addEventListener('focus', function() {
        setTimeout(() => {
            regInputs.value = '';
            AuthService.hideErrorMessage(regOutputMessage);
        });
    });
});

// Автоматическое переключение на нужную форму при заходе на страницу (из главной страницы)
document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash;

    if (hash === '#register') {
        showRegisterForm();
    }
})