using DbAPI.Interfaces;

using TypeId = int;

namespace DbAPI.Services {
    public class PasswordRecoveryService : IPasswordRecoveryService {
        private readonly Dictionary<string, RecoveryTokenInfo> _recoveryTokens = new();
        private readonly TimeSpan _tokenLifeTime = TimeSpan.FromHours(1);

        public async Task<string> GenerateRecoveryToken(TypeId id) {
            var token = Guid.NewGuid().ToString() + Guid.NewGuid().ToString(); // token for recovering
            var tokenInfo = new RecoveryTokenInfo {
                UserId = id,
                ExpiresAt = DateTime.UtcNow.Add(_tokenLifeTime),
                IsUsed = false
            };

            _recoveryTokens[token] = tokenInfo;
            return await Task.FromResult(token);
        }

        public async Task<int?> ValidateRecoveryToken(string token) {
            if (_recoveryTokens.TryGetValue(token, out var tokenInfo)) {
                if (tokenInfo.ExpiresAt > DateTime.UtcNow && !tokenInfo.IsUsed) {
                    return await Task.FromResult(tokenInfo.UserId);
                }
            }
            return await Task.FromResult<int?>(null);
        }

        public async Task InvalidateRecoveryToken(string token) {
            if (_recoveryTokens.ContainsKey(token)) {
                _recoveryTokens[token].IsUsed = true;
            }
            await Task.CompletedTask;
        }

        private class RecoveryTokenInfo {
            public TypeId UserId { get; set; }
            public DateTime ExpiresAt { get; set; }
            public bool IsUsed { get; set; }
        }
    }
}
