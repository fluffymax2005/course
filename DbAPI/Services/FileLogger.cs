namespace DbAPI.Services {
    public class FileLogger : ILogger, IDisposable {
        private readonly string _logDirectory;
        private static readonly object _lock = new object();
        private string _currentDate;
        private string _currentFilePath;

        public FileLogger(string path) {
            _logDirectory = path;
            _currentDate = DateTime.Now.ToString("yyyyMMdd");
            _currentFilePath = GetCurrentLogFilePath();

            if (!Directory.Exists(_logDirectory)) {
                Directory.CreateDirectory(_logDirectory);
            }
        }

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull {
            return this;
        }

        public void Dispose() { }

        public bool IsEnabled(LogLevel logLevel) {
            switch (logLevel) {
                case LogLevel.Debug:
                case LogLevel.Warning:
                case LogLevel.Error:
                case LogLevel.Critical:
                case LogLevel.Information:
                    return true;
                default:
                    return false;
            }
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) {
            if (!IsEnabled(logLevel))
                return;

            var message = formatter(state, exception);
            if (string.IsNullOrEmpty(message))
                return;

            CheckDateChange();

            var logEntry = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} [{logLevel}] {message}";

            if (exception != null) {
                logEntry += $"{Environment.NewLine}Exception: {exception.GetType().Name}: {exception.Message}{Environment.NewLine}{exception.StackTrace}";
            }

            lock (_lock) {
                try {
                    File.AppendAllText(_currentFilePath, logEntry + Environment.NewLine);
                } catch (Exception ex) {
                    // Reserve console log
                    Console.WriteLine($"File log error: {ex.Message}");
                }
            }
        }

        private void CheckDateChange() {
            var today = DateTime.Now.ToString("yyyyMMdd");
            if (_currentDate != today) {
                lock (_lock) {
                    _currentDate = today;
                    _currentFilePath = GetCurrentLogFilePath();
                }
            }
        }

        private string GetCurrentLogFilePath() {
            return Path.Combine(_logDirectory, $"log_{_currentDate}.txt");
        }
    }
}
