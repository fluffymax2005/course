using DbAPI.Core.Entities;
using DbAPI.Infrastructure.Classes;
using Microsoft.EntityFrameworkCore;

namespace DbAPI.Infrastructure.Contexts {

    public class CredentialDbContext : DbContext {
        private readonly IConfiguration _configuration;

        public DbSet<Credential> Credentials { get; set; }
        public DbSet<Role> Roles { get; set; }

        public CredentialDbContext(DbContextOptions<CredentialDbContext> options, IConfiguration configuration) : base(options) {
            _configuration = configuration;
            Database.EnsureCreated();

        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) {
            optionsBuilder.EnableSensitiveDataLogging();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            base.OnModelCreating(modelBuilder);

            bool includeSeedData = _configuration.GetValue<bool>("IncludeSeedData");

            modelBuilder.Entity<Role>(entity => {
                entity.Property(e => e.Id).ValueGeneratedOnAdd().IsRequired().HasColumnOrder(1);
                entity.Property(e => e.Forename).IsRequired().HasColumnOrder(2);
                entity.Property(e => e.Rights).IsRequired().HasColumnOrder(3);
                entity.Property(e => e.CanGet).IsRequired().HasColumnOrder(4);
                entity.Property(e => e.CanPost).IsRequired().HasColumnOrder(5);
                entity.Property(e => e.CanUpdate).IsRequired().HasColumnOrder(6);
                entity.Property(e => e.CanDelete).IsRequired().HasColumnOrder(7);
                entity.Property(e => e.WhoAdded).IsRequired().HasColumnOrder(8);
                entity.Property(e => e.WhenAdded).IsRequired().HasColumnOrder(9);
                entity.Property(e => e.WhoChanged).HasColumnOrder(10);
                entity.Property(e => e.WhenChanged).HasColumnOrder(11);
                entity.Property(e => e.Note).HasColumnOrder(12);
                entity.Property(e => e.IsDeleted).HasColumnOrder(13);
            });

            ///////////////////////////

            modelBuilder.Entity<Credential>(entity => {
                entity.Property(e => e.Id).ValueGeneratedOnAdd().IsRequired().HasColumnOrder(1);
                entity.Property(e => e.RoleId).IsRequired().HasColumnOrder(2);
                entity.Property(e => e.Username).IsRequired().HasColumnOrder(3);
                entity.Property(e => e.Password).IsRequired().HasColumnOrder(4);
                entity.Property(e => e.Email).IsRequired().HasColumnOrder(5);
                entity.Property(e => e.WhoAdded).IsRequired().HasColumnOrder(6);
                entity.Property(e => e.WhenAdded).IsRequired().HasColumnOrder(7);
                entity.Property(e => e.WhoChanged).HasColumnOrder(8);
                entity.Property(e => e.WhenChanged).HasColumnOrder(9);
                entity.Property(e => e.Note).HasColumnOrder(10);
                entity.Property(e => e.IsDeleted).HasColumnOrder(11);
            });

            if (includeSeedData) {
                var roles = Generators.GenerateRoles();
                modelBuilder.Entity<Role>().HasData(roles);

                var credentials = Generators.GenerateCredentials();
                modelBuilder.Entity<Credential>().HasData(credentials);
            }
        }
    }
}