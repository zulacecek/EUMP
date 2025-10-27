import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { KeyValuePair } from '@/structs/genericStructs';

export const useTextFileStore = defineStore('textFileStore', () => {
    const textFileList = ref<KeyValuePair<string, string>[]>(new Array());
    
    function storeTextFileValue(objectName: string, objectValue: string) {
        var keyValue = <KeyValuePair<string, string>>({ 
            key: objectName, 
            value: objectValue
        });

        textFileList.value.push(keyValue);
    }

    function removeTextFileValue(objectName: string) {
        textFileList.value = textFileList.value.filter(x => x.key !== objectName);
    }

    function getTextFileValue(objectName: string) : string | undefined{
        return textFileList.value.firstOrDefault(x=> x.key == objectName)?.value;
    }

    function getTextFileValues() : KeyValuePair<string, string>[] {
        return textFileList.value;
    }

  return { storeTextFileValue, removeTextFileValue, getTextFileValue, getTextFileValues }
});