<script setup lang="ts">
import { ref } from 'vue';
import IconButton from '../IconButton.vue';
import { openFileDialog, type openFileDialogRequest } from '@/scripts/layerCommunication/fileSystemCommunication';

var emit = defineEmits(['update:modelValue']);
defineExpose({resetValue});
var props = defineProps({
    modelValue: String,
    label: String,
    selectButtonLabel: String,
    selectFolder: Boolean,
    displaySelectedPath: Boolean,
    disabled: Boolean,
    defaultPath: String
});

var modelValueRef = ref(props.modelValue);

function getSelectButtonLabel() {
    if(!props.selectButtonLabel) {
        return props.selectFolder ? "Select folder" : "Select file";
    }

    return props.selectButtonLabel;
}

async function openDialog() {
    var selected = await openFileDialog(<openFileDialogRequest>({ selectFolder: props.selectFolder, defaultPath: props.defaultPath }));
    if(selected) {
        modelValueRef.value = selected[0];
    }
    else {
        modelValueRef.value = '';
    }

    emit('update:modelValue', modelValueRef.value);
}

function resetValue() {
    modelValueRef.value = '';
}

</script>

<template>
    <div class="file-picker">
        <div class="flex-container file-picker-label-button">
            <label style="margin-right: 1rem;"> {{ label }} </label>
            <IconButton class="button" :text="getSelectButtonLabel()" @click="openDialog" :disabled="disabled" />
        </div>
        <div v-if="displaySelectedPath">
            <input class="textbox" :value="modelValueRef" disabled />
        </div>
    </div>
</template>
<style scoped>

.file-picker-label-button,
.file-picker {
    margin-bottom: 0.5rem;
}

</style>