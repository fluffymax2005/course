using DbAPI.Contexts;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TypeId = int;

namespace DbAPI.Repositories {
    public class CustomerRepository : IRepository<Customer, TypeId> {
        private readonly OrderDbContext _context;

        public CustomerRepository(OrderDbContext context) {
            _context = context;
        }

        public async Task<Customer?> GetByIdAsync(TypeId id) {
            return await _context.Customers.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Customer>?> GetAllAsync() {
            return await _context.Customers.ToListAsync();
        }

        public async Task<TypeId?> AddAsync(Customer entity) {
            entity.WhenAdded = DateTime.Now;
            entity.WhoChanged = null;
            entity.WhenChanged = null;
            entity.IsDeleted = null;

            await EntityValidate(entity.Forename, entity.Surname, entity.PhoneNumber, entity.Email,
                entity.WhoAdded, entity.WhenAdded, entity.Id, entity.WhoChanged, entity.WhenChanged,
                entity.Note, entity.IsDeleted);

            await _context.Customers.AddAsync(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
        }

        private async Task EntityValidate(string forename, string surname, string phoneNumber, string email,
            string whoAdded, DateTime whenAdded, TypeId? id = null, string? whoChanged = null,
            DateTime? whenChanged = null, string? note = null, DateTime? isDeleted = null) {

            if (forename.IsNullOrEmpty()) {
                throw new ArgumentNullException("Фамилия заказчика должна быть непустой строкой");
            } else if (surname.IsNullOrEmpty()) {
                throw new ArgumentNullException("Имя заказчика должно быть непустой строкой");
            } else if (phoneNumber.IsNullOrEmpty()) {
                throw new ArgumentNullException("Номер телефона заказчика должен быть непустой строкой");
            } else if (email.IsNullOrEmpty()) {
                throw new ArgumentNullException("Электронная почта заказчика должна быть непустой строкой");
            } else if (whoAdded.IsNullOrEmpty()) {
                throw new ArgumentNullException("\"Who added\" должен быть непустой строкой");
            }

            if (!Customer.PhoneNumberValidate(phoneNumber)) {
                throw new InvalidDataException("Введенный номер телефона заказчика некорректный");
            } else if (!Customer.EmailValidate(email)) {
                throw new InvalidDataException("Введенная Электронная почта заказчика некорректная");
            }

            if (id != 0) {
                throw new InvalidDataException("Сущность должна содержать ненулевой ID. Автогенерация включена");
            } else if (id == null)
                throw new DbUpdateException("БД переполнена. Отсутствует доступный ID для новой сущности");
        }

        public async Task UpdateAsync(Customer entity) {
            await EntityValidate(entity.Forename, entity.Surname, entity.PhoneNumber, entity.Email,
                entity.WhoAdded, entity.WhenAdded, entity.Id, entity.WhoChanged, entity.WhenChanged,
                entity.Note, entity.IsDeleted);

            entity.WhenChanged = DateTime.Now;

            _context.Customers.Update(entity);
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
                _context.Customers.Remove(entity);
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
