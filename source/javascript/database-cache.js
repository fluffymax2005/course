export {DatabaseCache};

// Кэширование данных при запросе из БД. Срок службы - 10 минут
class DatabaseCache {
    constructor() {
        this.cacheKey = 'db_cache_';
        this.cacheDuration = 10 * 60 * 1000; // 10 минут
    }

    // Сохраняем данные в кэш
    set(tableName, data) {
        const cacheData = {
            data: data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.cacheDuration
        };
        localStorage.setItem(this.cacheKey + tableName, JSON.stringify(cacheData));
    }

    // Получаем данные из кэша
    get(tableName) {
        const cached = localStorage.getItem(this.cacheKey + tableName);
        if (!cached) return null;

        const cacheData = JSON.parse(cached);
        
        // Проверяем не устарели ли данные
        if (Date.now() > cacheData.expiresAt) {
            this.clear(tableName);
            return null;
        }

        return cacheData.data;
    }

    // Очищаем кэш для конкретной таблицы
    clear(tableName) {
        localStorage.removeItem(this.cacheKey + tableName);
    }

    // Очищаем весь кэш
    clearAll() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.cacheKey))
            .forEach(key => localStorage.removeItem(key));
    }

     // Инвалидируем кэш при изменении данных
    onDataChanged(tableName) {      
        // Очищаем кэш измененной таблицы
        this.clear(tableName);
    }
}