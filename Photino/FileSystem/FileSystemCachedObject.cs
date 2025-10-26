using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.Photino.FileSystem
{
    internal class FileSystemCachedObject(string name = "", FileSystemCachedObjectType type = FileSystemCachedObjectType.None)
    {
        public string Name { get; set; } = name;
        public FileSystemCachedObjectType Type { get; set; } = type;
    }
}
