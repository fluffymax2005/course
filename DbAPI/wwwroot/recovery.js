class PasswordRecovery {
    constructor() {
        this.form = document.getElementById('recoveryForm');
        this.emailInput = document.getElementById('email');
        this.emailError = document.getElementById('emailError');
        this.recoveryButton = document.getElementById('recoveryButton');
        this.successMessage = document.getElementById('successMessage');
        this.btnText = this.recoveryButton.querySelector('.btn-text');
        this.btnLoader = this.recoveryButton.querySelector('.btn-loader');

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('input', () => this.validateEmail());

        // Очистка ошибок при фокусе
        this.emailInput.addEventListener('focus', () => this.clearError(this.emailError));
    }

    handleSubmit(e) {
        e.preventDefault();

        if (this.validateForm()) {
            this.sendRecoveryRequest();
        }
    }

    validateForm() {
        const isEmailValid = this.validateEmail();
        return isEmailValid;
    }

    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            this.showError(this.emailError, 'Поле email обязательно для заполнения');
            return false;
        }

        if (!emailRegex.test(email)) {
            this.showError(this.emailError, 'Введите корректный email адрес');
            return false;
        }

        this.clearError(this.emailError);
        return true;
    }

    showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearError(errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    async sendRecoveryRequest() {
        const email = this.emailInput.value.trim();

        this.setLoadingState(true);

        try {
            const response = await fetch('/api/Recovery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'RequestVerificationToken': this.getAntiForgeryToken()
                },
                body: JSON.stringify({ email: email })
            });

            if (response.ok) {
                this.showSuccess();
                this.form.reset();
            } else {
                const errorData = await response.json();
                this.handleError(errorData);
            }

        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
            this.showError(this.emailError, 'Произошла ошибка при отправке запроса. Попробуйте позже.');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.recoveryButton.disabled = true;
            this.btnText.style.display = 'none';
            this.btnLoader.style.display = 'block';
        } else {
            this.recoveryButton.disabled = false;
            this.btnText.style.display = 'block';
            this.btnLoader.style.display = 'none';
        }
    }

    showSuccess() {
        this.successMessage.style.display = 'block';

        // Скрываем сообщение через 5 секунд
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 5000);
    }

    handleError(errorData) {
        if (errorData.errors && errorData.errors.Email) {
            this.showError(this.emailError, errorData.errors.Email[0]);
        } else if (errorData.message) {
            this.showError(this.emailError, errorData.message);
        } else {
            this.showError(this.emailError, 'Произошла ошибка. Попробуйте позже.');
        }
    }

    getAntiForgeryToken() {
        // Получаем anti-forgery token из формы (если он есть)
        const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
        return tokenElement ? tokenElement.value : '';
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    new PasswordRecovery();
});

// Дополнительные утилиты для валидации
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}