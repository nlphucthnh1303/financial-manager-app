using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Npgsql;

namespace FinancialManager.Desktop
{
    /// <summary>
    /// Per-user settings stored in %APPDATA%\FinancialManager\settings.json.
    /// The database password and the JWT signing key are encrypted with Windows DPAPI (current user only).
    /// </summary>
    public class DesktopSettings
    {
        public string Host { get; set; } = "localhost";
        public int Port { get; set; } = 5432;
        public string Database { get; set; } = "financial-manager-app";
        public string Username { get; set; } = "postgres";
        public string Password { get; set; } = string.Empty;
        public string JwtSecret { get; set; } = string.Empty;

        public static string DataDirectory { get; } =
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FinancialManager");

        private static string FilePath => Path.Combine(DataDirectory, "settings.json");

        /// <summary>True once the user has saved a database connection at least once.</summary>
        public bool IsConfigured { get; private set; }

        public string ConnectionString => new NpgsqlConnectionStringBuilder
        {
            Host = Host,
            Port = Port,
            Database = Database,
            Username = Username,
            Password = Password,
        }.ConnectionString;

        public static DesktopSettings Load()
        {
            var settings = new DesktopSettings();
            if (File.Exists(FilePath))
            {
                var stored = JsonSerializer.Deserialize<StoredSettings>(File.ReadAllText(FilePath)) ?? new StoredSettings();
                settings.Host = stored.Host ?? settings.Host;
                settings.Port = stored.Port ?? settings.Port;
                settings.Database = stored.Database ?? settings.Database;
                settings.Username = stored.Username ?? settings.Username;
                settings.Password = Unprotect(stored.Password);
                settings.JwtSecret = Unprotect(stored.JwtSecret);
                settings.IsConfigured = true;
            }

            if (string.IsNullOrEmpty(settings.JwtSecret))
                settings.JwtSecret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
            return settings;
        }

        public void Save()
        {
            Directory.CreateDirectory(DataDirectory);
            var stored = new StoredSettings
            {
                Host = Host,
                Port = Port,
                Database = Database,
                Username = Username,
                Password = Protect(Password),
                JwtSecret = Protect(JwtSecret),
            };
            File.WriteAllText(FilePath, JsonSerializer.Serialize(stored, new JsonSerializerOptions { WriteIndented = true }));
            IsConfigured = true;
        }

        /// <summary>Returns null when the server accepts the credentials, otherwise a message for the user.</summary>
        public async Task<string?> TestConnectionAsync()
        {
            try
            {
                await using var conn = new NpgsqlConnection(ConnectionString + ";Timeout=5");
                await conn.OpenAsync();
                return null;
            }
            catch (PostgresException ex) when (ex.SqlState == "3D000")
            {
                return null; // database does not exist yet: it is created on first start
            }
            catch (PostgresException ex) when (ex.SqlState == "28P01")
            {
                return "Sai tên đăng nhập hoặc mật khẩu PostgreSQL.";
            }
            catch (Exception ex)
            {
                return $"Không kết nối được PostgreSQL tại {Host}:{Port}. Hãy kiểm tra PostgreSQL đã được cài và đang chạy. ({ex.Message})";
            }
        }

        private static string Protect(string value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            var bytes = Encoding.UTF8.GetBytes(value);
            return OperatingSystem.IsWindows()
                ? "dpapi:" + Convert.ToBase64String(ProtectedData.Protect(bytes, null, DataProtectionScope.CurrentUser))
                : "plain:" + Convert.ToBase64String(bytes);
        }

        private static string Unprotect(string? value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            try
            {
                if (value.StartsWith("dpapi:") && OperatingSystem.IsWindows())
                    return Encoding.UTF8.GetString(ProtectedData.Unprotect(Convert.FromBase64String(value[6..]), null, DataProtectionScope.CurrentUser));
                if (value.StartsWith("plain:"))
                    return Encoding.UTF8.GetString(Convert.FromBase64String(value[6..]));
            }
            catch (CryptographicException)
            {
                // Settings copied from another Windows user: ask for the password again
            }
            return string.Empty;
        }

        private class StoredSettings
        {
            public string? Host { get; set; }
            public int? Port { get; set; }
            public string? Database { get; set; }
            public string? Username { get; set; }
            public string? Password { get; set; }
            public string? JwtSecret { get; set; }
        }
    }
}
