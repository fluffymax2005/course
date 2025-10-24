import { BASE_API_URL } from "./api.js";
import { getCookie } from "./cookie.js";

// Переменные для управления состоянием
let currentEditingUser = null;
let currentEditingRole = null;
let currentUsersPage = 1;
let currentRolesPage = 1;
const itemsPerPage = 10;

// Функции для вкладок
window.switchTab = async function switchTab(tabName, event = null) {
    let loadSuccess = false;

    // Загрузить данные для вкладки
    if (tabName === 'users') {
        loadSuccess = await loadUsers();
    } else if (tabName === 'roles') {
        loadSuccess = await loadRoles();
    }

    if (!loadSuccess) {
        return false;
    }

    // Только после успешной загрузки данных переключаем вкладки
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убрать активный класс со всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Активировать кнопку (если event передан)
    if (event) {
        event.target.classList.add('active');
    } else {
        // Ищем кнопку по tabName и активируем её
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName) || 
                btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });
    }

    return true;
}

// Функции для пользователей
async function loadUsers(page = 1) {
    try {
        // Проверяем токен перед запросом
        const token = getCookie('token');
        const tokenExpireTime = getCookie('tokenExpireTime');
        
        if (!token || !tokenExpireTime) {
            console.error('Токен не найден');
            messageBoxShow('Авторизуйтесь в системе', 'red', '20px', '44%', 'translateY(50px)');
            return false;
        }

        const tokenExpireDateTime = new Date(tokenExpireTime);
        if (tokenExpireDateTime < new Date()) {
            console.error('Время сессии истекло');
            messageBoxShow('Время вашей сессии истекло. Авторизуйтесь повторно', 'red', '20px', '50%', 'translateY(50px)');
            return false;
        }
        
        const response = await fetch(`${BASE_API_URL}/Credential`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(response.status);
        
        const users = await response.json(); // Получаем массив напрямую
               
        if (Array.isArray(users)) {
            displayUsers(users);
            setupUsersPagination(users.length, page);
            currentUsersPage = page;
        } else {
            throw new Error('API returned non-array response');
        }
        
    } catch (error) {
        console.error('Error loading users:', error);
        
        const errorMessage = error.message == 401 ? 'Срок вашей сессии истек. Авторизуйтесь повторно' : 'Внутренняя ошибка';        
        messageBoxShow(errorMessage, 'red', '20px', '40%', 'translateY(50px)');
        return false;
    }
    return true;
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    // Добавьте проверку на массив
    if (!Array.isArray(users)) {
        console.error('Users is not an array:', users);
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.roleId}</td>
            <td>${user.username}</td>
            <td>${user.password}</td>
            <td>${user.email}</td>
            <td>${user.whoAdded}</td>
            <td>${new Date(user.whenAdded).toLocaleDateString()}</td>
            <td>${user.whoChanged === null ? 'null' : user.whoChanged}</td>
            <td>${user.whenChanged === null ? 'null' : new Date(user.whenChanged).toLocaleDateString()}</td>
            <td>${user.note === null ? 'null' : user.note}</td>
            <td>${user.isDeleted === null ? 'null' : new Date(user.isDeleted).toLocaleDateString()}</td>
            <td>
                <button class="btn-edit" onclick="editUser(${user.Id})" ${user.IsDeleted ? 'disabled' : ''}>Редактировать</button>
                <button class="btn-delete" onclick="confirmDeleteUser(${user.Id}, '${user.Username}')">
                    ${user.IsDeleted ? 'Восстановить' : 'Удалить'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupUsersPagination(totalCount, currentPage) {
    const pagination = document.getElementById('usersPagination');
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `<button onclick="loadUsers(${currentPage - 1})">‹</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="loadUsers(${i})">${i}</button>`;
        }
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="loadUsers(${currentPage + 1})">›</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Функции для ролей
async function loadRoles(page = 1) {
    try {
        const token = getCookie('token');
        const response = await fetch(`${BASE_API_URL}/Role`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки ролей');
        
        const roles = await response.json(); // Получаем массив напрямую
        
        // Исправьте здесь - передаём массив roles напрямую
        displayRoles(roles);
        //setupRolesPagination(roles.length, page); // Используем длину массива для пагинации
        currentRolesPage = page;
        
    } catch (error) {
        console.error('Error loading roles:', error);
        messageBoxShow('Ошибка загрузки ролей', 'red', '20px', '45%', 'translateY(50px)');
        return false;
    }
    return true;
}

function displayRoles(roles) {
    const tbody = document.getElementById('rolesTableBody');
    tbody.innerHTML = '';
    
    // Добавьте проверку на массив
    if (!Array.isArray(roles)) {
        console.error('Roles is not an array:', roles);
        return;
    }
    
    roles.forEach(role => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${role.id}</td>
            <td>${role.forename}</td>
            <td>${getRightsName(role.rights)}</td>
            <td>${role.canGet ? '✓' : '✗'}</td>
            <td>${role.canPost ? '✓' : '✗'}</td>
            <td>${role.canUpdate ? '✓' : '✗'}</td>
            <td>${role.canDelete ? '✓' : '✗'}</td>
            <td>${role.whoAdded}</td>
            <td>${new Date(role.whenAdded).toLocaleDateString()}</td>
            <td>${role.whoChanged}</td>
            <td>${new Date(role.whenChanged).toLocaleDateString()}</td>
            <td>${role.isDeleted === null ? 'null' : new Date(role.isDeleted).toLocaleDateString()}</td>
            <td>
                <button class="btn-edit" onclick="editRole(${role.id})" ${role.isDeleted ? 'disabled' : ''}>Редактировать</button>
                <button class="btn-delete" onclick="confirmDeleteRole(${role.id}, '${role.forename}')">
                    ${role.isDeleted ? 'Восстановить' : 'Удалить'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupRolesPagination(totalCount, currentPage) {
    const pagination = document.getElementById('rolesPagination');
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `<button onclick="loadRoles(${currentPage - 1})">‹</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="loadRoles(${i})">${i}</button>`;
        }
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="loadRoles(${currentPage + 1})">›</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Вспомогательные функции
function getRoleName(roleId) {
    const roles = {
        1: 'Администратор',
        2: 'Модератор',
        3: 'Пользователь'
    };
    return roles[roleId] || 'Неизвестно';
}

function getRightsName(rights) {
    const rightsMap = {
        0: 'Пользователь',
        1: 'Редактор',
        2: 'Администратор'
    };
    return rightsMap[rights] || 'Неизвестно';
}

// Модальные окна для пользователей
window.showUserForm = function showUserForm() {
    currentEditingUser = null;
    document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
    document.getElementById('userForm').reset();
    document.getElementById('password').required = true;
    loadRolesForSelect();
    document.getElementById('userModal').style.display = 'block';
}

window.editUser = function editUser(userId) {
    // Здесь должна быть логика загрузки данных пользователя
    // Для демонстрации используем заглушку
    currentEditingUser = userId;
    document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
    document.getElementById('password').required = false;
    loadRolesForSelect();
    
    // Загружаем данные пользователя (заглушка)
    document.getElementById('username').value = 'example_user';
    document.getElementById('email').value = 'user@example.com';
    document.getElementById('roleId').value = '1';
    document.getElementById('note').value = 'Пример примечания';
    
    document.getElementById('userModal').style.display = 'block';
}

window.closeUserModal = function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function loadRolesForSelect() {
    console.log(`Sending requst: ${BASE_API_URL}/Role`);
    try {
        const token = getCookie('token');
        const response = await fetch(`${BASE_API_URL}/Role`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content': 'application/json'
            }
        });
        
        if (response.ok) {
            const roles = await response.json(); // Получаем массив напрямую
            
            // Добавьте проверку
            if (!Array.isArray(roles)) {
                console.error('Expected array of roles but got:', roles);
                return;
            }
            
            const select = document.getElementById('roleId');
            select.innerHTML = '';
            
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.forename;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading roles for select:', error);
    }
}

window.addUser = async function addUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    if (formData.get('password') != formData.get('confirm-password')) {
        messageBoxShow('Пароли не совпадают', 'red', '20px', '45%', 'translateY(50px)');
        return;
    }

    const roleInput = formData.get('roleId');
    const userData = {
        userName: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        whoRegister: getCookie('userName'),
        registerRights: roleInput === '0' ? 0 : roleInput === '1' ? 1 : 2
    };
    

    try {      
        const response = await fetch(`${BASE_API_URL}/Credential/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) throw new Error(response);
        
        messageBoxShow('Пользователь успешно сохранен', '#4CAF50', '20px', '45%', 'translateY(50px)');
        closeUserModal();
        loadUsers(currentUsersPage);
        
    } catch (error) {
        console.error('Error saving user:', error);
        messageBoxShow('Ошибка регистрации пользователя', 'red', '20px', '50%', 'translateY(50px)');
    }
}

// Модальные окна для ролей
window.showRoleForm = function showRoleForm() {
    currentEditingRole = null;
    document.getElementById('roleModalTitle').textContent = 'Добавить роль';
    document.getElementById('roleForm').reset();
    document.getElementById('roleModal').style.display = 'block';
}

window.editRole = function editRole(roleId) {
    // Здесь должна быть логика загрузки данных роли
    // Для демонстрации используем заглушку
    currentEditingRole = roleId;
    document.getElementById('roleModalTitle').textContent = 'Редактировать роль';
    
    // Загружаем данные роли (заглушка)
    document.getElementById('forename').value = 'Пример роли';
    document.getElementById('rights').value = '1';
    document.getElementById('canGet').checked = true;
    document.getElementById('canPost').checked = true;
    document.getElementById('canUpdate').checked = false;
    document.getElementById('canDelete').checked = false;
    
    document.getElementById('roleModal').style.display = 'block';
}

window.closeRoleModal = function closeRoleModal() {
    document.getElementById('roleModal').style.display = 'none';
}

window.saveRole = async function saveRole(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const roleData = {
        Forename: formData.get('forename'),
        Rights: parseInt(formData.get('rights')),
        CanGet: formData.get('canGet') === 'on',
        CanPost: formData.get('canPost') === 'on',
        CanUpdate: formData.get('canUpdate') === 'on',
        CanDelete: formData.get('canDelete') === 'on'
    };
    
    try {
        const token = getCookie('token');
        const url = currentEditingRole ? `/api/roles/${currentEditingRole}` : '/api/roles';
        const method = currentEditingRole ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roleData)
        });
        
        if (!response.ok) throw new Error('Ошибка сохранения роли');
        
        messageBoxShow('Роль успешно сохранена', '#4CAF50', '20px', '50%', 'translateY(50px)');
        closeRoleModal();
        loadRoles(currentRolesPage);
        
    } catch (error) {
        console.error('Error saving role:', error);
        messageBoxShow('Ошибка сохранения роли', 'red', '20px', '50%', 'translateY(50px)');
    }
}

// Функции удаления
window.confirmDeleteUser = function confirmDeleteUser(userId, username) {
    const isCurrentlyDeleted = false; // Здесь должна быть логика проверки текущего статуса
    
    document.getElementById('confirmMessage').textContent = 
        `Вы уверены, что хотите ${isCurrentlyDeleted ? 'восстановить' : 'удалить'} пользователя "${username}"?`;
    
    document.getElementById('confirmDeleteBtn').onclick = () => deleteUser(userId, isCurrentlyDeleted);
    document.getElementById('confirmModal').style.display = 'block';
}

window.confirmDeleteRole = function confirmDeleteRole(roleId, roleName) {
    const isCurrentlyDeleted = false; // Здесь должна быть логика проверки текущего статуса
    
    document.getElementById('confirmMessage').textContent = 
        `Вы уверены, что хотите ${isCurrentlyDeleted ? 'восстановить' : 'удалить'} роль "${roleName}"?`;
    
    document.getElementById('confirmDeleteBtn').onclick = () => deleteRole(roleId, isCurrentlyDeleted);
    document.getElementById('confirmModal').style.display = 'block';
}

async function deleteUser(userId, restore = false) {
    try {
        const token = getCookie('token');
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ restore: restore })
        });
        
        if (!response.ok) throw new Error('Ошибка удаления пользователя');
        
        messageBoxShow(`Пользователь успешно ${restore ? 'восстановлен' : 'удален'}`, '#4CAF50', '20px', '50%', 'translateY(50px)');
        closeConfirmModal();
        loadUsers(currentUsersPage);
        
    } catch (error) {
        console.error('Error deleting user:', error);
        messageBoxShow('Ошибка удаления пользователя', 'red', '20px', '50%', 'translateY(50px)');
    }
}

async function deleteRole(roleId, restore = false) {
    try {
        const token = getCookie('token');
        const response = await fetch(`/api/roles/${roleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ restore: restore })
        });
        
        if (!response.ok) throw new Error('Ошибка удаления роли');
        
        messageBoxShow(`Роль успешно ${restore ? 'восстановлена' : 'удалена'}`, '#4CAF50', '20px', '50%', 'translateY(50px)');
        closeConfirmModal();
        loadRoles(currentRolesPage);
        
    } catch (error) {
        console.error('Error deleting role:', error);
        messageBoxShow('Ошибка удаления роли', 'red', '20px', '50%', 'translateY(50px)');
    }
}

window.closeConfirmModal = function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Поиск
function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    
    rows.forEach(row => {
        const username = row.cells[2].textContent.toLowerCase();
        const email = row.cells[4].textContent.toLowerCase();
        
        if (username.includes(searchTerm) || email.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Инициализация при загрузке страницы администратора
function initAdminPanel() {
    loadUsers();
    loadRoles();
}
