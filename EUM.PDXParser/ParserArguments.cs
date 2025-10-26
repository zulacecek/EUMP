using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.PDXParser
{
    public class ParserArguments
    {
        public int LineNumber { get; set; } = 0;
        public bool ContinueOnEmptyOnelineBlock { get; set; }
    }
}
