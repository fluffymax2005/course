using static DbAPI.Interfaces.IInformation;
using TypeId = int;

namespace DbAPI.DTO {
    public class LoginResponse {
        public TypeId UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public UserRights UserRights { get; set; }

        public string Token { get; set; }
        public DateTime TokenExpireTime { get; set; }

        public bool CanGet { get; set; }
        public bool CanPost { get; set; }
        public bool CanUpdate { get; set; }
        public bool CanDelete { get; set; }
    }
}
