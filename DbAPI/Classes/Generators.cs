using DbAPI.Models;
using static DbAPI.Interfaces.IInformation;

namespace DbAPI.Classes {
    public static class Generators {
        private static readonly Random _random = new Random(1000);
        public static List<Customer> GenerateCustomers(int count) {
            string[] firstNames = { "Иван", "Алексей", "Дмитрий", "Сергей", "Андрей", "Михаил", "Артем", "Николай", "Павел", "Егор" };
            string[] lastNames = { "Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов", "Васильев", "Попов", "Соколов", "Михайлов", "Новиков" };
            string[] domains = { "gmail.com", "mail.ru", "yandex.ru", "outlook.com", "hotmail.com" };

            return Enumerable.Range(1, count).Select(i => new Customer {
                Id = i,
                Forename = firstNames[_random.Next(firstNames.Length)],
                Surname = lastNames[_random.Next(lastNames.Length)],
                PhoneNumber = $"+79{_random.Next(10000000, 99999999)}",
                Email = $"user{i}@example.com",
                WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                WhoAdded = "system",
                Note = $"Клиент #{i}"
            }).ToList();
        }

        public static List<Models.Route> GenerateRoutes(int count) {
            var districts = new[] { "Центральный", "Северный", "Южный", "Западный", "Восточный" };
            var streetTypes = new[] { "ул.", "пр.", "пер.", "б-р", "наб." };
            var streetNames = new[] { "Ленина", "Гагарина", "Пушкина", "Советская", "Мира" };
            var landmarks = new[] { "ТЦ 'Галерея'", "ЖД вокзал", "Аэропорт", "Университет", "Парк Победы" };

            return Enumerable.Range(1, count).Select(i => {
                // Генерация случайного адреса посадки
                var boarding = _random.Next(10) < 3
                    ? $"{districts[_random.Next(districts.Length)]} р-н, {landmarks[_random.Next(landmarks.Length)]}"
                    : $"{districts[_random.Next(districts.Length)]} р-н, {streetTypes[_random.Next(streetTypes.Length)]} " +
                      $"{streetNames[_random.Next(streetNames.Length)]}, {_random.Next(1, 150)}";

                // Генерация уникального адреса высадки
                string dropOff;
                do {
                    dropOff = _random.Next(10) < 3
                        ? $"{districts[_random.Next(districts.Length)]} р-н, {landmarks[_random.Next(landmarks.Length)]}"
                        : $"{districts[_random.Next(districts.Length)]} р-н, {streetTypes[_random.Next(streetTypes.Length)]} " +
                          $"{streetNames[_random.Next(streetNames.Length)]}, {_random.Next(1, 150)}";
                }
                while (dropOff == boarding);

                return new Models.Route {
                    Id = i,
                    BoardingAddress = boarding,
                    DropAddress = dropOff,
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    WhoAdded = "system",
                    Note = $"Маршрут #{i}"
                };
            }).ToList();
        }

        public static List<Driver> GenerateDrivers(int count) {
            var firstNames = new[] { "Иван", "Алексей", "Дмитрий", "Сергей", "Андрей", "Михаил", "Артем", "Николай", "Александр", "Юрий", "Игорь", "Максим", "Никита" };
            var lastNames = new[] { "Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов", "Васильев", "Попов", "Соколов", "Гарбарь", "Ляшенок", "Минко", "Фетисов", "Топорков" };
            var licenseSeries = Enumerable.Range('A', 26)
                .Select(c => ((char)c).ToString() + (char)_random.Next('A', 'Z' + 1))
                .Distinct()
                .Take(20)
                .ToArray();

            return Enumerable.Range(1, count).Select(i => new Driver {
                Id = i,
                Forename = firstNames[_random.Next(firstNames.Length)],
                Surname = lastNames[_random.Next(lastNames.Length)],
                PhoneNumber = $"+79{_random.Next(10000000, 99999999)}",
                DriverLicenceSeries = licenseSeries[_random.Next(licenseSeries.Length)],
                DriverLicenceNumber = _random.Next(100000, 999999).ToString(),
                WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                WhoAdded = "system",
                WhenChanged = new DateTime(2023, 1, 1).AddDays(i + _random.Next(1, 30)),
                WhoChanged = "system",
                Note = $"Водитель #{i}"
            }).ToList();
        }

        public static List<TransportVehicle>? GenerateTransportVehicles(List<Driver> drivers, int count) {
            // Проверка, что список водителей не пуст
            if (drivers == null || drivers.Count == 0)
                return null;

            var regions = new[] { 77, 78, 99, 97, 177, 150, 190, 197, 199, 750 };
            var letters = "ABCEHKMOPTXY";
            var models = new[]
            {
                "Toyota Camry", "Hyundai Solaris", "Kia Rio", "Volkswagen Polo",
                "Skoda Rapid", "Lada Vesta", "Renault Logan", "Nissan Almera"
            };
            var colors = new[]
            {
                "Белый", "Черный", "Серебристый", "Серый",
                "Красный", "Синий", "Зеленый", "Коричневый"
            };

            // Создаем список для хранения использованных DriverId
            var usedDriverIds = new HashSet<int>();

            return Enumerable.Range(1, count).Select(i => {
                // Выбираем случайного водителя, который еще не имеет транспортного средства
                Driver driver;
                int attempts = 0;
                do {
                    driver = drivers[_random.Next(drivers.Count)];
                    attempts++;

                    // Если все водители уже имеют ТС, разрешаем дублирование
                    if (attempts > 10) break;
                }
                while (usedDriverIds.Contains(driver.Id));

                usedDriverIds.Add(driver.Id);

                return new TransportVehicle {
                    Id = i,
                    DriverId = driver.Id, // Связываем с конкретным водителем
                    Number = $"{letters[_random.Next(letters.Length)]}" +
                            $"{_random.Next(0, 10)}{_random.Next(0, 10)}{_random.Next(0, 10)}" +
                            $"{letters[_random.Next(letters.Length)]}{letters[_random.Next(letters.Length)]}",
                    Series = letters[_random.Next(letters.Length)].ToString(),
                    RegistrationCode = regions[_random.Next(regions.Length)],
                    Model = models[_random.Next(models.Length)],
                    Color = colors[_random.Next(colors.Length)],
                    ReleaseYear = _random.Next(2000, 2024),
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    WhoAdded = "system",
                    WhenChanged = new DateTime(2023, 1, 1).AddDays(i + _random.Next(1, 30)),
                    WhoChanged = "system",
                    Note = $"ТС #{i} (Водитель: {driver.Surname} {driver.Forename})"
                };
            }).ToList();
        }

        public static List<Rate>? GenerateRates(List<Driver> drivers, List<TransportVehicle> vehicles, int count) {
            // Проверка наличия связанных данных
            if (drivers == null || drivers.Count == 0)
                return null;

            if (vehicles == null || vehicles.Count == 0)
                return null;

            var rateTypes = new[] { "Стандарт", "Премиум", "Эконом", "Бизнес", "Комфорт" };

            return Enumerable.Range(1, count).Select(i => {
                // Выбираем случайного водителя и его транспортное средство
                var driver = drivers[_random.Next(drivers.Count)];
                var driverVehicles = vehicles.Where(v => v.DriverId == driver.Id).ToList();
                var vehicle = driverVehicles.Count > 0
                    ? driverVehicles[_random.Next(driverVehicles.Count)]
                    : vehicles[_random.Next(vehicles.Count)];

                return new Rate {
                    Id = i,
                    Forename = rateTypes[_random.Next(rateTypes.Length)],
                    DriverId = driver.Id,
                    VehicleId = vehicle.Id,
                    MovePrice = _random.Next(10, 50),  // Цена за км (10-50 руб)
                    IdlePrice = _random.Next(5, 25),    // Цена за минуту простоя (5-25 руб)
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    WhoAdded = "system",
                    WhenChanged = new DateTime(2023, 1, 1).AddDays(i + _random.Next(1, 30)),
                    WhoChanged = "system",
                    Note = $"Тариф для {driver.Surname} ({vehicle.Model})"
                };
            }).ToList();
        }

        public static List<Order>? GenerateOrders(
            List<Customer> customers,
            List<Models.Route> routes,
            List<Rate> rates,
            int count) {
            // Проверка наличия связанных данных
            if (customers == null || customers.Count == 0)
                return null;

            if (routes == null || routes.Count == 0)
                return null;

            if (rates == null || rates.Count == 0)
                return null;

            return Enumerable.Range(1, count).Select(i => {
                var customer = customers[_random.Next(customers.Count)];
                var route = routes[_random.Next(routes.Count)];
                var rate = rates[_random.Next(rates.Count)];
                var distance = _random.Next(1, 50); // Дистанция 1-50 км

                return new Order {
                    Id = i,
                    CustomerId = customer.Id,
                    RouteId = route.Id,
                    RateId = rate.Id,
                    Distance = distance,
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    WhoAdded = "system",
                    WhenChanged = new DateTime(2023, 1, 1).AddDays(i + _random.Next(1, 30)),
                    WhoChanged = "system",
                    Note = $"Заказ #{i} от {customer.Surname} ({distance} км)"
                };
            }).ToList();
        }

        public static List<Role>? GenerateRoles() {

            return Enumerable.Range(1, 2).Select(i => {
                return new Role {
                    Id = i,
                    Forename = i == 1 ? "admin" : "basic",
                    Rights = i == 1 ? UserRights.Admin : UserRights.Basic,
                    CanGet = true,
                    CanPost = i == 1,
                    CanUpdate = i == 1,
                    CanDelete = i == 1,
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1)
                };
            }).ToList();
        }

        public static List<Credential>? GenerateCredentials() {
            return Enumerable.Range(1, 2).Select(i => {
                return new Credential {
                    Id = i,
                    Username = i == 1 ? "admin" : "basic",
                    Password = PasswordHasher.HashPassword("JcGDN9ST5KEG!"),
                    Email = $"user{i}@example.com",
                    RoleId = i,
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1)
                };
            }).ToList();
        }
    }
}
