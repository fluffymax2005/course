using DbAPI.Core.Entities;
using DbAPI.Infrastructure.Classes;
using DbAPI.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Route = DbAPI.Core.Entities.Route;

using TypeId = int;

namespace DbAPI.Infrastructure.Controllers {
    [Route("api/[controller]")]
    [ApiController]
    public class GeneratorController : ControllerBase {
        private readonly ILogger<GeneratorController> _logger;
        private readonly OrderRepository _orderRepository;
        private readonly CustomerRepository _customerRepository;
        private readonly DriverRepository _driverRepository;
        private readonly RateRepository _rateRepository;
        private readonly RouteRepository _routeRepository;
        private readonly TransportVehicleRepository _vehicleRepository;

        public GeneratorController(
            ILogger<GeneratorController> logger,
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            DriverRepository driverRepository,
            RateRepository rateRepository,
            RouteRepository routeRepository,
            TransportVehicleRepository vehicleRepository) {

            _logger = logger;
            _orderRepository = orderRepository;
            _customerRepository = customerRepository;
            _driverRepository = driverRepository;
            _rateRepository = rateRepository;
            _routeRepository = routeRepository;
            _vehicleRepository = vehicleRepository;
        }

        [HttpGet("order")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateOrders([FromQuery] TypeId count) {
            _logger.LogWarning($"Администратор \"{User.Identity.Name}\" начал выполнение GeneratorController.GenerateOrders({count})");

            if (count <= 0) {
                _logger.LogError($"GeneratorController.GenerateOrders({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей должно быть положительным числом.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей должно быть положительным числом." });
            }

            var orders = await _orderRepository.GetAllAsync();
            if (orders.Count() + count > TypeId.MaxValue) {
                _logger.LogError($"GeneratorController.GenerateOrders({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД." });
            }

            var customers = (List<Customer>)await _customerRepository.GetAllAsync();
            var routes = (List<Route>)await _routeRepository.GetAllAsync();
            var rates = (List<Rate>)await _rateRepository.GetAllAsync();
            var vehicles = (List<TransportVehicle>)await _vehicleRepository.GetAllAsync();

            var generatedOrders = Generators.GenerateOrders(customers, routes, rates, vehicles, count, true);
            if (generatedOrders == null || generatedOrders.Count == 0) {
                _logger.LogError($"GeneratorController.GenerateOrders({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Отсутствует(-ют) одна или несколько зависимых таблиц.");
                return BadRequest(new { message = "Генерация невозможна. Отсутствует(-ют) одна или несколько зависимых таблиц." });
            }

            foreach (var entity in generatedOrders) {
                entity.WhoAdded = User.Identity.Name;
            }

            await _orderRepository.AddCollectionAsync(generatedOrders);

            _logger.LogInformation($"GeneratorController.GenerateOrders({count}) завершилась успешно.");
            return Ok(new { message = "Генерация прошла успешно." });
        }

        [HttpGet("customer")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateCustomers([FromQuery] TypeId count) {
            _logger.LogWarning($"Администратор \"{User.Identity.Name}\" начал выполнение GeneratorController.GenerateCustomers({count})");

            if (count <= 0) {
                _logger.LogError($"GeneratorController.GenerateCustomers({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей должно быть положительным числом.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей должно быть положительным числом." });
            }

            var customers = await _customerRepository.GetAllAsync();
            if (customers.Count() + count > TypeId.MaxValue) {
                _logger.LogError($"GeneratorController.GenerateCustomers({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД." });
            }

            var generatedCustomers = Generators.GenerateCustomers(count, true);
            if (generatedCustomers == null || generatedCustomers.Count == 0) {
                _logger.LogError($"GeneratorController.GenerateCustomers({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Внутренняя ошибка Generators.GenerateCustomers({count}).");
                return BadRequest(new { message = "Генерация невозможна. Внутренняя ошибка." });
            }

            foreach (var entity in generatedCustomers) {
                entity.WhoAdded = User.Identity.Name;
            }

            await _customerRepository.AddCollectionAsync(generatedCustomers);

            _logger.LogInformation($"GeneratorController.GenerateCustomers({count}) завершилась успешно.");
            return Ok(new { message = "Генерация прошла успешно." });
        }

        [HttpGet("driver")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateDrivers([FromQuery] TypeId count) {
            _logger.LogWarning($"Администратор \"{User.Identity.Name}\" начал выполнение GeneratorController.GenerateDrivers({count})");

            if (count <= 0) {
                _logger.LogError($"GeneratorController.GenerateDrivers({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей должно быть положительным числом.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей должно быть положительным числом." });
            }

            var drivers = await _driverRepository.GetAllAsync();
            if (drivers.Count() + count > TypeId.MaxValue) {
                _logger.LogError($"GeneratorController.GenerateDrivers({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД." });
            }

            var generatedDrivers = Generators.GenerateDrivers(count, true);
            if (generatedDrivers == null || generatedDrivers.Count == 0) {
                _logger.LogError($"GeneratorController.GenerateDrivers({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Внутренняя ошибка Generators.GenerateDrivers({count}).");
                return BadRequest(new { message = "Генерация невозможна. Внутренняя ошибка." });
            }

            foreach (var entity in generatedDrivers) {
                entity.WhoAdded = User.Identity.Name;
            }

            await _driverRepository.AddCollectionAsync(generatedDrivers);

            _logger.LogInformation($"GeneratorController.GenerateDrivers({count}) завершилась успешно.");
            return Ok(new { message = "Генерация прошла успешно." });
        }

        [HttpGet("rate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateRates([FromQuery] TypeId count) {
            _logger.LogWarning($"Администратор \"{User.Identity.Name}\" начал выполнение GeneratorController.GenerateRates({count})");

            if (count <= 0) {
                _logger.LogError($"GeneratorController.GenerateRates({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей должно быть положительным числом.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей должно быть положительным числом." });
            }

            var rates = await _rateRepository.GetAllAsync();
            if (rates.Count() + count > TypeId.MaxValue) {
                _logger.LogError($"GeneratorController.GenerateRates({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД." });
            }

            var drivers = (List<Driver>)await _driverRepository.GetAllAsync();
            var vehicles = (List<TransportVehicle>)await _vehicleRepository.GetAllAsync();

            var generatedRates = Generators.GenerateRates(drivers, vehicles, count, true);
            if (generatedRates == null || generatedRates.Count == 0) {
                _logger.LogError($"GeneratorController.GenerateRates({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Отсутствует(-ют) одна или несколько зависимых таблиц, либо число тарифов меньше 5, либо тарифы уже сгенерированы.");
                return BadRequest(new {
                    message = "Генерация невозможна. Отсутствует(-ют) одна или несколько зависимых таблиц, " +
                    "либо число тарифов меньше 5, либо тарифы уже сгенерированы."
                });
            }

            foreach (var entity in generatedRates) {
                entity.WhoAdded = User.Identity.Name;
            }

            await _rateRepository.AddCollectionAsync(generatedRates);

            _logger.LogInformation($"GeneratorController.GenerateRates({count}) завершилась успешно.");
            return Ok(new { message = "Генерация прошла успешно." });
        }

        [HttpGet("route")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateRoutes([FromQuery] TypeId count) {
            _logger.LogWarning($"Администратор \"{User.Identity.Name}\" начал выполнение GeneratorController.GenerateRoutes({count})");

            if (count <= 0) {
                _logger.LogError($"GeneratorController.GenerateRoutes({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей должно быть положительным числом.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей должно быть положительным числом." });
            }

            var routes = await _routeRepository.GetAllAsync();
            if (routes.Count() + count > TypeId.MaxValue) {
                _logger.LogError($"GeneratorController.GenerateRoutes({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД." });
            }

            var generatedRoutes = Generators.GenerateRoutes(count, true);
            if (generatedRoutes == null || generatedRoutes.Count == 0) {
                _logger.LogError($"GeneratorController.GenerateRoutes({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Внутренняя ошибка Generators.GenerateRoutes({count}).");
                return BadRequest(new { message = "Генерация невозможна. Внутренняя ошибка." });
            }

            foreach (var entity in generatedRoutes) {
                entity.WhoAdded = User.Identity.Name;
            }

            await _routeRepository.AddCollectionAsync(generatedRoutes);

            _logger.LogInformation($"GeneratorController.GenerateRoutes({count}) завершилась успешно.");
            return Ok(new { message = "Генерация прошла успешно." });
        }

        [HttpGet("transportvehicle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GenerateVehicles([FromQuery] TypeId count) {
            _logger.LogWarning($"Администратор \"{User.Identity.Name}\" начал выполнение GeneratorController.GenerateVehicles({count})");

            if (count <= 0) {
                _logger.LogError($"GeneratorController.GenerateVehicles({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей должно быть положительным числом.");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей должно быть положительным числом." });
            }

            var vehicles = await _routeRepository.GetAllAsync();
            if (vehicles.Count() + count > TypeId.MaxValue) {
                _logger.LogError($"GeneratorController.GenerateVehicles({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД");
                return BadRequest(new { message = "Генерация невозможна. Запрошенное количество записей превышает максимальную вместимость таблицы БД." });
            }

            var drivers = (List<Driver>)await _driverRepository.GetAllAsync();

            var generatedVehicles = Generators.GenerateTransportVehicles(drivers, count, true);
            if (generatedVehicles == null || generatedVehicles.Count == 0) {
                _logger.LogError($"GeneratorController.GenerateVehicles({count}) завершилась неуспешно. Причина: " +
                    $"генерация невозможна. Отсутствует(-ют) одна или несколько зависимых таблиц.");
                return BadRequest(new { message = "Генерация невозможна. Отсутствует(-ют) одна или несколько зависимых таблиц." });
            }

            foreach (var entity in generatedVehicles) {
                entity.WhoAdded = User.Identity.Name;
            }

            await _vehicleRepository.AddCollectionAsync(generatedVehicles);

            _logger.LogInformation($"GeneratorController.GenerateVehicles({count}) завершилась успешно.");
            return Ok(new { message = "Генерация прошла успешно." });
        }
    }
}
