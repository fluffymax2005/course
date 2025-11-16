
window.displayStruct = displayStruct;

// Инициализация при переходе в данную секцию
export function initStatisticsSection() {
    // Сброс поля выбора типа статистики
    document.getElementById('structSelect').selectedIndex = 0;
    
    // Отключаем все все структуры
    document.querySelectorAll(`.struct`).forEach(
        s => s.classList.remove('active'));

    // Сбрасываем все значения input и select
    document.querySelectorAll('.statistics-container input').forEach(i => i.value = '');
    document.querySelectorAll('.statistics-container select').forEach(s => s.selectedIndex = 0);
}

function displayStruct() {
    const structSelect = document.getElementById('structSelect');
    const text = structSelect.options[structSelect.selectedIndex].value;


    // Отключаем все все структуры
    document.querySelectorAll(`.struct`).forEach(
        s => s.classList.remove('active'));

    if (text !== '') {
        // Активируем нужную
        document.getElementById(`${text}Struct`).classList.add('active');
    }
    
}