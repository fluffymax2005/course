using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TypeId = int;

namespace DbAPI.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : BaseCrudController<Order, TypeId> {
        private readonly ILogger<Order> _logger;

        public OrderController(IRepository<Order, TypeId> repository, ILogger<Order> logger) : base(repository) {
            _logger = logger;
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

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Basic, Editor, Admin")]
        public override async Task<ActionResult<Order>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Order.Get({id})\"");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Editor, Admin")]
        public override async Task<ActionResult<Order>> CreateAsync([FromBody] Order entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Order.Create()\"");
            try {
                await _repository.AddAsync(entity);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Order.Create()\" пользователя \"{User.Identity.Name}\" завершился ошибкой. Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Order.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return CreatedAtAction(nameof(GetAsync), new { id = GetEntityId(entity) }, entity);
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

            try {
                await _repository.UpdateAsync(entity);
            } catch (InvalidDataException ex) {
                _logger.LogError($"Order:UpdateAsync({id}): {ex.Message}");
                return BadRequest($"Ошибка сохранения: {ex.Message}");
            }
            _logger.LogInformation($"Запрос \"Order.Update({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return NoContent();
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Order.Delete({id})\"");
            if (await _repository.GetByIdAsync(id) == null) {
                _logger.LogError($"Запрос \"Order.Delete({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }
            await _repository.SoftDeleteAsync(id);
            _logger.LogInformation($"Запрос \"Order.Delete({id})\" пользователя \"{User.Identity.Name}\" успешен");
            return NoContent();
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Order.RecoverAsync({id})\"");
            var entity = await _repository.GetByIdAsync(id);
            if (entity != null) {
                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _repository.UpdateAsync(entity);

                _logger.LogInformation($"Запрос \"Order.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" успешен");
                return Ok("Восстановление прошло успешно");
            }

            _logger.LogError($"Запрос \"Order.RecoverAsync({id})\" пользователя \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: сущность не найдена или уже существует");
            return NotFound(new { message = $"Сущность с ID = {id} не найдена или уже существует" });
        }
    }
}