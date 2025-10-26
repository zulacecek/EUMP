using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.PDXParser
{
    public class ListWithKey
    {
        public required string Key { get; set; }
        public List<string> Values { get; set; } = new List<string>();
    }
}
