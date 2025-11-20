using DbAPI.Core.Entities;
using DbAPI.Infrastructure.Interfaces;
using DbAPI.Infrastructure.Repositories;
using Microsoft.Extensions.FileProviders;
using TypeId = int;

namespace DbAPI.Infrastructure.Services {
    public static class DependencyInjection {
        private static readonly string EMAIL_SECRETS_PATH = "Infrastructure/Secrets/EmailSettings.json";
        private static readonly string JWT_SECRETS_PATH = "Infrastructure/Secrets/JwtSettings.json";


        public static IServiceCollection AddReposes(this IServiceCollection services) {

            // Reposes registration for main database
            services.AddScoped<IRepository<Order, TypeId>, OrderRepository>();
            services.AddScoped<IRepository<Customer, TypeId>, CustomerRepository>();
            services.AddScoped<IRepository<Driver, TypeId>, DriverRepository>();
            services.AddScoped<IRepository<Rate, TypeId>, RateRepository>();
            services.AddScoped<IRepository<DbAPI.Core.Entities.Route, TypeId>, RouteRepository>();
            services.AddScoped<IRepository<TransportVehicle, TypeId>, TransportVehicleRepository>();

            // Reposes registration for user credentials database
            services.AddScoped<IRepository<Role, TypeId>, RoleRepository>();
            services.AddScoped<RoleRepository>();
            services.AddScoped<IRepository<Credential, TypeId>, CredentialRepository>();

            return services;
        }

        public static IServiceCollection AddEmailServices(this IServiceCollection services) {

            // Email service registration for main database
            services.AddScoped<IEmailService, EmailService>();

            return services;
        }

        public static IServiceCollection AddPasswordRecoveryServices(this IServiceCollection services) {

            // Recovery password service registration for main database
            services.AddMemoryCache();
            services.AddScoped<IPasswordRecoveryService, PasswordRecoveryService>();

            return services;
        }

        public static WebApplication AddStaticFiles(this WebApplication app) {
            app.UseStaticFiles(new StaticFileOptions {
                FileProvider = new PhysicalFileProvider(
                    Path.Combine(Directory.GetCurrentDirectory(), "Presentation/wwwroot"))
            });

            return app;
        }

        public static ConfigurationManager AddConfigurationSecrets(this ConfigurationManager configuration) {
            configuration.AddJsonFile(EMAIL_SECRETS_PATH)
                .AddJsonFile(JWT_SECRETS_PATH);

            return configuration;
        }
    }
}
