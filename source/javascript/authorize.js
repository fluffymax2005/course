/* Сервис авторизации */

class AuthService {
    static API_BASE_URL = 'http://localhost:5091/api/Credential';
    static hoursTokenExpiresAt = 1;

    static async login() {
        const loginInput = document.getElementById('loginAuthorize');
        const passwordInput = document.getElementById('passwordAuthorize');
        
        const login = loginInput.value.toString();
        const password = passwordInput.value.toString();

        
        var outputText = document.getElementById('authorizeMessage');
        if (login.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Введите логин');
            return;
        } else if (password.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Введите пароль');
            return;
        }

        console.log("Отправка запроса:", `${this.API_BASE_URL}/login`);

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

            console.log("Код ответа:", response.status);
            
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

            // Удаление старых куки
            this.deleteCookie('token');
            this.deleteCookie('tokenExpireTime');
            
            // Запись токена в куки
            const tokenExpireTime = data.tokenExpireTime;
            const token = data.token;
            document.cookie = "token=" + token + ";expires=" + tokenExpireTime + ";path=/";
            document.cookie = "tokenExpireTime=" + tokenExpireTime + ";expire=" + tokenExpireTime + ";path=/";

            // Запись прав доступа и роль пользователя в куки
            const userRights = data.userRights;
            document.cookie = "userRights=" + userRights + ";expires=" + tokenExpireTime + ";path=/";

            // Запись имени пользователя в куки
            const username = data.username;
            document.cookie = "userName=" + username + ";expires=" + tokenExpireTime + ";path=/";


            console.log(document.cookie);

        } catch (error) {
            console.error("Ошибка авторизации:", error);
            this.setTextMessage(outputText, true, 'Внутреняя ошибка. Попробуйте позже');
            return;
        }

        // Успешный переход в рабочую область
        setTimeout(() => {
            window.location.href = '/workspace-form/index.html';
        }, 1000);
    }

    static async register() {
        const loginInput = document.getElementById('loginRegister');
        const emailInput = document.getElementById('emailRegister');
        const passwordInput = document.getElementById('passwordRegister');
        const confirmPasswordInput = document.getElementById('confirmPasswordRegister');

        const login = loginInput.value.toString();
        const email = emailInput.value.toString();
        const password = passwordInput.value.toString();
        const confirmPassword = confirmPasswordInput.value.toString();

        console.log(login);
        console.log(email);
        console.log(password);
        console.log(confirmPassword);

        var outputText = document.getElementById('registerMessage');
        if (login.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Введите логин');
            return;
        } else if (email.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Введите адрес электронной почты');
            return;
        } else if (password.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Введите пароль');
            return;
        } else if (confirmPassword.trim().length === 0) {
            this.setTextMessage(outputText, true, 'Подтвердите пароль');
            return;
        } else if (password !== confirmPassword) {
            this.setTextMessage(outputText, true, 'Пароли не совпадают')
            return;
        }

        console.log("Отправка запроса:", `${this.API_BASE_URL}/register`);

        try {
            const response = await fetch(`${this.API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                body: JSON.stringify( {
                    username: login,
                    email: email,
                    password: password,
                    registerRights: 0
                })
            });

            console.log('Код ответа', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Ошибка регистрации: ', response.status, errorData);

                let errorMessage = errorData.message;
                this.setTextMessage(outputText, true, errorMessage);
                return;
            }

            this.setTextMessage(outputText, false, 'Регистрация прошла успешно. Можете вернуться и войти в аккаунт');

        } catch (error) {
            console.error('Ошибка регистрации', error);
            this.setTextMessage(outputText, true, 'Внутренняя ошибка. Попробуйте позже');
        }

        console.log('Регистрация прошла успешно');
    }

    static async recover() {
        const emailInput = document.getElementById('recoverEmail');

        const email = emailInput.value.toString();

        console.log(email);

        var outputText = document.getElementById('recoverMessage');
        console.log("Отправка запроса:", `${this.API_BASE_URL}/recover`);

        try {
            const response = await fetch(`${this.API_BASE_URL}/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                body: JSON.stringify( {
                    email: email,
                })
            });

            console.log('Код ответа', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Ошибка восстановления: ', response.status, errorData);

                let errorMessage = errorData.message;
                this.setTextMessage(outputText, true, errorMessage);
                return;
            }

            this.setTextMessage(outputText, false, '✅ Инструкции по восстановлению пароля отправлены на указанную почту!');

        } catch (error) {
            console.error('Ошибка регистрации', error);
            this.setTextMessage(outputText, true, 'Внутренняя ошибка. Попробуйте позже');
        }

        console.log('Восстановление прошло успешно');
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

    static setCookie(name, value, options = {}) {
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
    
    static deleteCookie(name) {
    this.setCookie(name, "", {
        'max-age': -1
    })
}
}