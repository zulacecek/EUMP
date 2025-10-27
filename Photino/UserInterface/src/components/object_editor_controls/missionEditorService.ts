import { fireEvent } from "@/scripts/event_system/globalEventHandler";
import { missionTreeSelectedEventName } from "@/scripts/event_system/missionEvents";
import { parseMissionTree } from "@/scripts/pdxImporters/missionTreeImporter";
import { addObjectChange } from "@/scripts/repositories/changedObjectRepository";
import { createAvailableObjectForMissionTree, createNewMissionTree, getExistingMissionTreeNames, mergeMissionTreeData, storeMissionTree } from "@/scripts/repositories/missionTreeRepository";
import { deepClone } from "@/scripts/utils";
import { useMissionTreeListStore } from "@/stores/missionStore";
import { ChangedObjectActionType, ObjectType, type AvailableObject } from "@/structs/genericStructs";
import { type MissionTree } from "@/structs/missionStructs";
import { getValidObjectName } from "./objectEditorExtender";
import { useSynchStore } from "@/stores/synchronizationStore";
import { defaultLocalisationName } from "@/scripts/repositories/localisationRepository";
import { requestFile } from "@/scripts/layerCommunication/fileCommunication";


export async function missionTreeCreated(missionTreeName: string) : Promise<AvailableObject> {
    if(!missionTreeName) {
        missionTreeName = 'New Mission Tree';
    }

    var existingMissionTrees = await getExistingMissionTreeNames();
    missionTreeName = getValidObjectName(missionTreeName, existingMissionTrees);

    var missionTree = createNewMissionTree(missionTreeName, [], false);
    return missionTreeStoreAndOpen(missionTree);
}

export function cloneMissionTree(missionTreeName: string) : AvailableObject | undefined {
    var missionTreeStore = useMissionTreeListStore();
    var missionTree = missionTreeStore.getMissionTree(missionTreeName);
    if(!missionTree){
        return undefined;
    }

    var missionTreeCloned = deepClone(missionTree);
    missionTreeCloned.name = `${missionTreeName}_clone`;
    return missionTreeStoreAndOpen(missionTreeCloned);
}

export function missionTreeStoreAndOpen(missionTree: MissionTree) : AvailableObject {
    storeMissionTree(missionTree);
    addObjectChange(ChangedObjectActionType.New, ObjectType.MissionTree, missionTree.name, missionTree.name);

    var createdAvailableObject = createAvailableObjectForMissionTree(missionTree);
    missionTreeSelected(createdAvailableObject);

    return createdAvailableObject;
}


export function missionTreeSelected(missionTree: AvailableObject | undefined) {
    if(missionTree) {
        fireEvent(missionTreeSelectedEventName, missionTree.id, missionTree.name);
    }
}

export async function missionTreeImported(fileContent: string, fileName: string, generateReplacementFile: boolean) : Promise<AvailableObject | undefined> {
    var existingMissionTrees = await getExistingMissionTreeNames();
    var missionTreeName = getValidObjectName(fileName, existingMissionTrees);
    var parsedMissionTree = parseMissionTree(fileContent, missionTreeName);
    if(!parsedMissionTree) {
        return undefined;
    }
    
    parsedMissionTree.generateReplacementFile = generateReplacementFile;
    parsedMissionTree.localisationFileId = defaultLocalisationName;
    
    return missionTreeStoreAndOpen(parsedMissionTree)
}

export function handleMissionTreeLoadedFromEditor(selectedObjectId: string) : string {
    var missionTreeStore = useMissionTreeListStore();
    var synchronizationStore = useSynchStore();

    var missionTreeEditorValue = synchronizationStore.getObjetEditorValue(ObjectType.MissionTree, selectedObjectId);

    var currentMissionTree = missionTreeStore.getMissionTree(selectedObjectId);
    if(currentMissionTree) {
        return parseAndMergeMissionTree(missionTreeEditorValue, currentMissionTree);
    }

    return '';
}

export async function loadMissionTreeFromFileSystemAndMergeToExisting(filePath: string, into: MissionTree) {
    var fileContent = await requestFile(filePath);
    if(fileContent) {
        parseAndMergeMissionTree(fileContent, into);
    }
}

export function parseAndMergeMissionTree(importedMissionTreeContent: string, into: MissionTree) {
    var synchronizationStore = useSynchStore();
    var objectName = into.name;
    var parsedMissionTree = parseMissionTree(importedMissionTreeContent, objectName);

    var currentMissionTree = into;
    if(currentMissionTree) {
        mergeMissionTreeData(parsedMissionTree, currentMissionTree);

        synchronizationStore.setEditorValueSynchronizedFromDesigner(ObjectType.MissionTree, currentMissionTree.name);
        synchronizationStore.setEditorValueSynchronizedFromEditor(ObjectType.MissionTree, currentMissionTree.name);

        return currentMissionTree.name;
    }

    return '';
}

export function handleMissionTreeLoadedFromDesigner(selectedObjectId: string) : string {
    var synchronizationStore = useSynchStore();
    synchronizationStore.storeObjectEditorValue(ObjectType.MissionTree, selectedObjectId, '');
    synchronizationStore.setEditorValueSynchronizedFromDesigner(ObjectType.MissionTree, selectedObjectId);
    synchronizationStore.setEditorValueSynchronizedFromEditor(ObjectType.MissionTree, selectedObjectId);

    return selectedObjectId;
}