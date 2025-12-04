import { getEmail, getTokenExpireTime, getUserName, getUserRights, UserRights } from "./cookie.js";
import { formatValue } from "./database-general-service.js";


export function showUserInfoSection() {
    const table = document.querySelector('#userInfoTable'); // таблица, данные для которой заполняем
    const tBody = table.querySelector('#userInfoTableBody'); // тело таблицы

    tBody.innerHTML = '';

    // Имя пользователя
    const nameRow = document.createElement('tr');
    nameRow.style.textAlign = 'center';
    const nameKeyTd = document.createElement('td')
    nameKeyTd.textContent = 'Имя';
    nameKeyTd.style.textAlign = 'center';

    const nameValueTd = document.createElement('td')
    nameValueTd.textContent = getUserName();
    nameValueTd.style.textAlign = 'center';

    nameRow.appendChild(nameKeyTd);
    nameRow.appendChild(nameValueTd);

    tBody.appendChild(nameRow);

    // Электронная почта пользователя
    const emailRow = document.createElement('tr');
    emailRow.style.textAlign = 'center';
    const emailKeyTd = document.createElement('td')
    emailKeyTd.textContent = 'Электронная почта';
    emailKeyTd.style.textAlign = 'center';

    const emailValueTd = document.createElement('td')
    emailValueTd.textContent = getEmail();
    emailValueTd.style.textAlign = 'center';

    emailRow.appendChild(emailKeyTd);
    emailRow.appendChild(emailValueTd);

    tBody.appendChild(emailRow);

    // Права пользователя
    const rightsRow = document.createElement('tr');
    const rightsKeyTd = document.createElement('td');
    rightsKeyTd.textContent = 'Права';
    rightsKeyTd.style.textAlign = 'center';

    const rightsValueTd = document.createElement('td');
    let rightsString = '';
    switch (getUserRights()) {
        case UserRights.Admin: rightsString = 'Администратор'; break;
        case UserRights.Basic: rightsString = 'Базовый пользователь'; break;
        case UserRights.Director: rightsString = 'Директор'; break;
        case UserRights.Editor: rightsString = 'Редактор'; break;
    }
    
    rightsValueTd.textContent = rightsString;
    rightsValueTd.style.textAlign = 'center';

    rightsRow.appendChild(rightsKeyTd);
    rightsRow.appendChild(rightsValueTd);

    tBody.appendChild(rightsRow);

    // Срок сессии
    const sessionRow = document.createElement('tr');
    const sessionKeyTd = document.createElement('td');
    sessionKeyTd.textContent = 'Сессия актуальна до';
    sessionKeyTd.style.textAlign = 'center';

    const sessionValueTd = document.createElement('td');    
    sessionValueTd.textContent = formatValue(getTokenExpireTime(), 'date');
    sessionValueTd.style.textAlign = 'center';

    sessionRow.appendChild(sessionKeyTd);
    sessionRow.appendChild(sessionValueTd);

    tBody.appendChild(sessionRow);

    // Доступные секции
    const sectionRow = document.createElement('tr');
    const sectionKeyTd = document.createElement('td');
    sectionKeyTd.textContent = 'Доступные секции';
    sectionKeyTd.style.textAlign = 'center';

    const sectionValueTd = document.createElement('td');
    let sectionString = '';
    switch (getUserRights()) {
        case UserRights.Admin: sectionString = '\"Главная\", \"База данных\", \"Статистика\", \"Панель администратора\", \"Профиль\"'; break;
        case UserRights.Basic: sectionString = '\"Главная\", \"База данных\", \"Профиль\"'; break;
        case UserRights.Director: sectionString = '\"Главная\", \"Статистика\", \"Профиль\"'; break;
        case UserRights.Editor: sectionString = '\"Главная\", \"База данных\", \"Профиль\"'; break;
    }

    sectionValueTd.textContent = sectionString;
    sectionValueTd.style.textAlign = 'center';

    sectionRow.appendChild(sectionKeyTd);
    sectionRow.appendChild(sectionValueTd);

    tBody.appendChild(sectionRow);
}