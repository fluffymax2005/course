using DbAPI.Contexts;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.EntityFrameworkCore;
using static DbAPI.Interfaces.IInformation;

using TypeId = int;

namespace DbAPI.Repositories {
    public class RoleRepository : IRepository<Role, TypeId> {
        private readonly CredentialDbContext _context;

        public RoleRepository(CredentialDbContext context) {
            _context = context;
        }

        public async Task<Role?> GetByIdAsync(TypeId id) {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<Role?> GetByUserRights(UserRights rights) {
            return await _context.Roles
                .FirstOrDefaultAsync(r => r.Rights == rights);
        }

        public async Task<IEnumerable<Role>?> GetAllAsync() {
            return await _context.Roles.ToListAsync();
        }

        public async Task<TypeId?> AddAsync(Role entity) {
            entity.WhenAdded = DateTime.Now;
            entity.WhoChanged = null;
            entity.WhenChanged = null;
            entity.IsDeleted = null;

            await _context.Roles.AddAsync(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
        }

        public async Task UpdateAsync(Role entity) {
            entity.WhenChanged = DateTime.Now;

            _context.Roles.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task SoftDeleteAsync(TypeId id, string userName) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                if (entity.IsDeleted != null)
                    throw new ArgumentException($"Запись с ID = {id} уже удалена");

                entity.WhoChanged = userName;
                entity.IsDeleted = DateTime.Now; // soft delete
                entity.WhenChanged = DateTime.Now;
                await _context.SaveChangesAsync();
                return;
            }
            throw new ArgumentException($"Сущность с ID = {id} не существует в БД.");
        }

        public async Task DeleteAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                _context.Roles.Remove(entity);
                await _context.SaveChangesAsync();
                return;
            }
            throw new ArgumentException($"Сущность с ID = {id} не существует в БД.");
        }

        public async Task RecoverAsync(TypeId id, string userName) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                if (entity.IsDeleted == null)
                    throw new ArgumentException($"Сущность с ID = {id} существует в БД.");

                entity.WhoChanged = userName;
                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _context.SaveChangesAsync();
                return;
            }
            throw new ArgumentException($"Сущность с ID = {id} не существует в БД.");
        }
    }
}
