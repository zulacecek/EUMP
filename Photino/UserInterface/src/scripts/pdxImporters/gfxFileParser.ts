import type { GfxFile, SpriteType } from "@/structs/gfxStructs";
import { newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments } from "./pdxSyntaxParser"

export function parseGfxFile(fileName: string, fileContent: string) : GfxFile  {
    var lines = normalizedFileInput(fileContent).split(newLineSeperator);
    var gfxFile = <GfxFile>({ name: fileName, sprites: new Array()});
    for (var parserArguments = <ParserArguments>({ lineNumber: 0 }); parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        var line = lines[parserArguments.lineNumber];
        if(!line){
            continue;
        }

        if(line.startsWith("spriteTypes")) {
            var parsedSpriteTypes = parseBlock(lines, parserArguments, "");
            for(var parsedSpriteType of parsedSpriteTypes.blocks) {
                var statements = parsedSpriteType.statements;
                if(!statements){
                    continue;
                }

                var name = statements.filter(x => x.key == "name")[0]?.value;
                var textureFile = statements.filter(x => x.key == "texturefile")[0]?.value;

                if(name && textureFile){
                    gfxFile.sprites.push(<SpriteType>({ name: name.replace(/"/g, ""), textureFile: textureFile.replace(/"/g, "").replace(/\/\//g, "/") }));
                }
            }
        }
    }

    return gfxFile;
}