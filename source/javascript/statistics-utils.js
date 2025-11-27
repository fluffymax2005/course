export class ChartVariables {
    static PROFIT = 'profit';
    static ORDERS_COUNT = 'orders-count';

    static _chartIDArray = []; // массив, содержащий ID активных графиков
    static _chartIDCounter = 0; // счетчик порядкового номера графика
    static _chartParseData = []; // массив, содержащий информацию, подлежащую парсингу
    static _timeIntervalType = null; // по какому временному диапазону идет выборка
    static _categoryStatistics = null; // категория, по которой производится парсинг для графиков

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

    static get categoryStatistics() {return this._categoryStatistics;}
    static set categoryStatistics(category) {this._categoryStatistics = category;}

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

    static parseDriverData(data) {
        const parseType = data.type;
        if (!parseType || !data)
            return null;

        const chartData = { labels: [], datasets: [] };

        // Определяем поле данных в зависимости от категории статистики
        let dataField = '';
        let datasetLabel = '';
        
        switch (ChartVariables.categoryStatistics) {
            case ChartVariables.PROFIT:
                dataField = 'totalProfit';
                datasetLabel = 'Общий доход (руб.)';
                break;
            case ChartVariables.ORDERS_COUNT:
                dataField = 'orderCount';
                datasetLabel = 'Количество заказов';
                break;
            default:
                return null;
        }

        // Для водителей всегда используем гистограмму с данными по каждому водителю
        if (data.drivers && data.drivers.length > 0) {
            // Сортируем водителей по выбранному полю (по убыванию)
            const sortedDrivers = [...data.drivers].sort((a, b) => b[dataField] - a[dataField]);
            
            // Берем топ водителей для отображения (максимум 10 для лучшей читаемости)
            const topDrivers = sortedDrivers.slice(0, Math.min(10, sortedDrivers.length));
            
            // Создаем labels - имена водителей
            chartData.labels = topDrivers.map(driver => driver.driverName);
            
            // Создаем dataset с данными
            const dataset = {
                label: datasetLabel,
                data: topDrivers.map(driver => driver[dataField]),
                borderWidth: 2,
                backgroundColor: this._generateDriverColors(topDrivers.length),
                borderColor: this._generateDriverColors(topDrivers.length, 0.8)
            };
            
            chartData.datasets.push(dataset);
        }

        console.log('Parsed driver data:', chartData);
        return chartData;
    }

    // Вспомогательный метод для генерации цветов для водителей
    static _generateDriverColors(count, alpha = 1) {
        const colors = [];
        const baseColors = [
            'rgba(54, 162, 235, ALPHA)',   // синий
            'rgba(255, 99, 132, ALPHA)',   // красный
            'rgba(75, 192, 192, ALPHA)',   // зеленый
            'rgba(255, 159, 64, ALPHA)',   // оранжевый
            'rgba(153, 102, 255, ALPHA)',  // фиолетовый
            'rgba(255, 205, 86, ALPHA)',   // желтый
            'rgba(201, 203, 207, ALPHA)',  // серый
            'rgba(255, 99, 71, ALPHA)',    // томатный
            'rgba(46, 139, 87, ALPHA)',    // морской волны
            'rgba(147, 112, 219, ALPHA)'   // средний фиолетовый
        ];
        
        for (let i = 0; i < count; i++) {
            const color = baseColors[i % baseColors.length].replace('ALPHA', alpha);
            colors.push(color);
        }
        
        return colors;
    }

    static parseRateData(data) {
        const parseType = data.type;
        if (!parseType || !data)
            return null;

        const chartData = { labels: [], datasets: [] };

        switch (parseType) {
            case this.QUARTER_PARSE_TYPE:
                // Для кварталов создаем гистограмму
                return this._parseRateQuarterData(data);
            case this.YEAR_PARSE_TYPE:
                // Для годов создаем круговые диаграммы
                return this._parseRateYearData(data);
            default:
                return null;
        }
    }

    static _parseRateYearData(data) {
        const chartData = { 
            type: 'year',
            periods: [] 
        };

        if (data.distribution && data.distribution.length > 0) {
            data.distribution.forEach(yearData => {
                const periodData = {
                    year: yearData.year,
                    labels: [],
                    datasets: []
                };

                // Собираем данные для круговой диаграммы
                if (yearData.rateDistribution && yearData.rateDistribution.length > 0) {
                    const dataset = {
                        data: [],
                        backgroundColor: [],
                        borderColor: [],
                        borderWidth: 2
                    };

                    yearData.rateDistribution.forEach(rate => {
                        periodData.labels.push(rate.rateName);
                        dataset.data.push(rate.orderPercentage);
                        
                        // Генерируем цвета для каждого тарифа
                        const color = this._generateRateColor(rate.rateId);
                        dataset.backgroundColor.push(color);
                        dataset.borderColor.push(color.replace('0.7', '1'));
                    });

                    periodData.datasets.push(dataset);
                }

                chartData.periods.push(periodData);
            });
        }

        console.log('Parsed rate year data:', chartData);
        return chartData;
    }

    static _parseRateQuarterData(data) {
        if (!data.distribution || data.distribution.length === 0) 
            return null;

        // Группируем данные по годам
        const years = [...new Set(data.distribution.map(item => item.year))].sort();
        const chartData = {
            type: 'quarter',
            periods: []
        };

        years.forEach(year => {
            const yearData = data.distribution.filter(item => item.year === year);
            
            // Создаем данные для каждого года
            const periodData = {
                year: year,
                labels: ['1 квартал', '2 квартал', '3 квартал', '4 квартал'],
                datasets: []
            };

            // Собираем все уникальные тарифы для этого года
            const allRates = new Map();
            
            yearData.forEach(quarterData => {
                if (quarterData.rateDistribution) {
                    quarterData.rateDistribution.forEach(rate => {
                        if (!allRates.has(rate.rateId)) {
                            allRates.set(rate.rateId, {
                                rateName: rate.rateName,
                                data: new Array(4).fill(0), // 4 квартала
                                color: this._generateRateColor(rate.rateId)
                            });
                        }
                    });
                }
            });

            // Заполняем данные по кварталам для этого года
            yearData.forEach(quarterData => {
                const quarterIndex = quarterData.quarter - 1; // кварталы от 0 до 3
                
                if (quarterData.rateDistribution && quarterIndex < 4) {
                    quarterData.rateDistribution.forEach(rate => {
                        const rateData = allRates.get(rate.rateId);
                        if (rateData) {
                            rateData.data[quarterIndex] = rate.orderPercentage;
                        }
                    });
                }
            });

            // Создаем datasets для этого года
            allRates.forEach((rateData, rateId) => {
                periodData.datasets.push({
                    label: rateData.rateName,
                    data: rateData.data,
                    borderWidth: 2,
                    backgroundColor: rateData.color,
                    borderColor: rateData.color.replace('0.7', '1')
                });
            });

            chartData.periods.push(periodData);
        });

        console.log('Parsed rate quarter data:', chartData);
        return chartData;
    }

    // Вспомогательный метод для генерации цветов тарифов
    static _generateRateColor(rateId) {
        const colors = [
            'rgba(255, 99, 132, 0.7)',   // красный
            'rgba(54, 162, 235, 0.7)',   // синий
            'rgba(75, 192, 192, 0.7)',   // зеленый
            'rgba(255, 159, 64, 0.7)',   // оранжевый
            'rgba(153, 102, 255, 0.7)',  // фиолетовый
            'rgba(255, 205, 86, 0.7)',   // желтый
            'rgba(201, 203, 207, 0.7)',  // серый
        ];
        
        return colors[rateId % colors.length];
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
        const canvasID = `${selectValue}Canvas_${ChartVariables.chartIDCounter}`;
        ChartVariables.appendChartID(canvasID);
        canvas.id = canvasID;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        console.log('Creating donut chart with:', { labels, datasets });

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
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12,
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ${value.toFixed(2)}%`;
                                }
                            }
                        }
                    },
                    cutout: '50%'
                },
            });
        } catch (error) {
            console.error('Error creating donut chart:', error);
        }

        return canvas;
    }
}