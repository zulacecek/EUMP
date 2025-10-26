namespace EUM.Core.Context
{
    public class Mod
    {
        public string ModName { get; set; } = string.Empty;
        public string ProjectName { get; set; } = string.Empty;
        public string WorkDirectory { get; set; } = string.Empty;
        public string Eu4Directory { get; set; } = string.Empty;
        public string Eu4ModDirectory { get; set; } = string.Empty;
        public bool IsCreated { get; set; }
        public string SupportedVersion { get; set; } = string.Empty;
        public string ModVersion { get; set; } = string.Empty;
        public List<string> ModTags { get; set; } = [];
        public bool AllowExportDirectlyToModDirectory { get; set; }
        public string CreatedInVersion { get; set; } = string.Empty;
        public string ParentModName { get; set; } = string.Empty;
    }
}
