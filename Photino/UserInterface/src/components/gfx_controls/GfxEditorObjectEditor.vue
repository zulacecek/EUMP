<script setup lang="ts">
import { ref, watch } from 'vue';
import { handleEditorOpened, handleEditorValueChanged, shouldGenerateNewEditorValue } from '../object_editor_controls/objectEditorExtender';
import { ObjectType } from '@/structs/genericStructs';
import MonacoEditor from '../basic_controls/monaco/MonacoEditor.vue';
import GfxEditor from './GfxEditor.vue'
import GfxProperties from './GfxProperties.vue'
import { useGfxStore } from '@/stores/gfxStore';

var props = defineProps<{ visibleElement: string, objectName: string }>();
var editorValue = ref('');
const objectType = ObjectType.GFXFile;

function generateEditorCode() {
    var objectName = props.objectName;
    if(!objectName) {
        return;
    }
    
    var objectStore = useGfxStore();
    var object = objectStore.getGfxFile(objectName);
    var generateNewEditorValue = shouldGenerateNewEditorValue(objectType, objectName);
    if(object && generateNewEditorValue) {
        var exportedValue = JSON.stringify(object);
        editorValue.value = handleEditorOpened(objectType, objectName, exportedValue, generateNewEditorValue);
    }
}

function editorValueChanged(editedValue: string) {
    var objectName = props.objectName;
    var objectType = ObjectType.GFXFile;
    handleEditorValueChanged(objectType, objectName, editedValue);
}

watch(() => props.visibleElement, (newVisibleElement) => {
    if(newVisibleElement === 'editor') {
        generateEditorCode();
    }
},
    { immediate: true }
);

</script>
<template>
    <span v-show="visibleElement === 'designer'">
        <GfxEditor :objectName="objectName" />
    </span>
    <span v-if="visibleElement === 'editor'">
        <MonacoEditor :value="editorValue" @value-changed="editorValueChanged" />
    </span>
    <span v-show="visibleElement === 'properties'">
        <GfxProperties :objectName="objectName" />
    </span>
</template>

<style scope>
</style>