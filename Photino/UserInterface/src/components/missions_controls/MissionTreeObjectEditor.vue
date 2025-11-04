<script setup lang="ts">
import MonacoEditor from '../basic_controls/monaco/MonacoEditor.vue';
import MissionTreeEditor from './MissionTreeEditor.vue';
import { ref, watch } from 'vue';
import { useMissionTreeListStore } from '@/stores/missionStore';
import { exportMissionTree } from '@/scripts/pdxExporters/missionTreeExporter';
import { ObjectType } from '@/structs/genericStructs';
import { handleEditorOpened, handleEditorValueChanged, shouldGenerateNewEditorValue } from '../object_editor_controls/objectEditorExtender';
import MissionTreeProperties from './MissionTreeProperties.vue'

var props = defineProps({ visibleElement: String, selectedMissionTreeName: String });
var editorValue = ref();

function generateEditorCode() {
    var objectName = props.selectedMissionTreeName;
    if(!objectName) {
        return;
    }

    var objectStore = useMissionTreeListStore();
    var object = objectStore.getMissionTree(objectName);
    var generateNewEditorValue = shouldGenerateNewEditorValue(ObjectType.MissionTree, objectName);
    if(object) {
        var exportedValue = '';
        if(generateNewEditorValue) {
            exportedValue = exportMissionTree(object);
        }
        
        editorValue.value = handleEditorOpened(ObjectType.MissionTree, objectName, exportedValue, generateNewEditorValue);
    }
}

function editorValueChanged(editedValue: string) {
    var objectName = props.selectedMissionTreeName;
    var objectType = ObjectType.MissionTree;
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
    <span v-if="visibleElement === 'designer'">
        <MissionTreeEditor :selectedMissionTreeName="selectedMissionTreeName"></MissionTreeEditor>
    </span>
    <span v-else-if="visibleElement === 'editor'">
        <MonacoEditor :value="editorValue" @value-changed="editorValueChanged" />
    </span>
    <span v-else-if="visibleElement === 'properties'">
        <MissionTreeProperties :missionTreeName="selectedMissionTreeName" />
    </span>
</template>

<style scoped>

</style>