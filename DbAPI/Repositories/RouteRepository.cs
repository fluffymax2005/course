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
            
            entity.WhenAdded = DateTime.Now;
            entity.WhoChanged = null;
            entity.WhenChanged = null;
            entity.IsDeleted = null;

            await EntityValidate(entity.BoardingAddress, entity.DropAddress, entity.WhoAdded,
                entity.WhenAdded, entity.Id, entity.WhoChanged, entity.WhenChanged, entity.Note,
                entity.IsDeleted);

            await _context.Routes.AddAsync(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
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
            entity.WhenChanged = DateTime.Now;

            _context.Routes.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task SoftDeleteAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                if (entity.IsDeleted != null)
                    throw new ArgumentException($"Запись с ID = {id} уже удалена");

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
                _context.Routes.Remove(entity);
                await _context.SaveChangesAsync();
                return;
            }
            throw new ArgumentException($"Сущность с ID = {id} не существует в БД.");
        }

        public async Task RecoverAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                if (entity.IsDeleted == null)
                    throw new ArgumentException($"Сущность с ID = {id} существует в БД.");

                entity.IsDeleted = null;
                entity.WhenChanged = DateTime.Now;
                await _context.SaveChangesAsync();
                return;
            }
            throw new ArgumentException($"Сущность с ID = {id} не существует в БД.");
        }
    }
}
