function showRegisterForm() {
    // Убираем активность с авторизации
    document.querySelector('.authorize-form').classList.remove('active');
    // Добавляем активность регистрации
    document.querySelector('.register-form').classList.add('active');
}

function showAuthorizeForm() {
    // Убираем активность с регистрации
    document.querySelector('.register-form').classList.remove('active');
    // Добавляем активность авторизации
    document.querySelector('.authorize-form').classList.add('active');
}