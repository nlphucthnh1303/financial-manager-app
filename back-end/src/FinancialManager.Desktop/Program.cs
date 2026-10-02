using System.Runtime.InteropServices;
using Photino.NET;

namespace FinancialManager.Desktop
{
    public static class Program
    {
        private const string Title = "Financial Manager";

        /// <summary>
        /// FinancialManager.exe              → opens the app window
        /// FinancialManager.exe --headless   → only runs the local server and prints its URL (used for testing)
        /// </summary>
        [STAThread]
        public static int Main(string[] args)
        {
            using var instance = new Mutex(true, @"Local\FinancialManager.Desktop", out var isFirstInstance);
            if (!isFirstInstance)
            {
                ShowError("Financial Manager đang chạy rồi.");
                return 1;
            }

            try
            {
                var headless = args.Contains("--headless");
                var settings = DesktopSettings.Load();
                using var server = new AsyncDisposer(new DesktopServer(settings, args.Where(a => a != "--headless").ToArray()));
                var url = server.Value.StartAsync().GetAwaiter().GetResult();

                if (headless)
                {
                    Console.WriteLine($"Financial Manager đang chạy tại {url} (Ctrl+C để dừng)");
                    // The hosts handle Ctrl+C / SIGTERM themselves; exit once they start stopping
                    server.Value.Stopping.Wait();
                    return 0;
                }

                var icon = Path.Combine(AppContext.BaseDirectory, "app.ico");
                var window = new PhotinoWindow()
                    .SetTitle(Title)
                    .SetUseOsDefaultSize(false)
                    .SetSize(1360, 860)
                    .SetMinSize(960, 640)
                    .Center()
                    .SetResizable(true)
                    .SetDevToolsEnabled(false)
                    .SetContextMenuEnabled(false)
                    // Keep WebView2 data (login, theme) in the user profile, not next to the exe
                    .SetTemporaryFilesPath(Path.Combine(DesktopSettings.DataDirectory, "WebView"))
                    .Load(url);
                if (File.Exists(icon)) window.SetIconFile(icon);
                window.WaitForClose();
                return 0;
            }
            catch (Exception ex)
            {
                var log = WriteCrashLog(ex);
                ShowError($"Không khởi động được Financial Manager:\n{ex.GetBaseException().Message}\n\nChi tiết: {log}");
                return 1;
            }
        }

        public static string WriteCrashLog(Exception ex)
        {
            var path = Path.Combine(DesktopSettings.DataDirectory, "error.log");
            try
            {
                Directory.CreateDirectory(DesktopSettings.DataDirectory);
                File.AppendAllText(path, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {ex}\n\n");
            }
            catch (IOException) { }
            return path;
        }

        private static void ShowError(string message)
        {
            if (OperatingSystem.IsWindows())
                MessageBoxW(IntPtr.Zero, message, Title, 0x10 /* MB_ICONERROR */);
            else
                Console.Error.WriteLine(message);
        }

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int MessageBoxW(IntPtr hWnd, string text, string caption, uint type);

        /// <summary>Lets the synchronous STA Main dispose the async server.</summary>
        private sealed class AsyncDisposer(DesktopServer value) : IDisposable
        {
            public DesktopServer Value { get; } = value;
            public void Dispose() => Value.DisposeAsync().AsTask().GetAwaiter().GetResult();
        }
    }
}
