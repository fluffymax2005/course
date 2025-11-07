using DbAPI.Contexts;
using DbAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TypeId = int;

namespace DbAPI.Repositories {
    public class RouteRepository : IRepository<Models.Route, TypeId> {
        private readonly OrderDbContext _context;

        public RouteRepository(OrderDbContext context) {
            _context = context;
        }

        public async Task<Models.Route?> GetByIdAsync(TypeId id) {
            return await _context.Routes.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Models.Route>?> GetAllAsync() {
            return await _context.Routes.ToListAsync();
        }

        public async Task<TypeId?> AddAsync(Models.Route entity) {
            await EntityValidate(entity.BoardingAddress, entity.DropAddress, entity.WhoAdded,
                entity.WhenAdded, entity.Id, entity.WhoChanged, entity.WhenChanged, entity.Note,
                entity.IsDeleted);

            await _context.Routes.AddAsync(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
        }

        public async Task AddAsync(string boardingAddress, string dropAddress, string whoAdded,
            DateTime whenAdded, TypeId? id, string? whoChanged = null, DateTime? whenChanged = null,
            string? note = null, DateTime? isDeleted = null) {

            await EntityValidate(boardingAddress, dropAddress, whoAdded, whenAdded, id, whoChanged,
                whenChanged, note, isDeleted);

            var entity = new Models.Route {
                BoardingAddress = boardingAddress,
                DropAddress = dropAddress,
                WhoAdded = whoAdded,
                WhenAdded = whenAdded,
                WhoChanged = whoChanged,
                WhenChanged = whenChanged,
                Note = note,
                IsDeleted = isDeleted
            };

            await _context.Routes.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        private async Task EntityValidate(string boardingAddress, string dropAddress, string whoAdded,
        DateTime whenAdded, TypeId? id, string? whoChanged = null, DateTime? whenChanged = null, string? note = null,
        DateTime? isDeleted = null) {

            if (boardingAddress.IsNullOrEmpty()) {
                throw new ArgumentNullException("Адрес посадки должен быть непустой строкой");
            } else if (dropAddress.IsNullOrEmpty()) {
                throw new ArgumentNullException("Адрес высадки должен быть непустой строкой");
            } else if (whoAdded.IsNullOrEmpty()) {
                throw new ArgumentNullException("\"Who added\" должен быть непустой строкой");
            }

            if (id != 0) {
                throw new InvalidDataException("Сущность должна содержать ненулевой ID. Автогенерация включена");
            } else if (id == null)
                throw new DbUpdateException("БД переполнена. Отсутствует доступный ID для новой сущности");
        }

        public async Task UpdateAsync(Models.Route entity) {
            _context.Routes.Update(entity);
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
                _context.Routes.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

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
    }
}
