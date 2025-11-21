import { ApiService } from "./api.js";
import { ChartCreation, ChartParseData, ChartVariables } from "./statistics-utils.js";
import {MessageBox} from "./form-utils.js";
import { getToken } from "./cookie.js";

window.displayStruct = displayStruct;
window.initAnalys = initAnalys;

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
    document.querySelectorAll('.display').forEach(d => d.replaceChildren());
}

function displayStruct() {
    const structSelect = document.getElementById('structSelect');
    const text = structSelect.options[structSelect.selectedIndex].value;

    // Отключаем все все структуры и убираем все графики
    document.querySelectorAll(`.struct`).forEach(
        s => s.classList.remove('active'));
    document.querySelectorAll('.display').forEach(d => d.replaceChildren());

    // Сбрасываем значения всех input в панели управления выборкой
    document.querySelectorAll('.struct input').forEach(i => i.value = '');

    ChartVariables.clearCharts();

    if (text !== '') {
        // Активируем нужную
        document.getElementById(`${text}Struct`).classList.add('active');
    }
}

async function initAnalys(event) {
    event.preventDefault();

    document.querySelectorAll('.display').forEach(d => d.replaceChildren()); // убираем графики
    ChartVariables.clearCharts(); // сбрасываем значения текущих графиков

    await fetchStatisticData();

    switch (document.getElementById('structSelect').value) {
        case ChartParseData.ORDER: fillOrderChart(); break;
        case ChartParseData.VEHICLE: fillVehicleChart(); break;  
        case ChartParseData.DRIVER: fillDriverChart(); break;
        case ChartParseData.RATE: fillRateChart(); break;  
        default: return;
    }

    MessageBox.RemoveAwait()
}

async function  fetchStatisticData() {
    const structSelect = document.getElementById('structSelect');
    const categorySelect = document.querySelector('.category-container select');
    const timeIntervalSelect = document.querySelector('.time-type-container select');
    const yearStartInput = document.querySelector('.year-start-container input');
    const yearEndInput = document.querySelector('.year-end-container input');
    const popularSelect = document.querySelector('.popular-container select');

    if (yearStartInput.value === '') {
        MessageBox.ShowFromLeft('Укажите начальный год', 'red', false, '45', 'translateY(-50px)');
        return;
    } else if (yearEndInput.value === '') {
        MessageBox.ShowFromLeft('Укажите конечный год', 'red', false, '45', 'translateY(-50px)');
        return;
    }

    // Локальный путь доступа к БД
    const path = ApiService.getStatisticsPath(
        structSelect.value,
        categorySelect.value,
        timeIntervalSelect.value,
        yearStartInput.value,
        yearEndInput.value,
        popularSelect ? popularSelect.value : null,
        popularSelect ? popularSelect.text === 'Да' ? 'true' : 'false' : null
    );
    console.log(path);

    const token = getToken();

    MessageBox.ShowAwait()
    try {
        const data = await ApiService.get(path, {
            'Authorization': `Bearer ${token}`
        });

        ChartVariables.chartParseData = data; // запоминаем данные для парсинга
    } catch (error) {
        MessageBox.RemoveAwait();
        await MessageBox.ShowFromLeft(`Ошибка: ${error.data.message}`, 'red', false, '40', 'translateY(-50px)');
        return;
    }
}

// БЛОК ФУНКЦИЙ, ЗАПОЛНЯЮЩИХ СТАТИСТИКУ
function fillOrderChart() {
    const parsedData = ChartParseData.parseOrderData(ChartVariables.chartParseData);
    
    // Удобно отображать до <MAX_CHARTS_PER_CONTAINER> параметров в одном графике
    // Если параметров больше (<MAX_CHARTS_PER_CONTAINER> - 1), то надо сделать срез данных и разделить срезы по разным графикам
    let slicedData = null; 
    if (parsedData.data.length > ChartParseData.MAX_CHARTS_PER_CONTAINER - 1) {
        
        slicedData = { labels: [], data: [] };

        // В случае, если обрабатываем кварталы, то все label'ы - номера кварталов
        if (ChartVariables.chartParseData.type === ChartParseData.QUARTER_PARSE_TYPE) {
            parsedData.labels.forEach(l => slicedData.labels.push(l));  
        }
        
        // Разбиение всех данных над подконтейнеры
        for (let i = 0; i < parsedData.data.length; i += ChartParseData.MAX_CHARTS_PER_CONTAINER) {          
            const endIndex = Math.min(i + ChartParseData.MAX_CHARTS_PER_CONTAINER, parsedData.data.length);
            slicedData.data.push(parsedData.data.slice(i, endIndex));            
        }
    }

    const displayContainer = document.getElementById(ChartCreation._getDisplayClassID('order')); 
    displayContainer.innerHTML = ''; // Сбрасываем разметку контейнера со статистикой при создании

    // Срез не требуется, а значит используется
    if (!slicedData) {
        const rowContainer = document.createElement('div');
        rowContainer.style.width = '100%';
        rowContainer.style.display = 'flex';
        rowContainer.style.marginBottom = '20px';

        const chartContainer = document.createElement('div');
        chartContainer.style.width = '100%';
        chartContainer.style.height = '500px';
        chartContainer.style.position = 'relative';
        chartContainer.style.padding = '10px';
        chartContainer.style.boxSizing = 'border-box'; 
        chartContainer.style.borderRadius = '8px';
        chartContainer.style.backgroundColor = 'white';

        const canvas = ChartCreation.createHistogram('order', parsedData.labels, parsedData.data);
        chartContainer.appendChild(canvas);
        rowContainer.appendChild(chartContainer);
        displayContainer.appendChild(rowContainer);        
    } else {        
        // Со срезом - несколько строк по 2 графика
        for (let i = 0; i < slicedData.data.length; i++) {
            const pairNumber = Math.floor(ChartVariables.chartIDCounter / 2);
            
            // Создаем контейнер для двух графиков на данной строке
            let rowContainer = null;
            rowContainer = document.createElement('div');
            rowContainer.id = `$orderPairContainer_${pairNumber}`;
            rowContainer.style.width = '100%';
            rowContainer.style.display = 'flex';
            rowContainer.style.flexWrap = 'wrap';
            rowContainer.style.justifyContent = 'space-between';
            rowContainer.style.marginBottom = '20px';
            rowContainer.style.gap = '20px';

            // Создаем графики для этой строки
            slicedData.data[i].forEach((dataset) => {
                const chartContainer = document.createElement('div');
                chartContainer.id = `$orderChartPairContainer_${pairNumber}`;
                chartContainer.style.flex = '1';
                chartContainer.style.minWidth = '45%';
                chartContainer.style.height = '500px';
                chartContainer.style.position = 'relative';
                chartContainer.style.backgroundColor = 'white';
                chartContainer.style.border = '1px solid #ddd';
                chartContainer.style.borderRadius = '8px';
                chartContainer.style.padding = '10px'; 
                chartContainer.style.boxSizing = 'border-box';

                const canvas = ChartCreation.createHistogram('order', slicedData.labels, [dataset]);
                
                chartContainer.appendChild(canvas);
                rowContainer.appendChild(chartContainer);
            });

            displayContainer.appendChild(rowContainer);
        }
    }
}