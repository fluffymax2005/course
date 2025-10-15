// database.js
let currentTable = '';
let currentEditingRecord = null;
let currentDataPage = 1;
const dataPerPage = 10;

// Структуры таблиц (заглушка - в реальном приложении получать с сервера)
const tableSchemas = {
    users: {
        name: 'Пользователи',
        fields: [
            { name: 'id', type: 'number', label: 'ID', required: true, readonly: true },
            { name: 'username', type: 'text', label: 'Имя пользователя', required: true },
            { name: 'email', type: 'email', label: 'Email', required: true },
            { name: 'role', type: 'select', label: 'Роль', options: ['user', 'moderator', 'admin'] },
            { name: 'created_at', type: 'date', label: 'Дата создания' },
            { name: 'is_active', type: 'boolean', label: 'Активен' }
        ]
    },
    products: {
        name: 'Товары',
        fields: [
            { name: 'id', type: 'number', label: 'ID', required: true, readonly: true },
            { name: 'name', type: 'text', label: 'Название', required: true },
            { name: 'category', type: 'text', label: 'Категория', required: true },
            { name: 'price', type: 'number', label: 'Цена', required: true },
            { name: 'stock', type: 'number', label: 'Количество на складе' },
            { name: 'supplier', type: 'text', label: 'Поставщик' }
        ]
    }
    // ... остальные таблицы
};

function loadTableData() {
    const tableSelect = document.getElementById('tableSelect');
    currentTable = tableSelect.value;
    
    if (!currentTable) {
        hideTableInterface();
        return;
    }
    
    // Проверяем права доступа
    checkDatabaseAccess();
    
    // Загружаем данные таблицы
    fetchTableData();
}

function checkDatabaseAccess() {
    const userRights = getUserRights(); // Функция должна быть реализована
    const actionButtons = document.getElementById('dbActionButtons');
    
    if (userRights >= 1) { // Права редактора или админа
        actionButtons.style.display = 'flex';
    } else {
        actionButtons.style.display = 'none';
    }
}

async function fetchTableData() {
    try {
        const token = getCookie('token');
        const response = await fetch(`${BASE_API_URL}/${currentTable}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        
        const data = await response.json();
        displayTableData(data);
        
    } catch (error) {
        console.error('Error loading table data:', error);
        messageBoxShow('Ошибка загрузки данных таблицы', 'red');
    }
}

function displayTableData(data) {
    const tableHead = document.getElementById('dataTableHead');
    const tableBody = document.getElementById('dataTableBody');
    const tableInfo = document.getElementById('tableInfo');
    const dataTable = document.getElementById('dataTable');
    const noDataMessage = document.getElementById('noDataMessage');
    
    // Очищаем таблицу
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        dataTable.style.display = 'none';
        noDataMessage.style.display = 'block';
        tableInfo.style.display = 'none';
        return;
    }
    
    // Показываем элементы интерфейса
    dataTable.style.display = 'table';
    noDataMessage.style.display = 'none';
    tableInfo.style.display = 'flex';
    
    // Заполняем информацию о таблице
    document.getElementById('tableName').textContent = tableSchemas[currentTable]?.name || currentTable;
    document.getElementById('recordCount').textContent = `Записей: ${data.length}`;
    
    // Создаем заголовки таблицы
    const headerRow = document.createElement('tr');
    const fields = tableSchemas[currentTable]?.fields || Object.keys(data[0]);
    
    fields.forEach(field => {
        const fieldName = typeof field === 'object' ? field.label : field;
        const th = document.createElement('th');
        th.textContent = fieldName;
        headerRow.appendChild(th);
    });
    
    // Добавляем столбец для действий если есть права
    if (getUserRights() >= 1) {
        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Действия';
        headerRow.appendChild(actionsTh);
    }
    
    tableHead.appendChild(headerRow);
    
    // Заполняем данные
    data.forEach((record, index) => {
        const row = document.createElement('tr');
        
        fields.forEach(field => {
            const fieldConfig = typeof field === 'object' ? field : { name: field };
            const td = document.createElement('td');
            const value = record[fieldConfig.name];
            
            // Форматируем значение в зависимости от типа
            td.textContent = formatValue(value, fieldConfig.type);
            td.className = getCellClassName(fieldConfig.type, value);
            
            row.appendChild(td);
        });
        
        // Добавляем кнопки действий если есть права
        if (getUserRights() >= 1) {
            const actionsTd = document.createElement('td');
            actionsTd.className = 'table-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit-small';
            editBtn.textContent = '✏️';
            editBtn.onclick = () => editRecord(record);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-small';
            deleteBtn.textContent = '🗑️';
            deleteBtn.onclick = () => confirmDeleteRecord(record);
            
            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(deleteBtn);
            row.appendChild(actionsTd);
        }
        
        tableBody.appendChild(row);
    });
}

function formatValue(value, type) {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
        case 'date':
            return new Date(value).toLocaleDateString();
        case 'boolean':
            return value ? '✓' : '✗';
        case 'number':
            return Number(value).toLocaleString();
        default:
            return String(value);
    }
}

function getCellClassName(type, value) {
    switch (type) {
        case 'boolean':
            return value ? 'status-active' : 'status-inactive';
        default:
            return '';
    }
}