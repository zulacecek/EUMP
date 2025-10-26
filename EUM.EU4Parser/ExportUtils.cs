using EUM.Core.Context;
using EUM.Logging.Logging;

namespace EUM.EU4Parser
{
    internal class ExportUtils
    {
        internal const string ExportFolderName = "export";
        internal const string BaseModExportFolder = "--base--";

        internal static string GetTabs(int number = 1) => new('\t', number);

        internal static void WriteExportedFiles(List<ExportedObject> exportedObjects)
        {
            string localExportPath = GetLocalBaseExportPath();
            string directExportPath = GetGameModPath();
            var localExportPathForObject = localExportPath;
            var directExportPathForObject = directExportPath;

            var exportType = EditorContext.ModSettings?.ExportType ?? ExportType.WorkingFolder;

            foreach (var exportedObject in exportedObjects)
            {
                if (exportedObject is null)
                {
                    continue;
                }

                var objectExportFolder = exportedObject.ObjectExportFolder;
                if (objectExportFolder == BaseModExportFolder)
                {
                    localExportPathForObject = GetLocalExportPath();
                    directExportPathForObject = GetBaseGameModPath();
                    objectExportFolder = string.Empty;
                }
                else
                {
                    localExportPathForObject = localExportPath;
                    directExportPathForObject = directExportPath;
                }

                    var exportPath = Path.Combine(objectExportFolder, exportedObject.Name);
                if (exportedObject?.GenerateReplacementFile ?? false && !string.IsNullOrEmpty(exportedObject.OriginalFileName))
                {
                    exportPath = Path.Combine(objectExportFolder, exportedObject?.OriginalFileName ?? string.Empty);
                }

                exportPath += $".{exportedObject?.FileExtension}";

                switch (exportType)
                {
                    case ExportType.ModFolder:
                        var fileExportPath = Path.Combine(directExportPathForObject, exportPath);
                        WriteExportedFile(fileExportPath, exportedObject?.ObjectContent);

                        fileExportPath = Path.Combine(localExportPathForObject, exportPath);
                        WriteExportedFile(fileExportPath, exportedObject?.ObjectContent);
                        break;
                    case ExportType.WorkingFolder:
                    default:
                        fileExportPath = Path.Combine(localExportPathForObject, exportPath);
                        WriteExportedFile(fileExportPath, exportedObject?.ObjectContent);
                        break;
                }
            }
        }

        private static void WriteExportedFile(string path, string? objectContent)
        {
            try
            {
                var directoryPath = Path.GetDirectoryName(path);
                Directory.CreateDirectory(directoryPath);
                File.WriteAllTextAsync(path, objectContent ?? string.Empty);
            }
            catch (Exception ex)
            {
                LogProvider.LogException(ex, nameof(WriteExportedFiles));
            }
        }

        internal static string GetBaseModPath()
        {
            if (EditorContext.OpenedMod is null)
            {
                return string.Empty;
            }

            var workingFolderPath = EditorContext.OpenedMod.WorkDirectory;
            var projectName = EditorContext.OpenedMod.ProjectName;
            return Path.Combine(workingFolderPath, projectName);
        }

        internal static string GetBaseGameModPath()
        {
            if (EditorContext.OpenedMod is null)
            {
                return string.Empty;
            }

            return EditorContext.OpenedMod.Eu4ModDirectory;
        }

        internal static string GetGameModPath()
        {
            if (EditorContext.OpenedMod is null)
            {
                return string.Empty;
            }

            var modName = EditorContext.OpenedMod.ModName;
            var modPath = Path.Combine(GetBaseGameModPath(), modName);

            Directory.CreateDirectory(modPath);

            return modPath;
        }

        internal static string GetLocalExportPath()
        {
            return Path.Combine(GetBaseModPath(), ExportFolderName);
        }

        internal static string GetLocalBaseExportPath()
        {
            if (EditorContext.OpenedMod is null)
            {
                return string.Empty;
            }

            var modName = EditorContext.OpenedMod.ModName;

            return Path.Combine(GetLocalExportPath(), modName);
        }

        internal static string GetLocalModuleExportPath(string module)
        {
            var exportPath = Path.Combine(GetLocalBaseExportPath(), module);
            if (!Directory.Exists(exportPath))
            {
                Directory.CreateDirectory(exportPath);
            }

            return exportPath;
        }

        internal static string GetDirectModuleExportPath(string module)
        {
            var exportPath = Path.Combine(GetGameModPath(), module);
            if (!Directory.Exists(exportPath))
            {
                Directory.CreateDirectory(exportPath);
            }

            return exportPath;
        }
    }
}
