using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TypeId = int;

namespace DbAPI.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class RoleController : BaseCrudController<Role, TypeId> {
        private readonly ILogger<Role> _logger;

        public RoleController(IRepository<Role, TypeId> repository, ILogger<Role> logger) : base(repository) {
            _logger = logger;
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
        public override async Task<ActionResult<Role>> CreateAsync([FromBody] Role entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Role.Create()\"");
            try {
                await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Role.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Role.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return CreatedAtAction(nameof(GetAsync), new { id = GetEntityId(entity) }, entity);
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

            await _repository.UpdateAsync(entity);
            _logger.LogInformation($"Запрос \"Role.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return NoContent();
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Role.Delete({id})\"");
            if (await _repository.GetByIdAsync(id) == null) {
                _logger.LogError($"Запрос \"Role.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }
            await _repository.SoftDeleteAsync(id);
            _logger.LogInformation($"Запрос \"Role.Delete({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return NoContent();
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Role.RecoverAsync({id})\"");
            var entity = await _repository.GetByIdAsync(id);
            if (entity != null) {
                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _repository.UpdateAsync(entity);

                _logger.LogInformation($"Запрос \"Role.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" успешен");
                return Ok("Восстановление прошло успешно");
            }

            _logger.LogError($"Запрос \"Role.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена или уже существует");
            return NotFound(new { message = $"Сущность с ID = {id} не найдена или уже существует" });
        }
    }
}
