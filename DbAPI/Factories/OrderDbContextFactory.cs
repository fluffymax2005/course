using DbAPI.Classes;
using DbAPI.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;


namespace DbAPI.Factories {

    public class OrderDbContextFactory : IDesignTimeDbContextFactory<OrderDbContext> {

        // Create OrderDbContext using args:
        //  1. IP-address
        //  2. Database Name
        //  3. User login
        //  4. User password
        public OrderDbContext CreateCustomDbContext(string[] args) {
            if (args.Length < 4) { // Must be 4 neccessary arguments
                return null;
            }

            var optionsBuilder = new DbContextOptionsBuilder<OrderDbContext>();
            int mode;
            int.TryParse(args[0], out mode);
            optionsBuilder.UseSqlServer(SqlConnect.GetConnectionString((SqlConnect.ConnectMode)mode, args[1], args[2], args[3], args[4]));

            return new OrderDbContext(optionsBuilder.Options);
        }

        // Create OrderDbContext using default connectionString in appsettings.json
        public OrderDbContext CreateDbContext(string[] args) {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory()) // find appsetings.json
                .AddJsonFile("appsettings.json")
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<OrderDbContext>();
            optionsBuilder.UseSqlServer(config.GetConnectionString("DefaultConnection"));

            return new OrderDbContext(optionsBuilder.Options);
        }
    }
}