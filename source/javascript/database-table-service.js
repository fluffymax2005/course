import { getToken, getUserName, getUserRights, setTableHash, UserRights } from "./cookie.js";
import { populateEditForm, currentRecord, changeCurrentSearchId, allTableData, detectFieldType, tableMap, changeCurrentRecord, currentRecordAction, TableFormConfirmButton } from "./database-form-service.js";
import { displaySearchResults, displayTableData, showSearchInfo } from "./database-visuals.js";
import { messageBoxShowFromLeft } from "./index.js";
import { ApiService } from "./api.js";
import { getCurrentPageData } from "./database-general-service.js";

const TABLE_EDIT = 0;
const TABLE_INSERT = 1;
const TABLE_DELETE = 2;
const TABLE_RECOVER = 3;

export class TableAction {
    static get Edit() {return TABLE_EDIT;}
    static get Insert() {return TABLE_INSERT;}
    static get Delete() {return TABLE_DELETE;}
    static get Recover() {return TABLE_RECOVER;}
}

// Отобразить форму добавления новой записи
window.showAddRecordForm = function showAddRecordForm() {
    TableModifying(null, TableAction.Insert);
}

// Обновление записи
window.recordAction = async function recordAction(event) {
    event.preventDefault();

    // Задаем тип действия
    let action = currentRecordAction;
    
    const formData = new FormData(event.target);
    const body = {};

    // Копируем все наименования ключей.
    // 1. Добавление записей - копирование ключей первой входящей записи
    // 2. Редактирование записей - копирование ключей текущей записи
    // 3. Удаление записей - копирование ключей текущей записи
    let localRecord;
    if (action === TableAction.Insert) { // Добавление
        localRecord = allTableData[0];
    } else {
        localRecord = currentRecord;
    }

    let recordIndex = allTableData.indexOf(localRecord); // индекс записи
    
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
                messageBoxShow('Некорректный формат номера телефона. Используйте формат: +7XXXXXXXXXX', 'red', 0, 'translateY(50px)');
                return;
            }
            // Форматируем номер перед сохранением
            value = getFormattedPhoneValue(value);
        }
        
        // Преобразуем типы данных и обновляем значение
        const fieldType = detectFieldType(key, localRecord[key]);
        body[key] = convertValueType(value, fieldType);
    }
    
    // Обновляем служебные поля
    switch (action) {
        case TableAction.Insert:
            body.id = '0';
            body.whoAdded = getUserName();
            body.whenAdded = new Date().toISOString();
            break;
        case TableAction.Edit:
            body.whoChanged = getUserName();
            body.whenChanged = new Date().toISOString();
            break;
        case TableAction.Delete: {
            body.whoChanged = getUserName();

            const time = new Date().toISOString();
            body.whenChanged = time;
            body.isDeleted = time;
            break;
        }
        case TableAction.Recover: {
            body.whoChanged = getUserName();
            body.whenChanged = new Date().toISOString();
            body.isDeleted = null;
            break;
        }
    }
    
    try {
        const token = getToken();
        const tableSelect = document.getElementById('tableSelect');
        const apiTableName = tableMap.get(tableSelect.options[tableSelect.selectedIndex].text);

        let data;
        let hash;
        
        switch (action) {
            case TableAction.Insert:
                data = await ApiService.post(`${apiTableName}`, body, {
                    'Authorization': `Bearer ${token}`
                });

                // Добавление в конец новой записи
                const newSet = await ApiService.get(`${apiTableName}`, {
                    'Authorization': `Bearer ${token}`
                });

                allTableData.push(newSet);

                break;
            case TableAction.Edit: {
                data = await ApiService.put(`${apiTableName}/${currentRecord.id}`, body, {
                    'Authorization': `Bearer ${token}`
                });

                hash = data.hash;

                // Обновление текущей записи на актуальную
                const updatedSet = await ApiService.get(`${apiTableName}/${currentRecord.id}`, {
                    'Authorization': `Bearer ${token}`
                });

                allTableData[recordIndex] = updatedSet;

                hash = updatedSet.hash;

                break;
            }
                
            case TableAction.Delete: {
                data = await ApiService.delete(`${apiTableName}/${currentRecord.id}`, {
                    'Authorization': `Bearer ${token}`
                });

                // В случае, если пользователь не админ и произведено удаление, то надо удалить из памяти запись
                const userRights = getUserRights();
                if (userRights !== UserRights.Admin) {
                    allTableData.splice(recordIndex);
                } else {
                    // Если пользователь админ, то нужно получить свежую запись
                    const updatedSet = await ApiService.get(`${apiTableName}/${currentRecord.id}`, {
                        'Authorization': `Bearer ${token}`
                    });

                    allTableData[recordIndex] = updatedSet;
                }

                hash = data.hash;

                break;
            }
                
            case TableAction.Recover:
                data = await ApiService.patch(`${apiTableName}/${currentRecord.id}/recover`, {
                    'Authorization': `Bearer ${token}`
                });

                hash = data.hash;

                // Обновление текущей записи на актуальную
                const updatedSet = await ApiService.get(`${apiTableName}/${currentRecord.id}`, {
                    'Authorization': `Bearer ${token}`
                });

                allTableData[recordIndex] = updatedSet;

                hash = updatedSet.hash;

                break;
        }

        // Запись нового хэша состояния таблицы
        const tableName = tableSelect.options[tableSelect.selectedIndex].text;
        setTableHash(tableName, hash);

        messageBoxShowFromLeft('Операция успешна завершена', 'green', false, '40', 'translateY(50px)');
    } catch (error) {
        if (action === TableAction.Insert && error.status === 400) {
            messageBoxShowFromLeft(`Введены некорректные данные. Проверьте содержимое и повторите попытку снова.`, 'red', false, '40', 'translateY(50px)');
        } else {
            messageBoxShowFromLeft(`Ошибка: ${error.data.message}`, 'red', false, '40', 'translateY(50px)');
        }
        
        console.error(error);
        return;
    }

    displayTableData(getCurrentPageData()); // обновляем отображение страницы
}

// Функция редактирования записи
export function TableModifying(record, action) {
    changeCurrentRecord(record, action);
    
    // Получаем название таблицы
    const tableSelect = document.getElementById('tableSelect');
    const tableName = tableSelect.options[tableSelect.selectedIndex].text;

    let formHeader;
    switch (action) {
        case TableAction.Edit:
        case TableAction.Delete:
        case TableAction.Recover: formHeader = `${TableFormConfirmButton.Text(action)} запись (ID: ${record.id}) - ${tableName}`; break;
        case TableAction.Insert: formHeader = `${TableFormConfirmButton.Text(action)} запись - ${tableName}`; break;
    }
    
    // Устанавливаем заголовок модального окна
    document.getElementById('editRecordModalTitle').textContent = formHeader;

    // Заполняем поля формы
    switch (action) {
        case TableAction.Edit: 
        case TableAction.Delete:
        case TableAction.Recover: populateEditForm(record, tableName, action); break;
        case TableAction.Insert: populateEditForm(null, tableName, action); break;   
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
window.searchById = function searchById() {
    const searchInput = document.getElementById('searchById');
    const searchId = parseInt(searchInput.value);
    
    if (!searchId || searchId <= 0) {
        messageBoxShow('Введите корректный ID', 'red');
        return;
    }
    
    changeCurrentSearchId(searchId);
    
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