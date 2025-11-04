import type { LanguageLocalisation } from "../../structs/localisationStructs";
import { formatFileSystemPath, getFileSavePath, removeExtensionFromFileName, toSnakeCase } from "../utils";
import { computed } from "vue";
import { ChangedObjectActionType, ObjectType, type AvailableObject, type KeyValuePair } from "../../structs/genericStructs";
import { addObjectChange, hasObjectChanged, popObjectChange } from "./changedObjectRepository";
import { useLocalisationStore } from "@/stores/localisationStore";
import { useModStore } from "@/stores/modStore";
import { requestFile, requestObjectFromFile, saveObject } from "../layerCommunication/fileCommunication";
import { deleteFile, readDir } from "../layerCommunication/fileSystemCommunication";
import { useSynchStore } from "@/stores/synchronizationStore";
import { displayGlobalLoader, hideGlobalLoader } from "../uiControllers/appController";
import { handleObjectOpenedById } from "@/components/object_editor_controls/objectEditorStructureTreeExtender";
import { handleSaveSynchronization } from "./baseGameObjectRepository";

export const defaultLocalisationName = 'default';
export const gameLocalisationFolderName = 'localisation';
export const localisationFileExtension = 'txt';


export function instantiateLanguageLocalisation(name: string, generateReplacementFile: boolean = false, originalFileName: string = "") : LanguageLocalisation {
    name = toSnakeCase(name);

    var languageLocalisation = <LanguageLocalisation>({ 
        language: "english",
        localisationMap: new Array(),
        name: name,
        generateReplacementFile: generateReplacementFile,
        originalFileName: originalFileName
    });

    addObjectChange(ChangedObjectActionType.New, ObjectType.Localisation, languageLocalisation.name, languageLocalisation.name);

    return languageLocalisation;
}

export async function getExistingLocalisationNames() : Promise<string[]> {
    var fileSystemTrees =  (await readDir(getLanguageLocalisationSaveFolder())).map(x=> removeExtensionFromFileName(x.name));
    var localisationStore = useLocalisationStore();
    var memoryLocalisations = localisationStore.getLocalisations().map(x => x.name);
    return [...new Set([...fileSystemTrees, ...memoryLocalisations])];
}

export function createAvailableObjectForLocalisation(localisation: LanguageLocalisation) : AvailableObject {
    return <AvailableObject>({
        name: localisation.name,
        id: localisation.name,
        type: ObjectType.Localisation
    });
}

export function getLanguageLocalisationSaveFolder() : string {
    return getFileSavePath(ObjectType.Localisation);
}

export async function saveLanguageLocalisation(isSaveBeforeExport?: boolean) {
    var localisationStore = useLocalisationStore();
    var localisations = localisationStore.getLocalisations();
    
    var baseSavePath = getLanguageLocalisationSaveFolder();
    
    for(var localisation of localisations) {
        handleSaveSynchronization(localisation, isSaveBeforeExport);

        if(hasObjectChanged(localisation.name, ObjectType.Localisation)) {
            var localisationSavePath = formatFileSystemPath(baseSavePath, `${localisation.name}.${localisationFileExtension}`);
            popObjectChange(localisation.name);
            await saveObject(localisationSavePath, localisation);
        }
    }
}

export async function removeLocalisation(localisationName: string) {
    var localisationStore = useLocalisationStore();
    var existingLocalisation = localisationStore.getLocalisation(localisationName);
    if(existingLocalisation) {
        localisationStore.removeLocalisation(localisationName);
        var filePath = formatFileSystemPath(getLanguageLocalisationSaveFolder(), `${localisationName}.${localisationFileExtension}`);
        await deleteFile(filePath);
    }
}

export function mergeLocalisationData(from: LanguageLocalisation, into: LanguageLocalisation) {
    if(!from || !into) {
        return;
    }
    
    into.localisationMap = from.localisationMap;
}

export async function openLocalisation(localisationName: string) : Promise<LanguageLocalisation | undefined> {
    if(!localisationName) {
        return undefined;
    }
    
    var baseSavePath = getLanguageLocalisationSaveFolder();
    if(!localisationName.endsWith(localisationFileExtension)){
        localisationName += `.${localisationFileExtension}`;
    }

    var synchronizationStore = useSynchStore();
    synchronizationStore.setEditorValueSynchronizedFromDesigner(ObjectType.Localisation, localisationName);
    synchronizationStore.setEditorValueSynchronizedFromEditor(ObjectType.Localisation, localisationName);
    
    displayGlobalLoader('Loading localisation');
    var localisationPath = formatFileSystemPath(baseSavePath, localisationName);
    var result = await requestObjectFromFile<LanguageLocalisation>(localisationPath);
    hideGlobalLoader();
    return result;
}   

var localisationMapComputed = computed(() => {
    var localisationStore = useLocalisationStore();
    var localisations = localisationStore.getLocalisations();
    var returnValue = new Map<string, Map<string, KeyValuePair<string, string>>>();
    for(var localisationFile of localisations){
        var localisationMap = localisationFile.localisationMap;
        if(!localisationMap) {
            return;
        }

        returnValue.set(localisationFile.name, new Map(localisationMap.map(x => [x.key, x])) )
    }
    
    return returnValue;
});

export function getObjectLocalisationMap(id: string) : Map<string, KeyValuePair<string,string>> | undefined {
    if(!localisationMapComputed.value) {
        return;
    }

    return localisationMapComputed.value.get(id);
}

export function getLocalisation(id: string) : LanguageLocalisation | undefined {
    var localisationStore = useLocalisationStore();
    return localisationStore.getLocalisation(id);
}

export function storeLocalisation(localisation: LanguageLocalisation) {
    var localisationStore = useLocalisationStore();
    localisationStore.addLocalisation(localisation);
}

export function getDefaultLocalisation() : LanguageLocalisation {
    var localisationStore = useLocalisationStore();
    var modStore = useModStore();
    var localisations = localisationStore.getLocalisations();
    var defaultLocalisation = localisations.firstOrDefault(x => x.name == defaultLocalisationName);
    if(defaultLocalisation) {
        return defaultLocalisation;
    }

    if(!defaultLocalisation) {
        handleObjectOpenedById(defaultLocalisationName, ObjectType.Localisation, true);
    }

    localisations = localisationStore.getLocalisations();
    defaultLocalisation = localisations.firstOrDefault(x => x.name == defaultLocalisationName);
    if(defaultLocalisation) {
        return defaultLocalisation;
    }

    var newLocalisation = instantiateLanguageLocalisation(defaultLocalisationName);
    storeLocalisation(newLocalisation);
    var newAvailableLocalisation = createAvailableObjectForLocalisation(newLocalisation);
    modStore.openObject(newAvailableLocalisation);
    
    return newLocalisation;
}

export function getMissionNameText(missionId: string, localisationFileId: string) : string {
    if(!localisationFileId){
      return missionId;
    }
  
    var localisationMap = getObjectLocalisationMap(localisationFileId);
    if(!localisationMap) {
      return missionId;
    }
  
    var missionNameLocalisationKey = `${missionId}_title`;
    var nameMapped = localisationMap.get(missionNameLocalisationKey);
    return nameMapped?.value?.replace(/\[.*?\]/g, '') ?? missionId;
}

export function getLocalisationKeyTranslation(key: string, localisationFileId: string) : string {
    if(!localisationFileId){
        return key;
      }
    
      var localisationMap = getObjectLocalisationMap(localisationFileId);
      if(!localisationMap) {
        return key;
      }
    
      var nameMapped = localisationMap.get(key);
      return nameMapped?.value ?? key;
}