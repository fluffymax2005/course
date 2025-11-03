using DbAPI.Classes;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using TypeId = int;

namespace DbAPI.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class TransportVehicleController : BaseCrudController<TransportVehicle, TypeId>, ITableState {
        private readonly ILogger<TransportVehicleController> _logger;
        private readonly IMemoryCache _cache;

        public TransportVehicleController(IRepository<TransportVehicle, TypeId> repository,
            ILogger<TransportVehicleController> logger, IMemoryCache cache) : base(repository) {
            _logger = logger;
            _cache = cache;
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

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<TransportVehicle>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.Get({id})\"");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> CreateAsync([FromBody] TransportVehicle entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.Create()\"");
            try {
                await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"TransportVehicle.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"TransportVehicle.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
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
            if (await _repository.GetByIdAsync(id) == null) {
                _logger.LogError($"Запрос \"TransportVehicle.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }
            await _repository.SoftDeleteAsync(id);
            _logger.LogInformation($"Запрос \"TransportVehicle.Delete({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.RecoverAsync({id})\"");
            var entity = await _repository.GetByIdAsync(id);
            if (entity != null) {
                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _repository.UpdateAsync(entity);

                _logger.LogInformation($"Запрос \"TransportVehicle.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" успешен");
                return Ok(new { message = "Восстановление прошло успешно", hash = UpdateTableHash() });
            }

            _logger.LogError($"Запрос \"TransportVehicle.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена или уже существует");
            return NotFound(new { message = $"Сущность с ID = {id} не найдена или уже существует" });
        }

        // api/{entity}/generate-table-state-hash
        [HttpGet("generate-table-state-hash")]
        [Authorize]
        public IActionResult GenerateTableStateHash() {
            _logger.LogInformation($"Перегенерация хэша актульности таблицы \"Credential\"");

            return Ok(new { hash = UpdateTableHash() });
        }

        // api/{entity}/verify-table-state-hash
        [HttpPost("verify-table-state-hash")]
        [Authorize]
        public IActionResult VerifyTableStateHash([FromBody] string hash) {
            var cacheKey = "TransportVehicle";
            var cacheHash = _cache.Get<string>(cacheKey);

            // Создаем новый хэш для сравнения
            var newHash = Hasher.CreateTableHash();

            if (cacheHash == null) {
                _cache.Set(cacheKey, newHash);
                return Ok(new { result = "0", hash = newHash });
            } else {
                var verifyResult = cacheHash.Equals(hash);
                return Ok(new {
                    result = verifyResult ? "1" : "0",
                    hash = verifyResult ? hash : newHash,
                });
            }
        }

        public string UpdateTableHash() {
            var cacheKey = "TransportVehicle";
            var hash = Hasher.CreateTableHash();

            _cache.Remove(cacheKey); // remove old hash
            _cache.Set(cacheKey, hash); // add new hash

            return hash;
        }
    }
}
