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

    ChartVariables.clearCharts();

    if (text !== '') {
        // Активируем нужную
        document.getElementById(`${text}Struct`).classList.add('active');
    }
}

async function initAnalys(event) {
    event.preventDefault();

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
        structSelect.options[structSelect.selectedIndex].value,
        categorySelect.options[categorySelect.selectedIndex].value,
        timeIntervalSelect.options[categorySelect.selectedIndex].value,
        yearStartInput.value,
        yearEndInput.value,
        popularSelect ? popularSelect.options[popularSelect.selectedIndex].value : null,
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
    
    // Удобно отображать до 5 параметров в одном графике
    // Если параметров больше пяти, то надо сделать срез данных и разделить срезы по разным графикам
    let slicedData = null; 
    if (parsedData.labels.length > 5) {
        slicedData = { labels: [], data: [] };
        // Разбиение всех данных над подконтейнеры
        for (let i = 0; i < parsedData.labels.length; i += 5) {
            slicedData.labels[Math.floor(i /  4)].push(parsedData.labels[Math.floor(i /  4)]);
            slicedData.data[Math.floor(i /  4)].push(parsedData.data.slice(i, i + 4));
        }
    }

    if (!slicedData) {
        const displayContainer = document.getElementById(ChartCreation._getDisplayClassID('order'));
        const canvas = ChartCreation.createHistogram('order', parsedData.labels, parsedData.data[0]);

        // Сбрасываем разметку контейнера со статистикой при создан
        displayContainer.innerHTML = '';

        // Графики будут расположены попарно в подконтейнерах.
        let pairContainer = null;
        const pairNumber = Math.floor(ChartVariables.chartIDCounter / 2);
        pairContainer = document.createElement('div');
        pairContainer.id = `orderPairContainer_${pairNumber}`;

        //if (ChartVariables.chartIDCounter % 2)
        //    pairContainer = document.getElementById(
        //        `${selectValue}PairContainer_${pairNumber}`);
        //else {
            //pairContainer = document.createElement('div');
            //pairContainer.id = `${selectValue}PairContainer_${pairNumber}`
        //}

        // Размещает компоненты
        pairContainer.appendChild(canvas);
        displayContainer.appendChild(pairContainer);

        // Существующий div не нужно повторно размещать
        // if ((ChartVariables.chartIDCounter - 1) % 2 === 0)
            //displayContainer.appendChild(pairContainer);

        
    } else {
        const displayContainer = document.getElementById(this._getDisplayClassID('order'));
        for (let i = 0; i < slicedData.labels.length; i++) {
            const canvas = ChartCreation.createHistogram('order', slicedData.labels[i], slicedData.data[i]);

        }
    }
}