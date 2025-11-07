import {getTableHash, getToken, setTableHash} from './cookie.js'
import {ApiService} from './api.js';
import { messageBoxShowFromRight } from "./index.js";
import { DatabaseCache } from "./database-cache.js";
import { isFieldRequired, getMinValue, getMaxValue, TableAction } from './database-table-service.js';
import { displayTableData, fieldNameMapping } from "./database-visuals.js";
import { getCurrentPageData } from "./database-general-service.js";

export const dbCache = new DatabaseCache();

export let currentSearchId = null; // текущая запись, подлежащая поиску
export let currentRecord = null; // текущая запись, с коротой производятся действия
export let currentRecordAction = null; // тип операции, применяемый к текущей записи

export let allTableData = []; // данные всех таблиц

export let currentDataPage = 1; // текущая отображаемая страницы - пагинация
export const DATA_PER_PAGE = 20; // Число строк на каждой странице - пагинация

// Словарь для доступа к API

export var tableMap = new Map();

tableMap.set('Заказы', 'Order')
    .set('Заказчики', 'Customer')
    .set('Маршруты', 'Route')
    .set('Тарифы', 'Rate')
    .set('Шоферы', 'Driver')
    .set('Транспортные средства', 'TransportVehicle');

// Текстовое содержимое кнопок форм при подтвержении действия:
// 1. Добавить набор.
// 2. Редактировать набор.
// 3. Удалить набор.
// 4. Восстановить набор.

const EDIT_BUTTON_TEXT = 'Сохранить';
const INSERT_BUTTON_TEXT = 'Добавить';
const DELETE_BUTTON_TEXT = 'Удалить';
const RECOVER_BUTTON_TEXT = 'Восстановить';

export class TableFormConfirmButton {
    static get Edit() {return EDIT_BUTTON_TEXT};
    static get Insert() {return INSERT_BUTTON_TEXT};
    static get Delete() {return DELETE_BUTTON_TEXT};
    static get Recover() {return RECOVER_BUTTON_TEXT;}
    static Text(action) {
        switch (action) {
            case TableAction.Edit: return this.Edit;
            case TableAction.Insert: return this.Insert;
            case TableAction.Delete: return this.Delete;
            case TableAction.Recover: return this.Recover;
        }
    }
}

// Текстовое содержимое заголовков форм при подтвержении действия:
// 1. Добавить набор.
// 2. Редактировать набор.
// 3. Удалить набор.
// 4. Восстановить набор.

const EDIT_FORM_HEADER = 'Редактировать';
const INSERT_FORM_HEADER = 'Добавить';
const DELETE_FORM_HEADER = 'Удалить';
const RECOVER_FORM_HEADER = 'Восстановить';

export class TableFormConfirmHeader {
    static get Edit() {return EDIT_FORM_HEADER};
    static get Insert() {return INSERT_FORM_HEADER};
    static get Delete() {return DELETE_FORM_HEADER};
    static get Recover() {return RECOVER_FORM_HEADER;}
    static Text(action) {
        switch (action) {
            case TableAction.Edit: return this.Edit;
            case TableAction.Insert: return this.Insert;
            case TableAction.Delete: return this.Delete;
            case TableAction.Recover: return this.Recover;
        }
    }
}


// Функции для изменения значений переменных

export function changeCurrentSearchId(value) {
    currentSearchId = value;
}

export function changeCurrentDataPage(value) {
    currentDataPage = value;
}

export function changeCurrentRecord(value, action) {
    currentRecord = value;
    currentRecordAction = action;
}

export async function fetchTableData(useCache = true) {
    // Выпадающий список
    const tableSelect = document.getElementById('tableSelect');
    const tableName = tableSelect.options[tableSelect.selectedIndex].text;

    const token = getToken(); // токен сессии

    const tableHash = getTableHash(tableName); // хэш таблицы
    let isGoingToFetch = false; // нужно ли выполнять вытягивание данных из БД - данные несвежие
    
    // Данных нет в памяти - вытягивание
    if (tableHash === undefined || tableHash === null) {
        try {
            const data = await ApiService.post(`${tableMap.get(tableSelect.options[tableSelect.selectedIndex].text)}/verify-table-state-hash`, "-", {
                'Authorization': `Bearer ${token}`,
            });

            setTableHash(tableName, data.hash);
            isGoingToFetch = true;
        } catch (error) {
            messageBoxShowFromRight(`Ошибка: ${error.message}`, 'red', false, 0, 'translateY(50px)');
            return;
        }
    } else { // Данные есть, но не ясно, свежие ли?
        try {
            const data = await ApiService.post(`${tableMap.get(tableSelect.options[tableSelect.selectedIndex].text)}/verify-table-state-hash`, tableHash, {
                'Authorization': `Bearer ${token}`,
            });

            if (data.hash != tableHash) {
                isGoingToFetch = true;
                setTableHash(tableName, data.hash);
            }

        } catch (error) {
            messageBoxShowFromRight(`Ошибка: ${error.message}`, 'red', false, 0, 'translateY(50px)');
            return;
        }
    }

    // Пользователь обращается к кэшированной таблице со свежими данными
    if (useCache && !isGoingToFetch) {
        const cachedData = dbCache.get(tableName);
        if (cachedData) {
            allTableData = cachedData;
            currentDataPage = 1;
            displayTableData(getCurrentPageData());
            return;
        }
    }

    // Вытягиваем данные
    try {       
        const data = await ApiService.get(`${tableMap.get(tableSelect.options[tableSelect.selectedIndex].text)}`, {
            'Authorization': `Bearer ${token}`
        });

        if (Array.isArray(data)) {
            // Сохраняем в кэш
            dbCache.set(tableName, data);
            
            allTableData = data;
            currentDataPage = 1;
            displayTableData(getCurrentPageData());
            setupPagination();
        } else {
            throw new Error('API returned non-array response');
        }

    } catch (error) {       
        messageBoxShowFromRight('Внутренняя ошибка', 'red', false, '43', 'translateY(50px)');
    }
}

// Настройка пагинации
export function setupPagination() {
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
export function detectFieldType(fieldName, value) {
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

// Заполнение формы действия над таблицей
export function populateEditForm(record, tableName, action) {
    const formFields = document.getElementById('editRecordFields');
    formFields.innerHTML = '';

    // Задаем текст в поле кнопки подтверждения действия
    document.getElementById('applyModalForm').textContent = TableFormConfirmButton.Text(action);
    
    // Поля, которые нельзя редактировать
    const nonEditableFields = ['id', 'whoAdded', 'whenAdded', 'whoChanged', 'whenChanged', 'isDeleted'];

    // В случае, если добавляется новый набор, то дин. верстка будет по нулевому набору (он дб)
    if (action === TableAction.Insert) {
        record = allTableData[0];
    }

    // Производим дин. верстку
    if (action === TableAction.Delete || action === TableAction.Recover) { // Удаление и восстановление требует лишь подтверждения
        const formGroup = document.createElement('div');
        formGroup.className = 'form-field';
        
        const label = document.createElement('label');

        const actionString = action === TableAction.Delete ? "удалить" : "восстановить";
        label.textContent = `Вы действительно хотите ${actionString} набор с ID = ${record.id}?`;
        label.style.fontSize = '12pt';

        formGroup.appendChild(label);
        formFields.appendChild(formGroup);
    } else {
        // Создаем поля для каждого свойства записи
        Object.keys(record).forEach(key => {
            if (nonEditableFields.includes(key)) return;
            
            const formGroup = document.createElement('div');
            formGroup.className = 'form-field';
            
            const label = document.createElement('label');
            label.textContent = fieldNameMapping[key] || key;
            label.htmlFor = `edit_${key}`;
            
            // Добавление нового элемента требует пустых начальных значений <input>
            let input;
            switch (action) {
                case TableAction.Edit: input = createFormField(key, record[key], tableName); break;
                case TableAction.Insert: input = createFormField(key, null, tableName); break;
            }
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            formFields.appendChild(formGroup);
        });
    }
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