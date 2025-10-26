namespace EUM.Core.Context
{
    public class ModSettings
    {
        public bool BeautifySavedObjects { get; set; }
        public ExportType ExportType { get; set; }
    }

    public enum ExportType
    {
        WorkingFolder,
        ModFolder,
    }
}
