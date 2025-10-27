import { useTextFileStore } from "@/stores/textFileStore";
import { ObjectType, type AvailableObject } from "@/structs/genericStructs";
import { saveFile } from "../layerCommunication/fileCommunication";
import { popObjectChange } from "./changedObjectRepository";

export function createAvailableObjectForTextFile(objectId: string, objectName: string) {
    return <AvailableObject>({
        name: objectName,
        id: objectId,
        type: ObjectType.TextFile
    });
};

export async function saveTextFiles() {
    var textFileStore = useTextFileStore();
    for(var textFile of textFileStore.getTextFileValues()) {
        if(!textFile) {
            return;
        }

        await saveFile(textFile.key, textFile.value);
        textFileStore.removeTextFileValue(textFile.key);
        popObjectChange(textFile.key);
    }
}