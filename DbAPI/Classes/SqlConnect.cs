namespace DbAPI.Classes {
    public static class SqlConnect {
        public enum ConnectMode { WindowsSecure, SqlServerSecure };

        public static string? GetConnectionString(ConnectMode mode, string? ip, string? dbName, string? login, string? password, bool isTrustedConnection = true, bool trustServerSertificate = true) {
            string? connectionString = "";

            connectionString += $"Server={(ip == null ? "" : ip)};";
            connectionString += $"Database={(dbName == null ? "" : dbName)};";

            if (mode == ConnectMode.SqlServerSecure) {
                connectionString += $"User ID={(login == null ? "" : login)};";
                connectionString += $"Password={(password == null ? "" : password)};";
            }

            connectionString += $"Trusted_Connection={(isTrustedConnection ? "True" : "False")};";

            //if (mode == ConnectMode.SqlServerSecure) {
            connectionString += $"TrustServerCertificate={(trustServerSertificate ? "True" : "False")};";
            //}

            return connectionString;
        }
    }
}
