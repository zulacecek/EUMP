<script setup lang="ts">
import { ref, watch } from 'vue';
import MonacoEditor from '@/components/basic_controls/monaco/MonacoEditor.vue';
import { requestFile } from '@/scripts/layerCommunication/fileCommunication';
import { addObjectChange } from '@/scripts/repositories/changedObjectRepository';
import { ChangedObjectActionType, ObjectType } from '@/structs/genericStructs';
import { useTextFileStore } from '@/stores/textFileStore';

var props = defineProps({ selectedObjectId: String });
var editorValue = ref();
var wasJustGenerated = false;

async function generateEditorCode() {
    editorValue.value = await requestFile(props.selectedObjectId as string);
    wasJustGenerated = true;
}

function editorValueChanged(editedValue: string) {
    if(!props.selectedObjectId) {
        return;
    }

    if(!wasJustGenerated) {
        addObjectChange(ChangedObjectActionType.Update, ObjectType.TextFile, props.selectedObjectId as string, props.selectedObjectId as string);
    }

    var textFileStore = useTextFileStore();
    textFileStore.storeTextFileValue(props.selectedObjectId, editedValue);

    wasJustGenerated = false;
}

watch(() => props.selectedObjectId, () => {
    generateEditorCode();
}, { immediate: true })

</script>

<template>
    <MonacoEditor :value="editorValue" @value-changed="editorValueChanged" />
</template>

<style scoped>

</style>