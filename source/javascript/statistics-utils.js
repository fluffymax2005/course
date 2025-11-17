export class ChartVariables {
    static _chartIDArray = []; // массив, содержащий ID активных графиков
    static _chartIDCounter = 0; // счетчик порядкового номера графика
    static _chartParseData = []; // массив, содержащий информацию, подлежащую парсингу

    static get chartIDs() {return this._chartIDArray;}
    static set charIDs(array) {this._chartIDArray = array;}
    static appendChartID(id) {
        if (id) {   
            this._chartIDArray.push(id);
            this._chartIDCounter++;
        }
            
    }

    static get chartIDCounter() {return this._chartIDCounter;}

    static get chartParseData() {return this._chartParseData;}
    static set chartParseData(data) {this._chartParseData = data;}

    static clearCharts() {
        this._chartIDArray = [];
        this._chartIDCounter = 0;
    }
}

export class ChartParseData {
    static ORDER = 'order';
    static VEHICLE = 'vehicle';
    static DRIVER = 'driver';
    static RATE = 'rate';

    static QUARTER_PARSE_TYPE = 'quarter';
    static YEAR_PARSE_TYPE = 'year';

    static MAX_CHARTS_PER_CONTAINER = 2;

    /**
     * Метод парсинга Object[] в данные, пригодные для графиков
     * @param {string} data - данные, подлежащие парсингу
     * @returns {{labels: any, datasets: any}} - результат запроса
     */
    static parseOrderData(data) {
        const parseType = data.type;
        if (!parseType || !data)
            return null;

        const chartData = { labels: [], data: [] }

        switch (parseType) {
            case this.QUARTER_PARSE_TYPE:
                // Создаем labels для кварталов
                for (let i = 1; i <= 4; i++)    
                    chartData.labels.push(`${i}-ый квартал`);

                // Группируем данные по годам
                const years = [...new Set(data.profit.map(item => item.year))].sort();
                
                years.forEach(year => {
                    const yearData = data.profit.filter(item => item.year === year);
                    const dataset = [];
                    
                    // Заполняем данные для всех 4 кварталов
                    for (let quarter = 1; quarter <= 4; quarter++) {
                        const quarterData = yearData.find(item => item.quarter === quarter);
                        dataset.push(quarterData ? quarterData.totalCapitalization : null);
                    }
                    
                    chartData.data.push({
                        label: `${year}`,
                        data: dataset,
                        borderWidth: 2,
                    });
                });
                break;
                
            case this.YEAR_PARSE_TYPE:
                // Для годовой статистики показываем общую капитализацию за каждый год
                const yearGroups = {};
                data.profit.forEach(item => {
                    // Для годовой статистики используем общую капитализацию за год
                    // Если в данных есть прямая годовая статистика, используем её
                    // Иначе показываем сообщение, что нужны годовые данные
                    yearGroups[item.year] = item.totalCapitalization;
                });
                
                // Создаем labels и datasets
                Object.keys(yearGroups).sort().forEach(year => {
                    chartData.labels.push(`Год ${year}`);
                    chartData.data.push({
                        label: `Год ${year}`,
                        data: [yearGroups[year]],
                        borderWidth: 2,
                    });
                });
                break;
        }
        
        /*switch (parseType) {
            case this.QUARTER_PARSE_TYPE:
            
                for (let i = 1; i < 5; i++)    
                    chartData.labels.push(`${i}-ый квартал`);

                for (let i = 0; i < data.profit.length; i += 4) {
                    const dataset = [];
                    if (i < data.profit.length)
                        dataset.push(data.profit[i].totalCapitalization);
                    if (i + 1 < data.profit.length)
                        dataset.push(data.profit[i + 1].totalCapitalization);
                    if (i + 2 < data.profit.length)
                        dataset.push(data.profit[i + 2].totalCapitalization);
                    if (i + 3 < data.profit.length)
                        dataset.push(data.profit[i + 3].totalCapitalization);
                    
                    
                    chartData.data.push({
                        label: `${data.profit[i].year}`,
                        data: dataset,
                        borderWidth: 2,
                    })
                }
                break;
            case this.YEAR_PARSE_TYPE:
                for (let i = 0; i < data.profit.length; i++) {
                    chartData.data.push({
                        label: `${data.profit[i].year}`,
                        data: [data.profit[i].totalCapitalization],
                        borderWidth: 2,
                    });
                }
        }*/

        console.log(chartData)

        return chartData;
    }
}

export class ChartCreation {   
    static ORDER_STATISTICS_CONTAINER = 'order display';
    static VEHICLE_STATISTICS_CONTAINER = 'vehicle display';
    static DRIVER_STATISTICS_CONTAINER = 'driver display';
    static RATE_STATISTICS_CONTAINER = 'rate display';

    static ORDER_RU_NAME = 'Заказы';
    static VEHICLE_RU_NAME = 'Транспортные средства';
    static DRIVER_RU_NAME = 'Водители';
    static RATE_RU_NAME = 'Тарифы';

    static _getDisplayClassID(selectValue) {return `${selectValue}Display`;}

    static createHistogram(selectValue, labels, datasets) {        
        const canvas = document.createElement('canvas');
        const canvasID = `${selectValue}Canvas_${ChartVariables.chartIDCounter}`
        ChartVariables.appendChartID(canvasID);
        canvas.id = canvasID;
        canvas.style.width = '100%'
        canvas.style.height = '100%';

        try {
            const ctx = canvas.getContext('2d');

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right',
                            color: 'rgb(255, 99, 132)'
                        }
                    }
                
                }
            });
        } catch (error) {
            console.error(error);
        }

        return canvas;
    }
}