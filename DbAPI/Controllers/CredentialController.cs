using DbAPI.Classes;
using DbAPI.DTO;
using DbAPI.Interfaces;
using DbAPI.Models;
using DbAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using static DbAPI.Interfaces.IInformation;
using TypeId = int;

namespace DbAPI.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class CredentialController : BaseCrudController<Credential, TypeId>, ITableState {
        private readonly RoleRepository _roleRepository;
        private readonly IJwtService _jwtService;
        private readonly ILogger<CredentialController> _logger;
        private readonly IEmailService _emailService;
        private readonly IPasswordRecoveryService _passwordRecoveryService;
        private readonly IMemoryCache _cache;

        public CredentialController(IRepository<Credential, TypeId> credentialRepository, RoleRepository roleRepository,
            IJwtService jwtService, ILogger<CredentialController> logger, IEmailService emailService,
            IPasswordRecoveryService passwordRecoveryService, IMemoryCache cache) : base(credentialRepository) {
            _roleRepository = roleRepository;
            _jwtService = jwtService;
            _logger = logger;
            _emailService = emailService;
            _passwordRecoveryService = passwordRecoveryService;
            _cache = cache;
        }

        protected int GetEntityId(Credential entity) {
            return entity.Id;
        }

        [HttpGet("test")]
        public async Task<IActionResult> Test() {
            _logger.LogInformation("CredentialController:Test()");
            return Ok($"Подключение к БД успешно установлено: {DateTime.Now}");
        }

        [HttpPost("login")]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginPrompt request) {
            _logger.LogInformation($"Начало попытки авторизации для пользователя \"{request.Login}\"");

            // Standart checks
            CredentialRepository _credentialRepository = (CredentialRepository)_repository;
            if (_credentialRepository == null || _roleRepository == null || _jwtService == null) {
                _logger.LogCritical("Внутренняя ошибка: репозитории и сервисы не проинициализированы");
                return StatusCode(500, new { message = "Внутренняя ошибка" });
            }

            try {
                // Whether credential with such username exists
                Credential? credential = await _credentialRepository.GetByUserNameAsync(request.Login);
                if (credential == null) {
                    credential = await GetByEmailAsync(request.Login);
                }
                if (credential == null || credential.IsDeleted != null) {
                    _logger.LogError($"Пользователя с именем \"{request.Login}\" не существует");
                    return Unauthorized(new { message = $"Пользователя с именем \"{request.Login}\" не существует" });
                }


                // Password verification
                if (!Hasher.VerifyPassword(request.Password, credential.Password)) {
                    _logger.LogError($"Введен неверный логин или пароль пользователя \"{request.Login}\"");
                    return Unauthorized(new { message = "Введен неверный логин или пароль" });
                }


                // Whether such role exists 
                var role = await _roleRepository.GetByIdAsync(credential.RoleId);
                if (role == null || role.IsDeleted != null) {
                    _logger.LogCritical("Внутренняя ошибка: введенная роль пользователя не существует в БД");
                    return BadRequest(new { message = "Внутренняя ошибка" });
                }

                var token = _jwtService.GenerateToken(credential, role);

                var response = new LoginResponse {
                    UserId = credential.Id,
                    Username = credential.Username,
                    UserRights = role.Rights,
                    Token = token,
                    TokenExpireTime = DateTime.UtcNow.AddMinutes(_jwtService.GetTokenLifeTime()),
                    CanGet = role.CanGet,
                    CanPost = role.CanPost,
                    CanUpdate = role.CanUpdate,
                    CanDelete = role.CanDelete,
                };

                _logger.LogInformation($"Авторизация пользователя \"{request.Login}\" прошла успешно");
                return Ok(response);
            } catch (Exception ex) {
                _logger.LogCritical($"Внутренняя ошибка: {ex.Message}");
                return StatusCode(500, new { message = $"Внутренняя ошибка: {ex.Message}" });
            }
        }

        // POST: api/{entity}/register
        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] RegisterPrompt request) {
            string logRights = request.RegisterRights switch {
                UserRights.Basic => "простого пользователя",
                UserRights.Editor => "редактора",
                UserRights.Admin => "администратора"
            };

            _logger.LogInformation($"Начало попытки регистрации пользователя \"{request.UserName}\" " +
                $"с правами {logRights}. " +
                $"Админ-регистратор \"{request.WhoRegister ?? "отсутствует"}\"");

            // Standart checks
            CredentialRepository _credentialRepository = (CredentialRepository)_repository;
            if (_credentialRepository == null || _roleRepository == null) {
                _logger.LogCritical("Внутренняя ошибка: репозитории и сервисы не проинициализированы");
                return StatusCode(500, new { message = "Внутренняя ошибка" });
            }


            // Check whether person who registrates current one exists
            if (request.RegisterRights != UserRights.Basic && (request.WhoRegister.IsNullOrEmpty() ||
                await _credentialRepository.GetByUserNameAsync(request.WhoRegister) == null)) {
                _logger.LogError($"Администратор с именем \"{request.WhoRegister}\", " +
                    $"который регистрирует нового пользователя не существует");
                return BadRequest(new {
                    message = $"Администратор с именем \"{request.WhoRegister}\", " +
                    $"который регистрирует нового пользователя не существует"
                });
            }

            // Whether user with such name exists
            var credential = await _credentialRepository.GetByUserNameAsync(request.UserName);
            if (credential != null) {
                _logger.LogError($"Пользователь с именем \"{request.UserName}\" и адресом электронной почты " +
                    $"\"{request.Email}\" уже существует");
                return BadRequest(new {
                    message = $"Пользователь с именем \"{request.UserName}\" и адресом электронной почты " +
                    $"\"{request.Email}\" уже существует"
                });
            }

            // Check whether password is strong
            if (!Hasher.IsPasswordStrong(request.Password)) {
                _logger.LogError("Введенный пароль ненадёжен");
                return BadRequest(new { message = "Введенный пароль ненадёжен" });
            }

            // Whether selected role exists
            var role = await _roleRepository.GetByUserRights(request.RegisterRights);
            if (role == null) {
                _logger.LogError("\"Введенные права пользователя не существуют\"");
                return BadRequest(new { message = "Введенные права пользователя не существуют" });
            }


            var response = new RegisterResponse {
                UserName = request.UserName,
                CanGet = true,
                CanPost = request.RegisterRights != UserRights.Basic,
                CanUpdate = request.RegisterRights != UserRights.Basic,
                CanDelete = request.RegisterRights == UserRights.Admin
            };

            await _credentialRepository.AddAsync(new Credential {
                RoleId = role.Id,
                Username = request.UserName,
                Password = Hasher.HashPassword(request.Password),
                Email = request.Email,
                WhoAdded = request.WhoRegister.IsNullOrEmpty() ? request.UserName : request.WhoRegister,
                WhenAdded = DateTime.Now,
            });

            _logger.LogInformation($"Регистрация пользователя \"{request.UserName}\" прошла успешно");

            return Ok(response);
        }

        // PUT: api/{entity}/recover
        [HttpPost("recover")]
        [EnableRateLimiting("RecoverPolicy")]
        public async Task<IActionResult> RecoverAsync([FromBody] PasswordRecoveryRequest request) {
            _logger.LogInformation($"Начало попытки восстановления пароля");

            try {
                var credential = await GetByEmailAsync(request.Email);
                if (credential == null || credential.IsDeleted != null) {
                    _logger.LogWarning($"Запрос восстановления для несуществующего email: {request.Email}");
                    return Ok(new { message = $"Пользователя с email \"{request.Email}\" не существует" });
                }

                // Generate recover token
                var recoveryToken = await _passwordRecoveryService.GenerateRecoveryToken(credential.Id);

                // Create link to recover password
                var resetLink = $"{Request.Scheme}://{Request.Host}/api/Credential/reset/form?token={recoveryToken}";

                // Send email
                await _emailService.SendRecoveryEmailAsync(request.Email, resetLink, credential.Username);
                _logger.LogInformation($"Ссылка восстановления отправлена для пользователя \"{credential.Username}\" на почту \"{request.Email}\"");

                return Ok(new { message = "Если email зарегистрирован, инструкции будут отправлены" });
            } catch (Exception ex) {
                _logger.LogError($"Ошибка при обработке запроса восстановления: {ex.Message}");
                return StatusCode(500, new { message = "Произошла ошибка при обработке запроса" });
            }
        }

        // GET api/{entity}/reset/form
        [HttpGet("reset/form")]
        public IActionResult GetResetHTMLForm(string token) {
            _logger.LogInformation($"Запрос на сброс пароля создан для токена {token}");
            return PhysicalFile(
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "reset-password.html"),
                "text/html");
        }


        // POST api/{entity}/reset
        [HttpPost("reset")]
        public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequest request) {
            _logger.LogInformation("Запрос на сброс пароля");

            try {
                if (request.NewPassword != request.ConfirmPassword) {
                    return BadRequest(new { message = "Пароли не совпадают" });
                }

                if (!Hasher.IsPasswordStrong(request.NewPassword)) {
                    return BadRequest(new { message = "Пароль ненадежен" });
                }

                var userId = await _passwordRecoveryService.ValidateRecoveryToken(request.Token);
                if (userId == null) {
                    return BadRequest(new { message = "Недействительная или устаревшая ссылка восстановления" });
                }

                // Find user
                var _credentialRepository = (CredentialRepository)_repository;
                var credential = await _repository.GetByIdAsync(userId.Value);
                if (credential == null || credential.IsDeleted != null) {
                    return BadRequest(new { message = "Пользователь не найден" });
                }

                // Update password
                credential.Password = Hasher.HashPassword(request.NewPassword);
                credential.WhenChanged = DateTime.Now;

                await _credentialRepository.UpdateAsync(credential);

                // Invalidate recovery token
                await _passwordRecoveryService.InvalidateRecoveryToken(request.Token);

                _logger.LogInformation($"Пароль успешно сброшен для пользователя ID: {userId}");

                return Ok(new { message = "Пароль успешно изменен" });
            } catch (Exception ex) {
                _logger.LogError($"Ошибка при сбросе пароля: {ex.Message}");
                return StatusCode(500, new { message = "Произошла ошибка при сбросе пароля" });
            }
        }

        // GET: api/{entity}/validate-recovery-token?token={token}
        [HttpGet("validate-recovery-token")]
        public async Task<IActionResult> ValidateRecoveryTokenAsync([FromQuery] string token) {
            try {
                var userId = await _passwordRecoveryService.ValidateRecoveryToken(token);
                return Ok(new { valid = userId != null });
            } catch (Exception ex) {
                _logger.LogError($"Ошибка при проверке токена восстановления: {ex.Message}");
                return Ok(new { valid = false });
            }
        }

        [HttpGet("validate-token")]
        [AllowAnonymous]
        public IActionResult ValidateToken([FromQuery] string token) {
            try {
                var result = _jwtService.ValidateToken(token);
                return Ok(new { message = "Token is valid", });
            } catch (Exception ex) {
                _logger.LogError($"Ошибка при проверке токена: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
        }

        private async Task<Credential?> GetByEmailAsync(string email) {
            var _credentialRepository = (CredentialRepository)_repository;
            var credentials = await _credentialRepository.GetAllAsync();
            return credentials?.Where(c => c.Email == email).FirstOrDefault();
        }

        // GET: api/{entity}/user?username={username}
        [HttpGet("user")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Credential>> GetByUserName([FromQuery] string username) {
            var credentials = await _repository.GetAllAsync();
            var credential = credentials.Where(c => c.Username == username).FirstOrDefault();
            return credential != null ? Ok(credential) : NotFound(credential);
        }

        // GET: api/{entity}/
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public override async Task<ActionResult<IEnumerable<Credential>>> GetAllAsync() {
            _logger.LogWarning($"Администратор \"{User.Identity.Name}\" сделал запрос ко всем учетным записям");
            return Ok(await _repository.GetAllAsync());
        }

        // GET: api/{entity}/merge
        [HttpGet("merge")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Credential>>> GetAllMergedAsync() {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"Credential.GetAllMerged()\"");

            var credentials = await _repository.GetAllAsync();
            var roles = await _roleRepository.GetAllAsync();
            return Ok(credentials.Join(
                roles,
                credential => credential.RoleId,
                role => role.Id,
                (credential, role) => new {
                    Id = credential.Id,
                    RoleId = $"{role.Forename} ({role.Id})",
                    Username = credential.Username,
                    Password = credential.Password,
                    Email = credential.Email,
                    WhoAdded = credential.WhoAdded,
                    WhenAdded = credential.WhenAdded,
                    WhoChanged = credential.WhoChanged,
                    WhenChanged = credential.WhenChanged,
                    Note = credential.Note,
                    IsDeleted = credential.IsDeleted
                }
            ));
        }

        // GET: api/{entity}/{id}
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<ActionResult<Credential>> GetAsync(TypeId id) {
            var entity = await _repository.GetByIdAsync(id);
            _logger.LogWarning($"Администратор {User.Identity.Name} сделал запрос учетной записи с ID = {id}");
            return entity is null ? NotFound(new { message = $"Сущность с ID = {id} не найдена" }) : Ok(entity);
        }

        // GET: api/{entity}/merge
        [HttpGet("{id}/merge")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<Credential>>> GetMergedAsync(TypeId id) {
            _logger.LogInformation($"\"{User.Identity.Name}\" сделал запрос \"TransportVehicle.GetMerged({id})\"");

            var credential = await _repository.GetByIdAsync(id);
            var roles = await _roleRepository.GetAllAsync();
            var role = roles.Where(d => d.Id == credential.RoleId).FirstOrDefault();

            return Ok(new {
                Id = credential.Id,
                RoleId = $"{role.Forename} ({role.Id})",
                Username = credential.Username,
                Password = credential.Password,
                Email = credential.Email,
                WhoAdded = credential.WhoAdded,
                WhenAdded = credential.WhenAdded,
                WhoChanged = credential.WhoChanged,
                WhenChanged = credential.WhenChanged,
                Note = credential.Note,
                IsDeleted = credential.IsDeleted
            });
        }

        // POST: api/{entity}/
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> CreateAsync([FromBody] Credential entity) {
            _logger.LogWarning($"\"{User.Identity.Name}\" сделал запрос \"Credential.Create()\"");
            TypeId? id;
            entity.WhoAdded = User.Identity.Name;
            try {
                id = await _repository.AddAsync(entity);
                _logger.LogInformation($"Администратор {User.Identity.Name} создал новую учетную запись с ID = {entity.Id}");
            } catch (Exception ex) {
                _logger.LogError($"Администратору {User.Identity.Name} не удалось создать новую учетную запись с ID = {entity.Id}. " +
                    $"Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Role.Create()\" пользователя \"{User.Identity.Name}\" успешен");
            return Ok(new { hash = UpdateTableHash(), id = id });
        }

        // PUT: api/{entity}/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> UpdateAsync(TypeId id, [FromBody] Credential entity) {
            _logger.LogWarning($"Администратор {User.Identity.Name} пытается обновить данные учетной записи с ID = {entity.Id}");
            if (!id.Equals(GetEntityId(entity))) {
                _logger.LogError($"Администратору {User.Identity.Name} не удалось обновить данные учетной записи с ID = {entity.Id}. " +
                    $"Причина: сущность не найдена");
                return BadRequest(new { message = $"Сущность с ID = {id} не найдена" });
            }

            entity.WhoChanged = User.Identity.Name;
            try {
                await _repository.UpdateAsync(entity);
            } catch (InvalidDataException ex) {
                _logger.LogError($"Credential:UpdateAsync({id}): {ex.Message}");
                return BadRequest($"Ошибка сохранения: {ex.Message}");
            }

            _logger.LogInformation($"Администратор {User.Identity.Name} обновил учетную запись с ID = {entity.Id}");
            await _repository.UpdateAsync(entity);
            return Ok(new { hash = UpdateTableHash() });
        }

        // DELETE: api/{entity}/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> DeleteAsync(TypeId id) {
            _logger.LogWarning($"Администратор {User.Identity.Name} пытается удалить учетную запись с ID = {id}");

            try {
                await _repository.SoftDeleteAsync(id);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Credential.Delete({id})\" администратора \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }

            _logger.LogInformation($"Администратор {User.Identity.Name} удалил учетную запись с ID = {id}");
            return Ok(new { hash = UpdateTableHash() });
        }

        // Update: api/{entity}/{id}/recover
        [HttpPatch("{id}/recover")]
        [Authorize(Roles = "Admin")]
        public override async Task<IActionResult> RecoverAsync(TypeId id) {
            _logger.LogWarning($"Администратор {User.Identity.Name} пытается восстановить учетную запись с ID = {id}");

            try {
                await _repository.RecoverAsync(id);
            } catch (Exception ex) {
                _logger.LogError($"Запрос \"Credential.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" завершился ошибкой. " +
                    $"Причина: {ex.Message}");
                return NotFound(new { message = ex.Message });
            }

            _logger.LogInformation($"Запрос \"Credential.RecoverAsync({id})\" администратора \"{User.Identity.Name}\" успешен");
            return Ok(new { message = "Восстановление прошло успешно", hash = UpdateTableHash() });
        }

        // api/{entity}/generate-table-state-hash
        [HttpGet("generate-table-state-hash")]
        [Authorize(Roles = "Admin")]
        public IActionResult GenerateTableStateHash() {
            _logger.LogInformation($"Перегенерация хэша актульности таблицы \"Credential\"");

            return Ok(new { hash = UpdateTableHash() });
        }

        // api/{entity}/verify-table-state-hash
        [HttpGet("verify-table-state-hash")]
        [Authorize(Roles = "Admin")]
        public IActionResult VerifyTableStateHash([FromQuery] string hash) {
            var cacheKey = "Credential";
            var cacheHash = _cache.Get<string>(cacheKey);

            if (cacheHash == null) {
                var newHash = UpdateTableHash();
                return Ok(new { result = "0", hash = newHash });
            } else {
                var verifyResult = cacheHash.Equals(hash);
                return Ok(new {
                    result = verifyResult ? "1" : "0",
                    hash = verifyResult ? hash : cacheHash,
                });
            }
        }

        private string UpdateTableHash() {
            var cacheKey = "Credential";
            var hash = Hasher.CreateTableHash();

            _cache.Remove(cacheKey); // remove old hash
            _cache.Set(cacheKey, hash); // add new hash

            return hash;
        }

    }
}