export class ApiService {

    static BASE_API_URL = 'http://localhost:5091/api';

    /**
     * Универсальный метод для выполнения API запросов
     * @param {string} path - путь API
     * @param {string} methodType - HTTP метод (GET, POST, PUT, DELETE, etc.)
     * @param {object} requestBody - тело запроса (для POST, PUT)
     * @param {object} additionalHeaders - дополнительные заголовки
     * @returns {Promise<any>} - результат запроса
     * @throws {Error} - исключение в случае ошибки
     */
    static async apiCall(path, methodType = 'GET', requestBody = null, additionalHeaders = {}, isCheckingAuthorization = false) {
        const config = {
            method: methodType,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...additionalHeaders
            }
        };

        if (requestBody && ['POST', 'PUT', 'PATCH'].includes(methodType.toUpperCase())) {
            config.body = JSON.stringify(requestBody);
        }

        try {
            const response = await fetch(`${this.BASE_API_URL}/${path}`, config);

            console.log(response);

            if (isCheckingAuthorization && !response.ok && response.status === 401) {
                let errorMessage = response.text(); /*`HTTP ошибка! Статус: ${response.status}`*/;
                throw new ApiError(errorMessage, response.status, null);
            }
            
            if (!response.ok) {
                // Пытаемся получить детальную информацию об ошибке из response
                let errorData = await response.json();
                let errorMessage = errorData.message;
                
                throw new ApiError(errorMessage, response.status, errorData);
            }
            
            return await response.json();
            
        } catch (error) {
            // Если это уже наша кастомная ошибка - просто пробрасываем дальше
            if (error instanceof ApiError) {
                throw error;
            }

            throw error;
        }
    }

    // Вспомогательные методы для конкретных HTTP методов
    static async get(path, additionalHeaders = {}, isCheckingAuthorization = false) {
        return this.apiCall(path, 'GET', null, additionalHeaders, isCheckingAuthorization);
    }

    static async post(path, body, additionalHeaders = {}) {
        return this.apiCall(path, 'POST', body, additionalHeaders);
    }

    static async put(path, body, additionalHeaders = {}) {
        return this.apiCall(path, 'PUT', body, additionalHeaders);
    }

    static async delete(path, additionalHeaders = {}) {
        return this.apiCall(path, 'DELETE', null, additionalHeaders);
    }

    static async patch(path, additionalHeaders = {}) {
        return this.apiCall(path, 'PATCH', null, additionalHeaders);
    }

    static getStatisticsPath(structValue, categoryValue, timeIntervalParam, yearStartValue, yearEndValue, boolParam = null, boolValue = null) {
        let url = 
        `Statistics/${structValue}/${categoryValue}/${timeIntervalParam}?yearStart=${yearStartValue}&yearEnd=${yearEndValue}`;
        if (boolParam)
            url += `&isPopular=${boolValue}`;
        return url;       
    }
}

// Внутренний класс (не экспортируется)
class ApiError extends Error {
    constructor(message, status, data, originalError = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
    
    toString() {
        return `ApiError: ${this.message} (Status: ${this.status})`;
    }
}