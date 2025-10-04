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