import { getToken, getUserName, getUserRights, setTableHash, UserRights } from "./cookie.js";
import { populateEditForm, detectFieldType} from "./form-service.js";
import { closeRecordModalForm, displaySearchResults } from "./database-visuals.js";
import { ApiService } from "./api.js";
import { TableAction, TableGETSpecial, tableMap, TableName, TableVariables } from "./table-utils.js";
import { MessageBox, TableFormConfirmHeader } from "./form-utils.js";
import { showTableData } from "./workspace-visuals.js";

window.recordAction = recordAction;
window.searchById = searchById;

// Обновление записи
export async function recordAction(event) {
    event.preventDefault();

    // Задаем тип действия
    let action = TableVariables.recordAction;
    
    const formData = new FormData(event.target);
    const body = {};

    // Копируем все наименования ключей.
    // 1. Добавление записей - копирование ключей первой входящей записи
    // 2. Редактирование записей - копирование ключей текущей записи
    // 3. Удаление записей - копирование ключей текущей записи
    let localRecord;
    if (action === TableAction.Insert) { // Добавление
        localRecord = TableVariables.tableData[0];
    } else {
        localRecord = TableVariables.record;
    }

    let recordIndex = TableVariables.tableData.indexOf(localRecord); // индекс записи

    let changePassword = false; // проверка, что меняем пароль
    
    // Копируем ВСЕ поля из исходной записи
    Object.keys(localRecord).forEach(key => {
        body[key] = localRecord[key];
    });
    
    // Обновляем данные из формы
    for (let [key, value] of formData.entries()) {
        // Обработка чекбоксов
        if (value === 'on') {
            body[key] = true;
            continue;
        }
        
        // Пропускаем пустые чекбоксы (оставляем исходное значение)
        if (document.getElementById(`edit_${key}`)?.type === 'checkbox' && !document.getElementById(`edit_${key}`)?.checked) {
            body[key] = false;
            continue;
        }
        
        // Валидация для телефона только при подтверждении
        if (key === 'phoneNumber' && value) {
            if (!validatePhoneFormat(value)) {
                MessageBox.ShowFromCenter('Некорректный формат номера телефона. Используйте формат: +7XXXXXXXXXX', 'red');
                return;
            }
            // Форматируем номер перед сохранением
            value = getFormattedPhoneValue(value);
        }
        
        // Преобразуем типы данных и обновляем значение
        const fieldType = detectFieldType(key, localRecord[key]);
        if (fieldType === 'password')
            changePassword = true;
        try {
            body[key] = convertValueType(value, fieldType, key);
        } catch (error) {
            MessageBox.ShowFromCenter(error.message, 'red');
            return;
        }
        
    }
    
    // Обновляем служебные поля
    switch (action) {
        case TableAction.Insert:
            body.id = '0';
            body.whoAdded = getUserName();
            body.whenAdded = new Date();
            break;
        case TableAction.Edit:
            body.whoChanged = getUserName();
            body.whenChanged = new Date();
            break;
        case TableAction.Delete: {
            body.whoChanged = getUserName();

            const time = new Date();
            body.whenChanged = time;
            body.isDeleted = time;
            break;
        }
        case TableAction.Recover: {
            body.whoChanged = getUserName();
            body.whenChanged = new Date();
            body.isDeleted = null;
            break;
        }
    }
    
    MessageBox.ShowAwait();
    try {
        const token = getToken();
        const apiTableName = TableVariables.tableCodeName;

        let data;
        let hash;
        
        switch (action) {
            case TableAction.Insert:
                data = await ApiService.post(`${apiTableName}`, body, {
                    'Authorization': `Bearer ${token}`
                });

                // Добавление в конец новой записи
                const newSet = await ApiService.get(TableGETSpecial.getByIdApiString(apiTableName, data.id), {
                    'Authorization': `Bearer ${token}`
                });

                TableVariables.tableData.push(newSet);

                break;
            case TableAction.Edit: {

                let data = null;

                // В случае, если меняем пароль 
                if (changePassword) {
                    data = await ApiService.put(`${apiTableName}/password/update`, body, {
                        'Authorization': `Bearer ${token}`
                    });
                } else {
                    data = await ApiService.put(`${apiTableName}/${TableVariables.record.id}`, body, {
                        'Authorization': `Bearer ${token}`
                    });
                }

                hash = data.hash;

                // Обновление текущей записи на актуальную
                const updatedSet = await ApiService.get(TableGETSpecial.getByIdApiString(apiTableName, TableVariables.record.id), {
                    'Authorization': `Bearer ${token}`
                });

                TableVariables.tableData[recordIndex] = updatedSet;

                hash = updatedSet.hash;

                break;
            }
                
            case TableAction.Delete: {
                data = await ApiService.delete(`${apiTableName}/${TableVariables.record.id}`, {
                    'Authorization': `Bearer ${token}`
                });

                // В случае, если пользователь не админ и произведено удаление, то надо удалить из памяти запись
                const userRights = getUserRights();
                if (userRights !== UserRights.Admin) {
                    TableVariables.tableData.splice(recordIndex, 1);
                } else {
                    // Если пользователь админ, то нужно получить свежую запись
                    const updatedSet = await ApiService.get(TableGETSpecial.getByIdApiString(apiTableName, TableVariables.record.id), {
                        'Authorization': `Bearer ${token}`
                    });

                    TableVariables.tableData[recordIndex] = updatedSet;
                }

                hash = data.hash;

                break;
            }
                
            case TableAction.Recover:
                data = await ApiService.patch(`${apiTableName}/${TableVariables.record.id}/recover`, {
                    'Authorization': `Bearer ${token}`
                });

                hash = data.hash;

                // Обновление текущей записи на актуальную
                const updatedSet = await ApiService.get(TableGETSpecial.getByIdApiString(apiTableName, TableVariables.record.id), {
                    'Authorization': `Bearer ${token}`
                });

                TableVariables.tableData[recordIndex] = updatedSet;

                hash = updatedSet.hash;

                break;
        }

        // Запись нового хэша состояния таблицы
        setTableHash(tableMap.get(TableVariables.tableRUName), hash);

        const tableCodeName = `${TableName.getCodeName(TableVariables.tableRUName)}`; // кодовое имя таблицы
        
        // Получаем названия компонентов для отображения
        const paginationID = `${tableCodeName}Pagination`;
        const tableID = `${tableCodeName}Table`;
        const tableHeadID = `${tableCodeName}TableHead`;
        const tableBodyID = `${tableCodeName}TableBody`;
        const tableInfoID = `${tableCodeName}Info`;
        
        showTableData(paginationID, tableID, tableHeadID, tableBodyID, tableInfoID);

        closeRecordModalForm();

        MessageBox.ShowFromCenter('Операция успешна завершена', 'green');
    } catch (error) {       
        if ((action === TableAction.Edit || action === TableAction.Insert) && error.status === 400) {
            MessageBox.ShowFromCenter(`${error.data.message}`, 'red');
        } else if (error.status === 401) {
            deleteUserData();
            window.location.href = '../../authorize-form/authorize.html';
            return;
        }  else {
            MessageBox.ShowFromCenter(`Ошибка: ${error.data.message}`, 'red');
        }
        
        
        console.error(error);
        return;
    } finally {
        MessageBox.RemoveAwait();
    }
}

// Функция редактирования записи
export async function TableModifying(record, action, tableName) {
    TableVariables.record = record;
    TableVariables.recordAction = action;

    let formHeader;
    switch (action) {
        case TableAction.Edit:
        case TableAction.Delete:
        case TableAction.Recover: formHeader = `${TableFormConfirmHeader.Text(action)} запись (ID: ${record.id}) - ${tableName}`; break;
        case TableAction.Insert: formHeader = `${TableFormConfirmHeader.Text(action)} запись - ${tableName}`; break;
    }
    
    // Устанавливаем заголовок модального окна
    document.getElementById('editRecordModalTitle').textContent = formHeader;

    // Заполняем поля формы
    switch (action) {
        case TableAction.Edit: 
        case TableAction.Delete:
        case TableAction.Recover: await populateEditForm(record, tableName, action); break;
        case TableAction.Insert: await populateEditForm(null, tableName, action); break;   
    }
    
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

// ПОИСК ПО ID
function searchById() {
    const searchInput = document.getElementById('searchById');
    const searchId = parseInt(searchInput.value);
    
    if (!TableVariables.tableData) {
        MessageBox.ShowFromCenter('Выберите таблицу для поиска', 'red');
        return;
    } else if (searchId < 0) {
        MessageBox.ShowFromCenter('Введите корректный ID');
        return;
    }
    
    changesearchId(searchId);
    
    // Ищем запись по ID во всех данных
    const foundRecords = TableVariables.tableData.find(record => record.id === searchId);
    
    if (foundRecords) {
        // Показываем только найденную запись
        displaySearchResults([foundRecords]);
        showSearchInfo();
    } else {
        MessageBox.ShowFromCenter(`Искомая(-ые) сущность(-и) не найдена(-ы)`, 'red');
        return;
    }
    
    // Показываем кнопку очистки
    document.getElementById('clearSearchBtn').style.display = 'inline-block';
    document.getElementById('dataPagination').style.display = 'none';
}

// ДАЛЕЕ ИДУТ СЛУЖЕБНЫЕ ФУНКЦИИ ДЛЯ ВАЛИДАЦИИ И РАБОТЫ С ДАННЫМИ

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
export function isFieldRequired(fieldName, tableName) {
    const optionalFields = ['note', 'whoChanged', 'whenChanged'];
    return !optionalFields.includes(fieldName);
}

export function getMinValue(fieldName) {
    const minValues = {
        'distance': 1,
        'movePrice': 0,
        'idlePrice': 0,
        'registrationCode': 1,
        'releaseYear': 1886
    };
    return minValues[fieldName] || '';
}

export function getMaxValue(fieldName) {
    const maxValues = {
        'registrationCode': 999,
        'releaseYear': new Date().getFullYear()
    };
    return maxValues[fieldName] || '';
}

// Преобразование типов данных
function convertValueType(value, fieldType, key = null) {
    if (value === '' || value === null) return null;
    
    switch (fieldType) {
        case 'number':
            return Number(value);
        case 'boolean':
            return Boolean(value);
        case 'date':
            return new Date(value).toISOString();
        case 'id':
            const input = document.getElementById(`edit_${key}`);
            if (input.getAttribute('valid') === 'false') {
                throw new Error(`Введено некорректное значение в поле \"${document.getElementById(`label_${key}`).textContent}\"`);
            }

            const firstBrace = value.indexOf('(');
            const secondBrace = value.indexOf(')');
            return Number(value.substring(firstBrace + 1, secondBrace));
        default:
            return String(value);
    }
}