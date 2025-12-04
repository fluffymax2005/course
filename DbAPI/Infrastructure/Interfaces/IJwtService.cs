using DbAPI.Core.Entities;
using System.Security.Claims;

namespace DbAPI.Infrastructure.Interfaces {
    public interface IJwtService {
        string GenerateToken(Credential credential, Role role);
        ClaimsPrincipal ValidateToken(string token);
        int GetTokenLifeTime();
    }
}
