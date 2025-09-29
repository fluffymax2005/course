using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseCrudController<TEntity, TKey> : ControllerBase {
    protected readonly IRepository<TEntity, TKey> _repository;

    public BaseCrudController(IRepository<TEntity, TKey> repository) {
        _repository = repository;
    }

    // GET: api/{entity}/
    [HttpGet]
    public abstract Task<ActionResult<IEnumerable<TEntity>>> GetAllAsync();

    // GET: api/{entity}/{id}
    [HttpGet("{id}")]
    public abstract Task<ActionResult<TEntity>> GetAsync(TKey id);

    // POST: api/{entity}/
    [HttpPost]
    public abstract Task<ActionResult<TEntity>> CreateAsync([FromBody] TEntity entity);

    // PUT: api/{entity}/{id}
    [HttpPut("{id}")]
    public abstract Task<IActionResult> UpdateAsync(TKey id, [FromBody] TEntity entity);

    // DELETE: api/{entity}/{id}
    [HttpDelete("{id}")]
    public abstract Task<IActionResult> DeleteAsync(TKey id);

    // Update: api/{entity}/{id}/recover
    [HttpPatch("{id}/recover")]
    public abstract Task<IActionResult> RecoverAsync(TKey id);
}