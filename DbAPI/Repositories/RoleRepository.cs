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

        public async Task AddAsync(Role entity) {
            await _context.Roles.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Role entity) {
            _context.Roles.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task SoftDeleteAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                entity.IsDeleted = DateTime.Now; // soft delete
                entity.WhenChanged = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                _context.Roles.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        /*public async Task<TypeId> NewIdToAddAsync() {
            var entities = await GetAllAsync();
            if (entities == null)
                return 0; // entities are not found so can use id = 0

            // Get All deleted Ids in ascending order
            var Ids = entities
                .Where(e => e.IsDeleted != null || e.IsDeleted is null)
                .Select(e => e.Id)
                .OrderBy(id => id)
                .ToList();
            if (Ids.Last() == TypeId.MaxValue) {
                return -1; // all seats are reserved
            }

            return Ids.Last() + 1; // maybe all seats are reserved
        }*/

        public async Task<bool> RecoverAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity?.Id != null) {
                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _context.SaveChangesAsync();

                return true;
            }
            return false;
        }
    }
}
