import { ApiError, ApiService } from "./api.js";
import { ChartCreation, ChartParseData, ChartVariables } from "./statistics-utils.js";
import {MessageBox} from "./form-utils.js";
import { getToken } from "./cookie.js";

window.displayStruct = displayStruct;
window.initAnalys = initAnalys;
window.vehicleChange = vehicleChange;

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

    const yearStartContainer = document.getElementById('vehicleYearStart');
    if (yearStartContainer) {
        const yearStartLabel = yearStartContainer.querySelector('.year-start');
        yearStartContainer.style.display = 'none';
        yearStartLabel.textContent = 'Начальный год';
    }
    
}

async function initAnalys(event) {
    event.preventDefault();

    document.querySelectorAll('.display').forEach(d => d.replaceChildren()); // убираем графики
    ChartVariables.clearCharts(); // сбрасываем значения текущих графиков

    let isFetchSuccess = false;

    try {
        isFetchSuccess = await fetchStatisticData();
    } catch (error) {
        if (error instanceof ApiError)
            await MessageBox.ShowFromCenter(`Ошибка: ${error.data.message}`, 'red');
        return;
    }

    if (!isFetchSuccess)
        return;
    
    ChartVariables.timeIntervalType = document.querySelector('.time-type-container select').value;

    switch (document.getElementById('structSelect').value) {
        case ChartParseData.ORDER: fillOrderChart(); break;
        case ChartParseData.VEHICLE: fillVehicleChart(); break;  
        case ChartParseData.DRIVER: fillDriverChart(); break;
        case ChartParseData.RATE: fillRateChart(); break;  
        default: return;
    }

    MessageBox.RemoveAwait()
}

async function fetchStatisticData() {
    const structSelect = document.getElementById('structSelect');

    const activeStruct = document.querySelector('.struct.active');

    const categorySelect = activeStruct.querySelector('.category-container select');
    const timeIntervalSelect = activeStruct.querySelector('.time-type-container select');
    const yearStartInput = activeStruct.querySelector('.year-start-container input');
    const yearEndInput = activeStruct.querySelector('.year-end-container input');
    const popularSelect = activeStruct.querySelector('.popular-container select');

    if (activeStruct.id.includes('order') || activeStruct.id.includes('driver') || activeStruct.id.includes('rate')) {
        if (yearStartInput.value === '') {
            await MessageBox.ShowFromCenter('Укажите начальный год', 'red');
            return false;
        } else if (yearEndInput.value === '') {
            await MessageBox.ShowFromCenter('Укажите конечный год', 'red');
            return false;
        }
    } else if (activeStruct.id.includes('vehicle')) {       
        const timeIntervalType = timeIntervalSelect.value;
        
        if (timeIntervalType === ChartParseData.QUARTER_PARSE_TYPE) {
            // Режим кварталов - проверяем только год
            if (yearEndInput.value === '') {
                await MessageBox.ShowFromCenter('Укажите год для анализа кварталов', 'red');
                return false;
            }
        } else if (timeIntervalType === ChartParseData.YEAR_PARSE_TYPE) {
            // Режим годов - проверяем оба поля
            if (yearStartInput.value === '') {
                await MessageBox.ShowFromCenter('Укажите начальный год', 'red');
                return false;
            } else if (yearEndInput.value === '') {
                await MessageBox.ShowFromCenter('Укажите конечный год', 'red');
                return false;
            }
            
            // Дополнительная проверка: начальный год не должен быть больше конечного
            const startYear = parseInt(yearStartInput.value);
            const endYear = parseInt(yearEndInput.value);
            if (startYear > endYear) {
                await MessageBox.ShowFromCenter('Начальный год не может быть больше конечного года', 'red');
                return false;
            }
        }
    }

    let yearStartValue = 0, yearEndValue = 0;
    if (activeStruct.id.includes('order') || activeStruct.id.includes('driver') || activeStruct.id.includes('rate')) {
        yearStartValue = yearStartInput.value;
        yearEndValue = yearEndInput.value;
    } else if (activeStruct.id.includes('vehicle')) {
        yearStartValue = timeIntervalSelect.value === ChartParseData.QUARTER_PARSE_TYPE ? yearEndInput.value : yearStartInput.value;
        yearEndValue = yearEndInput.value;
    }

    // Локальный путь доступа к БД
    const path = ApiService.getStatisticsPath(
        structSelect.value,
        categorySelect.value,
        timeIntervalSelect.value,
        yearStartValue,
        yearEndValue,
        popularSelect ? popularSelect.value : null,
        popularSelect ? popularSelect.value : null
    );
    console.log(path);

    ChartVariables.categoryStatistics = categorySelect.value;

    const token = getToken();

    //MessageBox.ShowAwait()
    try {
        const data = await ApiService.get(path, {
            'Authorization': `Bearer ${token}`
        });

        ChartVariables.chartParseData = data; // запоминаем данные для парсинга
    } catch (error) {
        MessageBox.RemoveAwait();
        throw error;
    }

    return true;
}

function vehicleChange() {
    const select = document.getElementById('vehicleSelect');
    const value = select.value;
 
    const yearStartContainer = document.getElementById('vehicleYearStart');
    const yearEndContainer = document.getElementById('vehicleYearEnd');
    const yearStartLabel = yearStartContainer.querySelector('.year-start');
    const yearEndLabel = yearEndContainer.querySelector('.year-end');
    switch (value) {
        case ChartParseData.QUARTER_PARSE_TYPE:
            yearStartContainer.style.display = 'none';
            yearStartLabel.textContent = 'Год';
            ChartVariables.timeIntervalType = ChartParseData.QUARTER_PARSE_TYPE;
            break;
        case ChartParseData.YEAR_PARSE_TYPE:
            yearStartContainer.style.display = 'flex';
            yearStartLabel.textContent = 'Начальный год';
            yearEndLabel.textContent = 'Конечный год';
            ChartVariables.timeIntervalType = ChartParseData.YEAR_PARSE_TYPE;
    }
}

// БЛОК ФУНКЦИЙ, ЗАПОЛНЯЮЩИХ СТАТИСТИКУ
function fillOrderChart() {
    const parsedData = ChartParseData.parseOrderData(ChartVariables.chartParseData); // парсированные данные
    
    // Удобно отображать до <MAX_CHARTS_PER_CONTAINER> параметров в одном графике
    // Если параметров больше (<MAX_CHARTS_PER_CONTAINER> - 1), то надо сделать срез данных и разделить срезы по разным графикам
    let slicedData = null;
    
    // Если обрабатывается выборка по годам и число годов превышает ChartParseData.MAX_CHARTS_PER_CONTAINER
    if (ChartVariables.timeIntervalType === ChartParseData.YEAR_PARSE_TYPE && parsedData.labels.length > ChartParseData.MAX_YEARS_PER_CHART) {
        slicedData = { labels: [], datasets: [] };

        // Разбиение на пятерки годов
        for (let i = 0; i < parsedData.labels.length; i += ChartParseData.MAX_YEARS_PER_CHART) {
            const endIndex = Math.min(i + ChartParseData.MAX_YEARS_PER_CHART, parsedData.datasets.length);

            slicedData.datasets.push(parsedData.datasets.slice(i, endIndex));
            slicedData.labels.push(parsedData.labels.slice(i, endIndex));
        }
    } else if (ChartVariables.timeIntervalType === ChartParseData.QUARTER_PARSE_TYPE && parsedData.datasets.length > ChartParseData.MAX_CHARTS_PER_CONTAINER - 1) {
        slicedData = { labels: [], datasets: [] };
        parsedData.labels.forEach(l => slicedData.labels.push(l));  // В случае, если обрабатываем кварталы, то все label'ы - номера кварталов

        // Разбиение всех данных над подконтейнеры
        for (let i = 0; i < parsedData.datasets.length; i += ChartParseData.MAX_CHARTS_PER_CONTAINER) {          
            const endIndex = Math.min(i + ChartParseData.MAX_CHARTS_PER_CONTAINER, parsedData.datasets.length);
            slicedData.datasets.push(parsedData.datasets.slice(i, endIndex));            
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

        let canvas = null;
        if (ChartVariables.timeIntervalType === ChartParseData.YEAR_PARSE_TYPE) {
            const localData = { labels: [], datasets: [] };
            for (let i = 0; i < parsedData.datasets.length; ++i) {
                const currentChartDataSet = parsedData.datasets[i]; 
                localData.labels.push(currentChartDataSet.label);

                const data = [];
                for (let j = 0; j < ChartParseData.MAX_YEARS_PER_CHART; j++) {
                    if (i === j)
                        data.push(currentChartDataSet.data[0]);
                    else
                        data.push(0);
                }

                const dataset = {
                    label: currentChartDataSet.label,
                    data: data,
                    borderWidth: 2
                };                    

                localData.datasets.push(dataset);
            }

            canvas = ChartCreation.createHistogram('order', localData.labels, localData.datasets);
        } else {
            canvas = ChartCreation.createHistogram('order', parsedData.labels, parsedData.datasets);
        }

        chartContainer.appendChild(canvas);
        rowContainer.appendChild(chartContainer);
        displayContainer.appendChild(rowContainer);        
    } else {        
        // Со срезом - несколько строк по 2 графика
        for (let i = 0; i < slicedData.datasets.length; i++) {
            const pairNumber = Math.floor(ChartVariables.chartIDCounter / 2);
            
            // Создаем контейнер для двух графиков на данной строке
            let rowContainer = null;
            rowContainer = document.createElement('div');
            rowContainer.id = `orderPairContainer_${pairNumber}`;
            rowContainer.style.width = '100%';
            rowContainer.style.display = 'flex';
            rowContainer.style.flexWrap = 'wrap';
            rowContainer.style.justifyContent = 'space-between';
            rowContainer.style.marginBottom = '20px';
            rowContainer.style.gap = '20px';

            if (ChartVariables.timeIntervalType === ChartParseData.YEAR_PARSE_TYPE) {
                const localData = { labels: [], datasets: [] };
                const currentChartDataSet = slicedData.datasets[i];


                for (let i = 0; i < currentChartDataSet.length; ++i) {
                    localData.labels.push(currentChartDataSet[i].label);

                    const data = [];
                    for (let j = 0; j < ChartParseData.MAX_YEARS_PER_CHART; j++) {
                        if (i === j)
                            data.push(currentChartDataSet[i].data);
                        else
                            data.push(0);
                    }

                    const dataset = {
                        label: currentChartDataSet[i].label,
                        data: data,
                        borderWidth: 2
                    };                    

                    localData.datasets.push(dataset);
                }

                const chartContainer = document.createElement('div');
                chartContainer.id = `orderChartPairContainer_${pairNumber}`;
                chartContainer.style.flex = '1';
                chartContainer.style.minWidth = '45%';
                chartContainer.style.height = '500px';
                chartContainer.style.position = 'relative';
                chartContainer.style.backgroundColor = 'white';
                chartContainer.style.border = '1px solid #ddd';
                chartContainer.style.borderRadius = '8px';
                chartContainer.style.padding = '10px'; 
                chartContainer.style.boxSizing = 'border-box';

                const canvas = ChartCreation.createHistogram('order', localData.labels, localData.datasets);
                
                chartContainer.appendChild(canvas);
                rowContainer.appendChild(chartContainer);
            } else {
                // Создаем графики для этой строки
                slicedData.datasets[i].forEach((dataset) => {
                    const chartContainer = document.createElement('div');
                    chartContainer.id = `orderChartPairContainer_${pairNumber}`;
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
            }

            displayContainer.appendChild(rowContainer);
        }
    }
}

function fillVehicleChart() {
    const parsedData = ChartParseData.parseVehicleData(ChartVariables.chartParseData);
    if (!parsedData) return;

    const displayContainer = document.getElementById(ChartCreation._getDisplayClassID('vehicle')); 
    displayContainer.innerHTML = '';
    displayContainer.style.display = 'flex';
    displayContainer.style.flexDirection = 'column';

    if (parsedData.datasets.length === 0) return;

    // Определяем логику разбивки в зависимости от типа временного интервала
    let slicedData = null;
    
    if (ChartVariables.timeIntervalType === ChartParseData.YEAR_PARSE_TYPE && 
        parsedData.labels.length > ChartParseData.MAX_YEARS_PER_CHART) {
        
        slicedData = { labels: [], datasets: [] };
        
        // Разбиваем годы на группы по MAX_YEARS_PER_CHART
        for (let i = 0; i < parsedData.labels.length; i += ChartParseData.MAX_YEARS_PER_CHART) {
            const endIndex = Math.min(i + ChartParseData.MAX_YEARS_PER_CHART, parsedData.labels.length);
            
            // Создаем срез labels
            const slicedLabels = parsedData.labels.slice(i, endIndex);
            
            // Создаем срез datasets для этих годов
            const slicedDatasets = parsedData.datasets.map(dataset => {
                return {
                    label: dataset.label,
                    data: dataset.data.slice(i, endIndex),
                    borderWidth: dataset.borderWidth
                };
            });
            
            slicedData.labels.push(slicedLabels);
            slicedData.datasets.push(slicedDatasets);
        }
    }

    // Если разбивка не требуется (все годы помещаются в один график)
    if (!slicedData) {
        const rowContainer = document.createElement('div');
        rowContainer.style.width = '100%';
        rowContainer.style.display = 'flex';
        rowContainer.style.flexDirection = 'column';
        rowContainer.style.marginBottom = '20px';

        const chartContainer = document.createElement('div');
        chartContainer.style.width = '100%';
        chartContainer.style.height = '500px';
        chartContainer.style.position = 'relative';
        chartContainer.style.padding = '10px';
        chartContainer.style.boxSizing = 'border-box'; 
        chartContainer.style.borderRadius = '8px';
        chartContainer.style.backgroundColor = 'white';

        const canvas = ChartCreation.createHistogram('vehicle', parsedData.labels, parsedData.datasets);
        
        chartContainer.appendChild(canvas);
        rowContainer.appendChild(chartContainer);

        // Добавляем подпись с диапазоном лет для годовой статистики
        if (ChartVariables.timeIntervalType === ChartParseData.YEAR_PARSE_TYPE) {
            const yearLabel = document.createElement('div');
            yearLabel.style.textAlign = 'center';
            yearLabel.style.marginTop = '10px';
            yearLabel.style.fontSize = '16px';
            yearLabel.style.fontWeight = 'bold';
            yearLabel.style.color = '#333';
            
            if (parsedData.labels.length > 0) {
                const years = parsedData.labels;
                if (years.length === 1) {
                    yearLabel.textContent = `Год: ${years[0]}`;
                } else {
                    yearLabel.textContent = `Годы: ${years[0]} - ${years[years.length - 1]}`;
                }
                rowContainer.appendChild(yearLabel);
            }
        }

        displayContainer.appendChild(rowContainer);
    } else {
        // Со срезом - создаем строки с максимум 2 графиками
        for (let i = 0; i < slicedData.labels.length; i++) {
            const rowContainer = document.createElement('div');
            rowContainer.id = `vehicleRowContainer_${i}`;
            rowContainer.style.width = '100%';
            rowContainer.style.display = 'flex';
            rowContainer.style.flexWrap = 'wrap';
            rowContainer.style.justifyContent = 'space-between';
            rowContainer.style.marginBottom = '20px';
            rowContainer.style.gap = '20px';

            // Создаем график для текущей группы годов
            const currentLabels = slicedData.labels[i];
            const currentDatasets = slicedData.datasets[i];
            
            const chartContainer = document.createElement('div');
            chartContainer.id = `vehicleChart_${i}`;
            chartContainer.style.flex = '1';
            chartContainer.style.minWidth = '45%';
            chartContainer.style.height = '500px';
            chartContainer.style.position = 'relative';
            chartContainer.style.backgroundColor = 'white';
            chartContainer.style.border = '1px solid #ddd';
            chartContainer.style.borderRadius = '8px';
            chartContainer.style.padding = '10px'; 
            chartContainer.style.boxSizing = 'border-box';

            // Добавляем подзаголовок с диапазоном лет
            const chartInfo = document.createElement('div');
            chartInfo.style.textAlign = 'center';
            chartInfo.style.marginBottom = '10px';
            chartInfo.style.fontSize = '14px';
            chartInfo.style.fontWeight = '600';
            
            if (currentLabels.length === 1) {
                chartInfo.textContent = `Год: ${currentLabels[0]}`;
            } else {
                chartInfo.textContent = `Годы: ${currentLabels[0]} - ${currentLabels[currentLabels.length - 1]}`;
            }
            chartContainer.appendChild(chartInfo);

            const canvas = ChartCreation.createHistogram('vehicle', currentLabels, currentDatasets);
            
            chartContainer.appendChild(canvas);
            rowContainer.appendChild(chartContainer);

            // Если в строке только один график, делаем его шире
            if (slicedData.labels.length === 1 || (i === slicedData.labels.length - 1 && slicedData.labels.length % 2 === 1)) {
                const singleChart = rowContainer.querySelector('div');
                singleChart.style.minWidth = '70%';
                singleChart.style.margin = '0 auto';
            }

            displayContainer.appendChild(rowContainer);
        }
    }
}

function fillDriverChart() {
    const parsedData = ChartParseData.parseDriverData(ChartVariables.chartParseData);
    if (!parsedData || parsedData.datasets.length === 0) return;

    const displayContainer = document.getElementById(ChartCreation._getDisplayClassID('driver')); 
    displayContainer.innerHTML = ''; // Сбрасываем разметку контейнера
    displayContainer.style.display = 'flex';
    displayContainer.style.flexDirection = 'column';

    // Создаем контейнер для графика
    const rowContainer = document.createElement('div');
    rowContainer.style.width = '100%';
    rowContainer.style.display = 'flex';
    rowContainer.style.flexDirection = 'column';
    rowContainer.style.marginBottom = '20px';

    const chartContainer = document.createElement('div');
    chartContainer.style.width = '100%';
    chartContainer.style.height = '500px';
    chartContainer.style.position = 'relative';
    chartContainer.style.padding = '10px';
    chartContainer.style.boxSizing = 'border-box'; 
    chartContainer.style.borderRadius = '8px';
    chartContainer.style.backgroundColor = 'white';

    // Добавляем заголовок с информацией о типе статистики
    const chartTitle = document.createElement('div');
    chartTitle.style.textAlign = 'center';
    chartTitle.style.marginBottom = '15px';
    chartTitle.style.fontSize = '18px';
    chartTitle.style.fontWeight = 'bold';
    chartTitle.style.color = '#333';
    
    const activeStruct = document.querySelector('.struct.active');
    const yearStart = activeStruct.querySelector('.year-start-container input').value;
    const yearEnd = activeStruct.querySelector('.year-end-container input').value;

    if (ChartVariables.categoryStatistics === ChartVariables.PROFIT) {
        chartTitle.textContent = `Топ водителей по совокупному доходу за период ${yearStart}-${yearEnd} гг.`;
    } else if (ChartVariables.categoryStatistics === ChartVariables.ORDERS_COUNT) {
        chartTitle.textContent = `Топ водителей по совокупному количеству заказов за период ${yearStart}-${yearEnd} гг.`;
    }
    
    chartContainer.appendChild(chartTitle);

    // Используем готовый метод createHistogram
    const canvas = ChartCreation.createHistogram('driver', parsedData.labels, parsedData.datasets);
    
    chartContainer.appendChild(canvas);
    rowContainer.appendChild(chartContainer);
    displayContainer.appendChild(rowContainer);
}

function fillRateChart() {
    const parsedData = ChartParseData.parseRateData(ChartVariables.chartParseData);
    if (!parsedData) return;

    const displayContainer = document.getElementById(ChartCreation._getDisplayClassID('rate')); 
    displayContainer.innerHTML = '';
    displayContainer.style.display = 'flex';
    displayContainer.style.flexDirection = 'column';

    // Проверяем тип данных, а не временной интервал
    if (parsedData.type === 'year') {
        fillRateYearCharts(parsedData);
    } else if (parsedData.type === 'quarter') {
        fillRateQuarterCharts(parsedData);
    }
}

function fillRateYearCharts(parsedData) {
    const displayContainer = document.getElementById(ChartCreation._getDisplayClassID('rate'));
    
    if (!parsedData.periods || parsedData.periods.length === 0) {
        console.log('No periods data for rate year charts');
        return;
    }

    console.log('Creating rate year charts with periods:', parsedData.periods);

    // Разбиваем на группы по 2 графика в строке
    for (let i = 0; i < parsedData.periods.length; i += ChartParseData.MAX_CHARTS_PER_CONTAINER) {
        const rowContainer = document.createElement('div');
        rowContainer.style.width = '100%';
        rowContainer.style.display = 'flex';
        rowContainer.style.flexWrap = 'wrap';
        rowContainer.style.justifyContent = 'space-between';
        rowContainer.style.marginBottom = '20px';
        rowContainer.style.gap = '20px';

        const endIndex = Math.min(i + ChartParseData.MAX_CHARTS_PER_CONTAINER, parsedData.periods.length);
        
        for (let j = i; j < endIndex; j++) {
            const periodData = parsedData.periods[j];
            
            console.log(`Creating chart for year ${periodData.year} with data:`, periodData);

            const chartContainer = document.createElement('div');
            chartContainer.style.flex = '1';
            chartContainer.style.minWidth = '45%';
            chartContainer.style.height = '500px';
            chartContainer.style.position = 'relative';
            chartContainer.style.backgroundColor = 'white';
            chartContainer.style.border = '1px solid #ddd';
            chartContainer.style.borderRadius = '8px';
            chartContainer.style.padding = '10px';
            chartContainer.style.boxSizing = 'border-box';
            chartContainer.style.display = 'flex';
            chartContainer.style.flexDirection = 'column';

            // Добавляем заголовок с годом
            const yearTitle = document.createElement('div');
            yearTitle.style.textAlign = 'center';
            yearTitle.style.marginBottom = '10px';
            yearTitle.style.fontSize = '18px';
            yearTitle.style.fontWeight = 'bold';
            yearTitle.style.color = '#333';
            yearTitle.textContent = `Распределение тарифов за ${periodData.year} год`;
            chartContainer.appendChild(yearTitle);

            // Создаем контейнер для диаграммы
            const chartInnerContainer = document.createElement('div');
            chartInnerContainer.style.flex = '1';
            chartInnerContainer.style.position = 'relative';
            
            // Используем готовый метод createDonut для круговой диаграммы
            const canvas = ChartCreation.createDonut('rate', periodData.labels, periodData.datasets);
            chartInnerContainer.appendChild(canvas);
            chartContainer.appendChild(chartInnerContainer);

            rowContainer.appendChild(chartContainer);
        }

        // Если в последней строке один график, центрируем его
        if (rowContainer.children.length === 1) {
            const singleChart = rowContainer.querySelector('div');
            singleChart.style.minWidth = '70%';
            singleChart.style.margin = '0 auto';
        }

        displayContainer.appendChild(rowContainer);
    }
}

function fillRateQuarterCharts(parsedData) {
    const displayContainer = document.getElementById(ChartCreation._getDisplayClassID('rate'));

    if (!parsedData.periods || parsedData.periods.length === 0) return;

    // Разбиваем на группы по 2 графика в строке
    for (let i = 0; i < parsedData.periods.length; i += ChartParseData.MAX_CHARTS_PER_CONTAINER) {
        const rowContainer = document.createElement('div');
        rowContainer.style.width = '100%';
        rowContainer.style.display = 'flex';
        rowContainer.style.flexWrap = 'wrap';
        rowContainer.style.justifyContent = 'space-between';
        rowContainer.style.marginBottom = '20px';
        rowContainer.style.gap = '20px';

        const endIndex = Math.min(i + ChartParseData.MAX_CHARTS_PER_CONTAINER, parsedData.periods.length);
        
        for (let j = i; j < endIndex; j++) {
            const periodData = parsedData.periods[j];
            
            const chartContainer = document.createElement('div');
            chartContainer.style.flex = '1';
            chartContainer.style.minWidth = '45%';
            chartContainer.style.height = '500px';
            chartContainer.style.position = 'relative';
            chartContainer.style.backgroundColor = 'white';
            chartContainer.style.border = '1px solid #ddd';
            chartContainer.style.borderRadius = '8px';
            chartContainer.style.padding = '10px';
            chartContainer.style.boxSizing = 'border-box';
            chartContainer.style.display = 'flex';
            chartContainer.style.flexDirection = 'column';

            // Добавляем заголовок с годом
            const yearTitle = document.createElement('div');
            yearTitle.style.textAlign = 'center';
            yearTitle.style.marginBottom = '10px';
            yearTitle.style.fontSize = '18px';
            yearTitle.style.fontWeight = 'bold';
            yearTitle.style.color = '#333';
            yearTitle.textContent = `Распределение тарифов за ${periodData.year} год по кварталам`;
            chartContainer.appendChild(yearTitle);

            // Создаем контейнер для диаграммы
            const chartInnerContainer = document.createElement('div');
            chartInnerContainer.style.flex = '1';
            chartInnerContainer.style.position = 'relative';
            
            // Используем готовый метод createHistogram для столбчатой диаграммы
            const canvas = ChartCreation.createHistogram('rate', periodData.labels, periodData.datasets);
            chartInnerContainer.appendChild(canvas);
            chartContainer.appendChild(chartInnerContainer);

            rowContainer.appendChild(chartContainer);
        }

        // Если в последней строке один график, центрируем его
        if (rowContainer.children.length === 1) {
            const singleChart = rowContainer.querySelector('div');
            singleChart.style.minWidth = '70%';
            singleChart.style.margin = '0 auto';
        }

        displayContainer.appendChild(rowContainer);
    }
}