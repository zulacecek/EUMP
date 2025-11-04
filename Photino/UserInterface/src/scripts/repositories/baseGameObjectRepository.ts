import type { GameObject, ObjectType } from "@/structs/genericStructs";
import { hasObjectChanged, popObjectChange } from "./changedObjectRepository";

import { formatFileSystemPath } from "../utils";
import { saveObject } from "../layerCommunication/fileCommunication";

export const saveFileExtension = '.txt';

export function handleSaveSynchronization(gameObject: GameObject, isSaveBeforeExport?: boolean) {
    var lastModifiedTimestamp = Date.now();
    if(isSaveBeforeExport) {
        lastModifiedTimestamp = 1;
    }

    gameObject.lastModifed = lastModifiedTimestamp;
}

export async function saveGameObject(objects: GameObject[], saveFolder: string, objectType: ObjectType, isSaveBeforeExport?: boolean) {
    for(var object of objects) {
        handleSaveSynchronization(object, isSaveBeforeExport);

        if(hasObjectChanged(object.name, objectType)) {
            var objectSavePath = formatFileSystemPath(saveFolder, `${object.name}.txt`);
            popObjectChange(object.name);
            await saveObject(objectSavePath, object);
        }
    }
}