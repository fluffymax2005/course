let currentTable = '';
let currentSearchId = null;
let currentEditingRecord = null;
let allTableData = [];
let currentDataPage = 1;
const dataPerPage = 20;

// Словарь для доступа к API
var tableMap = new Map();
tableMap.set('Заказы', 'Order');
tableMap.set('Заказчики', 'Customer');
tableMap.set('Маршруты', 'Route');
tableMap.set('Тарифы', 'Rate');
tableMap.set('Шоферы', 'Driver');
tableMap.set('Транспортные средства', 'TransportVehicle');

// Маппинг русских названий для полей
const fieldNameMapping = {
    'id': 'ID',
    'customerId': 'ID заказчика',
    'routeId': 'ID маршрута',
    'rateId': 'ID тарифа',
    'driverId': 'ID шофера',
    'vehicleId': 'ID транспортного средства',
    'forename': 'Название',
    'surname': 'Фамилия',
    'phoneNumber': 'Номер телефона',
    'boardingAddress': 'Адрес посадки',
    'dropAddress': 'Адрес высадки',
    'driverLicenceSeries': 'Серия водительских прав',
    'driverLicenceNumber': 'Номер водительских прав',
    'number': 'Номер',
    'series': 'Серия',
    'registrationCode': 'Код регистрации',
    'model': 'Модель',
    'color': 'Цвет',
    'releaseYear': 'Год выпуска',
    'movePrice': 'Цена в пути',
    'idlePrice': 'Цена в простое',
    'username': 'Имя пользователя',
    'email': 'Email',
    'name': 'Название',
    'title': 'Заголовок',
    'description': 'Описание',
    'price': 'Цена',
    'quantity': 'Количество',
    'category': 'Ктегория',
    'status': 'Статус',
    'created_at': 'Дата создания',
    'updated_at': 'Дата обновления',
    'role': 'Роль',
    'is_active': 'Активен',
    'whoAdded': 'Кто добавил',
    'whenAdded': 'Когда добавил',
    'whoChanged': 'Кто изменил',
    'whenChanged': 'Когда изменил',
    'note': 'Примечание',
    'isDeleted': 'Удален',
    'customerName': 'Имя заказчика',
    'orderDate': 'Дата заказа',
    'routeName': 'Название маршрута',
    'distance': 'Расстояние',
    'rateValue': 'Значение тарифа',
    'driverName': 'Имя водителя',
    'vehicleModel': 'Модель транспорта'
};

function loadTableData() {
    const tableSelect = document.getElementById('tableSelect');
    currentTable = tableSelect.value;
    
    if (!currentTable) {
        hideTableInterface();
        return;
    }
    
    // Сбрасываем поиск при смене таблицы
    clearSearch();
    
    // Проверяем права доступа
    checkDatabaseAccess();
    
    // Загружаем данные таблицы
    fetchTableData();
}

function hideTableInterface() {
    document.getElementById('tableInfo').style.display = 'none';
    document.getElementById('dataTable').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'none';
    document.getElementById('noSearchResultsMessage').style.display = 'none';
    document.getElementById('dataPagination').style.display = 'none';
    document.getElementById('searchResultsInfo').style.display = 'none';
}

function checkDatabaseAccess() {
    const userRights = getCookie('userRights'); // Функция должна быть реализована
    const actionButtons = document.getElementById('dbActionButtons');
    
    if (userRights >= 1) { // Права редактора или админа
        actionButtons.style.display = 'flex';
    } else {
        actionButtons.style.display = 'none';
    }
}

async function fetchTableData() {
    const token = getCookie('token');
    const tokenExpireTime = getCookie('tokenExpireTime');
    if (tokenExpireTime === undefined) {
        console.error('Не удалось извлечь срок жизни токена, либо пользователь вышел из системы самостоятельно');
        messageBoxShow('Авторизуйтесь в системе', 'red', '20px', '44%', 'translateY(50px)');
        return;
    }

    const tokenExpireDateTime = new Date(tokenExpireTime); //  время жизни токена типа js
    if (tokenExpireDateTime < new Date()) {
        console.error('Время сессии истекло');
        messageBoxShow('Время вашей сессии истекло. Авторизуйтесь повторно', 'red', '20px', '37%', 'translateY(50px)');
        return;
    }

    // Выпадающий список
    const tableSelect = document.getElementById('tableSelect');

    try {
        const response = await fetch(`${BASE_API_URL}/${tableMap.get(tableSelect.options[tableSelect.selectedIndex].text)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(response.status);
        
        const data = await response.json();

        if (Array.isArray(data)) {
            allTableData = data;
            currentDataPage = 1; // Сбрасываем на первую страницу
            // ИСПРАВЛЕНИЕ: передаем данные для текущей страницы, а не все данные
            displayTableData(getCurrentPageData());
        } else {
            throw new Error('API returned non-array response');
        }

    } catch (error) {
        console.error('Error loading users:', error);
        
        const errorMessage = error.message == 401 ? 'Срок вашей сессии истек. Авторизуйтесь повторно' : 'Внутренняя ошибка';        
        messageBoxShow(errorMessage, 'red', '20px', '40%', 'translateY(50px)');
    }
}

// Получение данных для текущей страницы
function getCurrentPageData() {
    if (!allTableData || allTableData.length === 0) return [];
    
    const startIndex = (currentDataPage - 1) * dataPerPage;
    const endIndex = startIndex + dataPerPage;
    return allTableData.slice(startIndex, endIndex);
}

// Отображение данных таблицы
function displayTableData(data) {
    const tableHead = document.getElementById('dataTableHead');
    const tableBody = document.getElementById('dataTableBody');
    const tableInfo = document.getElementById('tableInfo');
    const dataTable = document.getElementById('dataTable');
    const noDataMessage = document.getElementById('noDataMessage');
    const noSearchResultsMessage = document.getElementById('noSearchResultsMessage');
    const pagination = document.getElementById('dataPagination');
    
    // Очищаем таблицу
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        dataTable.style.display = 'none';
        pagination.style.display = 'none';
        
        if (currentSearchId) {
            noSearchResultsMessage.style.display = 'block';
            noDataMessage.style.display = 'none';
        } else {
            noDataMessage.style.display = 'block';
            noSearchResultsMessage.style.display = 'none';
        }
        
        tableInfo.style.display = 'none';
        return;
    }
    
    // Показываем элементы интерфейса
    dataTable.style.display = 'table';
    noDataMessage.style.display = 'none';
    noSearchResultsMessage.style.display = 'none';
    tableInfo.style.display = 'flex';
    
    // Заполняем информацию о таблице
    const tableSelect = document.getElementById('tableSelect');
    document.getElementById('tableName').textContent = tableSelect.options[tableSelect.selectedIndex].text;
    
    // ИСПРАВЛЕНИЕ: Всегда показываем общее количество записей и текущий диапазон
    const totalRecords = allTableData.length;
    const startRecord = (currentDataPage - 1) * dataPerPage + 1;
    const endRecord = Math.min(currentDataPage * dataPerPage, totalRecords);
    
    if (currentSearchId) {
        // В режиме поиска показываем информацию о найденной записи
        document.getElementById('recordCount').textContent = `Найдена 1 запись из ${totalRecords}`;
    } else {
        // В обычном режиме показываем диапазон и общее количество
        document.getElementById('recordCount').textContent = `Записи: ${startRecord}-${endRecord} из ${totalRecords}`;
    }
    
    // Создаем заголовки таблицы ДИНАМИЧЕСКИ из первого объекта массива
    const headerRow = document.createElement('tr');
    const dataKeys = Object.keys(data[0]);
    
    // Создаем заголовки для каждого ключа данных
    dataKeys.forEach(key => {
        const th = document.createElement('th');
        
        // Используем маппинг для русских названий или преобразуем ключ
        if (fieldNameMapping[key]) {
            th.textContent = fieldNameMapping[key];
        } else {
            // Автоматическое преобразование
            th.textContent = key
                .replace(/_/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        }
        
        th.setAttribute('data-field', key);
        headerRow.appendChild(th);
    });
    
    // Добавляем столбец для действий если есть права
    if (getUserRights() >= 1) {
        const actionsTh = document.createElement('th');
        actionsTh.textContent = 'Действия';
        actionsTh.setAttribute('data-field', 'actions');
        headerRow.appendChild(actionsTh);
    }
    
    tableHead.appendChild(headerRow);
    
    // Заполняем данные
    data.forEach((record, index) => {
        const row = document.createElement('tr');
        if (currentSearchId && record.id === currentSearchId) {
            row.classList.add('search-highlight');
        }
        
        // Проходим по всем ключам объекта
        dataKeys.forEach(key => {
            const td = document.createElement('td');
            const value = record[key];
            
            // Определяем тип поля для форматирования
            const fieldType = detectFieldType(key, value);
            
            // Форматируем значение в зависимости от типа
            td.textContent = formatValue(value, fieldType);
            td.className = getCellClassName(fieldType, value);
            td.setAttribute('data-field', key);
            
            row.appendChild(td);
        });
        
        // Добавляем кнопки действий если есть права
        if (getUserRights() >= 1) {
            const actionsTd = document.createElement('td');
            actionsTd.className = 'table-actions';
            actionsTd.setAttribute('data-field', 'actions');
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit-small';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => editRecord(record);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-small';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => confirmDeleteRecord(record);
            
            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(deleteBtn);
            row.appendChild(actionsTd);
        }
        
        tableBody.appendChild(row);
    });
    
    // Настраиваем пагинацию
    setupPagination();
}

// Настройка пагинации
function setupPagination() {
    const pagination = document.getElementById('dataPagination');
    const totalRecords = currentSearchId ? 1 : allTableData.length;
    const totalPages = Math.ceil(totalRecords / dataPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Кнопка "Назад"
    if (currentDataPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentDataPage - 1})">‹ Назад</button>`;
    }
    
    // Номера страниц
    const startPage = Math.max(1, currentDataPage - 2);
    const endPage = Math.min(totalPages, currentDataPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentDataPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changePage(${i})">${i}</button>`;
        }
    }
    
    // Кнопка "Вперед"
    if (currentDataPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentDataPage + 1})">Вперед ›</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Смена страницы
function changePage(page) {
    currentDataPage = page;
    displayTableData(getCurrentPageData());
    
    // Прокрутка к верху таблицы
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// ПОИСК ПО ID
function searchById() {
    const searchInput = document.getElementById('searchById');
    const searchId = parseInt(searchInput.value);
    
    if (!searchId || searchId <= 0) {
        messageBoxShow('Введите корректный ID', 'red');
        return;
    }
    
    currentSearchId = searchId;
    
    // Ищем запись по ID во всех данных
    const foundRecord = allTableData.find(record => record.id === searchId);
    
    if (foundRecord) {
        // Показываем только найденную запись
        displaySearchResults([foundRecord]);
        showSearchInfo();
    } else {
        showNoSearchResults();
    }
    
    // Показываем кнопку очистки
    document.getElementById('clearSearchBtn').style.display = 'inline-block';
    document.getElementById('dataPagination').style.display = 'none';
}

// Обработка нажатия Enter в поле поиска
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        searchById();
    }
}

// Отображение результатов поиска
function displaySearchResults(results) {
    const tableHead = document.getElementById('dataTableHead');
    const tableBody = document.getElementById('dataTableBody');
    const dataTable = document.getElementById('dataTable');
    const noDataMessage = document.getElementById('noDataMessage');
    const noSearchResultsMessage = document.getElementById('noSearchResultsMessage');
    
    // Скрываем другие сообщения
    noDataMessage.style.display = 'none';
    noSearchResultsMessage.style.display = 'none';
    
    if (!results || results.length === 0) {
        dataTable.style.display = 'none';
        return;
    }
    
    // Показываем таблицу
    dataTable.style.display = 'table';
    
    // Очищаем таблицу
    tableBody.innerHTML = '';
    
    // Заполняем данными
    const dataKeys = Object.keys(results[0]);
    
    results.forEach((record, index) => {
        const row = document.createElement('tr');
        row.classList.add('search-highlight');
        
        dataKeys.forEach(key => {
            const td = document.createElement('td');
            const value = record[key];
            const fieldType = detectFieldType(key, value);
            
            td.textContent = formatValue(value, fieldType);
            td.className = getCellClassName(fieldType, value);
            td.setAttribute('data-field', key);
            
            // Особо выделяем ячейку с ID
            if (key === 'id' && value === currentSearchId) {
                td.style.fontWeight = 'bold';
                td.style.color = '#667eea';
            }
            
            row.appendChild(td);
        });
        
        // Добавляем кнопки действий если есть права
        if (getUserRights() >= 1) {
            const actionsTd = document.createElement('td');
            actionsTd.className = 'table-actions';
            actionsTd.setAttribute('data-field', 'actions');
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn-edit-small';
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Редактировать';
            editBtn.onclick = () => editRecord(record);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-small';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Удалить';
            deleteBtn.onclick = () => confirmDeleteRecord(record);
            
            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(deleteBtn);
            row.appendChild(actionsTd);
        }
        
        tableBody.appendChild(row);
    });
}

function getUserRights() {
    return getCookie('userRights');
}

// Показать информацию о поиске
function showSearchInfo() {
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsText = document.getElementById('searchResultsText');
    
    searchResultsText.textContent = `Найдена запись с ID: ${currentSearchId}`;
    searchResultsInfo.style.display = 'block';
}

// Показать сообщение о ненайденных результатах
function showNoSearchResults() {
    const dataTable = document.getElementById('dataTable');
    const noSearchResultsMessage = document.getElementById('noSearchResultsMessage');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsText = document.getElementById('searchResultsText');
    
    // Скрываем таблицу и показываем сообщение
    dataTable.style.display = 'none';
    noSearchResultsMessage.style.display = 'block';
    
    // Показываем информацию о поиске
    searchResultsText.textContent = `Запись с ID: ${currentSearchId} не найдена`;
    searchResultsInfo.style.display = 'block';
    
    // ИСПРАВЛЕНИЕ: Показываем общее количество записей
    const totalRecords = allTableData.length;
    document.getElementById('recordCount').textContent = `Записей: 0 из ${totalRecords}`;
}

// Очистка поиска
function clearSearch() {
    currentSearchId = null;
    
    // Сбрасываем поле поиска
    document.getElementById('searchById').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    
    // Скрываем информацию о поиске
    document.getElementById('searchResultsInfo').style.display = 'none';
    
    // Сбрасываем на первую страницу и показываем все данные
    currentDataPage = 1;
    if (allTableData && allTableData.length > 0) {
        displayTableData(getCurrentPageData());
    }
}

// Вспомогательные функции
function detectFieldType(fieldName, value) {
    if (value === null || value === undefined) return 'text';
    
    // Определяем по имени поля
    if (fieldName.includes('date') || fieldName.includes('Date') || 
        fieldName.includes('created') || fieldName.includes('updated') ||
        fieldName.includes('when')) {
        return 'date';
    }
    
    if (fieldName.includes('price') || fieldName.includes('amount') || 
        fieldName.includes('cost') || fieldName.includes('sum') ||
        fieldName.includes('distance') || fieldName.includes('rateValue')) {
        return 'number';
    }
    
    if (fieldName.includes('is_') || fieldName.includes('has_') || 
        fieldName === 'isDeleted' || fieldName === 'is_active') {
        return 'boolean';
    }
    
    if (fieldName.includes('email')) return 'email';
    if (fieldName.includes('phone')) return 'phone';
    
    // Определяем по значению
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (!isNaN(Date.parse(value))) return 'date';
    
    return 'text';
}

function formatValue(value, type) {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
        case 'date':
            try {
                return new Date(value).toLocaleDateString('ru-RU');
            } catch {
                return String(value);
            }
        case 'boolean':
            return value ? '✓' : '✗';
        case 'number':
            return new Intl.NumberFormat('ru-RU').format(Number(value));
        case 'email':
            return String(value).toLowerCase();
        default:
            return String(value);
    }
}

function getCellClassName(type, value) {
    switch (type) {
        case 'boolean':
            return value ? 'status-active' : 'status-inactive';
        case 'number':
            if (value < 0) return 'amount-negative';
            if (value > 0) return 'amount-positive';
            return '';
        case 'date':
            return 'date-cell';
        default:
            return '';
    }
}

// Заглушки для остальных функций
function showAddRecordForm() {
    messageBoxShow('Функция добавления записи в разработке', 'blue');
}

function exportTableData() {
    messageBoxShow('Функция экспорта в разработке', 'blue');
}

// Функция редактирования записи
function editRecord(record) {
    currentEditingRecord = record;
    
    // Получаем название таблицы
    const tableSelect = document.getElementById('tableSelect');
    const tableName = tableSelect.options[tableSelect.selectedIndex].text;
    
    // Устанавливаем заголовок модального окна
    document.getElementById('editRecordModalTitle').textContent = 
        `Редактировать запись (ID: ${record.id}) - ${tableName}`;
    
    // Заполняем поля формы
    populateEditForm(record, tableName);
    
    // Показываем модальное окно
    document.getElementById('editRecordModal').style.display = 'block';
    
    // Блокируем скролл body
    document.body.classList.add('modal-open');
    
    // Прокручиваем к началу формы
    const formFields = document.getElementById('editRecordFields');
    if (formFields) {
        formFields.scrollTop = 0;
    }
}

// Заполнение формы редактирования
function populateEditForm(record, tableName) {
    const formFields = document.getElementById('editRecordFields');
    formFields.innerHTML = '';
    
    // Поля, которые нельзя редактировать
    const nonEditableFields = ['id', 'whoAdded', 'whenAdded', 'whoChanged', 'whenChanged', 'isDeleted'];
    
    // Создаем поля для каждого свойства записи
    Object.keys(record).forEach(key => {
        if (nonEditableFields.includes(key)) return;
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-field';
        
        const label = document.createElement('label');
        label.textContent = fieldNameMapping[key] || key;
        label.htmlFor = `edit_${key}`;
        
        const input = createFormField(key, record[key], tableName);
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        formFields.appendChild(formGroup);
    });
}

// Создание поля формы в зависимости от типа данных
function createFormField(fieldName, value, tableName) {
    const fieldType = detectFieldType(fieldName, value);
    
    switch (fieldType) {
        case 'boolean':
            return createCheckboxField(fieldName, value);
        case 'number':
            return createNumberField(fieldName, value);
        case 'date':
            return createDateField(fieldName, value);
        case 'email':
            return createEmailField(fieldName, value);
        case 'phone':
            return createPhoneField(fieldName, value);
        default:
            return createTextField(fieldName, value, tableName);
    }
}

// Создание различных типов полей
function createTextField(fieldName, value, tableName) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `edit_${fieldName}`;
    input.name = fieldName;
    input.value = value || '';
    input.required = isFieldRequired(fieldName, tableName);
    
    // Добавляем валидацию для специальных полей
    if (fieldName === 'email') {
        input.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';
        input.title = 'Введите корректный email адрес';
    }
    
    return input;
}

function createNumberField(fieldName, value) {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `edit_${fieldName}`;
    input.name = fieldName;
    input.value = value || '';
    input.min = getMinValue(fieldName);
    input.max = getMaxValue(fieldName);
    input.required = true;
    return input;
}

function createCheckboxField(fieldName, value) {
    const container = document.createElement('div');
    container.className = 'checkbox-container';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `edit_${fieldName}`;
    checkbox.name = fieldName;
    checkbox.checked = Boolean(value);
    
    const label = document.createElement('label');
    label.htmlFor = `edit_${fieldName}`;
    label.textContent = fieldNameMapping[fieldName] || fieldName;
    
    container.appendChild(checkbox);
    container.appendChild(label);
    
    return container;
}

function createDateField(fieldName, value) {
    const input = document.createElement('input');
    input.type = 'datetime-local';
    input.id = `edit_${fieldName}`;
    input.name = fieldName;
    
    if (value) {
        const date = new Date(value);
        input.value = date.toISOString().slice(0, 16);
    }
    
    return input;
}

function createEmailField(fieldName, value) {
    const input = document.createElement('input');
    input.type = 'email';
    input.id = `edit_${fieldName}`;
    input.name = fieldName;
    input.value = value || '';
    input.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';
    input.title = 'Введите корректный email адрес';
    input.required = true;
    return input;
}

function createPhoneField(fieldName, value) {
    const container = document.createElement('div');
    container.className = 'phone-input-container';
    
    const input = document.createElement('input');
    input.type = 'tel';
    input.id = `edit_${fieldName}`;
    input.name = fieldName;
    input.value = value || '';
    input.placeholder = '+7XXXXXXXXXX';
    input.title = 'Введите номер телефона в формате +7XXXXXXXXXX';
    input.required = true;
    
    // Добавляем подсказку под полем
    const hint = document.createElement('div');
    hint.className = 'phone-hint';
    hint.textContent = 'Формат: +7XXXXXXXXXX (12 символов)';
    hint.style.cssText = 'font-size: 12px; color: #718096; margin-top: 4px;';
    container.appendChild(hint);
    
    container.appendChild(input);
    
    return container;
}

// Функция для форматирования номера телефона перед валидацией
function formatPhoneForValidation(phoneValue) {
    if (!phoneValue) return '';
    
    // Удаляем все нецифровые символы
    let numbers = phoneValue.replace(/\D/g, '');
    
    // Если номер начинается с 7 или 8, или без кода страны
    if (numbers.startsWith('7') || numbers.startsWith('8')) {
        numbers = '7' + numbers.substring(1);
    } else if (numbers.length === 10) {
        // Если ввели 10 цифр без кода страны
        numbers = '7' + numbers;
    }
    
    // Ограничиваем длину (11 цифр - код страны + номер)
    numbers = numbers.substring(0, 11);
    
    return numbers ? '+7' + numbers.substring(1) : '';
}

// Валидация номера телефона при подтверждении
function validatePhoneFormat(phoneValue) {
    if (!phoneValue) return false;
    
    // Форматируем номер для проверки
    const formattedPhone = formatPhoneForValidation(phoneValue);
    
    // Проверяем формат +7XXXXXXXXXX (ровно 12 символов)
    return formattedPhone.match(/^\+7[0-9]{10}$/);
}

// Функция для получения отформатированного номера телефона
function getFormattedPhoneValue(phoneValue) {
    return formatPhoneForValidation(phoneValue);
}

// Вспомогательные функции для валидации
function isFieldRequired(fieldName, tableName) {
    const optionalFields = ['note', 'whoChanged', 'whenChanged'];
    return !optionalFields.includes(fieldName);
}

function getMinValue(fieldName) {
    const minValues = {
        'distance': 1,
        'movePrice': 0,
        'idlePrice': 0,
        'registrationCode': 1,
        'releaseYear': 1886
    };
    return minValues[fieldName] || '';
}

function getMaxValue(fieldName) {
    const maxValues = {
        'registrationCode': 999,
        'releaseYear': new Date().getFullYear()
    };
    return maxValues[fieldName] || '';
}

// Закрытие модального окна
function closeEditRecordModal() {
    document.getElementById('editRecordModal').style.display = 'none';
    currentEditingRecord = null;
    
    // Разблокируем скролл body
    document.body.classList.remove('modal-open');
    
    // Очищаем форму
    document.getElementById('editRecordFields').innerHTML = '';
}


// Обновление записи
async function updateRecord(event) {
    event.preventDefault();
    
    if (!currentEditingRecord) {
        messageBoxShow('Ошибка: запись для редактирования не найдена', 'red');
        return;
    }
    
    const formData = new FormData(event.target);
    const updatedData = {};
    
    // Копируем ВСЕ поля из исходной записи
    Object.keys(currentEditingRecord).forEach(key => {
        updatedData[key] = currentEditingRecord[key];
    });
    
    // Обновляем данные из формы
    for (let [key, value] of formData.entries()) {
        // Обработка чекбоксов
        if (value === 'on') {
            updatedData[key] = true;
            continue;
        }
        
        // Пропускаем пустые чекбоксы (оставляем исходное значение)
        if (document.getElementById(`edit_${key}`)?.type === 'checkbox' && !document.getElementById(`edit_${key}`)?.checked) {
            updatedData[key] = false;
            continue;
        }
        
        // Валидация для телефона только при подтверждении
        if (key === 'phoneNumber' && value) {
            if (!validatePhoneFormat(value)) {
                messageBoxShow('Некорректный формат номера телефона. Используйте формат: +7XXXXXXXXXX', 'red');
                return;
            }
            // Форматируем номер перед сохранением
            value = getFormattedPhoneValue(value);
        }
        
        // Преобразуем типы данных и обновляем значение
        const fieldType = detectFieldType(key, currentEditingRecord[key]);
        updatedData[key] = convertValueType(value, fieldType);
    }
    
    // Обновляем служебные поля
    updatedData.whoChanged = getCookie('userName');
    updatedData.whenChanged = new Date().toISOString();
    
    try {
        const token = getCookie('token');
        const tableSelect = document.getElementById('tableSelect');
        const apiTableName = tableMap.get(tableSelect.options[tableSelect.selectedIndex].text);
        
        console.log('Sending update data:', updatedData); // Для отладки
        
        const response = await fetch(`${BASE_API_URL}/${apiTableName}/${currentEditingRecord.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${errorText}`);
        }
        
        messageBoxShow('Запись успешно обновлена', '#4CAF50');
        closeEditRecordModal();
        
        // Обновляем данные таблицы
        await fetchTableData();
        
    } catch (error) {
        console.error('Error updating record:', error);
        messageBoxShow(error.message, 'red');
    }
}

// Преобразование типов данных
function convertValueType(value, fieldType) {
    if (value === '' || value === null) return null;
    
    switch (fieldType) {
        case 'number':
            return Number(value);
        case 'boolean':
            return Boolean(value);
        case 'date':
            return new Date(value).toISOString();
        default:
            return String(value);
    }
}

function confirmDeleteRecord(record) {
    messageBoxShow(`Удаление записи ID: ${record.id} в разработке`, 'blue');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик Enter для поля поиска
    const searchInput = document.getElementById('searchById');
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearchKeypress);
    }
});

// Закрытие по клику вне модального окна
window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editRecordModal');
    if (event.target === editModal) {
        closeEditRecordModal();
    }
});

// Предотвращаем закрытие при клике на само модальное окно
document.addEventListener('click', function(event) {
    const modalContent = document.querySelector('#editRecordModal .modal-content');
    if (modalContent && modalContent.contains(event.target)) {
        event.stopPropagation();
    }
});