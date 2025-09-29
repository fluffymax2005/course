using DbAPI.Interfaces;

namespace DbAPI.Services {
    public class EmailService : IEmailService {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger) {
            _logger = logger;
        }

        public async Task SendRecoveryEmailAsync(string email, string recoveryUrl, string username) {
            var emailContent = $@"
                Восстановление пароля

                Здравствуйте, {username}!

                Для восстановления пароля перейдите по ссылке:
                {recoveryUrl}

                Ссылка действительна 24 часа.

                Если вы не запрашивали восстановление, проигнорируйте это письмо.";

            _logger.LogInformation($"Восстановление пароля пользователя \"{username}\"");

            await Task.CompletedTask;
        }
    }
}
