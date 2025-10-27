import { toSnakeCase } from "@/scripts/utils";
import { ChangedObjectActionType, ObjectType, type AvailableObject } from "@/structs/genericStructs";
import { getValidObjectName } from "./objectEditorExtender";
import type { GfxFile } from "@/structs/gfxStructs";
import { addObjectChange } from "@/scripts/repositories/changedObjectRepository";
import { createGfxFile, getExistingGfxFileNames, storeGfxFile } from "@/scripts/repositories/GfxRepository";
import { objectSelected } from "./objectEditorService";
import { gfxFileSelectedEventName } from "@/scripts/event_system/gfxFileEvents";

export async function gfxFileCreated(objectName: string) : Promise<AvailableObject> {
    objectName = toSnakeCase(objectName);
    if(!objectName) {
        objectName = 'New Gfx';
    }

    var existingLocalisationNames = await getExistingGfxFileNames();
    objectName = getValidObjectName(objectName, existingLocalisationNames);
    
    var localisation = createGfxFile(objectName, false);
    return gfxFileStoreAndOpen(localisation);
}

function gfxFileStoreAndOpen(gfxFile: GfxFile) : AvailableObject {
    storeGfxFile(gfxFile);
    addObjectChange(ChangedObjectActionType.New, ObjectType.GFXFile, gfxFile.name, gfxFile.name);

    var createdAvailableObject = createAvailableObjectForGfxFile(gfxFile);
    objectSelected(gfxFileSelectedEventName, createdAvailableObject);
    return createdAvailableObject;
}

export function createAvailableObjectForGfxFile(gfxFile: GfxFile) : AvailableObject {
    return <AvailableObject>({
        name: gfxFile.name,
        id: gfxFile.name,
        type: ObjectType.GFXFile
    });
}