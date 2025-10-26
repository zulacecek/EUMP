using DirectXTexNet;
using EUM.Logging.Logging;
using EUM.Photino.Parsers.GfxParser;

namespace EUM.Photino.Gfx
{
    public class ImageService
    {
        internal async static Task ConvertDdsToPng(string ddsPath, string outputPath, Guid codec)
        {
            try
            {
                var image = TexHelper.Instance.LoadFromDDSFile(ddsPath, DDS_FLAGS.NONE);

                using var stream = image.SaveToWICMemory(0, WIC_FLAGS.FORCE_SRGB, codec);
                using var fileStream = File.Create(outputPath);
                await stream.CopyToAsync(fileStream);
            }
            catch (Exception ex)
            {
                LogProvider.LogException(ex, "Dds convert");
            }
        }

        internal async static Task ConvertDdsFilesToPng(string basePath, List<SpriteType> sprites, string outputPath)
        {
            var codec = TexHelper.Instance.GetWICCodec(WICCodecs.PNG);

            foreach (var sprite in sprites)
            {
                if (sprite.Name.ToLowerInvariant().StartsWith("gfx"))
                {
                    continue;
                }

                var inputFile = Path.Combine(basePath, sprite.TextureFile);
                var inputFilePath = Path.Combine(basePath, inputFile);

                var outputFileName = Path.GetFileNameWithoutExtension(sprite.Name) + ".png";
                var outputFilePath = Path.Combine(outputPath, outputFileName);
                await ConvertDdsToPng(inputFilePath, outputFilePath, codec);
            }
        }
    }
}
