using DbAPI.Contexts;
using DbAPI.Interfaces;
using DbAPI.Models;
using DbAPI.Repositories;
using DbAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;
using TypeId = int;

var builder = WebApplication.CreateBuilder(args);

// Add logging
builder.Logging.AddFile(Path.Combine(Directory.GetCurrentDirectory(), "logs"));

// Disable system debug requests
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.None); // SQL requests
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Connection", LogLevel.Error); // SQL connection
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Infrastructure", LogLevel.None);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Update", LogLevel.None);

// Min level for system logs
builder.Logging.AddFilter("Microsoft", LogLevel.Error);
builder.Logging.AddFilter("System", LogLevel.Error);

// Swagger logs only for errors
builder.Logging.AddFilter("Microsoft.AspNetCore.Hosting", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.AspNetCore.Routing", LogLevel.Warning);
builder.Logging.AddFilter("Swashbuckle.AspNetCore", LogLevel.Warning);

// My log categories - all levels to log
builder.Logging.AddFilter("DbAPI", LogLevel.Debug);
builder.Logging.AddFilter("db", LogLevel.Debug); // my controllers
builder.Logging.AddFilter("db.Controllers", LogLevel.Information);

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options => {
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid token in the text input below.\n\nExample: \"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\""
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddRateLimiter(options => {
    options.AddPolicy("RecoveryPolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions {
                AutoReplenishment = true,
                PermitLimit = 3,
                Window = TimeSpan.FromHours(1)
            }
        ));
});

// Register OrderDbContext + reposes
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IRepository<Order, TypeId>, OrderRepository>();
builder.Services.AddScoped<IRepository<Customer, TypeId>, CustomerRepository>();
builder.Services.AddScoped<IRepository<Driver, TypeId>, DriverRepository>();
builder.Services.AddScoped<IRepository<Rate, TypeId>, RateRepository>();
builder.Services.AddScoped<IRepository<DbAPI.Models.Route, TypeId>, RouteRepository>();
builder.Services.AddScoped<IRepository<TransportVehicle, TypeId>, TransportVehicleRepository>();

builder.Services.AddScoped<IRepository<Role, TypeId>, RoleRepository>();
builder.Services.AddScoped<IRepository<Credential, TypeId>, CredentialRepository>();
builder.Services.AddScoped<RoleRepository>();
builder.Services.AddScoped<CredentialRepository>();

builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddMemoryCache();
builder.Services.AddScoped<IPasswordRecoveryService, PasswordRecoveryService>();

// JWT
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.AddScoped<IJwtService, JwtService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();