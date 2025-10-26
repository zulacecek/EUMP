using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HelloPhotino.Vue.FileSystem
{
    public static class BaseFileSystemProvider
    {
        public const string AppName = "EUM";

        public static string GetAppDocumentPath()
        {
            string documentPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
            return Path.Combine(documentPath, AppName);
        }

        public static void TryInitializeAppDocumentFolder()
        {
            Directory.CreateDirectory(GetAppDocumentPath());
        }
    }
}
