import {getTableHash, getToken, setTableHash} from './cookie.js'
import {ApiService} from './api.js';
import { isFieldRequired, getMinValue, getMaxValue, TableVariables, TableModifying } from './table-service.js';
import { DATA_PER_PAGE, dbCache, fieldNameMapping, TableAction } from './table-utils.js';
import { MessageBox, TableFormConfirmButton } from './form-utils.js';

window.showAddRecordForm = showAddRecordForm;

// Отобразить форму добавления новой записи
export function showAddRecordForm() {
    TableModifying(null, TableAction.Insert);
}

export async function fetchTableData(tableName, entityName, paginationID, useCache = true) {

    const token = getToken(); // токен сессии

    const tableHash = getTableHash(tableName); // хэш таблицы
    let isGoingToFetch = false; // нужно ли выполнять вытягивание данных из БД - данные несвежие
    
    // Данных нет в памяти - вытягивание
    if (!tableHash) {
        try {
            const data = await ApiService.get(`${entityName}/verify-table-state-hash?hash=default`, {
                'Authorization': `Bearer ${token}`,
            });

            setTableHash(tableName, data.hash);
            isGoingToFetch = true;
        } catch (error) {
            messageBoxShowFromRight(`Ошибка: ${error.message}`, 'red', false, 0, 'translateY(50px)');
            throw error;
        }
    } else { // Данные есть, но не ясно, свежие ли?
        try {
            const data = await ApiService.get(`${entityName}/verify-table-state-hash?hash=${tableHash}`, {
                'Authorization': `Bearer ${token}`,
            });

            if (data.result === '0' || !dbCache.get(tableName)) {
                isGoingToFetch = true;
                setTableHash(tableName, data.hash);
            }

        } catch (error) {
            messageBoxShowFromRight(`Ошибка: ${error.message}`, 'red', false, 0, 'translateY(50px)');
            throw error;
        }
    }

    // Пользователь обращается к кэшированной таблице со свежими данными
    if (useCache && !isGoingToFetch) {
        const cachedData = dbCache.get(tableName);
        if (cachedData) {
            TableVariables.tableData = cachedData;
            TableVariables.dataPage = 1;
            return;
        }
    }

    // Вытягиваем данные
    try {       
        const data = await ApiService.get(`${entityName}`, {
            'Authorization': `Bearer ${token}`
        });

        if (Array.isArray(data)) {
            // Сохраняем в кэш
            dbCache.set(tableName, data);
            
            TableVariables.tableData = data;
            TableVariables.dataPage = 1;
        } else {
            throw new Error('API returned non-array response');
        }

    } catch (error) {       
        MessageBox.ShowFromLeft('Внутренняя ошибка', 'red', false, '43', 'translateY(50px)');
        console.error(error);
        throw error;
    }
}

// Настройка пагинации
export function setupPagination(paginationID) {
    const pagination = document.getElementById(paginationID);
    const totalRecords = TableVariables.searchResults ? TableVariables.searchResults.length : TableVariables.tableData.length;
    const totalPages = Math.ceil(totalRecords / DATA_PER_PAGE);
    
    pagination.style.display = 'flex';
    
    let paginationHTML = '';

    let tableID = '', tableHead = '', tableBodyID = '', tableInfoID = '';
    switch (paginationID) {
        case 'dataPagination':
            tableID = 'dataTable';
            tableHead = 'dataTableHead';
            tableBodyID = 'dataTableBody';
            tableInfoID = 'dataInfo';
            break;
        case 'usersPagination':
            tableID = 'usersTable';
            tableHead = 'usersTableHead';
            tableBodyID = 'usersTableBody';
            tableInfoID = 'usersInfo';
            break;
        case 'rolesPagination':
            tableID = 'rolesTable';
            tableHead = 'rolesTableHead';
            tableBodyID = 'rolesTableBody';
            tableInfoID = 'rolesInfo';
            break;
    }
    
    // Кнопка "Назад"
    if (TableVariables.dataPage > 1) {
        paginationHTML += `<button onclick="changePage(${TableVariables.dataPage - 1}, '${paginationID}', '${tableID}', '${tableHead}', '${tableBodyID}', '${tableInfoID}')">Назад</button>`;
    }
    
    // Номера страниц
    const startPage = Math.max(1, TableVariables.dataPage - 2);
    const endPage = Math.min(totalPages, TableVariables.dataPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === TableVariables.dataPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changePage(${i}, '${paginationID}', '${tableID}', '${tableHead}', '${tableBodyID}', '${tableInfoID}')">${i}</button>`;
        }
    }
    
    // Кнопка "Вперед"
    if (TableVariables.dataPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${TableVariables.dataPage + 1}, '${paginationID}', '${tableID}', '${tableHead}', '${tableBodyID}', '${tableInfoID}')">Вперед</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Вспомогательные функции
export function detectFieldType(fieldName, value) {
    if (value === null || value === undefined) return 'text';
    
    if (typeof value === 'boolean') return 'boolean';

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
        return 'date';
    }
    
    if (fieldName.includes('email')) return 'email';
    if (fieldName.includes('phone')) return 'phone';
    
    // Определяем по значению
    if (typeof value === 'number') return 'number';
    if (!isNaN(Date.parse(value))) return 'date';
    
    return 'text';
}

// Заполнение формы действия над таблицей
export async function populateEditForm(record, tableName, action) {
    const formFields = document.getElementById('editRecordFields');
    formFields.innerHTML = '';

    // Задаем текст в поле кнопки подтверждения действия
    document.getElementById('applyModalForm').textContent = TableFormConfirmButton.Text(action);
    
    // Поля, которые нельзя редактировать
    const nonEditableFields = ['id', 'whoAdded', 'whenAdded', 'whoChanged', 'whenChanged', 'isDeleted'];

    // В случае, если добавляется новый набор, то дин. верстка будет по нулевому набору (он дб)
    if (action === TableAction.Insert) {
        record = TableVariables.tableData[0];
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
        for (const key of Object.keys(record)) {
            if (nonEditableFields.includes(key) || key.includes('can')) continue;
            
            const formGroup = document.createElement('div');
            formGroup.className = 'form-field';
            
            if (detectFieldType(key, record[key]) !== 'boolean') {
                const label = document.createElement('label');
                label.textContent = fieldNameMapping[key] || key;
                label.htmlFor = `edit_${key}`;
                formGroup.appendChild(label);
            }
            

            // Добавление нового элемента требует пустых начальных значений <input>
            let input;
            switch (action) {
                case TableAction.Edit: input = await createFormField(key, record[key], tableName); break;
                case TableAction.Insert: input = await createFormField(key, null, tableName); break;
            }

            // В процессе создания компонентов произошла ошибка
            if (!input && !key.includes('can')) {
                MessageBox.ShowFromLeft(`Внутренняя ошибка. Попробуйте позже`, 'red', false, '45', 'transformY(40px)');
                console.error(key, record[key], tableName);
                return;
            }
            
            formGroup.appendChild(input);
            formFields.appendChild(formGroup);
        }
    }
}

// Создание поля формы в зависимости от типа данных
async function createFormField(fieldName, value, tableName) {
    const fieldType = detectFieldType(fieldName, value);
    
    switch (fieldType) {
        case 'boolean':
            return createCheckboxField(fieldName, value);
        case 'number':
            return await createNumberField(fieldName, value);
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

async function createNumberField(fieldName, value) {
    let component = null;
    if (fieldName === 'rights') {
        try {
            const token = getToken();
            const data = await ApiService.get(`Role/`, {
                'Authorization': `Bearer ${token}`
            });

            // Заполняем названия ролей
            component = document.createElement('select');
            component.innerHTML = '';
            
            const rights = [];
            data.forEach(set => {
                const newOption = document.createElement('option');
                if (!rights.includes(set.rights)) {
                    rights.push(set.rights);
                    newOption.value = set.rights;
                    newOption.textContent = set.rights;
                    component.appendChild(newOption);
                }
            });
        } catch (error) {
            MessageBox.ShowFromLeft(`Ошибка: ${error.data.message}`, 'red', false, '40', 'trasformY(40px)');
        }
    } else {
        component = document.createElement('input');
        component.type = 'number';
        component.id = `edit_${fieldName}`;
        component.name = fieldName;
        component.value = value || '';
        component.min = getMinValue(fieldName);
        component.max = getMaxValue(fieldName);
        component.required = true;
    }

    return component;
}

function createCheckboxField(fieldName, value) {
    const container = document.createElement('div');
    container.className = 'checkbox-container';
    container.style.display = 'flex';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `edit_${fieldName}`;
    checkbox.name = fieldName;
    checkbox.checked = Boolean(value);
    
    const label = document.createElement('label');
    label.htmlFor = `edit_${fieldName}`;
    label.textContent = fieldNameMapping[fieldName] || fieldName;
    label.style.fontWeight = 'bold';
    
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