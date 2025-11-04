<script setup lang="ts">
import { useLocalisationStore } from '@/stores/localisationStore';
import MonacoEditor from '../basic_controls/monaco/MonacoEditor.vue';
import LocalisationEditor from './LocalisationEditor.vue';
import { ObjectType } from '@/structs/genericStructs';
import { ref, watch } from 'vue';
import { exportLocalisation } from '@/scripts/pdxExporters/languageLocalisationExporter';
import { handleEditorOpened, handleEditorValueChanged, shouldGenerateNewEditorValue } from '../object_editor_controls/objectEditorExtender';
import LocalisationProperties from './LocalisationProperties.vue'

var props = defineProps({ visibleElement: String, selectedLocalisationName: String });
var editorValue = ref('');

function generateEditorCode() {
    var objectName = props.selectedLocalisationName;
    if(!objectName) {
        return;
    }

    var objectStore = useLocalisationStore();
    var object = objectStore.getLocalisation(objectName);
    var generateNewEditorValue = shouldGenerateNewEditorValue(ObjectType.Localisation, objectName);
    if(object && generateNewEditorValue) {
        var exportedValue = exportLocalisation(object);
        editorValue.value = handleEditorOpened(ObjectType.Localisation, objectName, exportedValue, generateNewEditorValue);
    }
}

function editorValueChanged(editedValue: string) {
    var objectName = props.selectedLocalisationName;
    var objectType = ObjectType.Localisation;
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
        <LocalisationEditor :selectedLocalisationName="selectedLocalisationName" />
    </span>
    <span v-if="visibleElement === 'editor'">
        <MonacoEditor :value="editorValue" @value-changed="editorValueChanged" />
    </span>
    <span v-show="visibleElement === 'properties'">
        <LocalisationProperties :objectName="selectedLocalisationName" />
    </span>
</template>

<style scoped>

</style>