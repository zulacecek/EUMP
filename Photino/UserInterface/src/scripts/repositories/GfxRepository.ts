import { formatFileSystemPath, getFileSavePath, removeExtensionFromFileName, toSnakeCase } from "../utils";
import { ChangedObjectActionType, ObjectType, type AvailableObject } from "../../structs/genericStructs";
import { addObjectChange } from "./changedObjectRepository";
import { requestObjectFromFile } from "../layerCommunication/fileCommunication";
import { deleteFile, readDir } from "../layerCommunication/fileSystemCommunication";
import { useSynchStore } from "@/stores/synchronizationStore";
import { displayGlobalLoader, hideGlobalLoader } from "../uiControllers/appController";
import { saveFileExtension, saveGameObject } from "./baseGameObjectRepository";
import type { GfxFile } from "@/structs/gfxStructs";
import { useGfxStore } from "@/stores/gfxStore";

export const gameLocalisationFolderName = 'gfx';
const objectType = ObjectType.GFXFile;

export function createGfxFile(name: string, generateReplacementFile: boolean = false, originalFileName: string = "") : GfxFile {
    name = toSnakeCase(name);

    var gfxFile = <GfxFile>({ 
       generateReplacementFile,
       id: name,
       name: name,
       originalFileName,
       sprites: new Array(),
    });

    addObjectChange(ChangedObjectActionType.New, objectType, gfxFile.name, gfxFile.name);

    return gfxFile;
}

export async function getExistingGfxFileNames() : Promise<string[]> {
    var fileSystemTrees =  (await readDir(getGfxFileSaveFolder())).map(x=> removeExtensionFromFileName(x.name));
    var gfxStore = useGfxStore();
    var memoryObjects = gfxStore.getGfxFiles().map(x => x.name);
    return [...new Set([...fileSystemTrees, ...memoryObjects])];
}

export function createAvailableObjectForGfxFile(gfxFile: GfxFile) : AvailableObject {
    return <AvailableObject>({
        name: gfxFile.name,
        id: gfxFile.name,
        type: objectType
    });
}

export async function saveGfxFiles(isSaveBeforeExport?: boolean) {
    var gfxStore = useGfxStore();
    var gfxFiles = gfxStore.getGfxFiles();

    var baseSavePath = getGfxFileSaveFolder();
    
    await saveGameObject(gfxFiles, baseSavePath, objectType, isSaveBeforeExport);
}

export async function removeGfxFile(objectName: string) {
    var gfxStore = useGfxStore();
    var gfxFile = gfxStore.getGfxFile(objectName);
    if(gfxFile) {
        gfxStore.removeGfxFile(objectName);
        var filePath = formatFileSystemPath(getGfxFileSaveFolder(), `${objectName}${saveFileExtension}`);
        await deleteFile(filePath);
    }
}

export async function openGfxFile(objectName: string) : Promise<GfxFile | undefined> {
    if(!objectName) {
        return undefined;
    }
    
    var baseSavePath = getGfxFileSaveFolder();
    if(!objectName.endsWith(saveFileExtension)){
        objectName += saveFileExtension;
    }

    var synchronizationStore = useSynchStore();
    synchronizationStore.setEditorValueSynchronizedFromDesigner(objectType, objectName);
    synchronizationStore.setEditorValueSynchronizedFromEditor(objectType, objectName);
    
    displayGlobalLoader('Loading gfx file');
    var objectPath = formatFileSystemPath(baseSavePath, objectName);
    var result = await requestObjectFromFile<GfxFile>(objectPath);
    hideGlobalLoader();
    return result;
}

export function mergeGfxFile(from: GfxFile, into: GfxFile) {
    if(!from || !into) {
        return;
    }
    
    into.sprites = from.sprites;
}

export function getGfxFile(id: string) : GfxFile | undefined {
    var objectStore = useGfxStore();
    return objectStore.getGfxFile(id);
}

export function storeGfxFile(gfxFile: GfxFile) {
    var objectStore = useGfxStore();
    return objectStore.addGfxFile(gfxFile);
}

export function getGfxFileSaveFolder() : string {
    return getFileSavePath(objectType);
}