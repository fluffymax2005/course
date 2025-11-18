namespace DbAPI.Infrastructure.Interfaces {
    public interface IEmailService {
        Task SendRecoveryEmailAsync(string email, string recoveryUrl, string username);
    }
}
