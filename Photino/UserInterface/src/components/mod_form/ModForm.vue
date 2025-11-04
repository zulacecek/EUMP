<script setup lang="ts">
import { ref } from 'vue';
import FilePicker from '../basic_controls/file_picker/FilePicker.vue';
import Textbox from '../basic_controls/Textbox.vue';
import type { ModFormInputModel } from './modFormInputModel';
import { stringIsEmptyOrUndentified } from '@/scripts/utils';

defineExpose({ validate });
const validationFailed = ref(false);

var props = defineProps<{ 
    modelValue: ModFormInputModel,
    disableModName?: boolean,
    disableProjectName?: boolean,
    disableWorkingFolder?: boolean,
}>();

var formData = ref(props.modelValue);

function validate() : boolean {
    var values = props.modelValue;
    var result = !stringIsEmptyOrUndentified(values.gameFolder) && 
        !stringIsEmptyOrUndentified(values.modFolder) && 
        !stringIsEmptyOrUndentified(values.modName) && 
        !stringIsEmptyOrUndentified(values.modVersion) && stringIsEmptyOrUndentified(values.projectName) && 
        !stringIsEmptyOrUndentified(values.supportedVersion) && 
        !stringIsEmptyOrUndentified(values.workingFolder);

    if(!result) {
        validationFailed.value = true;
    }
    
    return result;
}

</script>

<template>
    <div class="mod-form">
        <div v-if="validationFailed" class="text-red ">
            All values must be filled in!
        </div>
        <Textbox label="Mod name" :disabled="disableModName" v-model="formData.modName" />
        <Textbox label="Project name" :disabled="disableProjectName" v-model="formData.projectName" />
        <FilePicker :label="'Mod working folder'" :disabled="disableWorkingFolder" v-model="formData.workingFolder" :selectFolder="true" :displaySelectedPath="true" />
        <FilePicker :label="'EU4 mod directory'" v-model="formData.modFolder" :selectFolder="true" :displaySelectedPath="true" />
        <FilePicker :label="'EU4 game directory'" v-model="formData.gameFolder" :selectFolder="true" :displaySelectedPath="true" />
        <Textbox label="Mod version" v-model="formData.modVersion" />
        <Textbox label="Supported game version" v-model="formData.supportedVersion" />
    </div>
</template>

<style scoped>

</style>