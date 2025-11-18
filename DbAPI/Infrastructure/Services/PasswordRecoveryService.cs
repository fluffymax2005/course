using DbAPI.Infrastructure.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace DbAPI.Infrastructure.Services {
    public class PasswordRecoveryService : IPasswordRecoveryService {
        private readonly IMemoryCache _cache;
        private readonly ILogger<PasswordRecoveryService> _logger;
        private readonly TimeSpan _tokenLifeTime = TimeSpan.FromHours(1);

        public PasswordRecoveryService(IMemoryCache cache, ILogger<PasswordRecoveryService> logger) {
            _cache = cache;
            _logger = logger;
        }

        public async Task<string> GenerateRecoveryToken(int userId) {
            try {
                var token = Guid.NewGuid().ToString();
                var cacheKey = $"RecoveryToken_{token}";

                _logger.LogInformation($"🔐 Генерация токена для пользователя {userId}");
                _logger.LogInformation($"📝 Токен: {token}");

                // Сохраняем userId в кэше с временем жизни
                _cache.Set(cacheKey, userId, new MemoryCacheEntryOptions {
                    AbsoluteExpirationRelativeToNow = _tokenLifeTime
                });

                _logger.LogInformation($"✅ Токен сохранен в кэше для пользователя {userId}");

                return await Task.FromResult(token);
            } catch (Exception ex) {
                _logger.LogError($"❌ Ошибка генерации токена: {ex.Message}");
                throw;
            }
        }

        public async Task<int?> ValidateRecoveryToken(string token) {
            try {
                _logger.LogInformation($"🔍 Валидация токена: {token}");

                if (string.IsNullOrEmpty(token)) {
                    _logger.LogWarning("❌ Токен пустой");
                    return null;
                }

                var cacheKey = $"RecoveryToken_{token}";

                if (_cache.TryGetValue(cacheKey, out int userId)) {
                    _logger.LogInformation($"✅ Токен валиден для пользователя {userId}");
                    return await Task.FromResult(userId);
                }

                _logger.LogWarning($"❌ Токен не найден в кэше: {token}");
                return await Task.FromResult((int?)null);
            } catch (Exception ex) {
                _logger.LogError($"❌ Ошибка валидации токена: {ex.Message}");
                return null;
            }
        }

        public async Task InvalidateRecoveryToken(string token) {
            try {
                var cacheKey = $"RecoveryToken_{token}";
                _cache.Remove(cacheKey);
                _logger.LogInformation($"🗑️ Токен инвалидирован: {token}");
            } catch (Exception ex) {
                _logger.LogError($"❌ Ошибка инвалидации токена: {ex.Message}");
            }

            await Task.CompletedTask;
        }
    }
}