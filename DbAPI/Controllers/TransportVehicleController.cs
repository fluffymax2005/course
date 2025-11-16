using DbAPI.Classes;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Drawing;
using static System.Runtime.InteropServices.JavaScript.JSType;
using TypeId = int;

namespace DbAPI.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class TransportVehicleController : BaseCrudController<TransportVehicle, TypeId>, ITableState {
        private readonly ILogger<TransportVehicleController> _logger;
        private readonly IMemoryCache _cache;
        private readonly IRepository<Driver, TypeId> _driverRepository;

        public TransportVehicleController(IRepository<TransportVehicle, TypeId> repository,
            ILogger<TransportVehicleController> logger, IMemoryCache cache, IRepository<Driver, TypeId> driverRepository) : base(repository) {
            _logger = logger;
            _cache = cache;
            _driverRepository = driverRepository;
        }

        protected int GetEntityId(TransportVehicle entity) {
            return entity.Id;
        }

        // GET: api/{entity}/
        [HttpGet]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<IEnumerable<TransportVehicle>>> GetAllAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.GetAll()\"");
            return Ok(await _repository.GetAllAsync());
        }

        // GET: api/{entity}/merge
        [HttpGet("merge")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public async Task<ActionResult<IEnumerable<TransportVehicle>>> GetAllMergedAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.GetAllMerged()\"");

            var vehicles = await _repository.GetAllAsync();
            var drivers = await _driverRepository.GetAllAsync();
            return Ok(vehicles.Join(
                drivers,
                vehicle => vehicle.DriverId,
                driver => driver.Id,
                (vehicle, driver) => new {
                    Id = vehicle.Id,
                    DriverId = $"{driver.Surname} {driver.Forename[0]}. ({driver.Id})",
                    Number = vehicle.Number,
                    Series = vehicle.Series,
                    RegistrationCode = vehicle.RegistrationCode,
                    Model = vehicle.Model,
                    Color = vehicle.Color,
                    ReleaseYear = vehicle.ReleaseYear,
                    WhoAdded = vehicle.WhoAdded,
                    WhenAdded = vehicle.WhenAdded,
                    WhoChanged = vehicle.WhoChanged,
                    WhenChanged = vehicle.WhenChanged,
                    Note = vehicle.Note,
                    IsDeleted = vehicle.IsDeleted
                }
            ));
        }

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<TransportVehicle>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.Get({id})\"");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // GET: api/{entity}/merge
        [HttpGet("{id}/merge")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public async Task<ActionResult<IEnumerable<TransportVehicle>>> GetMergedAsync(TypeId id) {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.GetMerged({id})\"");

            var vehicle = await _repository.GetByIdAsync(id);
            var drivers = await _driverRepository.GetAllAsync();
            var driver = drivers.Where(d => d.Id == vehicle.DriverId).FirstOrDefault();

            return Ok(new {
                Id = vehicle.Id,
                DriverId = $"{driver.Surname} {driver.Forename[0]}. ({driver.Id})",
                Number = vehicle.Number,
                Series = vehicle.Series,
                RegistrationCode = vehicle.RegistrationCode,
                Model = vehicle.Model,
                Color = vehicle.Color,
                ReleaseYear = vehicle.ReleaseYear,
                WhoAdded = vehicle.WhoAdded,
                WhenAdded = vehicle.WhenAdded,
                WhoChanged = vehicle.WhoChanged,
                WhenChanged = vehicle.WhenChanged,
                Note = vehicle.Note,
                IsDeleted = vehicle.IsDeleted
            });
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> CreateAsync([FromBody] TransportVehicle entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.Create()\"");
            TypeId? id;
            entity.WhoAdded = User.Identity.Name;
            try {
                id = await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"TransportVehicle.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"TransportVehicle.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash(), id = id });
        }

        // PUT: api/{entity}/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> UpdateAsync(TypeId id, [FromBody] TransportVehicle entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.Update({id})\"");
            if (!id.Equals(GetEntityId(entity))) {
                _logger.LogError($"Запрос \"TransportVehicle.Update({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }

            entity.WhoChanged = User.Identity.Name;
            try {
                await _repository.UpdateAsync(entity);
            } catch (InvalidDataException ex) {
                _logger.LogError($"TransportVehicle:UpdateAsync({id}): {ex.Message}");
                return BadRequest($"Ошибка сохранения: {ex.Message}");
            }

            _logger.LogInformation($"Запрос \"TransportVehicle.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.Delete({id})\"");

            try {
                await _repository.SoftDeleteAsync(id, User.Identity.Name);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"TransportVehicle.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"TransportVehicle.Delete({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.RecoverAsync({id})\"");

            try {
                await _repository.RecoverAsync(id, User.Identity.Name);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"TransportVehicle.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return NotFound(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"TransportVehicle.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" успешен");
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
            var cacheKey = "TransportVehicle";
            var cacheHash = _cache.Get<string>(cacheKey);

            if (cacheHash == null) {
                var newHash = UpdateTableHash();
                return Ok(new { result = "0", hash = newHash });
            } else {
                var verifyResult = cacheHash.Equals(hash);
                return Ok(new {
                    result = verifyResult ? "1" : "0",
                    hash = verifyResult ? hash : cacheHash
                });
            }
        }

        private string UpdateTableHash() {
            var cacheKey = "TransportVehicle";
            var hash = Hasher.CreateTableHash();

            _cache.Remove(cacheKey); // remove old hash
            _cache.Set(cacheKey, hash); // add new hash

            return hash;
        }
    }
}
