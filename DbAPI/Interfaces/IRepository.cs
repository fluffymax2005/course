using TypeId = int;

namespace DbAPI.Interfaces {
    public interface IRepository<TEntity, TKey> {

        // Async versions
        Task<TEntity?> GetByIdAsync(TKey id);
        Task<IEnumerable<TEntity>?> GetAllAsync();
        Task<TypeId?> AddAsync(TEntity entity);
        Task UpdateAsync(TEntity entity);
        Task DeleteAsync(TKey id);
        Task SoftDeleteAsync(TKey id, string userName);
        Task RecoverAsync(TKey key, string userName);
    }
}
