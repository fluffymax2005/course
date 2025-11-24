export class ChartVariables {
    static _chartIDArray = []; // массив, содержащий ID активных графиков
    static _chartIDCounter = 0; // счетчик порядкового номера графика
    static _chartParseData = []; // массив, содержащий информацию, подлежащую парсингу
    static _timeIntervalType = null; // по какому временному диапазону идет выборка

    static get chartIDs() {return this._chartIDArray;}
    static set charIDs(array) {this._chartIDArray = array;}
    static appendChartID(id) {
        if (id) {   
            this._chartIDArray.push(id);
            this._chartIDCounter++;
        }
            
    }

    static get chartIDCounter() {return this._chartIDCounter;}

    static get timeIntervalType() {return this._timeIntervalType;}
    static set timeIntervalType(type) {this._timeIntervalType = type;}

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
    static MAX_YEARS_PER_CHART = 2;


    /**
     * Метод парсинга Object[] в данные, пригодные для графиков
     * @param {string} data - данные, подлежащие парсингу
     * @returns {{labels: any, datasets: any}} - результат запроса
     */
    static parseOrderData(data) {
        const parseType = data.type;
        if (!parseType || !data)
            return null;

        const chartData = { labels: [], datasets: [] }

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
                    for (let quarter = 1; quarter <= 4; ++quarter) {
                        const quarterData = yearData.find(item => item.quarter === quarter);
                        dataset.push(quarterData ? quarterData.totalCapitalization : null);
                    }
                    
                    chartData.datasets.push({
                        label: `${year}`,
                        data: dataset,
                        borderWidth: 2,
                    });
                });
                break;
                
            case this.YEAR_PARSE_TYPE:
                // Для годовой статистики показываем общую капитализацию за каждый год
                // Группируем данные по годам
                const yearGroups = [...new Set(data.profit.map(item => item.year))].sort();
                
                yearGroups.forEach(year => {
                    const dataset = data.profit.find(p => p.year === year).totalCapitalization;
                    
                    chartData.labels.push(`${year}`);
                    chartData.datasets.push({
                        label: `${year}`,
                        data: [dataset],
                        borderWidth: 2,
                    });
                });
                break;
        }

        console.log(chartData)

        return chartData;
    }

    static parseVehicleData(data) {
        const parseType = data.type;
        if (!parseType || !data)
            return null;

        const chartData = { labels: [], datasets: [] };

        switch (parseType) {
            case this.QUARTER_PARSE_TYPE:
                // Создаем labels для кварталов
                chartData.labels = ['1 квартал', '2 квартал', '3 квартал', '4 квартал'];

                // Получаем все уникальные модели транспортных средств
                const allModels = new Set();
                data.stats.forEach(stat => {
                    stat.topVehicles.forEach(vehicle => {
                        allModels.add(vehicle.model);
                    });
                });

                // Создаем dataset для каждой модели
                Array.from(allModels).forEach(model => {
                    const dataset = [];
                    
                    // Для каждого квартала находим данные по модели
                    for (let quarter = 1; quarter <= 4; quarter++) {
                        const quarterData = data.stats.find(stat => 
                            stat.quarter === quarter
                        );
                        
                        if (quarterData) {
                            const vehicleData = quarterData.topVehicles.find(v => v.model === model);
                            dataset.push(vehicleData ? vehicleData.totalOrderCount : 0);
                        } else {
                            dataset.push(0);
                        }
                    }
                    
                    chartData.datasets.push({
                        label: model,
                        data: dataset,
                        borderWidth: 2,
                    });
                });
                break;
                
            case this.YEAR_PARSE_TYPE:
                // Для годовой статистики группируем по годам
                const yearGroups = [...new Set(data.stats.map(item => item.year))].sort();
                
                // Получаем все уникальные модели
                const topModels = new Set();
                data.stats.forEach(stat => {
                    stat.topVehicles.forEach(vehicle => {
                        topModels.add(vehicle.model);
                    });
                });

                // Создаем dataset для каждой модели
                Array.from(topModels).forEach(model => {
                    const dataset = [];
                    
                    yearGroups.forEach(year => {
                        const yearData = data.stats.find(stat => stat.year === year);
                        if (yearData) {
                            const vehicleData = yearData.topVehicles.find(v => v.model === model);
                            dataset.push(vehicleData ? vehicleData.totalOrderCount : 0);
                        } else {
                            dataset.push(0);
                        }
                    });
                    
                    chartData.datasets.push({
                        label: model,
                        data: dataset,
                        borderWidth: 2,
                    });
                });

                // Labels - это годы
                chartData.labels = yearGroups.map(year => `${year}`);
                break;
        }

        console.log('Parsed vehicle data:', chartData);
        return chartData;
    }

    // Вспомогательный метод для генерации случайных цветов
    static _generateColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
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

    static createDonut(selectValue, labels, datasets) {
        const canvas = document.createElement('canvas');
        const canvasID = `${selectValue}Canvas_${ChartVariables.chartIDCounter}`
        ChartVariables.appendChartID(canvasID);
        canvas.id = canvasID;
        canvas.style.width = '100%'
        canvas.style.height = '100%';

        console.log(labels);
        console.log(datasets);

        try {
            const ctx = canvas.getContext('2d');

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Chart.js Doughnut Chart'
                    }
                    }
                },
            });
        } catch (error) {
            console.error(error);
        }

        console.log(canvas);

        return canvas;
    }
}