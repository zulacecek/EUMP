import { useModStore } from "@/stores/modStore";
import { ChangedObjectActionType, type AvailableObject, type GameObject } from "@/structs/genericStructs";
import{ ObjectType } from "@/structs/genericStructs";
import { cloneMissionTree, handleMissionTreeLoadedFromDesigner, handleMissionTreeLoadedFromEditor, loadMissionTreeFromFileSystemAndMergeToExisting, missionTreeCreated, missionTreeImported } from "./missionEditorService";
import { fireEvent } from "@/scripts/event_system/globalEventHandler";
import { objectCreatedEventName } from "@/scripts/event_system/objectEditorEvents";
import { removeMissionTree } from "@/scripts/repositories/missionTreeRepository";
import { requestFile } from "@/scripts/layerCommunication/fileCommunication";
import { deepClone, getFileName, toSnakeCase } from "@/scripts/utils";
import { cloneLocalisation, handleLocalisationLoadedFromDesigner, handleLocalisationLoadedFromEditor, localisationCreated, localisationImported } from "./localisationEditorService";
import { addObjectChange, hasObjectChanged } from "@/scripts/repositories/changedObjectRepository";
import { useSynchStore } from "@/stores/synchronizationStore";
import { removeLocalisation } from "@/scripts/repositories/localisationRepository";
import { useMissionTreeListStore } from "@/stores/missionStore";
import { useLocalisationStore } from "@/stores/localisationStore";
import { getObjectExportPath } from "@/scripts/pdxExporters/exportUtils";
import { useSettingsStore } from "@/stores/settingsStore";
import { ExternalEditorType } from "@/structs/editorStructs";
import { openExternalEditor } from "@/scripts/layerCommunication/objects/objectCommunication";
import type { MissionTree } from "@/structs/missionStructs";
import { renderModStructureEventName } from "./objectEditorStructureTreeExtender";
import { gfxFileCreated } from "./gfxfileEditorService";
import { removeGfxFile } from "@/scripts/repositories/GfxRepository";
import { useGfxStore } from "@/stores/gfxStore";

export async function handleObjectCreated(objectName: string, objectType: ObjectType) : Promise<AvailableObject | undefined> {
    var modStore = useModStore();
    var createdAvailableObject;
    switch(objectType){
        case ObjectType.MissionTree:
            createdAvailableObject = await missionTreeCreated(objectName);
            break;
        case ObjectType.Localisation:
            createdAvailableObject = await localisationCreated(objectName);
            break;
        case ObjectType.GFXFile:
            createdAvailableObject = await gfxFileCreated(objectName);
            break;
        case ObjectType.Unknown:
        default:
            return;
    }

    synchronizeObject(objectType, createdAvailableObject.name);

    modStore.openObject(createdAvailableObject);

    fireEvent(objectCreatedEventName, createdAvailableObject);

    return createdAvailableObject;
}

export function handleObjectDeleted(objectName: string, objectType: ObjectType) {
    switch(objectType) {
        case ObjectType.MissionTree:
            removeMissionTree(objectName);
            break;
        case ObjectType.Localisation:
            removeLocalisation(objectName);
            break;
        case ObjectType.GFXFile:
            removeGfxFile(objectName);
            break;
    }
    
    objectName = getFileName(objectName);
    var modStore = useModStore();
    if(modStore.getOpenedObject(objectName)) {
        modStore.closeObject(objectName);
    }
    else {
        fireEvent(renderModStructureEventName);
    }
}

export function handleObjectCloned(objectName: string, objectType: ObjectType) : AvailableObject | undefined{
    var createdAvailableObject = undefined;
    switch(objectType) {
        case ObjectType.MissionTree:
            createdAvailableObject = cloneMissionTree(objectName);
            break;
        case ObjectType.Localisation:
            createdAvailableObject = cloneLocalisation(objectName);
            break;
        case ObjectType.GFXFile:
            //TODO: DOooooooooooooooooo
            break;
    }

    if(!createdAvailableObject) {
        return undefined;
    }

    synchronizeObject(objectType, createdAvailableObject.name);

    var modStore = useModStore();
    modStore.openObject(createdAvailableObject);

    fireEvent(objectCreatedEventName, createdAvailableObject);

    return createdAvailableObject;
}

export async function handleObjectImported(pathToFile: string, generateReplacementFile: boolean, objectType: ObjectType) : Promise<AvailableObject | undefined> {
    var fileContent = await requestFile(pathToFile);
    if(!fileContent) {
        return undefined;
    }

    var fileName = getFileName(pathToFile);
        
    var createdAvailableObject : AvailableObject | undefined = undefined;
    switch(objectType) {
        case ObjectType.MissionTree:
            createdAvailableObject = await missionTreeImported(fileContent, fileName, generateReplacementFile);
            break;
        case ObjectType.Localisation:
            createdAvailableObject = await localisationImported(fileContent, fileName, generateReplacementFile);
            break;
        case ObjectType.GFXFile:
            //TODO: DOOOoooooooooooooooooo
            break;
    }

    if(!createdAvailableObject) {
        return undefined;
    }

    synchronizeObject(objectType, createdAvailableObject.name);

    var modStore = useModStore();
    modStore.openObject(createdAvailableObject);

    fireEvent(objectCreatedEventName, createdAvailableObject);

    return createdAvailableObject;
}

export async function handleObjectSynchronizedFromExportedFile(filePath: string, objectType: ObjectType, objectName: string) {
    switch(objectType) {
        case ObjectType.MissionTree:
            var missionTree = getGameObject(objectName, objectType) as MissionTree;
            await loadMissionTreeFromFileSystemAndMergeToExisting(filePath, missionTree);
            break;
        case ObjectType.Localisation:
            //TODO: dooooooooooo
        case ObjectType.GFXFile:
            //TODO: DOOOoooooooooooooooooo
            break;
    }
    
    addObjectChange(ChangedObjectActionType.Update, objectType, objectName, objectName);
}

export function handleObjectOpened(objectType: ObjectType, objectName: string) {
    synchronizeObject(objectType, objectName);
}

function synchronizeObject(objectType: ObjectType, objectName: string) {
    var synchronizationStore = useSynchStore();
    synchronizationStore.setEditorValueSynchronizedFromDesigner(objectType, objectName);
    synchronizationStore.setEditorValueSynchronizedFromEditor(objectType, objectName);
}

export function handleObjectClosed(selectedObject: AvailableObject) {
   handleObjectClosedByName(selectedObject.type, selectedObject.id);
}

export function handleObjectClosedByName(objectType: ObjectType, objectname: string) {
     var modStore = useModStore();
    modStore.closeObject(objectname);

    switch(objectType){
        case ObjectType.MissionTree:
            var missionStore = useMissionTreeListStore();
            missionStore.removeMissionTree(objectname);
        case ObjectType.GFXFile:
            var gfxStore = useGfxStore();
            gfxStore.removeGfxFile(objectname);
            break;
    }
}

export function getOpenedObjects(skipChangesIndicator?: boolean, objectType?: ObjectType) {
    var modStore = useModStore();
    var synchronizationStore = useSynchStore();

    var value = new Array();
    var openedObjects =  modStore.getOpenedObjects();
    if(objectType) {
        openedObjects = openedObjects.filter(x => x.type === objectType);
    }
    
    for(var object of openedObjects) {
        var transformedValue = deepClone(object);
        value.push(transformedValue);
        if(!skipChangesIndicator && hasObjectChanged(object.id, object.type) && !object.name.startsWith('*')) {
            transformedValue.name = `*${object.name}`;
        }

        var isObjectLoaded = false;
        switch(object.type) {
            case ObjectType.MissionTree:
                var missionStore = useMissionTreeListStore();
                isObjectLoaded = missionStore.isMissionTreeLoaded(object.id);
                break;
            case ObjectType.Localisation:
                var localisationStore = useLocalisationStore();
                isObjectLoaded = localisationStore.isLocalisationLoaded(object.id);
                break;
            case ObjectType.GFXFile:
                var gfxStore = useGfxStore();
                isObjectLoaded = gfxStore.isGfxLoaded(object.id)
                break;
        }

        if(!skipChangesIndicator && isObjectLoaded && !synchronizationStore.isEditorValueSynchronizedFromEditor(object.type, object.name)) {
            transformedValue.name = `!${transformedValue.name}`;
        }
    }

    return value;
}

export function handleObjectLoadedFromEditor(selectedObjectId: string, objectType: ObjectType) : string {
    var synchronizationStore = useSynchStore();
    if(synchronizationStore.isEditorValueSynchronizedFromEditor(objectType, selectedObjectId)) {
        return selectedObjectId;
    }

    switch(objectType) {
        case ObjectType.MissionTree:
            handleMissionTreeLoadedFromEditor(selectedObjectId);
            break;
        case ObjectType.Localisation:
            handleLocalisationLoadedFromEditor(selectedObjectId);
            break;
        case ObjectType.GFXFile:
            //TODO: Dooooooooooooooo
            break;
    }

    addObjectChange(ChangedObjectActionType.Update, objectType, selectedObjectId, selectedObjectId);
    return selectedObjectId;
}

export function handleObjectLoadedFromDesigner(selectedObjectId: string, objectType: ObjectType) {
    var synchronizationStore = useSynchStore();
    if(synchronizationStore.isEditorValueSynchronizedFromDesigner(objectType, selectedObjectId)) {
        return selectedObjectId;
    }

    switch(objectType) {
        case ObjectType.MissionTree:
            handleMissionTreeLoadedFromDesigner(selectedObjectId);
            break;
        case ObjectType.Localisation:
            handleLocalisationLoadedFromDesigner(selectedObjectId);
            break;
        case ObjectType.GFXFile:
            //TODO: Dooooooooooooooo
            break;
    }

    addObjectChange(ChangedObjectActionType.Update, objectType, selectedObjectId, selectedObjectId);
    return selectedObjectId;
}

export function getValidObjectName(objectName: string, existingNames: string[]) : string {
    objectName = toSnakeCase(objectName);

    var checkinNamesCounter = 0;
    while(checkinNamesCounter < 100) {
        if(existingNames.includes(objectName)) {
            objectName += `_${checkinNamesCounter}`;
        }
        else {
            checkinNamesCounter = 101;
        }
    }

    return objectName;
}

export function handleEditorOpened(objectType: ObjectType, objectName: string | undefined, objectExportedValue: string, shouldGenerateNewValue: boolean) : string {
    if(!objectName) {
        return '';
    }

    var synchronizationStore = useSynchStore();
    var editorValue =  synchronizationStore.getObjetEditorValue(objectType, objectName);
    if(objectExportedValue) {
        var objectType = ObjectType.Localisation;
        if(!editorValue || shouldGenerateNewValue) {
            synchronizationStore.storeObjectEditorValue(objectType, objectName, objectExportedValue);
            synchronizationStore.setEditorValueSynchronizedFromDesigner(objectType, objectName);
            synchronizationStore.setEditorValueSynchronizedFromEditor(objectType, objectName);
            return objectExportedValue;
        }
        else {
            return editorValue;
        }
    }

    return editorValue;
}

export function shouldGenerateNewEditorValue(objectType: ObjectType, objectName: string) : boolean {
    var synchronizationStore = useSynchStore();
    if(!synchronizationStore.hasObjectEditorValue(objectType, objectName) || !synchronizationStore.getObjetEditorValue(objectType, objectName)) {
        return true;
    }

    if(!synchronizationStore.isEditorValueSynchronizedFromEditor(objectType, objectName)) {
        return false;
    }

    return !synchronizationStore.isEditorValueSynchronizedFromDesigner(objectType, objectName);
}

export function handleEditorValueChanged(objectType: ObjectType, objectName: string | undefined, editedValue: string) {
    if(!objectName) {
        return;
    }

    var synchronizationStore = useSynchStore();

    synchronizationStore.storeObjectEditorValue(objectType, objectName, editedValue);
    synchronizationStore.setEditorValueNotSynchronizedFromEditor(objectType, objectName);
}

export function handleObjectOpenedInExternalEditor(objectType: ObjectType, objectName: string) {
    var pathToFile = getObjectExportPath(objectType, objectName);
    var settingsStore = useSettingsStore();
    var appSettings = settingsStore.getAppSettings();
    if(!appSettings) {
        var editor = ExternalEditorType.Default as string;
    }
    else {
        var editor = appSettings.externalEditor;
    }
  
    openExternalEditor(pathToFile, editor);
}

export function getGameObject(objectName: string, objectType: ObjectType) : GameObject | undefined {
    var gameObject;
    switch(objectType){
        case ObjectType.MissionTree:
            var missionStore = useMissionTreeListStore();
            gameObject = missionStore.getMissionTree(objectName);
            break;
        case ObjectType.Localisation:
            var localisationStore = useLocalisationStore();
            gameObject = localisationStore.getLocalisation(objectName);
            break;
        case ObjectType.GFXFile:
            var gfxStore = useGfxStore();
            gameObject = gfxStore.getGfxFile(objectName);
            break;
        case ObjectType.Unknown:
        default:
            return;
    }

    return gameObject;
}