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
    public class RoleController : BaseCrudController<Role, TypeId>, ITableState {
        private readonly ILogger<Role> _logger;
        private readonly IMemoryCache _cache;

        public RoleController(IRepository<Role, TypeId> repository, ILogger<Role> logger, IMemoryCache cache) : base(repository) {
            _logger = logger;
            _cache = cache;
        }

        protected int GetEntityId(Role entity) {
            return entity.Id;
        }

        // GET: api/{entity}/
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public override async Task<ActionResult<IEnumerable<Role>>> GetAllAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Role.GetAll()\"");
            return Ok(await _repository.GetAllAsync());
        }

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<ActionResult<Role>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Role.Get({id})\"");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> CreateAsync([FromBody] Role entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Role.Create()\"");
            TypeId? id;
            entity.WhoAdded = User.Identity.Name;
            try {
                id = await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Role.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Role.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash(), id = id });
        }

        // PUT: api/{entity}/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> UpdateAsync(TypeId id, [FromBody] Role entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Role.Update({id})\"");
            if (!id.Equals(GetEntityId(entity))) {
                _logger.LogError($"Запрос \"Role.Update({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }

            entity.WhoChanged = User.Identity.Name;
            try {
                await _repository.UpdateAsync(entity);
            } catch (InvalidDataException ex) {
                _logger.LogError($"Role:UpdateAsync({id}): {ex.Message}");
                return BadRequest($"Ошибка сохранения: {ex.Message}");
            }

            _logger.LogInformation($"Запрос \"Role.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Role.Delete({id})\"");

            try {
                await _repository.SoftDeleteAsync(id);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Role.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return NotFound(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Role.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" успешен");
            return Ok(new { message = "Восстановление прошло успешно", hash = UpdateTableHash() });
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Role.RecoverAsync({id})\"");
            
            try {
                await _repository.RecoverAsync(id);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Role.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: ${ex.Message}");
                return NotFound(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Role.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { message = "Восстановление прошло успешно", hash = UpdateTableHash() });
        }

        // api/{entity}/generate-table-state-hash
        [HttpGet("generate-table-state-hash")]
        [Authorize(Roles = "Admin")]
        public IActionResult GenerateTableStateHash() {
            _logger.LogInformation($"Перегенерация хэша актульности таблицы \"Credential\"");

            return Ok(new { hash = UpdateTableHash() });
        }

        // api/{entity}/verify-table-state-hash
        [HttpGet("verify-table-state-hash")]
        [Authorize(Roles = "Admin")]
        public IActionResult VerifyTableStateHash([FromQuery] string hash) {
            var cacheKey = "Role";
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
            var cacheKey = "Role";
            var hash = Hasher.CreateTableHash();

            _cache.Remove(cacheKey); // remove old hash
            _cache.Set(cacheKey, hash); // add new hash

            return hash;
        }
    }
}
