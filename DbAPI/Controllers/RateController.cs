using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TypeId = int;

namespace db.Controllers {
    [ApiController]
    [Route("api/[controller]")]
    public class RateController : BaseCrudController<Rate, TypeId> {
        private readonly ILogger<Rate> _logger;

        public RateController(IRepository<Rate, int> repository, ILogger<Rate> logger) : base(repository) {
            _logger = logger;
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
        public override async Task<ActionResult<Rate>> CreateAsync([FromBody] Rate entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Rate.Create()\"");
            try {
                await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Rate.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Rate.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return CreatedAtAction(nameof(GetAsync), new { id = GetEntityId(entity) }, entity);
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

            try {
                await _repository.UpdateAsync(entity);
            } catch (InvalidDataException ex) {
                _logger.LogError($"Rate:UpdateAsync({id}): {ex.Message}");
                return BadRequest($"Ошибка сохранения: {ex.Message}");
            }
            _logger.LogInformation($"Запрос \"Rate.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return NoContent();
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Rate.Delete({id})\"");
            if (await _repository.GetByIdAsync(id) == null) {
                _logger.LogError($"Запрос \"Rate.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }
            await _repository.SoftDeleteAsync(id);
            _logger.LogInformation($"Запрос \"Rate.Delete({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return NoContent();
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Rate.RecoverAsync({id})\"");
            var entity = await _repository.GetByIdAsync(id);
            if (entity != null) {
                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _repository.UpdateAsync(entity);

                _logger.LogInformation($"Запрос \"Rate.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" успешен");
                return Ok("Восстановление прошло успешно");
            }

            _logger.LogError($"Запрос \"Rate.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена или уже существует");
            return NotFound(new { message = $"Сущность с ID = {id} не найдена или уже существует" });
        }
    }
}
