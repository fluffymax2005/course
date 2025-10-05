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

document.addEventListener('DOMContentLoaded', function() {
    const authInputs = document.querySelectorAll('.authorize-form input');
    const authOutputMessage = document.querySelector('.authorize-form .output-message');

    function hideAuthErrorMessage() {
        AuthService.hideErrorMessage(authOutputMessage);
    }
    
    authInputs.forEach(input => {
        //input.addEventListener('mouseenter', hideAuthErrorMessage);
        input.addEventListener('focus', hideAuthErrorMessage);
       // input.addEventListener('input', hideAuthErrorMessage);
    });
});

/* Сервис авторизации */

class AuthService {
    static API_BASE_URL = 'http://localhost:5091/api/Credential';

    static async login() {
        const loginInput = document.getElementById('loginAuthorize');
        const passwordInput = document.getElementById('passwordAuthorize');
        
        const login = loginInput.value.toString();
        const password = passwordInput.value.toString();

        
        var outputText = document.querySelector('.output-message');
        if (login.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Введите логин');
            return;
        } else if (password.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Введите пароль');
            return;
        }

        console.log("Sending request to:", `${this.API_BASE_URL}/login`);

        try {
            const response = await fetch(`${this.API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    login: login,
                    password: password
                })
            });

            console.log("Response status:", response.status);
            
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    console.error("Ошибка авторизации: ", response.status, errorData);

                    let errorMessage = errorData.message;
                    this.setTextMessage(outputText, true, errorMessage);
                } catch (jsonError) {
                    console.log('Ошибка парсинга message -> string: ', response.status);
                    this.setTextMessage(outputText, true, 'Внутренняя ошибка. Попробуйте позже');
                }
                return;
            }
            
            const data = await response.json();

            this.setTextMessage(outputText, false, 'Авторизация прошла успешно');
            console.log("Авторизация прошла успешно: ", data);

        } catch (error) {
            console.error("Ошибка авторизации:", error);
            this.setTextMessage(outputText, true, 'Внутреняя ошибка. Попробуйте позже');
        }
    }

    static setTextMessage(label, isError, message, displayStyle = 'block') {
        label.textContent = message;
        
        if (displayStyle === 'block') {
            label.style.animation = 'slideUp 0.5s ease-in-out';
            label.style.display = 'block';
        } else {
            label.style.animation = 'slideDown 0.5s ease-in-out';
            label.style.display = 'none';
        }
        
        label.style.color = isError === true ? 'red' : 'green';
    }

    static hideErrorMessage(label) {
        if (label && label.style.display === 'block') {
            label.style.animation = 'slideDown 0.5s ease-out';
            setTimeout(() => {
                label.style.display = 'none';
            }, 450);
        }
    }
}