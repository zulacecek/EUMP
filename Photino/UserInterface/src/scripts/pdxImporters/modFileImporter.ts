import { replaceAllCharaters } from "../utils";
import { newLineSeperator } from "./pdxSyntaxParser";

export function ImportModFile(fileContent : string) : ModFile {
    var value = <ModFile>({ replace_files: new Array() });
    var lines = fileContent.split(newLineSeperator);
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if(line.startsWith('version')){
            value.version = line.split('=')[1].replace(/ " /g, '');
            continue;
        }

        if(line.startsWith('name')){
            value.name = line.split('=')[1].replace(/ " /g, '');
            continue;
        }

        if(line.startsWith('supported_version')){
            value.supported_version = line.split('=')[1].replace(/ " /g, '');
            continue;
        }

        if(line.startsWith('replace_path')){
            var replacePath = replaceAllCharaters(replaceAllCharaters(line.split('=')[1], '\\"', ''), '\\r', '');
            if(!value.replace_files.includes(replacePath)) {
                value.replace_files.push(replacePath);
            }

            continue;
        }
    }

    const regex = /"([^"]*)"/g;
    value.tags = [...fileContent.matchAll(regex)].map(match => match[1]);

    return value;
}

export type ModFile = {
    replace_files : string[];
    tags : string[];
    version : string;
    name : string;
    supported_version : string;
    import_directory_path: string;
}