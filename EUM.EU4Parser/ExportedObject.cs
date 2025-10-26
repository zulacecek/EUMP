using EUM.EU4Parser.Objects;

namespace EUM.EU4Parser
{
    public class ExportedObject
    {
        public required string Name { get; set; }
        public string FileExtension { get; set; } = "txt";
        public required string ObjectContent { get; set; }
        public string? OriginalFileName { get; set; }
        public ObjectType ObjectType { get; set; }
        public required string ObjectExportFolder { get; set; }
        public bool? GenerateReplacementFile { get; set; }

    }
}
