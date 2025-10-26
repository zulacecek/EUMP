using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.PDXParser
{
    public class DataBlock
    {
        public required string Key { get; set; }
        public List<DataStatement> Statements { get; set; } = [];
        public List<DataBlock> Blocks { get; set; } = [];
        public int Position { get; set; }
    }
}
