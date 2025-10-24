import { getToken, getUserName } from "./cookie.js";
import { fetchTableData, populateEditForm, currentEditingRecord, changeCurrentSearchId, allTableData, 
    changeCurrentDataPage, changeCurrentEditingRecord, detectFieldType, tableMap, dbCache } from "./database-form-service.js";
import { displaySearchResults, showSearchInfo } from "./database-visuals.js";
import { messageBoxShow } from "./index.js";
import { BASE_API_URL } from "./api.js";

export {editRecord, isFieldRequired, getMinValue, getMaxValue};

// Заглушки для остальных функций
window.showAddRecordForm = function showAddRecordForm() {
    messageBoxShow('Функция добавления записи в разработке', 'blue');
}

// Обновление записи
window.updateRecord = async function updateRecord(event) {
    event.preventDefault();
    
    if (!currentEditingRecord) {
        messageBoxShow('Ошибка: запись для редактирования не найдена', 'red', 0, 'translateY(50px)');
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
                messageBoxShow('Некорректный формат номера телефона. Используйте формат: +7XXXXXXXXXX', 'red', 0, 'translateY(50px)');
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
    updatedData.whoChanged = getUserName();
    updatedData.whenChanged = new Date().toISOString();
    
    try {
        const token = getToken();
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

        // Инвалидируем кэш после успешного обновления
        dbCache.onDataChanged(tableSelect.options[tableSelect.selectedIndex].text, 'update');
        
        messageBoxShow('Запись успешно обновлена', '#4CAF50', 0, 'translateY(50px)');
        closeEditRecordModal();
        
        // Обновляем данные таблицы
        await fetchTableData();
        
    } catch (error) {
        console.error('Error updating record:', error);
        messageBoxShow(error.message, 'red', 0, 'translateY(50px)');
    }
}

// Функция редактирования записи
function editRecord(record) {
    changeCurrentEditingRecord(record);
    
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

window.confirmDeleteRecord = function confirmDeleteRecord(record) {
    messageBoxShow(`Удаление записи ID: ${record.id} в разработке`, 'blue');
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