/* Служебные функции для куки */

const BASIC = 0;
const EDITOR = 1;
const ADMIN = 2;
const DIRECTOR = 3;

export class UserRights {
    static get Basic() {return BASIC};
    static get Editor() {return EDITOR};  
    static get Admin() {return ADMIN};  
    static get Director() {return DIRECTOR};  
}

export function getCookie(name) {
    return localStorage.getItem(name);
}

export function setCookie(name, value, options = {}) {
    localStorage.setItem(name, value);
}

export function deleteCookie(name) {
    localStorage.removeItem(name);
}

export function deleteUserData() {
    // Замена старых куки на новые
    const cookies = ['token', 'tokenExpireTime', 'userRights', 'userName'];

    cookies.forEach(cookie => {
        localStorage.removeItem(cookie);
    });
}


export function getUserRights() {
    return parseInt(getCookie('userRights'));
}

export function getToken() {
    return getCookie('token');
}

export function getTokenExpireTime() {
    return getCookie('tokenExpireTime');
}

export function getUserName() {
    return getCookie('userName');
}

export function getTableHash(name) {
    return getCookie(`table_hash_${name}`);
}

export function setTableHash(name, hash) {
    deleteCookie(`table_hash_${name}`);
    setCookie(`table_hash_${name}`, hash)
}