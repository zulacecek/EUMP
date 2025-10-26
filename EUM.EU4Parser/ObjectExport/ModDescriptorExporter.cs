using EUM.Core.Context;

namespace EUM.EU4Parser.ObjectExport
{
    public class ModDescriptorExporter
    {
        public static void GenerateAndExportModFiles()
        {
            var mod = EditorContext.OpenedMod;
            var exportedModFile = GenerateModFile(mod);
            var exportedDescriptorFile = GenerateDescriptorFile(mod);
            ExportUtils.WriteExportedFiles([exportedModFile, exportedDescriptorFile]);
        }

        internal static ExportedObject? GenerateModFile(Mod? mod)
        {
            if (mod is null)
            {
                return null;
            }

            var tags = string.Join("\n", mod.ModTags.Select(tag => $"\t\"{tag}\""));
            var modPath = mod.Eu4ModDirectory.Replace("\\", "/");
            string modFile = $"version=\"{mod.ModVersion}\"\n" +
                             $"tags={{\n{tags}\n}}\n" +
                             $"name=\"{mod.ProjectName}\"\n" +
                             $"supported_version=\"{mod.SupportedVersion}\"\n" +
                             $"path=\"{modPath}\"";

            return new ExportedObject
            {
                Name = mod.ModName,
                FileExtension = "mod",
                ObjectContent = modFile,
                GenerateReplacementFile = null,
                OriginalFileName = null,
                ObjectExportFolder = ExportUtils.BaseModExportFolder
            };
        }

        internal static ExportedObject? GenerateDescriptorFile(Mod? mod)
        {
            if (mod is null)
            {
                return null;
            }

            string tagsString = string.Join("\n", mod.ModTags.Select(tag => $"\t\"{tag}\""));
            string descriptor = $"version=\"{mod.ModVersion}\"\n" +
                                $"tags={{\n{tagsString}\n}}\n" +
                                $"name=\"{mod.ModName}\"\n" +
                                $"supported_version=\"{mod.SupportedVersion}\"";

            if (!string.IsNullOrEmpty(mod.ParentModName))
            {
                string dependencies = $"dependencies = {{ \n \"{mod.ParentModName}\" \n }}";
                descriptor += $"\n{dependencies}";
            }

            return new ExportedObject
            {
                Name = "descriptor",
                FileExtension = "mod",
                ObjectContent = descriptor,
                GenerateReplacementFile = null,
                OriginalFileName = null,
                ObjectExportFolder = string.Empty
            };
        }
    }
}
