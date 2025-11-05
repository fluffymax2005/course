using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TypeId = int;

namespace DbAPI.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticsController : ControllerBase {
        private readonly ILogger<StatisticsController> _logger;

        private readonly IRepository<Order, TypeId> _orderRepository;
        private readonly IRepository<Rate, TypeId> _rateRepository;
        private readonly IRepository<TransportVehicle, TypeId> _transportVehicleRepository;
        private readonly IRepository<Driver, TypeId> _driverRepository;


        public StatisticsController(
            ILogger<StatisticsController> logger,
            IRepository<Order, TypeId> orderRepository,
            IRepository<Rate, TypeId> rateRepository,
            IRepository<TransportVehicle, TypeId> transportVehicleRepository,
            IRepository<Driver, TypeId> driverRepository) {
            _logger = logger;
            _orderRepository = orderRepository;
            _rateRepository = rateRepository;
            _transportVehicleRepository = transportVehicleRepository;
            _driverRepository = driverRepository;
        }


        // Блок 1. Заказы

        // GET: api/{entity}/order/profit/quarter?yearStart={yearStart}&yearEnd={yearEnd}
        [HttpGet("order/profit/quarter")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> ProfitByQuarters([FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем заказы и тарифы
                var orders = await _orderRepository.GetAllAsync();
                var rates = await _rateRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null); // Исключаем удаленные заказы

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словарь тарифов для быстрого доступа
                var ratesDict = rates?.Where(r => r.IsDeleted == null).ToDictionary(r => r.Id);

                // Рассчитываем заработок по кварталам
                var profitByQuarters = filteredOrders
                    .Where(o => ratesDict != null && ratesDict.ContainsKey(o.RateId)) // Фильтруем заказы с валидными тарифами
                    .GroupBy(o => new { Year = o.WhenAdded.Year, Quarter = (o.WhenAdded.Month - 1) / 3 + 1 })
                    .Select(g => new {
                        Year = g.Key.Year,
                        Quarter = g.Key.Quarter,
                        TotalCapitalization = g.Sum(o => CalculateOrderCost(o, ratesDict[o.RateId])),
                        AverageOrderValue = g.Average(o => CalculateOrderCost(o, ratesDict[o.RateId]))
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Quarter)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    profit = profitByQuarters
                });
            } catch (Exception ex) {
                _logger.LogError(ex, $"Расчет капитализации по кварталам закончился ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }

        // GET: api/{entity}/order/capitalization/year?yearStart={yearStart}&yearEnd={yearEnd}
        [HttpGet("order/profit/year")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> ProfitByYears([FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем заказы и тарифы
                var orders = await _orderRepository.GetAllAsync();
                var rates = await _rateRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null); // Исключаем удаленные заказы

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словарь тарифов для быстрого доступа
                var ratesDict = rates?.Where(r => r.IsDeleted == null).ToDictionary(r => r.Id);

                // Рассчитываем капитализацию по годам
                var profitByYears = filteredOrders
                    .Where(o => ratesDict != null && ratesDict.ContainsKey(o.RateId)) // Фильтруем заказы с валидными тарифами
                    .GroupBy(o => new { Year = o.WhenAdded.Year })
                    .Select(g => new {
                        Year = g.Key.Year,
                        TotalCapitalization = g.Sum(o => CalculateOrderCost(o, ratesDict[o.RateId])),
                        AverageOrderValue = g.Average(o => CalculateOrderCost(o, ratesDict[o.RateId]))
                    })
                    .OrderBy(x => x.Year)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    profit = profitByYears
                });
            } catch (Exception ex) {
                _logger.LogError(ex, $"Расчет капитализации по кварталам закончился ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }

        // Вспомогательный метод для расчета стоимости заказа
        private decimal CalculateOrderCost(Order order, Rate rate) {
            return (order.Distance * rate.MovePrice) + rate.IdlePrice;
        }

        // Блок 2. Транспортные средства

        // GET: api/{entity}/vehicle/top-popular?isPopular={isPopular}&yearStart={yearStart}&yearEnd={yearEnd}
        [HttpGet("vehicle/top-popular/quarter")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> TopMostPopularTransportVehiclesByQuarters([FromQuery] bool isPopular, [FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем все заказы и транспортные средства
                var orders = await _orderRepository.GetAllAsync();
                var vehicles = await _transportVehicleRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null);

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словарь транспортных средств для быстрого доступа
                var vehiclesDict = vehicles?.Where(v => v.IsDeleted == null).ToDictionary(v => v.Id);

                // Группируем по кварталам и моделям машин
                var quarterlyVehicleStats = filteredOrders
                    .Where(o => vehiclesDict != null && vehiclesDict.ContainsKey(o.TransportVehicleId))
                    .GroupBy(o => new {
                        Year = o.WhenAdded.Year,
                        Quarter = (o.WhenAdded.Month - 1) / 3 + 1,
                        VehicleId = o.TransportVehicleId
                    })
                    .Select(g => {
                        var vehicle = vehiclesDict[g.Key.VehicleId];
                        return new {
                            Year = g.Key.Year,
                            Quarter = g.Key.Quarter,
                            VehicleId = g.Key.VehicleId,
                            Model = vehicle.Model,
                            OrderCount = g.Count(),
                        };
                    })
                    .ToList();

                // Группируем по кварталам и находим топ-5 моделей для каждого квартала
                var topVehiclesByQuarter = quarterlyVehicleStats
                    .GroupBy(q => new { q.Year, q.Quarter })
                    .Select(g => {
                        // Группируем по моделям внутри квартала
                        var modelStats = g.GroupBy(x => x.Model)
                            .Select(mg => new {
                                Model = mg.Key,
                                TotalOrderCount = mg.Sum(x => x.OrderCount),

                            })
                            .ToList();

                        // Сортируем в зависимости от параметра isPopular и берем топ-5
                        var topModels = isPopular
                            ? modelStats.OrderByDescending(m => m.TotalOrderCount)
                                       .Take(5)
                            : modelStats.OrderBy(m => m.TotalOrderCount)
                                       .Take(5);

                        return new {
                            Year = g.Key.Year,
                            Quarter = g.Key.Quarter,
                            QuarterName = $"Q{g.Key.Quarter} {g.Key.Year}",
                            TopVehicles = topModels.Select(m => new {
                                m.Model,
                                TotalOrderCount = m.TotalOrderCount,
                            }).ToList(),
                            TotalOrdersInQuarter = g.Sum(x => x.OrderCount),
                            TotalVehiclesInQuarter = g.Select(x => x.VehicleId).Distinct().Count()
                        };
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Quarter)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    stats = topVehiclesByQuarter
                });

            } catch (Exception ex) {
                _logger.LogError(ex, $"Анализ популярности транспортных средств по кварталам закончился ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }

        // GET: api/statistics/vehicle/top-popular?isPopular=true&yearStart=2023&yearEnd=2024
        [HttpGet("vehicle/top-popular/year")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> TopMostPopularTransportVehiclesByYears([FromQuery] bool isPopular, [FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем все заказы и транспортные средства
                var orders = await _orderRepository.GetAllAsync();
                var vehicles = await _transportVehicleRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null);

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словарь транспортных средств для быстрого доступа
                var vehiclesDict = vehicles?.Where(v => v.IsDeleted == null).ToDictionary(v => v.Id);

                // Группируем по годам и моделям машин
                var yearlyVehicleStats = filteredOrders
                    .Where(o => vehiclesDict != null && vehiclesDict.ContainsKey(o.TransportVehicleId))
                    .GroupBy(o => new {
                        Year = o.WhenAdded.Year,
                        VehicleId = o.TransportVehicleId
                    })
                    .Select(g => {
                        var vehicle = vehiclesDict[g.Key.VehicleId];
                        return new {
                            Year = g.Key.Year,
                            VehicleId = g.Key.VehicleId,
                            Model = vehicle.Model,
                            OrderCount = g.Count(),
                        };
                    })
                    .ToList();

                // Группируем по годам и находим топ-5 моделей для каждого года
                var topVehiclesByYear = yearlyVehicleStats
                    .GroupBy(q => q.Year)
                    .Select(g => {
                        // Группируем по моделям внутри года
                        var modelStats = g.GroupBy(x => x.Model)
                            .Select(mg => new {
                                Model = mg.Key,
                                TotalOrderCount = mg.Sum(x => x.OrderCount),
                            })
                            .ToList();

                        // Сортируем в зависимости от параметра isPopular и берем топ-5
                        var topModels = isPopular
                            ? modelStats.OrderByDescending(m => m.TotalOrderCount)
                                       .Take(5)
                            : modelStats.OrderBy(m => m.TotalOrderCount)
                                       .Take(5);

                        return new {
                            Year = g.Key,
                            TopVehicles = topModels.Select(m => new {
                                m.Model,
                                TotalOrderCount = m.TotalOrderCount,
                            }).ToList(),
                            TotalOrdersInYear = g.Sum(x => x.OrderCount),
                            TotalVehiclesInYear = g.Select(x => x.VehicleId).Distinct().Count()
                        };
                    })
                    .OrderBy(x => x.Year)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    stats = topVehiclesByYear
                });

            } catch (Exception ex) {
                _logger.LogError(ex, $"Анализ популярности транспортных средств по годам закончился ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }

        // Блок 3. Водители

        // GET: api/{entity}/driver/orders-count/year?yearStart={yearStart}&yearEnd={yearEnd}
        [HttpGet("driver/orders-count/year")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> DriversOrderedByOrdersCountByYears([FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем все заказы, водителей и транспортные средства
                var orders = await _orderRepository.GetAllAsync();
                var drivers = await _driverRepository.GetAllAsync();
                var vehicles = await _transportVehicleRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null);

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словари для быстрого доступа
                var driversDict = drivers?.Where(d => d.IsDeleted == null).ToDictionary(d => d.Id);
                var vehiclesDict = vehicles?.Where(v => v.IsDeleted == null).ToDictionary(v => v.Id);

                // Группируем заказы по водителям (через транспортные средства)
                var driverStats = filteredOrders
                    .Where(o => vehiclesDict != null && vehiclesDict.ContainsKey(o.TransportVehicleId) &&
                               driversDict != null && driversDict.ContainsKey(vehiclesDict[o.TransportVehicleId].DriverId))
                    .GroupBy(o => vehiclesDict[o.TransportVehicleId].DriverId)
                    .Select(g => {
                        var driver = driversDict[g.Key];
                        var driverVehicles = vehiclesDict.Values
                            .Where(v => v.DriverId == g.Key)
                            .ToList();

                        return new {
                            DriverId = g.Key,
                            DriverName = $"{driver.Surname} {driver.Forename}",
                            DriverPhone = driver.PhoneNumber,
                            DriverLicense = $"{driver.DriverLicenceSeries} {driver.DriverLicenceNumber}",
                            OrderCount = g.Count(),
                            TotalDistance = g.Sum(o => o.Distance),
                            AverageDistance = g.Average(o => o.Distance),
                            AssignedVehiclesCount = driverVehicles.Count,
                            VehicleModels = driverVehicles.Select(v => v.Model).Distinct().ToList()
                        };
                    })
                    .OrderByDescending(d => d.OrderCount)
                    .ThenByDescending(d => d.TotalDistance)
                    .Take(5)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    drivers = driverStats,
                });

            } catch (Exception ex) {
                _logger.LogError(ex, $"Сортировка водителей по количеству заказов закончилась ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }

        // GET: api/{entity}/profit/orders-count/year?yearStart={yearStart}&yearEnd={yearEnd}
        [HttpGet("driver/profit/year")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> TopProfitableDriversByYears([FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем все заказы, водителей, транспортные средства и тарифы
                var orders = await _orderRepository.GetAllAsync();
                var drivers = await _driverRepository.GetAllAsync();
                var vehicles = await _transportVehicleRepository.GetAllAsync();
                var rates = await _rateRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null);

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словари для быстрого доступа
                var driversDict = drivers?.Where(d => d.IsDeleted == null).ToDictionary(d => d.Id);
                var vehiclesDict = vehicles?.Where(v => v.IsDeleted == null).ToDictionary(v => v.Id);
                var ratesDict = rates?.Where(r => r.IsDeleted == null).ToDictionary(r => r.Id);

                // Группируем заказы по водителям (через транспортные средства) и считаем прибыль
                var driverStats = filteredOrders
                    .Where(o => vehiclesDict != null && vehiclesDict.ContainsKey(o.TransportVehicleId) &&
                               driversDict != null && driversDict.ContainsKey(vehiclesDict[o.TransportVehicleId].DriverId) &&
                               ratesDict != null && ratesDict.ContainsKey(o.RateId))
                    .GroupBy(o => vehiclesDict[o.TransportVehicleId].DriverId)
                    .Select(g => {
                        var driver = driversDict[g.Key];
                        var driverVehicles = vehiclesDict.Values
                            .Where(v => v.DriverId == g.Key)
                            .ToList();

                        // Рассчитываем общую прибыль для водителя
                        var totalProfit = g.Sum(o => CalculateOrderCost(o, ratesDict[o.RateId]));
                        var averageProfitPerOrder = g.Average(o => CalculateOrderCost(o, ratesDict[o.RateId]));

                        return new {
                            DriverId = g.Key,
                            DriverName = $"{driver.Surname} {driver.Forename}",
                            DriverPhone = driver.PhoneNumber,
                            DriverLicense = $"{driver.DriverLicenceSeries} {driver.DriverLicenceNumber}",
                            TotalProfit = totalProfit,
                            OrderCount = g.Count(),
                            TotalDistance = g.Sum(o => o.Distance),
                            AverageProfitPerOrder = averageProfitPerOrder,
                            AverageDistance = g.Average(o => o.Distance),
                            AssignedVehiclesCount = driverVehicles.Count,
                            VehicleModels = driverVehicles.Select(v => v.Model).Distinct().ToList()
                        };
                    })
                    .OrderByDescending(d => d.TotalProfit)
                    .Take(5)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    drivers = driverStats,
                });

            } catch (Exception ex) {
                _logger.LogError(ex, $"Сортировка водителей по прибыльности закончилась ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }

        // Блок 4. Тарифы

        // GET: api/{entity}/rate/popularity/quarter?yearStart={yearStart}&yearEnd={yearEnd}
        [HttpGet("rate/popularity/quarter")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> RatePopularityByQuarters([FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем все заказы и тарифы
                var orders = await _orderRepository.GetAllAsync();
                var rates = await _rateRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null);

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словарь тарифов для быстрого доступа
                var ratesDict = rates?.Where(r => r.IsDeleted == null).ToDictionary(r => r.Id);

                // Группируем по кварталам и тарифам
                var rateStatsByQuarter = filteredOrders
                    .Where(o => ratesDict != null && ratesDict.ContainsKey(o.RateId))
                    .GroupBy(o => new {
                        Year = o.WhenAdded.Year,
                        Quarter = (o.WhenAdded.Month - 1) / 3 + 1,
                        RateId = o.RateId
                    })
                    .Select(g => {
                        var rate = ratesDict[g.Key.RateId];
                        return new {
                            Year = g.Key.Year,
                            Quarter = g.Key.Quarter,
                            RateId = g.Key.RateId,
                            RateName = rate.Forename,
                            MovePrice = rate.MovePrice,
                            IdlePrice = rate.IdlePrice,
                            OrderCount = g.Count(),
                            TotalDistance = g.Sum(o => o.Distance),
                            TotalRevenue = g.Sum(o => CalculateOrderCost(o, rate))
                        };
                    })
                    .ToList();

                // Группируем по кварталам и рассчитываем долевое распределение
                var rateDistributionByQuarter = rateStatsByQuarter
                    .GroupBy(q => new { q.Year, q.Quarter })
                    .Select(g => {
                        var quarterTotalOrders = g.Sum(x => x.OrderCount);
                        var quarterTotalRevenue = g.Sum(x => x.TotalRevenue);

                        var rateDistribution = g.Select(r => new {
                            r.RateId,
                            r.RateName,
                            r.OrderCount,
                            OrderPercentage = quarterTotalOrders > 0 ? (r.OrderCount * 100.0) / quarterTotalOrders : 0,
                        })
                        .OrderByDescending(r => r.OrderCount)
                        .ToList();

                        return new {
                            Year = g.Key.Year,
                            Quarter = g.Key.Quarter,
                            TotalOrders = quarterTotalOrders,
                            TotalRevenue = quarterTotalRevenue,
                            RateDistribution = rateDistribution,
                            MostPopularRate = rateDistribution.FirstOrDefault(),
                            RatesCount = rateDistribution.Count
                        };
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Quarter)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    distribution = rateDistributionByQuarter
                });

            } catch (Exception ex) {
                _logger.LogError(ex, $"Статистика популярности тарифов по кварталам закончилась ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }

        // GET: api/{entity}/rate/popularity/year?yearStart={yearStart}&yearEnd={yearEnd}
        [HttpGet("rate/popularity/year")]
        [Authorize(Roles = "Admin, Director")]
        public async Task<IActionResult> RatePopularityByYears([FromQuery] int yearStart, [FromQuery] int yearEnd) {
            try {
                // Получаем все заказы и тарифы
                var orders = await _orderRepository.GetAllAsync();
                var rates = await _rateRepository.GetAllAsync();

                // Фильтруем заказы по запрошенным годам
                var filteredOrders = orders?.Where(o => o.WhenAdded.Year >= yearStart &&
                                                       o.WhenAdded.Year <= yearEnd &&
                                                       o.IsDeleted == null);

                if (filteredOrders == null || !filteredOrders.Any())
                    return BadRequest(new { message = "Данные за запрошенный период отсутствуют" });

                // Создаем словарь тарифов для быстрого доступа
                var ratesDict = rates?.Where(r => r.IsDeleted == null).ToDictionary(r => r.Id);

                // Группируем по годам и тарифам
                var rateStatsByYear = filteredOrders
                    .Where(o => ratesDict != null && ratesDict.ContainsKey(o.RateId))
                    .GroupBy(o => new {
                        Year = o.WhenAdded.Year,
                        RateId = o.RateId
                    })
                    .Select(g => {
                        var rate = ratesDict[g.Key.RateId];
                        return new {
                            Year = g.Key.Year,
                            RateId = g.Key.RateId,
                            RateName = rate.Forename,
                            MovePrice = rate.MovePrice,
                            IdlePrice = rate.IdlePrice,
                            OrderCount = g.Count(),
                            TotalDistance = g.Sum(o => o.Distance),
                            TotalRevenue = g.Sum(o => CalculateOrderCost(o, rate))
                        };
                    })
                    .ToList();

                // Группируем по годам и рассчитываем долевое распределение
                var rateDistributionByYear = rateStatsByYear
                    .GroupBy(q => q.Year)
                    .Select(g => {
                        var yearTotalOrders = g.Sum(x => x.OrderCount);
                        var yearTotalRevenue = g.Sum(x => x.TotalRevenue);

                        var rateDistribution = g.Select(r => new {
                            r.RateId,
                            r.RateName,
                            r.OrderCount,
                            OrderPercentage = yearTotalOrders > 0 ? (r.OrderCount * 100.0) / yearTotalOrders : 0,
                        })
                        .OrderByDescending(r => r.OrderCount)
                        .ToList();

                        return new {
                            Year = g.Key,
                            TotalRevenue = yearTotalRevenue,
                            RateDistribution = rateDistribution,
                            RatesCount = rateDistribution.Count
                        };
                    })
                    .OrderBy(x => x.Year)
                    .ToList();

                return Ok(new {
                    period = $"{yearStart}-{yearEnd}",
                    distribution = rateDistributionByYear
                });

            } catch (Exception ex) {
                _logger.LogError(ex, $"Статистика популярности тарифов по годам закончилась ошибкой: {ex.Message}");
                return StatusCode(500, new { error = "Внутренняя ошибка" });
            }
        }
    }
}
