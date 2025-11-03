import { fetchTableData, setupPagination, currentSearchId, changeCurrentSearchId, 
    changeCurrentDataPage, allTableData, currentDataPage, DATA_PER_PAGE, detectFieldType, currentEditingRecord,  
    changeCurrentEditingRecord} from "./database-form-service.js";
import { formatValue, getCellClassName, getCurrentPageData, checkDatabaseAccess } from "./database-general-service.js";
import { editRecord } from "./database-table-service.js";
import { getUserRights } from "./cookie.js";

let currentTable = '';

// Маппинг русских названий для полей
export const fieldNameMapping = {
    'id': 'ID',
    'customerId': 'ID заказчика',
    'routeId': 'ID маршрута',
    'rateId': 'ID тарифа',
    'driverId': 'ID шофера',
    'vehicleId': 'ID транспортного средства',
    'forename': 'Имя',
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

// Загрузка данных в таблицу
window.loadTableData = function loadTableData(useCache = true) {
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
    fetchTableData(useCache);
}

// Сокрытие интерфейса таблиц
export function hideTableInterface() {
    document.getElementById('tableInfo').style.display = 'none';
    document.getElementById('dataTable').style.display = 'none';
    document.getElementById('noDataMessage').style.display = 'none';
    document.getElementById('noSearchResultsMessage').style.display = 'none';
    document.getElementById('dataPagination').style.display = 'none';
    document.getElementById('searchResultsInfo').style.display = 'none';
}

// Отображение данных таблицы
export function displayTableData(data) {
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
    const startRecord = (currentDataPage - 1) * DATA_PER_PAGE + 1;
    const endRecord = Math.min(currentDataPage * DATA_PER_PAGE, totalRecords);
    
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

// Отображение результатов поиска
export function displaySearchResults(results) {
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

// Показать информацию о поиске
export function showSearchInfo() {
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsText = document.getElementById('searchResultsText');
    
    searchResultsText.textContent = `Найдена запись с ID: ${currentSearchId}`;
    searchResultsInfo.style.display = 'block';
}

// Показать сообщение о ненайденных результатах
export function showNoSearchResults() {
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
window.clearSearch = function clearSearch() {
    changeCurrentSearchId(null);
    
    // Сбрасываем поле поиска
    document.getElementById('searchById').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    
    // Скрываем информацию о поиске
    document.getElementById('searchResultsInfo').style.display = 'none';
    
    // Сбрасываем на первую страницу и показываем все данные
    changeCurrentDataPage(1);
    if (allTableData && allTableData.length > 0) {
        displayTableData(getCurrentPageData());
    }
}

// Смена страницы
window.changePage = function changePage(page) {
    changeCurrentDataPage(page);
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчик Enter для поля поиска
    const searchInput = document.getElementById('searchById');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                searchById();
            }
    });
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



// Закрытие модального окна
window.closeEditRecordModal = function closeEditRecordModal() {
    document.getElementById('editRecordModal').style.display = 'none';
    changeCurrentEditingRecord(null);
    
    // Разблокируем скролл body
    document.body.classList.remove('modal-open');
    
    // Очищаем форму
    document.getElementById('editRecordFields').innerHTML = '';
}