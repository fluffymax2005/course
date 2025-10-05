using DbAPI.Interfaces;
using System.Net;
using System.Net.Mail;

namespace DbAPI.Services {
    public class EmailService : IEmailService {
        private readonly ILogger<EmailService> _logger;
        private readonly IConfiguration _configuration;

        public EmailService(ILogger<EmailService> logger, IConfiguration configuration) {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task SendRecoveryEmailAsync(string email, string recoveryUrl, string username) {
            _logger.LogInformation($"Восстановление пароля для {username} ({email})");
            _logger.LogInformation($"Ссылка для сброса: {recoveryUrl}");

            try {

                // Проверяем входные параметры на null
                if (string.IsNullOrEmpty(email)) {
                    throw new ArgumentNullException(nameof(email), "Email должен быть непустой строкой");
                }

                if (string.IsNullOrEmpty(recoveryUrl)) {
                    throw new ArgumentNullException(nameof(recoveryUrl), "Ссылка для восстановления должна быть непустой строкой");
                }

                using var smtpClient = new SmtpClient(_configuration["Email:Host"]) {
                    Port = int.Parse(_configuration["Email:Port"]),
                    Credentials = new NetworkCredential(_configuration["Email:Username"], _configuration["Email:Password"]),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage {
                    From = new MailAddress(_configuration["Email:From"]),
                    Subject = "Восстановление пароля",
                    Body = $"Здравствуйте, {username}!<br><br>Для восстановления пароля перейдите по ссылке: <a href='{recoveryUrl}'>Восстановить пароль</a><br><br>Ссылка действительна 1 час.",
                    IsBodyHtml = true,
                };
                mailMessage.To.Add(email);

                await smtpClient.SendMailAsync(mailMessage);

                _logger.LogInformation($"Email отправлен для {email}");
            } catch (Exception ex) {
                _logger.LogError($"Ошибка отправки email: {ex.Message}");
                throw;
            }
        }
    }
}
