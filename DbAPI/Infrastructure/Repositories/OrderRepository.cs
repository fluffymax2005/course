using DbAPI.Core.Entities;
using DbAPI.Infrastructure.Contexts;
using DbAPI.Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TypeId = int;

namespace DbAPI.Infrastructure.Repositories {
    public class OrderRepository : IRepository<Order, TypeId> {
        private readonly OrderDbContext _context;

        public OrderRepository(OrderDbContext context) {
            _context = context;
        }

        public async Task<Order?> GetByIdAsync(TypeId id) {
            return await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Order>?> GetAllAsync() {
            return await _context.Orders.ToListAsync();
        }

        public async Task<TypeId?> AddAsync(Order entity) {
            entity.WhenAdded = DateTime.Now;
            entity.WhoChanged = null;
            entity.WhenChanged = null;
            entity.IsDeleted = null;

            await EntityValidate(entity.CustomerId, entity.RouteId, entity.RateId, entity.Distance,
                entity.WhoAdded, entity.WhenAdded, entity.Id, entity.WhoChanged, entity.WhenChanged,
                entity.Note, entity.IsDeleted);

            await _context.Orders.AddAsync(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
        }

        private async Task EntityValidate(TypeId customerId, TypeId routeId, TypeId rateId, int distance,
            string whoAdded, DateTime whenAdded, TypeId? id = null, string? whoChanged = null, DateTime? whenChanged = null,
            string? note = null, DateTime? isDeleted = null) {

            if (whoAdded.IsNullOrEmpty()) {
                throw new ArgumentNullException("\"Who added\" должен быть непустой строкой");
            }

            if (!Order.DistanceValidate(distance))
                throw new ArgumentException("Расстояние должно быть положительным целым числом");

            if (await _context.Customers.AnyAsync(c => c.Id == customerId) == false) {
                throw new InvalidDataException($"Заказчик с ID = {customerId} не существует");
            } else if (await _context.Routes.AnyAsync(r => r.Id == routeId) == false) {
                throw new InvalidDataException($"Маршрут с ID = {routeId} не существует");
            } else if (await _context.Rates.AnyAsync(r => r.Id == rateId) == false) {
                throw new InvalidDataException($"Тариф с ID = {rateId} не существует");
            }

            if (id != 0) {
                throw new InvalidDataException("Сущность должна содержать ненулевой ID. Автогенерация включена");
            } else if (id == null)
                throw new DbUpdateException("БД переполнена. Отсутствует доступный ID для новой сущности");
        }

        public async Task UpdateAsync(Order entity) {
            await EntityValidate(entity.CustomerId, entity.RouteId, entity.RateId, entity.Distance,
                entity.WhoAdded, entity.WhenAdded, entity.Id, entity.WhoChanged, entity.WhenChanged,
                entity.Note, entity.IsDeleted);

            entity.WhenChanged = DateTime.Now;
            _context.Orders.Update(entity);
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

        public async Task DeleteAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                _context.Orders.Remove(entity);
                await _context.SaveChangesAsync();
                return;
            }
            throw new ArgumentException($"Сущность с ID = {id} не существует в БД.");
        }
    }
}
