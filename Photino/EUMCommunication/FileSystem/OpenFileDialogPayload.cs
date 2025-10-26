using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.Photino.EUMCommunication.FileSystem
{
    internal class OpenFileDialogPayload
    {
        public string? DefaultPath { get; set; }
        public bool MultiSelect { get; set; }
        public bool SelectFolder { get; set; }
        public string FilterName { get; set; } = "Allowed extensions";
        public string[]? AllowedExtension { get; set; }
    }
}
