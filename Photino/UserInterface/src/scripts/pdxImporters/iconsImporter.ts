import type { Mod } from "@/structs/modStructs";
import { processImportedIcons, readFileContent } from "../backendControllers/backendCommunication";
import { parseGfxFile } from "./gfxFileParser"
import type { Icon } from "@/structs/gfxStructs";

export const vanillaMissionIcons = [
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
    "navalmissions"
]

export async function importIcons(mod: Mod, group: string) : Promise<(Icon[] | undefined)[]> {
    var fnmapped = vanillaMissionIcons.map(async (x) => {
        return importVanillaIcon(mod, x, group);
    });

    fnmapped.push((async () => {
        const fileName = "countrymissionsview";
        const fullPath = `${mod.eu4Directory}/interface/${fileName}.gfx`;
        const fileContent = await readFileContent(fullPath);
        if (!fileContent) {
            return;
        }

        const missionIconsPart = `spriteTypes = {\n${fileContent.split("#### Generic Mission Icons ####")[1]}\n}`;

        const gfxFileParsed = parseGfxFile(fileName, missionIconsPart);
        return processImportedIcons(mod, gfxFileParsed, group);
    })());

    return Promise.all(fnmapped);
}

export async function importVanillaIcon(mod: Mod, path: string, group: string) : Promise<Icon[] | undefined> {
    var fullPath = `${mod.eu4Directory}/interface/${path}.gfx`;
    return importIcon(mod, fullPath, group);
}

export async function importIcon(mod: Mod, path: string, group: string) : Promise<Icon[] | undefined> {
    var fileContent = await readFileContent(path);
    if(!fileContent) {
        return;
    }

    var gfxFileParsed = parseGfxFile(path, fileContent);
    return processImportedIcons(mod, gfxFileParsed, group);
}