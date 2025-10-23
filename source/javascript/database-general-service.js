import { getUserRights } from "./cookie.js";

export {getUserRights, checkDatabaseAccess, getCurrentPageData, formatValue, getCellClassName};

function checkDatabaseAccess() {
    const userRights = getUserRights(); // Функция должна быть реализована
    const actionButtons = document.getElementById('dbActionButtons');
    
    if (userRights >= 1) { // Права редактора или админа
        actionButtons.style.display = 'flex';
    } else {
        actionButtons.style.display = 'none';
    }
}

// Получение данных для текущей страницы
function getCurrentPageData() {
    if (!allTableData || allTableData.length === 0) return [];
    
    const startIndex = (currentDataPage - 1) * DATA_PER_PAGE;
    const endIndex = startIndex + DATA_PER_PAGE;
    return allTableData.slice(startIndex, endIndex);
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