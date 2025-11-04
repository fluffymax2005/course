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
    public class RouteController : BaseCrudController<Models.Route, TypeId>, ITableState {
        private readonly ILogger<RouteController> _logger;
        private readonly IMemoryCache _cache;

        public RouteController(IRepository<Models.Route, int> repository, ILogger<RouteController> logger,
            IMemoryCache cache) : base(repository) {
            _logger = logger;
            _cache = cache;
        }

        protected int GetEntityId(Models.Route entity) {
            return entity.Id;
        }

        // GET: api/{entity}/
        [HttpGet]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<IEnumerable<Models.Route>>> GetAllAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Route.GetAll()\"");
            return Ok(await _repository.GetAllAsync());
        }

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<Models.Route>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Route.Get({id})\"");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> CreateAsync([FromBody] Models.Route entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Route.Create()\"");
            try {
                await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Route.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Route.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // PUT: api/{entity}/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<IActionResult> UpdateAsync(TypeId id, [FromBody] Models.Route entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Route.Update({id})\"");
            if (!id.Equals(GetEntityId(entity))) {
                _logger.LogError($"Запрос \"Route.Update({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }

            await _repository.UpdateAsync(entity);
            _logger.LogInformation($"Запрос \"Route.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Route.Delete({id})\"");
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) {
                _logger.LogError($"Запрос \"Route.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            } else if (entity.IsDeleted != null) {
                _logger.LogError($"Запрос \"Route.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность уже удалена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }
                await _repository.SoftDeleteAsync(id);
            _logger.LogInformation($"Запрос \"Route.Delete({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash() });
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Route.RecoverAsync({id})\"");
            var entity = await _repository.GetByIdAsync(id);
            if (entity != null) {
                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _repository.UpdateAsync(entity);

                _logger.LogInformation($"Запрос \"Route.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" успешен");
                return Ok(new { message = "Восстановление прошло успешно", hash = UpdateTableHash() });
            }

            _logger.LogError($"Запрос \"Route.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
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
            var cacheKey = "Route";
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
            var cacheKey = "Route";
            var hash = Hasher.CreateTableHash();

            _cache.Remove(cacheKey); // remove old hash
            _cache.Set(cacheKey, hash); // add new hash

            return hash;
        }
    }
}
