using DbAPI.Contexts;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TypeId = int;

namespace DbAPI.Repositories {
    public class RateRepository : IRepository<Rate, TypeId> {
        private readonly OrderDbContext _context;

        public RateRepository(OrderDbContext context) {
            _context = context;
        }

        public async Task<Rate?> GetByIdAsync(TypeId id) {
            return await _context.Rates.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Rate>?> GetAllAsync() {
            return await _context.Rates.ToListAsync();
        }

        public async Task AddAsync(Rate entity) {

            await EntityValidate(entity.Forename, entity.MovePrice,
                entity.IdlePrice, entity.WhoAdded, entity.WhenAdded, entity.Id, entity.WhoChanged,
                entity.WhenChanged, entity.Note, entity.IsDeleted);

            await _context.Rates.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task AddAsync(string forename, int movePrice, int idlePrice, string whoAdded,
            DateTime whenAdded, string? whoChanged = null, TypeId? id = null, DateTime? whenChanged = null,
            string? note = null, DateTime? isDeleted = null) {

            await EntityValidate(forename, movePrice, idlePrice, whoAdded, whenAdded,
                id, whoChanged, whenChanged, note, isDeleted);

            var entity = new Rate {
                Forename = forename,
                MovePrice = movePrice,
                IdlePrice = idlePrice,
                WhoAdded = whoAdded,
                WhenAdded = whenAdded,
                WhoChanged = whoChanged,
                WhenChanged = whenChanged,
                Note = note,
                IsDeleted = isDeleted
            };

            await _context.Rates.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        private async Task EntityValidate(string forename, int movePrice, int idlePrice,
            string whoAdded, DateTime whenAdded, TypeId? id, string? whoChanged = null,
            DateTime? whenChanged = null, string? note = null, DateTime? isDeleted = null) {

            if (forename.IsNullOrEmpty()) {
                throw new ArgumentNullException("Название тарифа должно быть непустой строкой");
            } else if (whoAdded.IsNullOrEmpty()) {
                throw new ArgumentNullException("\"Who added\" должен быть непустой строкой");
            }

            if (!Rate.MovePriceValidate(movePrice))
                throw new ArgumentException("Цена поездки должна быть положительным целым числом");
            else if (!Rate.IdlePriceValidate(idlePrice))
                throw new ArgumentException("Цена простоя должна быть положительным целым числом");

            if (id != 0) {
                throw new InvalidDataException("Сущность должна содержать ненулевой ID. Автогенерация включена");
            } else if (id == null)
                throw new DbUpdateException("БД переполнена. Отсутствует доступный ID для новой сущности");
        }

        public async Task UpdateAsync(Rate entity) {
            _context.Rates.Update(entity);
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
                _context.Rates.Remove(entity);
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
