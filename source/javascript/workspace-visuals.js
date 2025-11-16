import { switchTab } from "./admin-panel.js";
import { getUserRights, UserRights } from "./cookie.js";
import { getCurrentPageData } from "./database-general-service.js";
import { clearSearch, displayTableData, hideTableInterface } from "./database-visuals.js";
import { SectionName } from "./form-utils.js";
import { initStatisticsSection } from "./statistics.js";
import { TableVariables } from "./table-utils.js";

window.showNavigationMenu = showNavigationMenu;
window.hideNavigationMenu = hideNavigationMenu;
window.showSection = showSection;
window.showAuthorizeForm = showAuthorizeForm;
window.showRegisterForm = showRegisterForm;

// Визуальные функции

function showNavigationMenu() {
    const leftDropDown = document.querySelector('.left-dropdown');
    console.log('Opening menu');
    leftDropDown.classList.add('open');
}

function hideNavigationMenu() {
    const leftDropDown = document.querySelector('.left-dropdown');
    console.log('Closing menu');
    leftDropDown.classList.remove('open');
}

// Функция для переключения между разделами
async function showSection(sectionName = null, isLoadListener = false) {
    if (isLoadListener) {
        return;
    }

    if (sectionName !== 'main') {
        const rightPos = document.getElementById('menuLeftDropDown').offsetWidth + 10; // отступ по левому краю в пикселя для messageBox


        // Получаем из куки роль пользователя для ограничения доступа и его срок жизни
        const userRights = getUserRights();

        // Ограничение на переход в области для пользователя
        if ((userRights === UserRights.Basic || userRights === UserRights.Editor) && (sectionName === 'statistics' || sectionName === 'admin-panel')) {
            messageBoxShowFromLeft('У вашего аккаунта отсутствуют права на переход в выбранную секцию. Для разрешения проблемы обратитесь к системному администратору',
                'red', true, rightPos, 'translateY(50px)');
            return;
        } else if (userRights === UserRights.Director && (sectionName === 'database' || sectionName === 'statstics' || sectionName === 'admin-panel')) {
            messageBoxShowFromLeft('У вашего аккаунта отсутствуют права на переход в выбранную секцию. Для разрешения проблемы обратитесь к системному администратору',
                'red', true, rightPos, 'translateY(50px)');
            return;
        }
    }

    // Скрываем все разделы
    const sections = document.querySelectorAll('.main, .database, .statistics, .admin-panel');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });
    
    // Показываем выбранный раздел
    if (sectionName === null) {
        const headerText = document.getElementById('header-text');
        sectionName = SectionName.getViewName(headerText.textContent);
    }

    const activeSection = document.querySelector(`.${sectionName}`);
    if (activeSection) {
        activeSection.style.display = 'block';
        activeSection.classList.add('active-section');

        // Сменяем название заголовка и его иконку рядом с панелью навигации
        const headerText = document.getElementById('header-text');
        headerText.textContent = SectionName.getCodeName(sectionName);

        const headerIcon = document.getElementById('page-icon');

        if (sectionName === SectionName.MAIN[1]) {
            headerIcon.src = 'assets/icons/main-page.svg';
        } else if (sectionName === SectionName.DATABASE[1]) {
            headerIcon.src = 'assets/icons/database-page.svg';

            // Выпадающий список
            const tableSelect = document.getElementById('tableSelect');
            tableSelect.value = '';

            // Скрываем пока что бесполезные компоненты
            document.getElementById('dataTable').style.display = 'none';
            document.getElementById('addRecordBtn').style.display = 'none';
            for (const e of document.getElementsByClassName('search-controls')) {
                e.style.display = 'none';
            }
            
            TableVariables.tableData = null;
            TableVariables.tableCodeName = null;
            TableVariables.tableRUName = null;
            TableVariables.recordAction = null;
            TableVariables.record = null;

            

            clearSearch('dataPagination', 'dataTable', 'dataTableHead', 'dataTableHead', 'dataInfo');
            hideTableInterface();
        } else if (sectionName === SectionName.STATISTICS[1]) {
            headerIcon.src = 'assets/icons/statistics-page.svg';
            initStatisticsSection();
        } else if (sectionName === SectionName.ADMIN_PANEL[1]) {
            headerIcon.src = 'assets/icons/admin-panel.svg';
            await switchTab('Учетные записи');
            hideTableInterface();
        }
    }
    
    // Закрываем меню навигации
    hideNavigationMenu();
}

// Отображение таблиц при успешной загрузке
export function showTableData(paginationID, tableID, tableHeadID, tableBodyID, tableInfoID, data = null) {
    displayTableData(getCurrentPageData(data), paginationID, tableID, tableHeadID, tableBodyID, tableInfoID, 
        TableVariables.tableRUName, TableVariables.tableCodeName);
}

// Перемещение для входа в систему
function showAuthorizeForm() {
    window.location.href = '/authorize-form/authorize.html#authorize';
}

function showRegisterForm() {
    setTimeout(() => {
        window.location.href = '/authorize-form/authorize.html#register';
    }, 1000);   
}

/* Инициализация формы проверяет авторизацию пользователя */

document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('load', function() {
        // Компоненты, стиль которых меняется в зависимости от свежести токена
        const authorizeItem = this.document.getElementById('authorizeItem');
        const registerItem = this.document.getElementById('registerItem');
        const quitItem = this.document.getElementById('quitItem');
         
        if (authorizeItem && registerItem && quitItem) {
            authorizeItem.style.display = 'none';
            registerItem.style.display = 'none';
            quitItem.style.display = 'block';
        }
        
    });
});

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // По умолчанию отображаем главную страницу
    showSection('main', true);
    
    // Обработчик для кнопки меню
    const menuButton = document.getElementById('menu-nav-image');
    if (menuButton)
        menuButton.addEventListener('click', function(e) {
            e.preventDefault();
            showNavigationMenu();
        });
    
    // Обработчик для кнопки закрытия
    const closeButton = document.getElementById('menu-nav-cancel-icon');
    if (closeButton)
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Close button clicked');
            hideNavigationMenu();
        });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(event) {
        const leftDropDown = document.querySelector('.left-dropdown');
        const menuButton = document.getElementById('menu-nav-image');
        const closeButton = document.getElementById('menu-nav-cancel-icon');
        
        if (leftDropDown && leftDropDown.classList.contains('open')) {
            if (!leftDropDown.contains(event.target) && 
                !menuButton.contains(event.target) && 
                !closeButton.contains(event.target)) {
                console.log('Closing menu by outside click');
                hideNavigationMenu();
            }
        }
    });
});