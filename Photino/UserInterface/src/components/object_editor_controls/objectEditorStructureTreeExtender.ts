import { newTreeNode, TreeNodeType, type TreeNode } from "../tree_view/treeNode";
import { useLocalisationStore } from "@/stores/localisationStore";
import { readDir, type FileSystemEntry } from "@/scripts/layerCommunication/fileSystemCommunication";
import { useModStore } from "@/stores/modStore";
import { createAvailableObjectForMissionTree, getMissionTreeSaveFolder, openMissionTreeFile } from "@/scripts/repositories/missionTreeRepository";
import { computed } from "vue";
import { getGameObject, getOpenedObjects, handleObjectCloned, handleObjectDeleted} from "./objectEditorExtender";
import { ObjectType, type AvailableObject } from "@/structs/genericStructs";
import { isObjectNew } from "@/scripts/repositories/changedObjectRepository";
import { removeExtensionFromFileName } from "@/scripts/utils";
import { fireEvent } from "@/scripts/event_system/globalEventHandler";
import { objectOpenedEventName } from "@/scripts/event_system/objectEditorEvents";
import { createAvailableObjectForLocalisation, getLanguageLocalisationSaveFolder, openLocalisation } from "@/scripts/repositories/localisationRepository";
import { useMissionTreeListStore } from "@/stores/missionStore";
import { useSynchStore } from "@/stores/synchronizationStore";
import { createAvailableObjectForAppSettings, createAvailableObjectForModSettings } from "@/scripts/repositories/settingsRepository";
import { getExportFolder } from "@/scripts/pdxExporters/exportUtils";
import { createAvailableObjectForTextFile } from "@/scripts/repositories/textObjectRepository";
import type { ContextMenuItem } from "@/scripts/uiControllers/contextMenuDirective";
import { openImportObjectModalEventName, openNewObjectModalEventName } from "./object_actions/objectActionsExtender";
import { getGfxFileSaveFolder, openGfxFile } from "@/scripts/repositories/GfxRepository";
import { createAvailableObjectForGfxFile } from "./gfxfileEditorService";
import type { GfxFile } from "@/structs/gfxStructs";
import { useGfxStore } from "@/stores/gfxStore";
import { useSettingsStore } from "@/stores/settingsStore";

export const renderModStructureEventName = "RenderModStructureEvent";

var modStore = computed(() => {
    return useModStore();
});

var missionStore = computed(() => {
    return useMissionTreeListStore();
});

var localisationStore = computed(() => {
    return useLocalisationStore();
});

export async function getObjectTreeStructure(filter?: string) : Promise<TreeNode[]> {
    var mod = modStore.value.getMod();
    if(!mod) {
        return [];
    }

    var baseTreeNode = <TreeNode>({ id: 'base', label: mod.modName, type: "parentNode", children: new Array(), isOpen: true});

    var missionTreeStructure = await getMissionTreeObjectTreeStructure();
    if(missionTreeStructure) {
        baseTreeNode.children?.push(missionTreeStructure);
    }

    var localisationTreeStructure = await getLocalisationObjectTreeStructure();
    if(localisationTreeStructure) {
        baseTreeNode.children?.push(localisationTreeStructure);
    }

    var gfxFileTreeStructure = await getGfxFileObjectTreeStructure();
    if(gfxFileTreeStructure) {
        baseTreeNode.children?.push(gfxFileTreeStructure);
    }

    return filterTreeNodes([baseTreeNode], filter);
}

function filterTreeNodes(nodes: TreeNode[], filter?: string) : TreeNode[] {
    if(!filter) {
        return nodes;
    }

    var filteredNodes = new Array();
    for(var node of nodes) {
        if(node.type === TreeNodeType.EndNode) {
            if(node.label.toLowerCase().includes(filter)) {
                filteredNodes.push(node);
            }
            continue;
        }

        if(node.type === TreeNodeType.ParentNode && node.children) {
            node.children = filterTreeNodes(node.children, filter);
            if(node.children && node.children.length > 0) {
                node.isOpen = true;
                filteredNodes.push(node);
            }
            else if(node.label.toLowerCase().includes(filter)) {
                filteredNodes.push(node);
            }
        }
    }

    return filteredNodes;
}

export async function getExportedObjectsTreeStructure(filter?: string) : Promise<TreeNode[]> {
    var exportedFolderStructure = await readDir(getExportFolder());
    var processedStructure = processExportObjectTreeStructure(exportedFolderStructure);
    return filterTreeNodes(processedStructure, filter);
}

function processExportObjectTreeStructure(entries: FileSystemEntry[]) : TreeNode[] {
    var result = new Array();
    var isFirst = true;
    for(var entry of entries) {
        var entryTreeNode = newTreeNode(entry.fullPath, removeExtensionFromFileName(entry.name), entry.isDirectory ? TreeNodeType.ParentNode : TreeNodeType.EndNode, processExportObjectTreeStructure(entry.children), ObjectType.TextFile);
        if(isFirst) {
            entryTreeNode.isOpen = true;
            isFirst = false;
        }
        result.push(entryTreeNode);
    }

    return result;
}

function getParentObjectContextMenuOption(objectType: ObjectType) {
    return {
        getMenu: () => {
            return [
                { label: 'New', value: 'new', objectContext: objectType },
                { label: 'Import', value: 'import', objectContext: objectType },
            ];
        },
        onSelect: (item: ContextMenuItem) => {
            switch(item.value) {
                case 'new':
                    fireEvent(openNewObjectModalEventName, item.objectContext)
                    break;
                case 'import':
                    fireEvent(openImportObjectModalEventName, item.objectContext);
                    break;
            }
        },
    };
}

function getObjectObjectContextMenuOption(object: any) {
    return {
        getMenu: () => {
            return [
                { label: 'Remove', value: 'remove', objectContext: object },
                { label: 'Clone', value: 'clone', objectContext: object },
            ];
        },
        onSelect: (item: ContextMenuItem) => {
            var object = item.objectContext;
            switch(item.value) {
                case 'remove':
                    handleObjectDeleted(object.name, object.type);
                    break;
                case 'clone':
                    handleObjectCloned(object.name, object.type);
                    break;
            }
        },
    };
}

export async function getMissionTreeObjectTreeStructure() : Promise<TreeNode | undefined> {
    var fileSystemObjects = await readDir(getMissionTreeSaveFolder());
    return getObjectTypeTreeStructure(fileSystemObjects, ObjectType.MissionTree, 'Missions')
}

export async function getLocalisationObjectTreeStructure() : Promise<TreeNode | undefined> {
    var fileSystemObjects = await readDir(getLanguageLocalisationSaveFolder());
    return getObjectTypeTreeStructure(fileSystemObjects, ObjectType.Localisation, 'Localisations')
}

export async function getGfxFileObjectTreeStructure() : Promise<TreeNode | undefined> {
    var fileSystemObjects = await readDir(getGfxFileSaveFolder());
    return getObjectTypeTreeStructure(fileSystemObjects, ObjectType.GFXFile, 'Gfx')
}

function getObjectTypeTreeStructure(fileSystemObjects: FileSystemEntry[], objectType: ObjectType, topNodeName: string) : TreeNode | undefined {
    var objects = fileSystemObjects.filter(x => !x.isDirectory)
        .map(x => 
            newTreeNode(
                removeExtensionFromFileName(x.name), 
                removeExtensionFromFileName(x.name), 
                TreeNodeType.EndNode, 
                undefined, 
                objectType, 
                getObjectObjectContextMenuOption({ name: x.name, type: objectType })
            )
        );

    var openedObjects = getOpenedObjects(true, objectType);
    for(var openedObject of openedObjects) {
        if(isObjectNew(openedObject.id, objectType)) {
            objects.push(newTreeNode(openedObject.id, openedObject.name, TreeNodeType.EndNode, undefined, objectType, getObjectObjectContextMenuOption({ name: openedObject.name, type: objectType })));
        }
    }

    if(objects.length == 0) {
        return;
    }

    return newTreeNode(`${topNodeName}topNode`, topNodeName, TreeNodeType.ParentNode, objects, objectType, getParentObjectContextMenuOption(objectType));
}

export async function handleObjectOpenedById(id: string, objectType: ObjectType, suppressObjectOpenedEvent?: boolean) {
    await handleObjectOpened(<TreeNode>({ label: id, id, objectType }), suppressObjectOpenedEvent);
}

export async function handleObjectOpened(openedObject: TreeNode, suppressObjectOpenedEvent?: boolean) {
    if(!openedObject){
        return;
    }

    var openedAvailableObject = modStore.value.getOpenedObject(openedObject.id);
    switch(openedObject.objectType) {
        case ObjectType.MissionTree:
            openedAvailableObject = await handleMissionTreeOpened(openedObject, openedAvailableObject);
            break;
        case ObjectType.Localisation:
            openedAvailableObject = await handleLocalisationOpened(openedObject, openedAvailableObject);
            break;
        case ObjectType.GFXFile:
            openedAvailableObject = await handleGfxFileOpened(openedObject, openedAvailableObject);
            break;
        case ObjectType.AppSettings:
            openedAvailableObject = handleAppSettingsOpened(openedAvailableObject);
            break;
        case ObjectType.ModSettings:
            openedAvailableObject = handleModSettingsOpened(openedAvailableObject);
            break;
        case ObjectType.TextFile:
            openedAvailableObject = handleTextFileOpened(openedObject.id, openedObject.label, openedAvailableObject);
            break;
        default:
            return;
    }

    if(openedAvailableObject) {
        var synchronizationStore = useSynchStore();

        synchronizationStore.setEditorValueSynchronizedFromDesigner(openedObject.objectType, openedObject.id);
        synchronizationStore.setEditorValueSynchronizedFromEditor(openedObject.objectType, openedObject.id);
        
        modStore.value.openObject(openedAvailableObject);
        if(!suppressObjectOpenedEvent) {
            fireEvent(objectOpenedEventName, openedObject.id, openedObject.objectType);
        }
    }
}

async function handleMissionTreeOpened(openedObject: TreeNode, alreadyOpenedObject: AvailableObject | undefined) : Promise<AvailableObject | undefined> {
    var openedAvailableObject = undefined;
    
    var existingMissionTree = missionStore.value.getMissionTree(openedObject.id);
    if(existingMissionTree){
        return alreadyOpenedObject ?? createAvailableObjectForMissionTree(existingMissionTree);
    }

    var missionTree = await openMissionTreeFile(openedObject.id);
    if(missionTree) {
        missionStore.value.addMissionTree(missionTree);
        openedAvailableObject = createAvailableObjectForMissionTree(missionTree);

        var missionTreeLocalisation = localisationStore.value.getLocalisation(missionTree.localisationFileId);
        if(!missionTreeLocalisation) {
            await handleObjectOpenedById(missionTree.localisationFileId, ObjectType.Localisation);
        }
    }

    return openedAvailableObject;
}

async function handleLocalisationOpened(openedObject: TreeNode, alreadyOpenedObject: AvailableObject | undefined) : Promise<AvailableObject | undefined> {
    var existingLocalisation = localisationStore.value.getLocalisation(openedObject.id);
    if(existingLocalisation){
        return alreadyOpenedObject ?? createAvailableObjectForLocalisation(existingLocalisation);
    }

    var localisation = await openLocalisation(openedObject.id);
    if(localisation) {
        localisationStore.value.addLocalisation(localisation);
        return createAvailableObjectForLocalisation(localisation);
    }
}

async function handleGfxFileOpened(openedObject: TreeNode, alreadyOpenedObject: AvailableObject | undefined) : Promise<AvailableObject | undefined> {
    var existingObject = getGameObject(openedObject.id, ObjectType.GFXFile) as GfxFile;
    if(existingObject){
        return alreadyOpenedObject ?? createAvailableObjectForGfxFile(existingObject);
    }

    var gfxStore = useGfxStore();

    var object = await openGfxFile(openedObject.id);
    if(object) {
        gfxStore.addGfxFile(object);
        return createAvailableObjectForGfxFile(object);
    }
}
function handleAppSettingsOpened(alreadyOpenedObject: AvailableObject | undefined) {
    return alreadyOpenedObject ?? createAvailableObjectForAppSettings();
}

function handleModSettingsOpened(alreadyOpenedObject: AvailableObject | undefined) {
    return alreadyOpenedObject ?? createAvailableObjectForModSettings();
}

function handleTextFileOpened(objectId: string, objectName: string, alreadyOpenedObject: AvailableObject | undefined) {
    return alreadyOpenedObject ?? createAvailableObjectForTextFile(objectId, objectName);
}