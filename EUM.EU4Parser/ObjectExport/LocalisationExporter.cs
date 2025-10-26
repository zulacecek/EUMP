using EUM.Core.Context;
using EUM.Core.Serialization;
using EUM.EU4Parser.Objects;
using System.Text;

namespace EUM.EU4Parser.ObjectExport
{
    public class LocalisationExporter
    {
        internal const string LocalisationsExportFolder = "localisation";

        public static void LoadAndExportLanguagelocalisations()
        {
            var savePath = Path.Combine(ExportUtils.GetBaseModPath(), ObjectType.Localisation.ToString());

            var objectFile = Directory.GetFiles(savePath);
            if (objectFile is null)
            {
                return;
            }

            var objects = new List<LanguageLocalisation>();
            foreach (var objectName in objectFile)
            {
                var objectPath = Path.Combine(savePath, objectName);
                if (!File.Exists(objectPath))
                {
                    continue;
                }

                var fileContent = File.ReadAllText(objectPath);
                if (string.IsNullOrEmpty(fileContent))
                {
                    continue;
                }

                var languageLocation = JsonSerializerExtender.Deserialize<LanguageLocalisation>(fileContent);
                if (languageLocation is null)
                {
                    continue;
                }

                objects.Add(languageLocation);
            }

            var exportType = EditorContext.ModSettings?.ExportType ?? ExportType.WorkingFolder;

            var exportedObjects = ExportLocalisations(objects);
            ExportUtils.WriteExportedFiles(exportedObjects);
        }

        internal static List<ExportedObject> ExportLocalisations(List<LanguageLocalisation> localisations)
        {
            var exportedObjects = new List<ExportedObject>();
            foreach (var localisation in localisations)
            {

                if (localisation == null)
                {
                    continue;
                }

                var result = new StringBuilder();
                result.AppendLine($"l_{localisation.Language}:");

                if (localisation.LocalisationMap == null)
                {
                    continue;
                }

                foreach (var line in localisation.LocalisationMap)
                {
                    result.AppendLine($" {line.Key}:0 \"{line.Value}\"");
                }

                var exportedObject = new ExportedObject
                {
                    ObjectExportFolder = LocalisationsExportFolder,
                    GenerateReplacementFile = localisation.GenerateReplacementFile,
                    Name = localisation.Name,
                    ObjectContent = result.ToString(),
                    ObjectType = ObjectType.Localisation,
                    OriginalFileName = localisation.OriginalFileName
                };

                exportedObjects.Add(exportedObject);
            }

            return exportedObjects;
        }
    }
}
