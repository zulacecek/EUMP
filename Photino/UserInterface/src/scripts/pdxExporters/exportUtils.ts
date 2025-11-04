import { useModStore } from "@/stores/modStore";
import { enhanceFileNameWithExtension, formatFileSystemPath, getProjectFolder } from "../utils";
import { ObjectType } from "@/structs/genericStructs";
import { gameMissionFolderName } from "../repositories/missionTreeRepository";
import { gameLocalisationFolderName } from "../repositories/localisationRepository";

export const modExportedEventName = "ModExportedEvent";
export const exportFolderName = 'export';

export function getTabs(numberOfTabs: number = 2) : string {
    return '\t'.repeat(numberOfTabs);
}

export function getExportFolder() {
    return formatFileSystemPath(getProjectFolder(), exportFolderName);
}

export function getObjectExportPath(objectType: ObjectType, fileName: string) : string {
    if(!fileName) {
        return '';
    }

    var moduleName = '';
    switch(objectType){
        case ObjectType.MissionTree:
            moduleName = gameMissionFolderName;
            break;
        case ObjectType.Localisation:
            moduleName = gameLocalisationFolderName;
            break;
    }

    var modStore = useModStore();
    var mod = modStore.getMod();
    if(!mod) {
        return '';
    }

    fileName = enhanceFileNameWithExtension(fileName, 'txt');
    
    return formatFileSystemPath(getExportFolder(), mod.modName, moduleName, fileName);
}