import { TableCache } from "./table-cache.js";

export const DATA_PER_PAGE = 20; // Число строк на каждой странице - пагинация

// Словарь для доступа к API
export var tableMap = new Map();

const ORDER = 'Order';
const CUSTOMER = 'Customer';
const ROUTE = 'Route';
const RATE = 'Rate';
const DRIVER = 'Driver';
const TRANSPORT_VEHICLE = 'TransportVehicle';
const CREDENTIAL = 'Credential'
const ROLE = 'Role';

tableMap.set('Заказы', ORDER)
    .set('Заказчики', CUSTOMER)
    .set('Маршруты', ROUTE)
    .set('Тарифы', RATE)
    .set('Шоферы', DRIVER)
    .set('Транспортные средства', TRANSPORT_VEHICLE)
    .set('Учетные записи', CREDENTIAL)
    .set('Роли', ROLE);

// Маппинг русских названий для полей
export const fieldNameMapping = {
    'id': 'ID',
    'customerId': 'ID заказчика',
    'routeId': 'ID маршрута',
    'rateId': 'ID тарифа',
    'driverId': 'ID шофера',
    'vehicleId': 'ID транспортного средства',
    'forename': 'Имя',
    'surname': 'Фамилия',
    'phoneNumber': 'Номер телефона',
    'boardingAddress': 'Адрес посадки',
    'dropAddress': 'Адрес высадки',
    'driverLicenceSeries': 'Серия водительских прав',
    'driverLicenceNumber': 'Номер водительских прав',
    'number': 'Номер',
    'series': 'Серия',
    'registrationCode': 'Код регистрации',
    'model': 'Модель',
    'color': 'Цвет',
    'releaseYear': 'Год выпуска',
    'movePrice': 'Цена в пути',
    'idlePrice': 'Цена в простое',
    'username': 'Имя пользователя',
    'email': 'Email',
    'whoAdded': 'Кто добавил',
    'whenAdded': 'Когда добавил',
    'whoChanged': 'Кто изменил',
    'whenChanged': 'Когда изменил',
    'note': 'Примечание',
    'isDeleted': 'Удален',
    'distance': 'Расстояние',
    'transportVehicleId': 'ID транспортного средства',
    'roleId': 'ID роли',
    'password': 'Пароль',
    'rights': 'Права',
    'canGet': 'GET',
    'canPost': 'POST',
    'canUpdate': 'UPDATE',
    'canDelete': 'DELETE',
};


export class TableAction {
    static TABLE_EDIT = 0;
    static TABLE_INSERT = 1;
    static TABLE_DELETE = 2;
    static TABLE_RECOVER = 3;

    static get Edit() {return this.TABLE_EDIT;}
    static get Insert() {return this.TABLE_INSERT;}
    static get Delete() {return this.TABLE_DELETE;}
    static get Recover() {return this.TABLE_RECOVER;}
}

export const dbCache = new TableCache();

// Двунаправленный словарь: наименование таблицы для пользователя <-> наименование в коде

export class TableName {
    static ORDER = ['Заказы', 'data']
    static CUSTOMER = ['Заказчики', 'data']
    static RATE = ['Тарифы', 'data']
    static ROUTE = ['Маршруты', 'data']
    static DRIVER = ['Водители', 'data']
    static TRANPSORT_VEHICLE = ['Транспортные средства', 'data']
    static CREDENTIAL = ['Учетные записи', 'users'];
    static ROLE = ['Роли', 'roles'];
    static TAXI = ['БД такси', 'taxi'];

    static getViewName(divTableID) {
        const fields = Object.values(TableName); // константые поля класса

        const foundField = fields.find(field => Array.isArray(field) && field[1] === divTableID);

        return foundField ? foundField[0] : null;
    }

    static getCodeName(tableName) {
        const fields = Object.values(TableName); // константые поля класса

        const foundField = fields.find(field => Array.isArray(field) && field[0] === tableName);

        return foundField ? foundField[1] : null;
    }
}

// Некоторые таблицы при запросе GetAll требуют отдельного пути к api. (Есть поля, ведующие в другие таблицы)
export class TableGETSpecial {
    static getAllApiString(table) {
        switch (table) {
            case ORDER:
            case CREDENTIAL:
            case TRANSPORT_VEHICLE:
                return `${table}/merge`;
            case CUSTOMER:
            case ROUTE:
            case RATE:
            case DRIVER:
            case ROLE:
                return table;
            default:
                return '';
        }
    }

    static getByIdApiString(table, id) {
        switch (table) {
            case ORDER:
            case CREDENTIAL:
            case TRANSPORT_VEHICLE:
                return `${table}/${id}/merge`;
            case CUSTOMER:
            case ROUTE:
            case RATE:
            case DRIVER:
            case ROLE:
                return `${table}/${id}`;
            default:
                return '';
        }
    }
}

// Класс, управляющий значениями переменных для текущей рассматриваемой таблицы
export class TableVariables {
    static _searchId = null; // текущая запись, подлежащая поиску
    static _searchResults = null; // все поисковые записи
    static _record = null; // текущая запись, с коротой производятся действия
    static _recordAction = null; // тип операции, применяемый к текущей записи

    static _tableData = []; // данные таблицы
    static _tableRUName = ''; // название таблицы для пользователя
    static _tableCodeName = ''; // идентификатор таблицы в коде

    static _dataPage = 1; // текущая отображаемая страницы - пагинация

    static get searchId() {return this._searchId;}
    static set searchId(id) { 
        if (id && id >= 0)
            this._searchId = id;
        else
            this._searchId = null;
    }

    static get record() {return this._record;}
    static set record(value) {this._record = value;}

    static get recordAction() {return this._recordAction;}
    static set recordAction(value) {
        const actions = Object.values(TableAction);

        const foundAction = actions.find(action => action === value);

        this._recordAction = foundAction !== null && foundAction !== undefined ? foundAction : null;
    }

    static get tableData() {return this._tableData;}
    static set tableData(data) {
        this._tableData = Array.isArray(data) ? data : null;
    }

    static get dataPage() {return this._dataPage;}
    static set dataPage(page) {
        this._dataPage = page && page > 0 ? page : null; 
    }

    static get tableRUName() {return this._tableRUName;}
    static set tableRUName(name) {
        this._tableRUName = name; 
    }

    static get tableCodeName() {return this._tableCodeName;}
    static set tableCodeName(name) {
        this._tableCodeName = name; 
    }

    static get searchResults() {return this._searchResults;}
    static set searchResults(results) {
        this._searchResults = results; 
    }
}