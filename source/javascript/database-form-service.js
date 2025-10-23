import {getToken, getTokenExpireTime} from './cookie.js'
import {BASE_API_URL} from './api.js';
import { messageBoxShow } from "./index.js";
import { DatabaseCache } from "./database-cache.js";
import { hideTableInterface, displayTableData, fieldNameMapping } from "./database-visuals.js";
import { checkDatabaseAccess, getCurrentPageData } from "./database-general-service.js";

export {hideTableInterface, checkDatabaseAccess, setupPagination, fetchTableData, populateEditForm};

export {currentEditingRecord};

const dbCache = new DatabaseCache();

let currentSearchId = null;
let currentEditingRecord = null;
let allTableData = []; // данные всех таблиц
let currentDataPage = 1;
const DATA_PER_PAGE = 20; // Число строк на каждой странице - пагинация

// Словарь для доступа к API
var tableMap = new Map();
tableMap.set('Заказы', 'Order');
tableMap.set('Заказчики', 'Customer');
tableMap.set('Маршруты', 'Route');
tableMap.set('Тарифы', 'Rate');
tableMap.set('Шоферы', 'Driver');
tableMap.set('Транспортные средства', 'TransportVehicle');

async function fetchTableData(useCache = true) {
    // Текущая сессия актульна
    const tokenExpireTime = getTokenExpireTime();
    if (tokenExpireTime === undefined) {
        console.error('Не удалось извлечь срок жизни токена, либо пользователь вышел из системы самостоятельно');
        messageBoxShow('Авторизуйтесь в системе', 'red', '0', '44%', 'translateY(50px)');
        return;
    }

    const tokenExpireDateTime = new Date(tokenExpireTime); //  время жизни токена типа js
    if (tokenExpireDateTime < new Date()) {
        console.error('Время сессии истекло');
        messageBoxShow('Время вашей сессии истекло. Авторизуйтесь повторно', 'red', '0', '37%', 'translateY(50px)');
        return;
    }

    // Выпадающий список
    const tableSelect = document.getElementById('tableSelect');
    const tableName = tableSelect.options[tableSelect.selectedIndex].text;

    // Пользователь обращается к кэшированной таблице
    if (useCache) {
        const cachedData = dbCache.get(tableName);
        if (cachedData) {
            allTableData = cachedData;
            currentDataPage = 1;
            displayTableData(getCurrentPageData());
            return;
        }
    }

    // Запрос
    const token = getToken();

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
            // Сохраняем в кэш
            dbCache.set(tableName, data);
            
            allTableData = data;
            currentDataPage = 1;
            displayTableData(getCurrentPageData());
        } else {
            throw new Error('API returned non-array response');
        }

    } catch (error) {
        console.error('Error loading users:', error);
        
        const errorMessage = error.message == 401 ? 'Срок вашей сессии истек. Авторизуйтесь повторно' : 'Внутренняя ошибка';        
        messageBoxShow(errorMessage, 'red', '0', '40%', 'translateY(50px)');
    }
}

// Настройка пагинации
function setupPagination() {
    const pagination = document.getElementById('dataPagination');
    const totalRecords = currentSearchId ? 1 : allTableData.length;
    const totalPages = Math.ceil(totalRecords / DATA_PER_PAGE);
    
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