using EUM.EU4Parser.Objects;

namespace EUM.Photino.Parsers.GfxParser
{
    internal class GfxFile(string name = "")
    {
        public string Name { get; set; } = name;
        public List<SpriteType> SpriteTypes { get; set; } = [];
        public ObjectType? ObjectType { get; set; }
    }
}
