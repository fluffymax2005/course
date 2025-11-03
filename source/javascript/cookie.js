/* Служебные функции для куки */

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