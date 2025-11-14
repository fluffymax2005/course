import { getUserRights, UserRights } from "./cookie.js";
import { TableVariables } from "./table-service.js";
import { DATA_PER_PAGE } from "./table-utils.js";

export function checkDatabaseAccess() {
    const userRights = getUserRights(); // Функция должна быть реализована
    const actionButtons = document.getElementById('dbActionButtons');
    
    switch (userRights) {
        case UserRights.Basic:
        case UserRights.Director:
            actionButtons.style.display = 'none';
            break;
        default:
            actionButtons.style.display = 'flex';
            for (const e of document.getElementsByClassName('search-controls')) {
                e.style.display = 'flex';
            }
    }
}

// Получение данных для текущей страницы
export function getCurrentPageData(data = null) {
    let dataCopy = null;

    if (!data && (!TableVariables.tableData || TableVariables.tableData.length === 0)) return [];
    else if (data) dataCopy = data;
    else dataCopy = TableVariables.tableData;
    


    const startIndex = (TableVariables.dataPage - 1) * DATA_PER_PAGE;
    const endIndex = startIndex + DATA_PER_PAGE;
    return dataCopy.slice(startIndex, endIndex);
}

export function formatValue(value, type) {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
        case 'date':
            try {
                const date = new Date(value);
                
                let dateString = '';
                dateString += date.getDate() <= 9 ? `0${date.getDate()}.` : `${date.getDate()}.`; // номер дня
                dateString += date.getMonth() <= 8 ? `0${date.getMonth() + 1}.` : `${date.getMonth() + 1}.`; // номер месяца
                dateString += `${date.getFullYear()} `; // номер года

                dateString += date.getHours() <= 9 ? `0${date.getHours()}:` : `${date.getHours()}:`; // номер часа
                dateString += date.getMinutes() <= 9 ? `0${date.getMinutes()}:` : `${date.getMinutes()}:`; // номер минут
                dateString += date.getSeconds() <= 9 ? `0${date.getSeconds()}` : `${date.getSeconds()}`; // номер секунд
                
                return dateString;
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

export function getCellClassName(type, value) {
    switch (type) {
        case 'boolean':
            return value ? 'status-active' : 'status-inactive';
        case 'number':
            //if (value < 0) return 'amount-negative';
            //if (value > 0) return 'amount-positive';
            return 'text';
        case 'date':
            return 'date-cell';
        default:
            return '';
    }
}