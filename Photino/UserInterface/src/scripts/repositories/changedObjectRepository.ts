
import { computed, ref } from "vue";

import { useModStore } from "@/stores/modStore";
import { ChangedObjectActionType, ObjectType, type ChangedObject } from "@/structs/genericStructs";

var changedObjects = computed(() => {
    var modStore = useModStore();
    return modStore.getChangedObjects();
});

export function instantiateChangedObject(actionType: ChangedObjectActionType, id: string, name: string, category: ObjectType, ignoreChangeCheck: boolean) {
    return <ChangedObject>({ changeType: actionType, objectId: id, objectCategory: category, objectName: name, ignoreChangeCheck: ignoreChangeCheck });
}

export function hasAnyObjectChanged() : boolean {
    return (changedObjects.value?.changedObjects?.size ?? 0) > 0;
}

export function addObjectChange(actionType: ChangedObjectActionType, category: ObjectType, id: string, name: string, ignoreChangeCheck: boolean = false) {
    if(!changedObjects.value || !changedObjects.value.changedObjects) {
        return;
    }

    if(changedObjects.value.changedObjects.has(id)){
        var existingObject = changedObjects.value.changedObjects.get(id);
        if(existingObject && ((existingObject.changeType == ChangedObjectActionType.New && actionType == ChangedObjectActionType.Update)
            || existingObject.changeType == actionType)) {
        
            // In case it exists. Override the ignoreChangeCheck. Used for object filesystem synchronization
            existingObject.ignoreChangeCheck = false;
            return;
        }
    }

    changedObjects.value.changedObjects.set(id, instantiateChangedObject(actionType, id, name, category, ignoreChangeCheck));
}

export function hasObjectChanged(id: string, category: ObjectType, ignoreChangeCheck: boolean = false ) : boolean {
    return detectObjectChange(ChangedObjectActionType.Update, id, category, ignoreChangeCheck)
    || detectObjectChange(ChangedObjectActionType.New, id, category, ignoreChangeCheck);
}

export function isObjectNew(id: string, category: ObjectType, ignoreChangeCheck: boolean = false ) : boolean {
    return detectObjectChange(ChangedObjectActionType.New, id, category, ignoreChangeCheck);
}
 
export function hasObjectBeenDelete(id: string, category: ObjectType, ignoreChangeCheck: boolean = false) : boolean {
    return detectObjectChange(ChangedObjectActionType.Delete, id, category, ignoreChangeCheck);
}

export function popObjectChange(id: string) {
    if(!changedObjects.value || !changedObjects.value.changedObjects) {
        return;
    }

    if(changedObjects.value.changedObjects.has(id)) {
        changedObjects.value.changedObjects.delete(id);
    }
}

export function detectObjectChange(actionType: ChangedObjectActionType, id: string, category: ObjectType, ignoreChangeCheck: boolean = false) : boolean {
    if(!changedObjects.value || !changedObjects.value.changedObjects) {
        return false;
    }

    if(changedObjects.value.changedObjects.has(id)) {
        var changedObject = changedObjects.value.changedObjects.get(id);
        if(changedObject) {
            if(ignoreChangeCheck) {
                return !changedObject.ignoreChangeCheck;
            }

            return changedObject.changeType == actionType && changedObject.objectCategory == category;
        }
    }
    
    return false;
}

export function getDeletedObjectIds(changeCategory: ObjectType) : ChangedObject[] {
    if(!changedObjects.value || !changedObjects.value.changedObjects) {
        return new Array();
    }

    return [...changedObjects.value.changedObjects.values()].filter(x => x.objectCategory == changeCategory && x.changeType == ChangedObjectActionType.Delete);
}

export function getDeletedMissionTreeIds() : ChangedObject[] {
    if(!changedObjects.value || !changedObjects.value.changedObjects) {
        return new Array();
    }

    return [...changedObjects.value.changedObjects.values()].filter(x => x.objectCategory == ObjectType.MissionTree && x.changeType == ChangedObjectActionType.Delete);
}