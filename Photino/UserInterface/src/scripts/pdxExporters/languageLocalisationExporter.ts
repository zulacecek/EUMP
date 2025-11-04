import type { LanguageLocalisation } from "@/structs/localisationStructs";

export function exportLocalisation(localisation: LanguageLocalisation): string {
    var result = `l_${localisation.language}:\n`;
    if (!localisation.localisationMap) {
        return result;
    }

    
    for (const line of localisation.localisationMap) {
        result += ` ${line.key}:0 "${line.value}"\n`;
    }

    return result;
}