/* Служебные функции для куки */

export {getCookie, setCookie, deleteCookie, getUserRights, getToken, getTokenExpireTime, getUserName};

function getCookie(name) {
    return localStorage.getItem(name);
}

function setCookie(name, value, options = {}) {
    localStorage.setItem(name, value);
}

function deleteCookie(name) {
    localStorage.removeItem(name);
}


function getUserRights() {
    return parseInt(getCookie('userRights'));
}

function getToken() {
    return getCookie('token');
}

function getTokenExpireTime() {
    return getCookie('tokenExpireTime');
}

function getUserName() {
    return getCookie('userName');
}