using DbAPI.Classes;
using DbAPI.DTO;
using DbAPI.Interfaces;
using DbAPI.Models;
using DbAPI.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DbAPI.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class RecoverController : ControllerBase {
        private readonly ILogger _logger;
        private readonly CredentialRepository _credentialRepository;
        private readonly IEmailService _emailService;
        private readonly IPasswordRecoveryService _passwordRecoveryService;

        public RecoverController(ILogger<RecoverController> logger, CredentialRepository credentialrepository, IEmailService emailService,
            IPasswordRecoveryService passwordRecoveryService) {
            _logger = logger;
            _credentialRepository = credentialrepository;
            _emailService = emailService;
            _passwordRecoveryService = passwordRecoveryService;
        }

        // GET: api/{entity}/recover/form
        [HttpGet("recover/form")]
        public IActionResult GetRecoverWebForm() {
            // Страница запроса восстановления (если нужна)
            _logger.LogInformation("Запрос на восстановление пароля через веб-форму создан");
            return PhysicalFile(
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "recovery.html"),
                "text/html"
            );
        }

        // PUT: api/{entity}/recover/request
        [HttpPost("recover/request")]
        [EnableRateLimiting("RecoverPolicy")]
        public async Task<IActionResult> Recover([FromBody] PasswordRecoveryRequest request) {
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
                var resetLink = $"{Request.Scheme}://{Request.Host}/api/recover/reset/form?token={recoveryToken}";

                // Send email
                await _emailService.SendRecoveryEmailAsync(request.Email, resetLink, credential.Username);
                _logger.LogInformation($"Ссылка восстановления отправлена для пользователя \"{credential.Username}\" на почту \"{request.Email}\"");

                return Ok(new { message = "Если email зарегистрирован, инструкции будут отправлены" });
            } catch (Exception ex) {
                _logger.LogError($"Ошибка при обработке запроса восстановления: {ex.Message}");
                return StatusCode(500, new { message = "Произошла ошибка при обработке запроса" });
            }
        }

        // GET: api/{entity}/reset/form
        [HttpGet("reset/form")]
        public IActionResult GetResetPasswordForm([FromQuery] string token) {
            _logger.LogInformation($"Запрос формы сброса пароля с токеном: {token}");
            return PhysicalFile(
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "reset-password.html"),
                "text/html"
            );
        }

        // POSTL api/{entity}/reset/request
        [HttpPost("reset/request")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request) {
            _logger.LogInformation("Запрос на сброс пароля");

            try {
                if (request.NewPassword != request.ConfirmPassword) {
                    return BadRequest(new { message = "Пароли не совпадают" });
                }

                if (!PasswordHasher.IsPasswordStrong(request.NewPassword)) {
                    return BadRequest(new { message = "Пароль ненадежен" });
                }

                var userId = await _passwordRecoveryService.ValidateRecoveryToken(request.Token);
                if (userId == null) {
                    return BadRequest(new { message = "Недействительная или устаревшая ссылка восстановления" });
                }

                // Find user
                var credential = await _credentialRepository.GetByIdAsync(userId.Value);
                if (credential == null || credential.IsDeleted != null) {
                    return BadRequest(new { message = "Пользователь не найден" });
                }

                // Update password
                credential.Password = PasswordHasher.HashPassword(request.NewPassword);
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

        // GET: api/Recover/validate-token
        [HttpGet("validate-token")]
        public async Task<IActionResult> ValidateToken([FromQuery] string token) {
            try {
                var userId = await _passwordRecoveryService.ValidateRecoveryToken(token);
                return Ok(new { valid = userId != null });
            } catch (Exception ex) {
                _logger.LogError($"Ошибка при проверке токена: {ex.Message}");
                return Ok(new { valid = false });
            }
        }

        private async Task<Credential?> GetByEmailAsync(string email) {
            var credentials = await _credentialRepository.GetAllAsync();
            return credentials?.Where(c => c.Email == email).FirstOrDefault();
        }
    }
}
