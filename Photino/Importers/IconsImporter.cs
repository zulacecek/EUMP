using EUM.Core.Serialization;
using EUM.Photino.FileSystem;
using EUM.Photino.Gfx;
using EUM.Photino.Parsers.GfxParser;
using HelloPhotino.Vue.FileSystem;

namespace EUM.Photino.Importers
{
    internal class IconsImporter
    {
        public const string VanillaIconsCacheFolder = "vanilla_mission_icons";
        public const string VanillaIconsCacheFileName = "vanilla_icons.txt";

        public static readonly List<string> VanillaMissionIcons =
        [
            "missionicons_dharma",
            "missionicons_domination",
            "missionicons_emperor",
            "missionicons_gc",
            "missionicons_king_of_kings",
            "missionicons_leviathan",
            "missionicons_lions_of_the_north",
            "missionicons_manchu",
            "missionicons_origins",
            "missionicons_pf",
            "missionicons_rb",
            "missionicons_third_rome",
            "missionicons_woc",
            "navalmissions",
            "countrymissionsview"
        ];

        public async static Task RenderVanillaMissionIcons(string basePath)
        {
            var tasks = new List<Task>();
            var outputBasePath = Path.Combine(BaseFileSystemProvider.GetAppDocumentPath(), VanillaIconsCacheFolder);
            Directory.CreateDirectory(outputBasePath);

            foreach (var item in VanillaMissionIcons)
            {
                var filePath = Path.Combine(basePath, "interface", item) + ".gfx";

                tasks.Add(ProcessGfxFileIcons(filePath, basePath, outputBasePath));
            }

            await Task.WhenAll(tasks);
        }

        public async static Task ProcessGfxFileIcons(string filePath, string basePath, string outputPath)
        {
            var gfxFile = await GfxParser.ParseGfxFileAsync(filePath);

            await ImageService.ConvertDdsFilesToPng(basePath, gfxFile.SpriteTypes, outputPath);
        }

        public async static Task WriteAvailableIconsFile()
        {
            var iconsCachePath = Path.Combine(BaseFileSystemProvider.GetAppDocumentPath(), VanillaIconsCacheFolder);
            var iconFilePaths = Directory.GetFiles(iconsCachePath);
            var vanillaIconsGfxFile = new GfxFile(VanillaIconsCacheFileName);
            foreach (var file in iconFilePaths)
            {
                if (!file.EndsWith("png"))
                {
                    continue;
                }

                vanillaIconsGfxFile.SpriteTypes.Add(new SpriteType(Path.GetFileNameWithoutExtension(file)));
            }

            var gfxFileSerialized = JsonSerializerExtender.Serialize(vanillaIconsGfxFile);
            var filePath = Path.Combine(iconsCachePath, VanillaIconsCacheFileName);
            await File.WriteAllTextAsync(filePath, gfxFileSerialized);
        }
    }
}
