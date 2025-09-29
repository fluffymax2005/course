using DbAPI.Models;
using System.Security.Claims;

namespace DbAPI.Interfaces {
    public interface IJwtService {
        string GenerateToken(Credential credential, Role role);
        ClaimsPrincipal ValidateToken(string token);
        int GetTokenLifeTime();
    }
}
