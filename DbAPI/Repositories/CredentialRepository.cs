using DbAPI.Classes;
using DbAPI.Contexts;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TypeId = int;

namespace DbAPI.Repositories {
    public class CredentialRepository : IRepository<Credential, TypeId> {
        private readonly CredentialDbContext _context;

        public CredentialRepository(CredentialDbContext context) {
            _context = context;
        }

        public async Task<Credential?> GetByIdAsync(TypeId id) {
            return await _context.Credentials.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<IEnumerable<Credential>?> GetAllAsync() {
            return await _context.Credentials.ToListAsync();
        }

        public async Task<TypeId?> AddAsync(Credential entity) {
            entity.WhenAdded = DateTime.Now;
            entity.WhoChanged = null;
            entity.WhenChanged = null;
            entity.IsDeleted = null;

            await EntityValidate(entity.RoleId, entity.Username, entity.Password, entity.WhoAdded,
                entity.WhenAdded, entity.Id, entity.WhoChanged, entity.WhenChanged, entity.Note,
                entity.IsDeleted);

            await _context.Credentials.AddAsync(entity);
            await _context.SaveChangesAsync();

            return entity.Id;
        }

        private async Task EntityValidate(TypeId roleId, string username, string password, string whoAdded,
            DateTime whenAdded, TypeId? id = null, string? whoChanged = null, DateTime? whenChanged = null,
            string? note = null, DateTime? isDeleted = null) {

            if (username.IsNullOrEmpty()) {
                throw new ArgumentNullException("Имя пользователя должно быть непустой строкой");
            } else if (password.IsNullOrEmpty()) {
                throw new ArgumentNullException("Пароль должен быть непустой строкой");
            } else if (whoAdded.IsNullOrEmpty()) {
                throw new ArgumentNullException("\"Who added\" должен быть непустой строкой");
            }

            if (!Hasher.IsPasswordStrong(password))
                throw new ArgumentException($"Введенный пароль недопустим.{Environment.NewLine}" +
                    $"Пароль должен содержать как минимум:{Environment.NewLine}" +
                    $"1. Одну латинскую букву нижнего и верхнего регистра.{Environment.NewLine}" +
                    $"2. Одну цифру.{Environment.NewLine}" +
                    $"3. Один спецсимвол.{Environment.NewLine}" +
                    $"Длина пароля должен быть не менее 8 символов.");
            else if (await _context.Roles.AnyAsync(r => r.Id == roleId) == false) {
                throw new ArgumentException($"Роль с ID = {roleId} не существует");
            }

            if (id != 0) {
                throw new InvalidDataException("Сущность должна содержать ненулевой ID. Автогенерация включена");
            } else if (id == null)
                throw new DbUpdateException("БД переполнена. Отсутствует доступный ID для нового пользователя");
        }

        public async Task UpdateAsync(Credential entity) {
            if (await _context.Roles.Where(d => d.Id == entity.RoleId).AnyAsync() == false) {
                throw new InvalidDataException($"Роль с ID = {entity.RoleId} не существует");
            }

            entity.WhenChanged = DateTime.Now;
            _context.Credentials.Update(entity);
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
                _context.Credentials.Remove(entity);
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

        public async Task<Credential?> GetByUserNameAsync(string username) {
            return await _context.Credentials
                .FirstOrDefaultAsync(c => c.Username == username && c.IsDeleted == null);
        }
    }
}
