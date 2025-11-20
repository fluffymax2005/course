using DbAPI.Infrastructure.Contexts;
using DbAPI.Infrastructure.Interfaces;
using DbAPI.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add logging
#if SWAGGER
string logPath = Path.Combine(Path.Combine(Directory.GetCurrentDirectory(), "Infrastructure", "logs"));
#endif
#if DOCKER
string logPath = Path.Combine(Directory.GetCurrentDirectory(), Environment.GetEnvironmentVariable("LOG_PATH"));
#endif

builder.Logging.AddFile(logPath);

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

// Register OrderDbContext and CredentialDbContext + reposes

#if DOCKER
var dbHostData = Environment.GetEnvironmentVariable("DB_HOST1");
var dbHostUserData = Environment.GetEnvironmentVariable("DB_HOST2");

var dbDataName = Environment.GetEnvironmentVariable("DB_NAME1");
var dbUserDataName = Environment.GetEnvironmentVariable("DB_NAME2");

var saPassword = Environment.GetEnvironmentVariable("DB_SA_PASSWORD");

var connectionDataString = $"Data Source={dbHostData};Initial Catalog={dbDataName};User Id=sa;Password={saPassword};TrustServerCertificate=true";
var connectionUserDataString = $"Data Source={dbHostUserData};Initial Catalog={dbUserDataName};User Id=sa;Password={saPassword};TrustServerCertificate=true";

builder.Services.AddDbContext<OrderDbContext>(options => options.UseSqlServer(connectionDataString));
builder.Services.AddDbContext<CredentialDbContext>(options => options.UseSqlServer(connectionUserDataString));
#endif

#if SWAGGER
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultDataConnection")));

builder.Services.AddDbContext<CredentialDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultCredentialConnection")));
#endif

// Dependency injection
builder.Services.AddReposes();
builder.Services.AddEmailServices();
builder.Services.AddPasswordRecoveryServices();
builder.Configuration.AddConfigurationSecrets();

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

// CORS policy
builder.Services.AddCors(options => {
    options.AddPolicy("AllowFrontend", policy => {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddAuthorization();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
#if SWAGGER
    app.UseSwagger();
    app.UseSwaggerUI();
#endif
}

app.UseRouting();

app.AddStaticFiles(); // Allow using HTML CSS JS

app.UseCors("AllowFrontend"); // CORS policy

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();