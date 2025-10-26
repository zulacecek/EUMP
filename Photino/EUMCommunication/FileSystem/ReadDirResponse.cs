using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.Photino.EUMCommunication.FileSystem
{
    internal class FileSystemEntry
    {
        public string Name { get; set; } = string.Empty;
        public string FullPath { get; set; } = string.Empty;
        public string Extension { get; set; } = string.Empty;
        public string PathWithoutFileName { get; set; } = string.Empty;
        public long Size { get; set; }
        public long LastModified { get; set; }
        public bool IsDirectory { get; set; }
        public List<FileSystemEntry> Children { get; set; } = new List<FileSystemEntry>();
    }
}
