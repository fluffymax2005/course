using DbAPI.Contexts;
using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TypeId = int;

namespace DbAPI.Repositories {
    public class TransportVehicleRepository : IRepository<TransportVehicle, TypeId> {

        private readonly OrderDbContext _context;

        public TransportVehicleRepository(OrderDbContext context) {
            _context = context;
        }

        // Async versions
        public async Task<IEnumerable<TransportVehicle>?> GetAllAsync() {
            return await _context.TransportVehicles.ToListAsync();
        }

        public async Task<TransportVehicle?> GetByIdAsync(TypeId id) {
            return await _context.TransportVehicles.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task AddAsync(TransportVehicle entity) {
            await EntityValidate(entity.DriverId, entity.Number, entity.Series, entity.RegistrationCode,
                entity.Model, entity.Color, entity.ReleaseYear, entity.WhoAdded, entity.WhenAdded,
                entity.Id, entity.WhoChanged, entity.WhenChanged, entity.Note, entity.IsDeleted);

            await _context.TransportVehicles.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        public async Task AddAsync(TypeId driverId, string number, string series,
            int registrationCode, string model, string color, int releaseYear, string whoAdded,
            DateTime whenAdded, string? whoChanged = null, DateTime? whenChanged = null, string? note = null,
            DateTime? isDeleted = null) {

            await EntityValidate(driverId, number, series, registrationCode, model, color, releaseYear, whoAdded,
                whenAdded, 0, whoChanged, whenChanged, note, isDeleted);

            var entity = new TransportVehicle {
                DriverId = driverId,
                Number = number,
                Series = series,
                RegistrationCode = registrationCode,
                Model = model,
                Color = color,
                ReleaseYear = releaseYear,
                WhoAdded = whoAdded,
                WhenAdded = whenAdded,
                WhoChanged = whoChanged,
                WhenChanged = whenChanged,
                Note = note,
                IsDeleted = isDeleted
            };

            await _context.TransportVehicles.AddAsync(entity);
            await _context.SaveChangesAsync();
        }

        private async Task EntityValidate(TypeId driverId, string number, string series,
            int registrationCode, string model, string color, int releaseYear, string whoAdded,
            DateTime whenAdded, TypeId? id = null, string? whoChanged = null, DateTime? whenChanged = null,
            string? note = null, DateTime? isDeleted = null) {

            if (number.IsNullOrEmpty()) {
                throw new ArgumentNullException("Номер транспортного средства должен быть непустой строкой");
            } else if (series.IsNullOrEmpty()) {
                throw new ArgumentNullException("Серия транспортного средства должна быть непустой строкой");
            } else if (model.IsNullOrEmpty()) {
                throw new ArgumentNullException("Модель транспортного средства должна быть непустой строкой");
            } else if (color.IsNullOrEmpty()) {
                throw new ArgumentNullException("Цвет транспортного средства должен быть непустой строкой");
            } else if (whoAdded.IsNullOrEmpty()) {
                throw new ArgumentNullException("\"Who added\" должен быть непустой строкой");
            }

            if (!TransportVehicle.NumberValidate(number)) {
                throw new InvalidDataException("Введенный номер транспортного средства некорректный");
            } else if (!TransportVehicle.SeriesValidate(series)) {
                throw new InvalidDataException("Введенная серия транспортного средства некорректная");
            } else if (!TransportVehicle.RegistrationCodeValidate(registrationCode)) {
                throw new InvalidDataException("Регистрационный код некорректный");
            } else if (!TransportVehicle.ReleaseYearValidate(releaseYear)) {
                throw new InvalidDataException("Год выпуска некорректный");
            }

            if (id != 0) {
                throw new InvalidDataException("Сущность должна содержать ненулевой ID. Автогенерация включена");
            } else if (id == null)
                throw new DbUpdateException("БД переполнена. Отсутствует доступный ID для новой сущности");
        }

        public async Task UpdateAsync(TransportVehicle entity) {
            _context.TransportVehicles.Update(entity);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                _context.TransportVehicles.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<TypeId> NewIdToAddAsync() {
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

        public async Task SoftDeleteAsync(TypeId id) {
            var entity = await GetByIdAsync(id);
            if (entity != null) {
                entity.IsDeleted = DateTime.Now; // soft delete
                entity.WhenChanged = DateTime.Now;
                await _context.SaveChangesAsync();
            }
        }
    }
}
