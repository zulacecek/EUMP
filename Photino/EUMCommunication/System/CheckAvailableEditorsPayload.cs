using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.Photino.EUMCommunication.System
{
    public class CheckAvailableEditorsPayload
    {
        public List<string> Editors { get; set; } = new List<string>();
    }
}
