import { ApiService } from "./api.js";
import { getToken, getUserName, UserRights } from "./cookie.js";
import { fetchTableData } from "./form-service.js";
import { MessageBox } from "./form-utils.js";
import { TableGETSpecial, tableMap, TableName, TableVariables } from "./table-utils.js";
import { showTableData } from "./workspace-visuals.js";

window.switchTab = switchTab;
window.showUserForm = showUserForm;
window.editUser = editUser;
window.closeUserModal = closeUserModal;
window.addUser = addUser;
window.searchUsers = searchUsers;
window.showRoleForm = showRoleForm;
window.saveRole = saveRole;

// Словарь: наименование сущности -> Имя компонента пагинации
const paginationNameMap = new Map();
paginationNameMap.set(tableMap.get('Учетные записи'), 'usersPagination')
    .set(tableMap.get('Роли'), 'rolesPagination');

// Функции для вкладок
export async function switchTab(tabName) {
    // Получаем кодовую часть имени таблицы
    const tableCodeName = TableName.getCodeName(tabName);
    
    // Загрузить данные для вкладки
    switch (tabName) {
        case TableName.CREDENTIAL[0]: await loadUsers(); break;
        case TableName.ROLE[0]: await loadRoles(); break;
    }

    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убрать активный класс со всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Показать выбранную вкладку
    document.getElementById(`${tableCodeName}-tab`).classList.add('active');
    
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
}

// Функции для пользователей
async function loadUsers() {
    
    // Смена переменных состояния текущей таблицы
    TableVariables.dataPage = 1;
    TableVariables.record = null;
    TableVariables.searchId = null;
    TableVariables.tableRUName = TableName.CREDENTIAL[0]; // Название таблицы - русское
    TableVariables.tableCodeName =  tableMap.get(TableVariables.tableRUName); // доступ к api

    const tableCodeName = TableName.getCodeName(TableVariables.tableRUName);

    await fetchTableData(TableVariables.tableRUName, TableVariables.tableCodeName, `${tableCodeName}Pagination`); // Загрузка данных
    showTableData(paginationNameMap.get(TableVariables.tableCodeName), `${tableCodeName}Table`, 
        `${tableCodeName}TableHead`, `${tableCodeName}TableBody`, `${tableCodeName}Info`);
}

// Функции для ролей
async function loadRoles() {
    // Смена переменных состояния текущей таблицы
    TableVariables.dataPage = 1;
    TableVariables.record = null;
    TableVariables.searchId = null;
    TableVariables.tableRUName = TableName.ROLE[0]; // Название таблицы - русское
    TableVariables.tableCodeName =  tableMap.get(TableVariables.tableRUName); // доступ к api

    const tableCodeName = TableName.getCodeName(TableVariables.tableRUName);

    await fetchTableData(TableVariables.tableRUName, TableVariables.tableCodeName, `${tableCodeName}Pagination`); // Загрузка данных
    showTableData(paginationNameMap.get(TableVariables.tableCodeName), `${tableCodeName}Table`, 
        `${tableCodeName}TableHead`, `${tableCodeName}TableBody`, `${tableCodeName}Info`);
}

// Модальные окна для пользователей
async function showUserForm() {
    try {
        const token = getToken();
        const data = await ApiService.get(`Role/`, {
            'Authorization': `Bearer ${token}`
        });

        document.getElementById('userModalTitle').textContent = 'Добавить пользователя';
        document.getElementById('userForm').reset();
        document.getElementById('password').required = true;
        document.getElementById('userModal').style.display = 'block';

        // Заполняем названия ролей
        const roleSelect = document.getElementById('roleId');
        roleSelect.innerHTML = '';
        
        data.forEach(set => {
            if (set.isDeleted !== null) return;

            const newOption = document.createElement('option');
            newOption.value = set.rights;
            newOption.textContent = set.forename;

            roleSelect.appendChild(newOption);
        });
    } catch (error) {
        if (error.status === 401) {
            deleteUserData();
            window.location.href = '../../authorize-form/authorize.html';
            return;
        }
        
        MessageBox.ShowFromLeft(`Ошибка: ${error.data.message}`, 'red', false, '40', 'translateY(40px)');
        return;
    }
}

function editUser(userId) {
    // Здесь должна быть логика загрузки данных пользователя
    // Для демонстрации используем заглушку
    currentEditingUser = userId;
    document.getElementById('userModalTitle').textContent = 'Редактировать пользователя';
    document.getElementById('password').required = false;
    //loadRolesForSelect();
    
    // Загружаем данные пользователя (заглушка)
    document.getElementById('username').value = 'example_user';
    document.getElementById('email').value = 'user@example.com';
    document.getElementById('roleId').value = '1';
    document.getElementById('note').value = 'Пример примечания';
    
    document.getElementById('userModal').style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function addUser(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    if (formData.get('password') != formData.get('confirm-password')) {
        messageBoxShow('Пароли не совпадают', 'red', '20px', '45%', 'translateY(50px)');
        return;
    }

    const roleInput = document.getElementById('roleId');
    const userData = {
        userName: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        whoRegister: getUserName(),
        registerRights: parseInt(roleInput.options[roleInput.selectedIndex].value)
    };
    
    MessageBox.ShowAwait();

    // Отправляем данные пользоваетеля
    try {
        const token = getToken();
        const data = await ApiService.post(`Credential/register`, userData, {
            'Authorization': `Bearer ${token}`
        });

        const newUser = await ApiService.get(TableGETSpecial.getByIdApiString(TableVariables.tableCodeName, data.id), {
            'Authorization': `Bearer ${token}`
        });

        MessageBox.RemoveAwait()

        closeUserModal();
        await MessageBox.ShowFromLeft('Пользователь успешно добавлен', 'green', false, '43', 'translateY(50px)');
        
        TableVariables.tableData.push(newUser);

        const tableCodeName = TableName.CREDENTIAL[1];
        showTableData(paginationNameMap.get(TableVariables.tableCodeName), `${tableCodeName}Table`, 
            `${tableCodeName}TableHead`, `${tableCodeName}TableBody`, `${tableCodeName}Info`);
    } catch (error) {
        if (error.status === 401) {
            deleteUserData();
            window.location.href = '../../authorize-form/authorize.html';
            return;
        }
        
        await MessageBox.ShowFromLeft(`Ошибка: ${error.data.message}`, 'red', false, '40', 'translateY(50px)');
        MessageBox.RemoveAwait();
        return;
    }
}

// Модальные окна для ролей
function showRoleForm() {
    document.getElementById('roleModalTitle').textContent = 'Добавить роль';
    document.getElementById('roleForm').reset();
    document.getElementById('roleModal').style.display = 'block';
}

window.closeRoleModal = function closeRoleModal() {
    document.getElementById('roleModal').style.display = 'none';
}

async function saveRole(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const rights = parseInt(formData.get('rights'));
    const roleData = {
        Forename: formData.get('forename'),
        Rights: rights,
        CanGet: true,
        CanPost: rights !== UserRights.Basic && rights !== UserRights.Director,
        CanUpdate: rights !== UserRights.Basic && rights !== UserRights.Director,
        CanDelete: rights === UserRights.Admin,
        whoAdded: getUserName()
    };
    
    try {
        const token = getToken('token');
        
        const data = await ApiService.post(`Role/`, roleData, {
            'Authorization': `Bearer ${token}`
        })
        
        closeRoleModal();
        MessageBox.ShowFromLeft('Роль успешно добавлена', 'green', false, '45', 'translateY(50px)');
        
        const newRole = await ApiService.get(`Role/${data.id}`, {
            'Authorization': `Bearer ${token}`
        });

        TableVariables.tableData.push(newRole);

        const tableCodeName = TableName.ROLE[1];
        showTableData(paginationNameMap.get(TableVariables.tableCodeName), `${tableCodeName}Table`, 
            `${tableCodeName}TableHead`, `${tableCodeName}TableBody`, `${tableCodeName}Info`);
        
    } catch (error) {
        if (error.status === 401) {
            deleteUserData();
            window.location.href = '../../authorize-form/authorize.html';
            return;
        }

        MessageBox.ShowFromLeft('Ошибка сохранения роли', 'red', false, '40', 'translateY(50px)');
    }
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