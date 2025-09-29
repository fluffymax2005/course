using System.Security.Cryptography;

namespace DbAPI.Classes {
    public static class PasswordHasher {
        // Salt size (bytes)
        private const int SaltSize = 16;

        // Hash size (bytes)
        private const int HashSize = 32;

        // Iterations coount for PBKDF2
        private const int Iterations = 10000;

        /// <summary>
        /// Make password hash using random salt
        /// </summary>
        public static string HashPassword(string password) {
            // Generate random salt
            byte[] salt = new byte[SaltSize];
            using (var rng = RandomNumberGenerator.Create()) {
                rng.GetBytes(salt);
            }

            // Make password hash
            byte[] hash = CreateHash(password, salt);

            // Join salt and hash
            byte[] hashBytes = new byte[SaltSize + HashSize];
            Array.Copy(salt, 0, hashBytes, 0, SaltSize);
            Array.Copy(hash, 0, hashBytes, SaltSize, HashSize);

            // Convert into base64 string
            return Convert.ToBase64String(hashBytes);
        }

        /// <summary>
        /// Verify that hashed password is equal to password
        /// </summary>
        public static bool VerifyPassword(string password, string hashedPassword) {
            try {
                // Convert base64 string int byte[]
                byte[] hashBytes = Convert.FromBase64String(hashedPassword);

                // Extract salt from first SaltSize bytes
                byte[] salt = new byte[SaltSize];
                Array.Copy(hashBytes, 0, salt, 0, SaltSize);

                // Make hash from given password with extracted salt
                byte[] hash = CreateHash(password, salt);

                // Compare hashes
                for (int i = 0; i < HashSize; i++) {
                    if (hashBytes[i + SaltSize] != hash[i])
                        return false;
                }

                return true;
            } catch {
                return false; // Case wrong format
            }
        }

        /// <summary>
        /// Make hash from given password using PBKDF2
        /// </summary>
        private static byte[] CreateHash(string password, byte[] salt) {
            using (var pbkdf2 = new Rfc2898DeriveBytes(
                password: password,
                salt: salt,
                iterations: Iterations,
                hashAlgorithm: HashAlgorithmName.SHA256)) {
                return pbkdf2.GetBytes(HashSize);
            }
        }

        /// <summary>
        /// Checks whether password is strong
        /// </summary>
        public static bool IsPasswordStrong(string password) {
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                return false;

            bool hasUpperCase = false;
            bool hasLowerCase = false;
            bool hasDigit = false;
            bool hasSpecialChar = false;

            foreach (char c in password) {
                if (char.IsUpper(c)) hasUpperCase = true;
                if (char.IsLower(c)) hasLowerCase = true;
                if (char.IsDigit(c)) hasDigit = true;
                if (char.IsPunctuation(c) || char.IsSymbol(c)) hasSpecialChar = true;
            }

            return hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar;
        }
    }
}
