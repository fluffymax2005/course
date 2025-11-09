import { TableCache } from "./table-cache.js";

export const DATA_PER_PAGE = 20; // Число строк на каждой странице - пагинация

// Словарь для доступа к API
export var tableMap = new Map();

tableMap.set('Заказы', 'Order')
    .set('Заказчики', 'Customer')
    .set('Маршруты', 'Route')
    .set('Тарифы', 'Rate')
    .set('Шоферы', 'Driver')
    .set('Транспортные средства', 'TransportVehicle')
    .set('Учетные записи', 'Credential')
    .set('Роли', 'Role');

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