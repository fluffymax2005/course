using DbAPI.Core.Entities;
using static DbAPI.Infrastructure.Interfaces.IInformation;
using Route = DbAPI.Core.Entities.Route;
using TypeId = int;

namespace DbAPI.Infrastructure.Classes {
    public static class Generators {
        private static readonly Random _random = new Random(1000);
        private static readonly string PERSON_DATA_PATH = @"Core/Person_Data";

        private static readonly string[] phone_numbers = new string[] { };

        public static List<Customer> GenerateCustomers(TypeId count) {
            string[] male_names = File.ReadAllLines($"{PERSON_DATA_PATH}/male_names.txt");
            string[] male_surnames = File.ReadAllLines($"{PERSON_DATA_PATH}/male_surnames.txt");

            string[] female_names = File.ReadAllLines($"{PERSON_DATA_PATH}/female_names.txt");
            string[] female_surnames = File.ReadAllLines($"{PERSON_DATA_PATH}/female_surnames.txt");

            string[] domains = { "gmail.com", "mail.ru", "yandex.ru", "outlook.com", "hotmail.com" };

            return Enumerable.Range(1, count).Select(i => {
                bool isMale = _random.Next(0, 2) == 0 ? false : true;
                string? forename = null, surname = null;
                if (isMale) {
                    forename = male_names[_random.Next(male_names.Length)];
                    surname = male_surnames[_random.Next(male_surnames.Length)];
                } else {
                    forename = female_names[_random.Next(female_names.Length)];
                    surname = female_surnames[_random.Next(female_surnames.Length)];
                }

                string? phoneNumber = null;
                do {
                    phoneNumber = $"+79{_random.Next(100000000, 999999999)}";
                } while (phone_numbers.Any(p => p.Equals(phoneNumber)));

                phone_numbers.Concat(new string[] { phoneNumber }.ToArray());

                return new Customer {
                    Id = i,
                    Forename = forename,
                    Surname = surname,
                    PhoneNumber = phoneNumber,
                    Email = $"user{i}@example.com",
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    Note = null
                };
            }).ToList();
        }

        public static List<Core.Entities.Route> GenerateRoutes(TypeId count) {
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
                } while (dropOff == boarding);

                return new Route {
                    Id = i,
                    BoardingAddress = boarding,
                    DropAddress = dropOff,
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    Note = null
                };
            }).ToList();
        }

        public static List<Driver> GenerateDrivers(TypeId count) {
            string[] male_names = File.ReadAllLines($"{PERSON_DATA_PATH}/male_names.txt");
            string[] male_surnames = File.ReadAllLines($"{PERSON_DATA_PATH}/male_surnames.txt");

            string[] female_names = File.ReadAllLines($"{PERSON_DATA_PATH}/female_names.txt");
            string[] female_surnames = File.ReadAllLines($"{PERSON_DATA_PATH}/female_surnames.txt");

            var licenseSeries = Enumerable.Range('A', 26)
                .Select(c => ((char)c).ToString() + (char)_random.Next('A', 'Z' + 1))
                .Distinct()
                .Take(20)
                .ToArray();

            return Enumerable.Range(1, count).Select(i => {
                bool isMale = _random.Next(0, 2) == 0 ? false : true;
                string? forename = null, surname = null;
                if (isMale) {
                    forename = male_names[_random.Next(male_names.Length)];
                    surname = male_surnames[_random.Next(male_surnames.Length)];
                } else {
                    forename = female_names[_random.Next(female_names.Length)];
                    surname = female_surnames[_random.Next(female_surnames.Length)];
                }

                string? phoneNumber = null;
                do {
                    phoneNumber = $"+79{_random.Next(100000000, 999999999)}";
                } while (phone_numbers.Any(p => p.Equals(phoneNumber)));

                phone_numbers.Concat(new string[] { phoneNumber }.ToArray());

                return new Driver {
                    Id = i,
                    Forename = forename,
                    Surname = surname,
                    PhoneNumber = phoneNumber,
                    DriverLicenceSeries = licenseSeries[_random.Next(licenseSeries.Length)],
                    DriverLicenceNumber = _random.Next(100000, 999999).ToString(),
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    WhenChanged = null,
                    WhoChanged = null,
                    Note = null
                };
            }).ToList();
        }

        public static List<TransportVehicle>? GenerateTransportVehicles(List<Driver> drivers, TypeId count) {
            // Проверка, что список водителей не пуст
            if (drivers == null || drivers.Count == 0)
                return null;

            var regions = File.ReadAllLines($"{PERSON_DATA_PATH}/region_numbers.txt");
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
                    RegistrationCode = int.Parse(regions[_random.Next(regions.Length)]),
                    Model = models[_random.Next(models.Length)],
                    Color = colors[_random.Next(colors.Length)],
                    ReleaseYear = _random.Next(2000, 2024),
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    WhoChanged = null,
                    WhenChanged = null,
                    Note = null
                };
            }).ToList();
        }

        public static List<Rate>? GenerateRates(List<Driver> drivers, List<TransportVehicle> vehicles, TypeId count = 5) {
            // Проверка наличия связанных данных
            if (drivers == null || drivers.Count == 0)
                return null;

            if (vehicles == null || vehicles.Count == 0)
                return null;

            var rateTypes = new[] { "Стандарт", "Премиум", "Эконом", "Бизнес", "Комфорт" };

            int[] move_prices = { 15, 25, 10, 30, 20 };
            int[] idle_prices = { 5, 8, 3, 10, 7 };
            var rateTypeIndexes = new HashSet<int>();

            return Enumerable.Range(1, count).Select(i => {
                // Выбираем случайного водителя и его транспортное средство
                var driver = drivers[_random.Next(drivers.Count)];
                var driverVehicles = vehicles.Where(v => v.DriverId == driver.Id).ToList();
                var vehicle = driverVehicles.Count > 0
                    ? driverVehicles[_random.Next(driverVehicles.Count)]
                    : vehicles[_random.Next(vehicles.Count)];

                // От индекса названия тарифа зависит его стоимость в простое и при поездке

                int rateTypeIndex;
                do {
                    rateTypeIndex = _random.Next(rateTypes.Length);
                } while (rateTypeIndexes.Any(r => r == rateTypeIndex));

                rateTypeIndexes.Add(rateTypeIndex);

                return new Rate {
                    Id = i,
                    Forename = rateTypes[rateTypeIndex],
                    MovePrice = move_prices[rateTypeIndex],
                    IdlePrice = idle_prices[rateTypeIndex],
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1).AddDays(i),
                    WhoChanged = null,
                    WhenChanged = null,
                    Note = null
                };
            }).ToList();
        }

        public static List<Order>? GenerateOrders(List<Customer> customers, List<Core.Entities.Route> routes, List<Rate> rates, List<TransportVehicle> vehicles, TypeId count) {
            // Проверка наличия связанных данных
            if (customers == null || customers.Count == 0)
                return null;

            if (routes == null || routes.Count == 0)
                return null;

            if (rates == null || rates.Count == 0)
                return null;

            if (vehicles == null || vehicles.Count == 0)
                return null;

            return Enumerable.Range(1, count).Select(i => {
                var customer = customers[_random.Next(customers.Count)];
                var route = routes[_random.Next(routes.Count)];
                var rate = rates[_random.Next(rates.Count)];
                var vehicle = vehicles[_random.Next(vehicles.Count)];
                var distance = _random.Next(1, 50); // Дистанция 1-50 км

                return new Order {
                    Id = i,
                    CustomerId = customer.Id,
                    RouteId = route.Id,
                    RateId = rate.Id,
                    TransportVehicleId = vehicle.Id,
                    Distance = distance,
                    WhenAdded = new DateTime(2020, 1, 1).AddHours(i * 2),
                    WhoAdded = "system",
                    WhoChanged = null,
                    WhenChanged = null,
                    Note = null
                };
            }).ToList();
        }

        public static List<Role>? GenerateRoles() {

            string[] forenames = ["basic", "editor", "admin", "director"];
            UserRights[] rights = [UserRights.Basic, UserRights.Editor, UserRights.Admin, UserRights.Director];
            bool[] canPost = { false, true, true, false };
            bool[] canUpdate = { false, true, true, false };
            bool[] canDelete = { false, false, true, false };

            return Enumerable.Range(1, 4).Select(i => {
                return new Role {
                    Id = i,
                    Forename = forenames[i - 1],
                    Rights = rights[i - 1],
                    CanGet = true,
                    CanPost = canPost[i - 1],
                    CanUpdate = canUpdate[i - 1],
                    CanDelete = canDelete[i - 1],
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2025, 10, 24)
                };
            }).ToList();
        }

        public static List<Credential>? GenerateCredentials() {
            TypeId[] roleIDs = { 1, 2, 3 };
            string[] usernames = { "basic", "editor", "admin" };

            return Enumerable.Range(1, 3).Select(i => {
                return new Credential {
                    Id = i,
                    Username = usernames[i - 1],
                    Password = Hasher.HashPassword("JcGDN9ST5KEG!"),
                    Email = $"santech_montage@mail.ru",
                    RoleId = roleIDs[i - 1],
                    WhoAdded = "system",
                    WhenAdded = new DateTime(2023, 1, 1)
                };
            }).ToList();
        }
    }
}
