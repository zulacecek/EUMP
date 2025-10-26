using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.EU4Parser.Objects
{
    internal class LanguageLocalisation
    {
        public string Name { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public List<KeyValuePair<string, string>> LocalisationMap { get; set; } = [];
        public string OriginalFileName { get; set; } = string.Empty;
        public bool GenerateReplacementFile { get; set; }
        public long ExportFileLastModified { get; set; }
        public bool WasInitialImport { get; set; }
    }
}
