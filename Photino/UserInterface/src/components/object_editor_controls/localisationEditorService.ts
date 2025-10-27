import { createAvailableObjectForLocalisation, getExistingLocalisationNames, instantiateLanguageLocalisation, mergeLocalisationData, storeLocalisation } from "@/scripts/repositories/localisationRepository";
import { deepClone, toSnakeCase } from "@/scripts/utils";
import { ChangedObjectActionType, ObjectType, type AvailableObject } from "@/structs/genericStructs";
import { getValidObjectName } from "./objectEditorExtender";
import { useLocalisationStore } from "@/stores/localisationStore";
import type { LanguageLocalisation } from "@/structs/localisationStructs";
import { addObjectChange } from "@/scripts/repositories/changedObjectRepository";
import { fireEvent } from "@/scripts/event_system/globalEventHandler";
import { localisationSelectedEventName } from "@/scripts/event_system/localisationEvents";
import { useSynchStore } from "@/stores/synchronizationStore";
import { parseLocalisation } from "@/scripts/pdxImporters/localisationImporter";
import { requestFile } from "@/scripts/layerCommunication/fileCommunication";

export async function localisationCreated(localisationName: string) : Promise<AvailableObject> {
    localisationName = toSnakeCase(localisationName);
    if(!localisationName) {
        localisationName = 'New Localisation';
    }

    var existingLocalisationNames = await getExistingLocalisationNames();
    localisationName = getValidObjectName(localisationName, existingLocalisationNames);
    
    var localisation = instantiateLanguageLocalisation(localisationName, false);
    return localisationStoreAndOpen(localisation);
}

export function cloneLocalisation(localisationName: string) {
    var localisationStore = useLocalisationStore();
    var localisation = localisationStore.getLocalisation(localisationName);
    if(!localisation){
        return;
    }

    var localisationCloned = deepClone(localisation);
    localisationCloned.name = `${localisationName}_clone`;
    return localisationStoreAndOpen(localisationCloned);
}

function localisationStoreAndOpen(localisation: LanguageLocalisation) : AvailableObject {
    storeLocalisation(localisation);
    addObjectChange(ChangedObjectActionType.New, ObjectType.Localisation, localisation.name, localisation.name);

    var createdAvailableObject = createAvailableObjectForLocalisation(localisation);
    localisationSelected(createdAvailableObject);
    return createdAvailableObject;
}

export function localisationSelected(localisation: AvailableObject | undefined) {
    if(localisation){
        fireEvent(localisationSelectedEventName, localisation.name, localisation.name);
    }
}

export async function localisationImported(fileContent: string, fileName: string, generateReplacementFile: boolean) : Promise<AvailableObject | undefined> {
    var existingObject = await getExistingLocalisationNames();
    var objectName = getValidObjectName(fileName, existingObject);
    var parsedObject = parseLocalisation(fileContent, objectName);
    if(!parsedObject) {
        return undefined;
    }
    
    parsedObject.generateReplacementFile = generateReplacementFile;
    
    return localisationStoreAndOpen(parsedObject)
}

export function handleLocalisationLoadedFromEditor(selectedObjectId: string) : string {
    var localisationStore = useLocalisationStore();
    var synchronizationStore = useSynchStore();
    var objectType = ObjectType.Localisation;

    var localisationEditorValue = synchronizationStore.getObjetEditorValue(objectType, selectedObjectId);
    var parsedLocalistion = parseLocalisation(localisationEditorValue, selectedObjectId);

    var currentLocalisation = localisationStore.getLocalisation(selectedObjectId);
    if(currentLocalisation) {
        mergeLocalisationData(parsedLocalistion, currentLocalisation)

        synchronizationStore.setEditorValueSynchronizedFromDesigner(objectType, currentLocalisation.name);
        synchronizationStore.setEditorValueSynchronizedFromEditor(objectType, currentLocalisation.name);

        addObjectChange(ChangedObjectActionType.Update, objectType, selectedObjectId, selectedObjectId);
        
        return currentLocalisation.name;
    }

    return '';
}

export function handleLocalisationLoadedFromDesigner(selectedObjectId: string) : string {
    var objectType = ObjectType.Localisation;
    var synchronizationStore = useSynchStore();
    synchronizationStore.storeObjectEditorValue(objectType, selectedObjectId, '');
    synchronizationStore.setEditorValueSynchronizedFromDesigner(objectType, selectedObjectId);
    synchronizationStore.setEditorValueSynchronizedFromEditor(objectType, selectedObjectId);

    return selectedObjectId;
}

export async function loadLocalisationFromFileSystemAndMergeToExisting(filePath: string, into: LanguageLocalisation) {
    var fileContent = await requestFile(filePath);
    if(fileContent) {
        parseAndMergeLocalisation(fileContent, into);

        var synchronizationStore = useSynchStore();
        synchronizationStore.setEditorValueSynchronizedFromDesigner(ObjectType.MissionTree, into.name);
        synchronizationStore.setEditorValueSynchronizedFromEditor(ObjectType.MissionTree, into.name);

        return into.name;
    }
}

function parseAndMergeLocalisation(fileContent: string, into: LanguageLocalisation) {
    var parsedLocalisation = parseLocalisation(fileContent, into.name);
    if(parsedLocalisation) {
        mergeLocalisationData(parsedLocalisation, into);
    }
}