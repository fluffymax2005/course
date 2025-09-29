using TypeId = int;

namespace DbAPI.Interfaces {
    public interface IPasswordRecoveryService {
        Task<string> GenerateRecoveryToken(TypeId id);
        Task<int?> ValidateRecoveryToken(string token);
        Task InvalidateRecoveryToken(string token);
    }
}
