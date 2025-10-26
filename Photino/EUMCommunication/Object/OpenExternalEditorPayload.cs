using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.Photino.EUMCommunication.Object
{
    internal class OpenExternalEditorPayload
    {
        public string PathToFile { get; set; } = string.Empty;
        public string EditorCommand { get; set; } = string.Empty;
    }
}
