import { useModStore } from "@/stores/modStore";
import { requestObjectFromFile, saveObject } from "../layerCommunication/fileCommunication";
import { formatFileSystemPath, getFileSavePath } from "../utils";
import type { AvailableObject } from "@/structs/genericStructs";

function getOpenedObjectsSaveFileName() {
    var baseSaveFolder = getFileSavePath('.editor');
    return formatFileSystemPath(baseSaveFolder, 'openedObjects.txt');
}

export async function saveOpenedObjects() {
    var modStore = useModStore();
    await saveObject(getOpenedObjectsSaveFileName(), modStore.getOpenedObjects());
}

export async function loadOpenedObjects() {
    var modStore = useModStore();
    var openedObjects = await requestObjectFromFile<AvailableObject[]>(getOpenedObjectsSaveFileName());
    if(openedObjects) {
        modStore.setOpenedObjects(openedObjects);
    }
}