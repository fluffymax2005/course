using DbAPI.Core.Entities;
using DbAPI.Infrastructure.Contexts;
using DbAPI.Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TypeId = int;

namespace DbAPI.Infrastructure.Repositories {
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

        public async Task<TypeId?> AddAsync(Rate entity) {

            entity.WhenAdded = DateTime.Now;
            entity.WhoChanged = null;
            entity.WhenChanged = null;
            entity.IsDeleted = null;

            await EntityValidate(entity.Forename, entity.MovePrice,
                entity.IdlePrice, entity.WhoAdded, entity.WhenAdded, entity.Id, entity.WhoChanged,
                entity.WhenChanged, entity.Note, entity.IsDeleted);

            await _context.Rates.AddAsync(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
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
            await EntityValidate(entity.Forename, entity.MovePrice,
                entity.IdlePrice, entity.WhoAdded, entity.WhenAdded, 0, entity.WhoChanged,
                entity.WhenChanged, entity.Note, entity.IsDeleted);

            entity.WhenChanged = DateTime.Now;

            _context.Rates.Update(entity);
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
                _context.Rates.Remove(entity);
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
