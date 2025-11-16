using DbAPI.Classes;
using DbAPI.Interfaces;
using DbAPI.Models;
using DbAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using TypeId = int;

namespace DbAPI.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : BaseCrudController<Order, TypeId>, ITableState {
        private readonly ILogger<Order> _logger;
        private readonly IMemoryCache _cache;
        private readonly IRepository<Customer, TypeId> _customerRepository;
        private readonly IRepository<Models.Route, TypeId> _routeRepository;
        private readonly IRepository<Rate, TypeId> _rateRepository;
        private readonly IRepository<TransportVehicle, TypeId> _transportVehicleRepository;

        public OrderController(IRepository<Order, TypeId> repository, ILogger<Order> logger, IMemoryCache cache,
            IRepository<Customer, TypeId> customerRepository, IRepository<Models.Route, TypeId> routeRepository,
            IRepository<Rate, TypeId> rateRepository, IRepository<TransportVehicle, TypeId> transportVehicleRepository) : base(repository) {
            _logger = logger;
            _cache = cache;
            _customerRepository = customerRepository;
            _routeRepository = routeRepository;
            _rateRepository = rateRepository;
            _transportVehicleRepository = transportVehicleRepository;
        }

        protected TypeId GetEntityId(Order entity) {
            return entity.Id;
        }

        // GET: api/{entity}/
        [HttpGet]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<IEnumerable<Order>>> GetAllAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Order.GetAll()\"");
            return Ok(await _repository.GetAllAsync());
        }

        // GET: api/{entity}/merge
        [HttpGet("merge")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public async Task<ActionResult<IEnumerable<Order>>> GetAllMergedAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Order.GetAllMerged()\"");

            var orders = await _repository.GetAllAsync();
            var customers = await _customerRepository.GetAllAsync();
            var routes = await _routeRepository.GetAllAsync();
            var rates = await _rateRepository.GetAllAsync();
            var vehicles = await _transportVehicleRepository.GetAllAsync();
            
            return Ok(orders.Join(
                customers,
                order => order.CustomerId,
                customer => customer.Id,
                (order, customer) => new {
                    Id = order.Id,
                    CustomerId = $"{customer.Surname} {customer.Forename[0]}. ({customer.Id})",
                    RouteId = order.RouteId,
                    RateId = order.RateId,
                    TransportVehicleId = order.TransportVehicleId,
                    Distance = order.Distance,
                    WhoAdded = order.WhoAdded,
                    WhenAdded = order.WhenAdded,
                    WhoChanged = order.WhoChanged,
                    WhenChanged = order.WhenChanged,
                    Note = order.Note,
                    IsDeleted = order.IsDeleted
                }
            ).Join(
                routes,
                order => order.RouteId,
                route => route.Id,
                (order, route) => new {
                    Id = order.Id,
                    CustomerId = order.CustomerId,
                    RouteId = $"{route.BoardingAddress} ({route.Id})",
                    RateId = order.RateId,
                    TransportVehicleId = order.TransportVehicleId,
                    Distance = order.Distance,
                    WhoAdded = order.WhoAdded,
                    WhenAdded = order.WhenAdded,
                    WhoChanged = order.WhoChanged,
                    WhenChanged = order.WhenChanged,
                    Note = order.Note,
                    IsDeleted = order.IsDeleted
                }
            ).Join(
                rates,
                order => order.RateId,
                rate => rate.Id,
                (order, rate) => new {
                    Id = order.Id,
                    CustomerId = order.CustomerId,
                    RouteId = order.RouteId,
                    RateId = $"{rate.Forename} ({rate.Id})",
                    TransportVehicleId = order.TransportVehicleId,
                    Distance = order.Distance,
                    WhoAdded = order.WhoAdded,
                    WhenAdded = order.WhenAdded,
                    WhoChanged = order.WhoChanged,
                    WhenChanged = order.WhenChanged,
                    Note = order.Note,
                    IsDeleted = order.IsDeleted
                }
            ).Join(
                vehicles,
                order => order.TransportVehicleId,
                vehicle => vehicle.Id,
                (order, vehicle) => new {
                    Id = order.Id,
                    CustomerId = order.CustomerId,
                    RouteId = order.RouteId,
                    RateId = order.RateId,
                    TransportVehicleId = $"{vehicle.Model} ({vehicle.Id})",
                    Distance = order.Distance,
                    WhoAdded = order.WhoAdded,
                    WhenAdded = order.WhenAdded,
                    WhoChanged = order.WhoChanged,
                    WhenChanged = order.WhenChanged,
                    Note = order.Note,
                    IsDeleted = order.IsDeleted
                }
            ));
        }

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<Order>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Order.Get({id})\"");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // GET: api/{entity}/merge
        [HttpGet("{id}/merge")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public async Task<ActionResult<IEnumerable<Order>>> GetMergedAsync(TypeId id) {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Order.GetMerged({id})\"");

            var order = await _repository.GetByIdAsync(id);

            var customers = await _customerRepository.GetAllAsync();
            var customer = customers.Where(c => c.Id == order.CustomerId).FirstOrDefault();

            var routes = await _routeRepository.GetAllAsync();
            var route = routes.Where(r => r.Id == order.RouteId).FirstOrDefault();

            var rates = await _rateRepository.GetAllAsync();
            var rate = rates.Where(r => r.Id == order.RateId).FirstOrDefault();

            var vehicles = await _transportVehicleRepository.GetAllAsync();
            var vehicle = vehicles.Where(v => v.Id == order.TransportVehicleId).FirstOrDefault();

            return Ok(new {
                Id = order.Id,
                CustomerId = $"{customer.Surname} {customer.Forename[0]}. ({customer.Id})",
                RouteId = $"{route.DropAddress} ({route.Id})",
                RateId = $"{rate.Forename} ({rate.Id})",
                TransportVehicleId = $"{vehicle.Model} ({vehicle.Id})",
                Distance = order.Distance,
                WhoAdded = order.WhoAdded,
                WhenAdded = order.WhenAdded,
                WhoChanged = order.WhoChanged,
                WhenChanged = order.WhenChanged,
                Note = order.Note,
                IsDeleted = order.IsDeleted
            });
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> CreateAsync([FromBody] Order entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Order.Create()\"");
            TypeId? id;
            entity.WhoAdded = User.Identity.Name;
            try {
                id = await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Order.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Order.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash(), id = id });
        }

        // PUT: api/{entity}/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> UpdateAsync(TypeId id, [FromBody] Order entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Order.Update({id})\"");
            if (!id.Equals(GetEntityId(entity))) {
                _logger.LogError($"Запрос \"Order.Update({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }

            entity.WhoChanged = User.Identity.Name;
            try {
                await _repository.UpdateAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Order:UpdateAsync({id}): {ex.Message}");
                return BadRequest(new { message = $"Ошибка сохранения: {ex.Message}" });
            }

            _logger.LogInformation($"Запрос \"Order.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Order.Delete({id})\"");

            try {
                await _repository.SoftDeleteAsync(id, User.Identity.Name);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Order.DeleteAsync({id})\" администратора \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Order.DeleteAsync({id})\" администратора \"{User.Identity.Name}\" успешен");
            return Ok(new { message = "Восстановление прошло успешно", hash = UpdateTableHash() });
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Order.RecoverAsync({id})\"");
            
            try {
                await _repository.RecoverAsync(id, User.Identity.Name);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Order.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Order.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" успешен");
             return Ok(new { message = "Восстановление прошло успешно", hash = UpdateTableHash() });          
        }

        // api/{entity}/generate-table-state-hash
        [HttpGet("generate-table-state-hash")]
        [Authorize]
        public IActionResult GenerateTableStateHash() {
            _logger.LogInformation($"Перегенерация хэша актульности таблицы \"Credential\"");

            return Ok(new { hash = UpdateTableHash() });
        }

        // api/{entity}/verify-table-state-hash
        [HttpGet("verify-table-state-hash")]
        [Authorize]
        public IActionResult VerifyTableStateHash([FromQuery] string hash) {
            var cacheKey = "Order";
            var cacheHash = _cache.Get<string>(cacheKey);

            if (cacheHash == null) {
                var newHash = UpdateTableHash();
                return Ok(new { result = "0", hash = newHash });
            } else {
                var verifyResult = cacheHash.Equals(hash);
                return Ok(new {
                    result = verifyResult ? "1" : "0",
                    hash = verifyResult ? hash : cacheHash,
                });
            }
        }

        private string UpdateTableHash() {
            var cacheKey = "Order";
            var hash = Hasher.CreateTableHash();

            _cache.Remove(cacheKey); // remove old hash
            _cache.Set(cacheKey, hash); // add new hash

            return hash;
        }
    }
}