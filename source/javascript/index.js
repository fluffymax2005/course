import { deleteUserData, getToken } from "./cookie.js";
import { ApiService} from "./api.js";
import { dbCache } from "./table-utils.js";
import { InputWithTips, MessageBox } from "./form-utils.js";

// Выход из системы
window.quitSystem = function quitSystem() {       
    deleteUserData();

    setTimeout(() => {
        const authorizeItem = document.getElementById('authorizeItem');
        const registerItem = document.getElementById('registerItem');
        const quitItem = document.getElementById('quitItem');

        authorizeItem.style.display = 'block';
        registerItem.style.display = 'block';
        quitItem.style.display = 'none';
    }, 100);

    window.location.href = '../../authorize-form/authorize.html';
}

// При загрузке формы проверяется актуальность сессии
document.addEventListener('DOMContentLoaded', async function() {
    // При загрузке главной формы проверяем актуальность сохраненного токена  
    const token = getToken();
    try {
        await ApiService.get(`Credential/validate-token?token=${token}`, true);
    } catch (error) {
        // Токен отсутствует или просрочен
        // Проброс пользователя в окно авторизации
        deleteUserData();
        window.location.href = '../../authorize-form/authorize.html';
    }
});