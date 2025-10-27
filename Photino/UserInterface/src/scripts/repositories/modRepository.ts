import { useModStore } from "@/stores/modStore";
import { modVersion } from "../appContext";
import { requestFile, saveFile } from "../layerCommunication/fileCommunication";
import { formatFileSystemPath } from "../utils";
import type { SavedModSetup } from "@/structs/communicationStructs";
import { getUserDocumentFolder } from "../layerCommunication/fileSystemCommunication";
import type { Mod } from "@/structs/modStructs";

export function createEmptyNewMod() : Mod {
    return <Mod>(
        {
            isCreated: true,
            modTags: ["Missions and Decisions"],
            createdInVersion: modVersion,
         });
}

export function createNewMod(projectName: string, modName: string, eu4Directory: string, workDirectory: string, eu4ModDirectory: string, modVersion: string, supportedVersion: string,allowExportDirectlyToModDirectory: boolean) : Mod {
    return<Mod>(
    {
        projectName, 
        modName, 
        eu4Directory, 
        workDirectory,
        eu4ModDirectory,
        modTags: ["Missions and Decisions"],
        modVersion,
        supportedVersion,
        isCreated: true,
        createdInVersion: modVersion,
    });
}

export async function saveMod(mod?: Mod) {
    if(!mod) {
        var modStore = useModStore();
        mod = modStore.getMod();
    }

    if(!mod){
        return;
    }

    var modJson = JSON.stringify(mod);
    var path = formatFileSystemPath(mod.workDirectory, `${mod.projectName}`, `${mod.projectName}.eu4mod`);
    await saveFile(path, modJson);
}

const createModDataFileName =  "mod_setup.txt";

export async function saveCreateModDataForNextUse(mod: Mod) {
    var savedSetup = <SavedModSetup>({ eu4Directory: mod.eu4Directory, eu4ModDirectory: mod.eu4ModDirectory, workDirectory: mod.workDirectory });
    var path = formatFileSystemPath(await getUserDocumentFolder(), createModDataFileName);
    await saveFile(path, JSON.stringify(savedSetup));
}

export async function loadSavedCreateModData() : Promise<SavedModSetup> {
    var path = formatFileSystemPath(await getUserDocumentFolder(), createModDataFileName);
    var result = await requestFile(path);
    return JSON.parse(result) as SavedModSetup;
}