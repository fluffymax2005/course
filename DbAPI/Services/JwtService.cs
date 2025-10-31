using DbAPI.Interfaces;
using DbAPI.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DbAPI.Services {
    public class JwtService : IJwtService {
        private readonly JwtSettings _jwtSettings;

        public JwtService(IOptions<JwtSettings> jwtSettings) {
            _jwtSettings = jwtSettings.Value;
        }

        public string GenerateToken(Credential credential, Role role) {
            // Create claims about user (утверждение, слово как в паспорте)
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, credential.Id.ToString()),
                new Claim(ClaimTypes.Name, credential.Username),

                new Claim(ClaimTypes.Role, GetRoleName(role)),
                new Claim("CanGet", role.CanGet.ToString()),
                new Claim("CanPost", role.CanPost.ToString()),
                new Claim("CanUpdate", role.CanUpdate.ToString()),
                new Claim("CanDelete", role.CanDelete.ToString()),

                // Unique token id 
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),

                // Time of token creating
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds()
                .ToString(), ClaimValueTypes.Integer64)
            };

            // Make symmetric key for secret string
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));

            // Make credentials for sign
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // Create JWT token
            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer, // Token producer
                audience: _jwtSettings.Audience, // Audience of token
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryInMinutes), // Live time of token
                signingCredentials: credentials // Sign 
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal ValidateToken(string token) {
            // Make JWT token handler
            var tokenHandler = new JwtSecurityTokenHandler();

            // Convert secret key into bytes
            var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

            // Validation properties of token
            var validationParameters = new TokenValidationParameters {
                ValidateIssuerSigningKey = true, // key validate is required
                IssuerSigningKey = new SymmetricSecurityKey(key), // key to check
                ValidateIssuer = true, // validate producer
                ValidIssuer = _jwtSettings.Issuer, // expected producer
                ValidateAudience = true, // validate audience
                ValidAudience = _jwtSettings.Audience, // expected audience
                ValidateLifetime = true, // validate lifetime
                ClockSkew = TimeSpan.Zero // without enter by time
            };

            try {
                // Validate token and get ClaimsPrincipal
                var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                return principal;
            } catch (SecurityTokenException ex) {
                // Catch specific security exceptions
                throw new Exception("Invalid token", ex);
            } catch (Exception ex) {
                // Catch other exceptions
                throw new Exception("Token validation failed", ex);
            }
        }

        public int GetTokenLifeTime() {
            return _jwtSettings.ExpiryInMinutes;
        }

        private string GetRoleName(Role role) {
            return role.Id switch {
                0 => "Basic",
                1 => "Editor",
                2 => "Admin",
                3 => "Director"
            };
        }
    }
}
