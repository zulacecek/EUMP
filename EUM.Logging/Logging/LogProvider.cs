namespace EUM.Logging.Logging
{
    public static class LogProvider
    {
        public const string AppName = "EUM";

        public static string GetAppDocumentPath()
        {
            string documentPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            return Path.Combine(documentPath, AppName);
        }

        public const string ApplicationLogFileName = "AppLog.txt";
        private static readonly object _lock = new();

        public static void LogText(LogItemType type, string source, string text)
        {
            var logItem = new LogItem(source, text)
            {
                Type = type
            };

            WriteIntoLogFile(logItem);
        }

        public static void LogException(Exception exception, string source)
        {
            var logItem = new LogItem(source, exception.Message)
            {
                Type = LogItemType.Exception
            };

            WriteIntoLogFile(logItem);
        }

        private static void WriteIntoLogFile(LogItem logItem)
        {
            var dateTime = logItem.Date;
            var folderPath = Path.Combine(GetAppDocumentPath(), dateTime.Date.ToString("yyyy-MM-dd"));

            var logFilePath = Path.Combine(folderPath, ApplicationLogFileName);
            Directory.CreateDirectory(logFilePath);

            var logEntry = $"[{dateTime.TimeOfDay}] - [{logItem.Type}] - [{logItem.Source}]:{Environment.NewLine} {logItem.Text}";
            Task.Run(() =>
            {
                try
                {
                    lock (_lock)
                    {
                        File.AppendAllLinesAsync(logFilePath, [logEntry]);
                    }
                }
                catch
                {
                }
            });
        }
    }
}
