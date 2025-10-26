using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.Logging.Logging
{
    public class LogItem(string source, string text)
    {
        public string Text { get; set; } = text;
        public string Source { get; set; } = source;
        public DateTime Date { get; set; } = DateTime.Now;
        public LogItemType Type { get; set; }
    }
}
