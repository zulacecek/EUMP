import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ObjectType } from '@/structs/genericStructs';

export const useSynchStore = defineStore('synchronizationStore', () => {
    var objectEditorValue = new Map<string, string>();
    var objectSynchronizedFromEditor = ref(new Array());
    var objectSynchronizedFromDesigner = ref(new Array());

    function getObjetEditorValue(objectType: ObjectType, objectName: string) : string {
        var value = '';
        var objectKey = getStoreKey(objectType, objectName);
        if(hasObjectEditorValueByKey(objectKey)) {
            value = objectEditorValue.get(objectKey) as string;
        }

        return value;
    }

    function hasObjectEditorValue(objectType: ObjectType, objectName: string) : boolean {
        var objectKey = getStoreKey(objectType, objectName);
        return hasObjectEditorValueByKey(objectKey);
    }

    function hasObjectEditorValueByKey(objectKey: string) : boolean {
        return objectEditorValue.has(objectKey);
    }

    function storeObjectEditorValue(objectType: ObjectType, objectName: string, value: string) {
        objectEditorValue.set(getStoreKey(objectType, objectName), value);
    }

    function isEditorValueSynchronizedFromEditor(objectType: ObjectType, objectName: string) : boolean {
        var objectKey = getStoreKey(objectType, objectName);
        return objectSynchronizedFromEditor.value.includes(objectKey);
    }

    function setEditorValueSynchronizedFromEditor(objectType: ObjectType, objectName: string) {
        var objectKey = getStoreKey(objectType, objectName);
        if(!objectSynchronizedFromEditor.value.includes(objectKey)) {
            objectSynchronizedFromEditor.value.push(objectKey);
        }
    }

    function setEditorValueNotSynchronizedFromEditor(objectType: ObjectType, objectName: string) {
        objectSynchronizedFromEditor.value = objectSynchronizedFromEditor.value.filter(x => x !== getStoreKey(objectType, objectName));
    }

    function isEditorValueSynchronizedFromDesigner(objectType: ObjectType, objectName: string) : boolean {
        var objectKey = getStoreKey(objectType, objectName);
        return objectSynchronizedFromDesigner.value.includes(objectKey);
    }

    function setEditorValueSynchronizedFromDesigner(objectType: ObjectType, objectName: string) {
        var objectKey = getStoreKey(objectType, objectName);
        if(!objectSynchronizedFromDesigner.value.includes(objectKey)) {
            objectSynchronizedFromDesigner.value.push(objectKey);
        }
    }

    function setEditorValueNotSynchronizedFromDesigner(objectType: ObjectType, objectName: string) {
        objectSynchronizedFromDesigner.value = objectSynchronizedFromDesigner.value.filter(x => x !== getStoreKey(objectType, objectName));
    }
    
    function getStoreKey(objectType: ObjectType, objectName: string) {
        return `${objectType}|${objectName}`;
    }

    return {
        getObjetEditorValue, 
        hasObjectEditorValue,
        storeObjectEditorValue, 
        isEditorValueSynchronizedFromEditor, 
        setEditorValueSynchronizedFromEditor, 
        setEditorValueNotSynchronizedFromEditor, 
        setEditorValueSynchronizedFromDesigner, 
        setEditorValueNotSynchronizedFromDesigner, 
        isEditorValueSynchronizedFromDesigner,
    }
});