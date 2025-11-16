using DbAPI.Classes;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using TypeId = int;

namespace db.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class RateController : BaseCrudController<Rate, TypeId>, ITableState {
        private readonly ILogger<Rate> _logger;
        private readonly IMemoryCache _cache;

        public RateController(IRepository<Rate, int> repository, ILogger<Rate> logger, IMemoryCache cache) : base(repository) {
            _logger = logger;
            _cache = cache;
        }

        protected int GetEntityId(Rate entity) {
            return entity.Id;
        }

        // GET: api/{entity}/
        [HttpGet]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<IEnumerable<Rate>>> GetAllAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Rate.GetAll()\"");
            return Ok(await _repository.GetAllAsync());
        }

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<Rate>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Rate.Get({id})\"");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> CreateAsync([FromBody] Rate entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Rate.Create()\"");
            TypeId? id;
            entity.WhoAdded = User.Identity.Name;
            try {
                id = await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Rate.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Rate.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash(), id = id });
        }

        // PUT: api/{entity}/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> UpdateAsync(TypeId id, [FromBody] Rate entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Rate.Update({id})\"");
            if (!id.Equals(GetEntityId(entity))) {
                _logger.LogError($"Запрос \"Rate.Update({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }

            entity.WhoChanged = User.Identity.Name;
            try {
                await _repository.UpdateAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Rate:UpdateAsync({id}): {ex.Message}");
                return BadRequest(new { message = $"Ошибка сохранения: {ex.Message}" });
            }

            _logger.LogInformation($"Запрос \"Rate.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Rate.Delete({id})\"");

            try {
                await _repository.SoftDeleteAsync(id, User.Identity.Name);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Rate.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Rate.Delete({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Rate.RecoverAsync({id})\"");

            try {
                await _repository.RecoverAsync(id, User.Identity.Name);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Rate.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Rate.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" успешен");
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
            var cacheKey = "Rate";
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
            var cacheKey = "Rate";
            var hash = Hasher.CreateTableHash();

            _cache.Remove(cacheKey); // remove old hash
            _cache.Set(cacheKey, hash); // add new hash

            return hash;
        }
    }
}
