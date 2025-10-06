class ResetService {
    static API_BASE_URL = 'http://localhost:5091/api/Credential';

    static async reset() {
        const newPasswordInput = document.getElementById('newPassword');
        const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

        const newPassword = newPasswordInput.value.toString();
        const confirmNewPassword = confirmNewPasswordInput.value.toString();

        var outputMessage = document.getElementById('outputMessage');
        if (newPassword.trim().length === 0) {
            this.setTextMessage(outputMessage, true, 'Введите новый пароль');
            return;
        } else if (confirmNewPassword.trim().length === 0) {
            this.setTextMessage(outputMessage, true, 'Подтвердите новый пароль');
            return;
        }

        const token = new URLSearchParams(window.location.search).get('token');

        console.log("Отправка запроса:", `${this.API_BASE_URL}/reset`);

        try {
            const response = await fetch(`${this.API_BASE_URL}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },

                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword,
                    confirmPassword: confirmNewPassword
                })
            });

            console.log('Код ответа', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Ошибка восстановления: ', response.status, errorData);

                let errorMessage = errorData.message;
                this.setTextMessage(outputMessage, true, errorMessage);
                return;
            }

            const data = await response.json();
            this.setTextMessage(outputMessage, false, 'Пароль успешно изменен');
        } catch (error) {
            console.error('Ошибка сброса пароля: ', error);
            this.setTextMessage(outputMessage, true, 'Внутренняя ошибка');
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