import type { KeyValuePair } from "@/structs/genericStructs";
import type { LanguageLocalisation } from "@/structs/localisationStructs";
import { instantiateLanguageLocalisation } from "../repositories/localisationRepository";

export function parseLocalisation(content: string, localisationName: string) : LanguageLocalisation {
    var lines = content.split('\n');
    var localisation = instantiateLanguageLocalisation(localisationName);
    var localisationMap = localisation.localisationMap;
    const removeCommentsRegex = new RegExp("#.*", "g");
    for(var line of lines) {
        if(line.includes('#')){
            line = line.replace(removeCommentsRegex, '');
        }
        
        if(line.trimStart().startsWith('l_')){
            localisation.language = line.split("l_")[1].replace(':', '').trim();
            continue;
        }

        if(!localisation.language) {
            localisation.language = 'english';
        }

        var splitLine = line.split(/\:\d+/g);
        var key = splitLine[0].trim();
        var value = splitLine[1];
        if(!value) {
            continue;    
        }

        value = value.replace(/\"/g, '').trim();

        var localisationMapped = localisationMap.firstOrDefault(x => x.key == key);
        if(localisationMapped) {
            localisationMapped.value = value;
        }
        else {
            var newKeyValuePair = <KeyValuePair<string, string>>({ key: key, value: value });
            localisationMap.push(newKeyValuePair);
        }
    }

    return localisation;
}