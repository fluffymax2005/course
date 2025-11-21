
import { MessageBox } from "../../../workspace-form/source/javascript/form-utils.js";

/* Сервис авторизации */
export class AuthService {
    static API_BASE_URL = 'http://localhost:5091/api/Credential';

    static async login() {
        MessageBox.ShowAwait();
        
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
                MessageBox.RemoveAwait();
                return;
            }
            
            const data = await response.json();

            setTimeout(() => {
                this.setTextMessage(outputText, false, 'Авторизация прошла успешно');
            }, 1000);  
            

            // Замена старых куки на новые
            const cookies = ['token', 'tokenExpireTime', 'userRights', 'userName'];
            const cookiesValues = [data.token, data.tokenExpireTime, data.userRights, data.username];

            cookies.forEach((cookie, index) => {
                localStorage.removeItem(cookie);
                localStorage.setItem(cookie, cookiesValues[index]);
            });
        } catch (error) {
            this.setTextMessage(outputText, true, 'Внутреняя ошибка. Попробуйте позже');
            MessageBox.RemoveAwait();
            return;
        }

        setTimeout(() => {
            MessageBox.RemoveAwait();
        }, 500);

        // Успешный переход в рабочую область
        setTimeout(() => {
            window.location.href = '../../workspace-form/index.html';
        }, 2000);        
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

        MessageBox.ShowAwait();
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

            if (!response.ok) {
                const errorData = await response.json();

                let errorMessage = errorData.message;
                this.setTextMessage(outputText, true, errorMessage);
                MessageBox.RemoveAwait();   
                return;
            }

            this.setTextMessage(outputText, false, 'Регистрация прошла успешно. Можете вернуться и войти в аккаунт');

        } catch (error) {
            console.error('Ошибка регистрации', error);
            this.setTextMessage(outputText, true, 'Внутренняя ошибка. Попробуйте позже');
        }

        MessageBox.RemoveAwait();
    }

    static async recover() {
        const emailInput = document.getElementById('recoverEmail');

        const email = emailInput.value.toString();

        console.log(email);

        var outputText = document.getElementById('recoverMessage');
        console.log("Отправка запроса:", `${this.API_BASE_URL}/recover`);

        MessageBox.ShowAwait();
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
                MessageBox.RemoveAwait();
                return;
            }

            this.setTextMessage(outputText, false, '✅ Инструкции по восстановлению пароля отправлены на указанную почту!');

        } catch (error) {
            console.error('Ошибка регистрации', error);
            this.setTextMessage(outputText, true, 'Внутренняя ошибка. Попробуйте позже');
            MessageBox.RemoveAwait();
        }

        console.log('Восстановление прошло успешно');

        MessageBox.RemoveAwait();
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