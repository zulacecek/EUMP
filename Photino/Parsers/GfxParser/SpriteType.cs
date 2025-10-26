using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EUM.Photino.Parsers.GfxParser
{
    internal class SpriteType(string? name, string? textureFile = null)
    {
        public string? Name { get; set; } = name;
        public string? TextureFile { get; set; } = textureFile;
    }
}
