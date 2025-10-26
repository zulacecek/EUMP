using static EUM.PDXParser.Parser;

namespace EUM.Photino.Parsers.GfxParser
{
    internal class GfxParser
    {
        public static GfxFile ParseGfxFile(string fileName)
        {
            var fileBlock = ParseFile(fileName);

            var gfxFile = new GfxFile(fileName);
            if (fileBlock.Key != "spriteTypes")
            {
                return gfxFile;
            }

            foreach (var item in fileBlock.Blocks)
            {
                if (item.Key == "spriteType")
                {
                    var spriteType = new SpriteType(GetStatementValueByKey("name", item.Statements), GetStatementValueByKey("texturefile", item.Statements));
                    gfxFile.SpriteTypes.Add(spriteType);
                }
            }

            return gfxFile;
        }

        public async static Task<GfxFile> ParseGfxFileAsync(string fileName)
        {
            var fileBlock = await ParseFileAsync(fileName);

            var gfxFile = new GfxFile(fileName);
            var blockWithData = fileBlock.Blocks.FirstOrDefault();
            if (blockWithData == null || blockWithData.Key != "spriteTypes")
            {
                return gfxFile;
            }

            foreach (var item in blockWithData.Blocks)
            {
                if (item.Key == "spriteType")
                {
                    var spriteType = new SpriteType(GetStatementValueByKey("name", item.Statements), GetStatementValueByKey("texturefile", item.Statements));
                    gfxFile.SpriteTypes.Add(spriteType);
                }
            }

            return gfxFile;
        }
    }
}
