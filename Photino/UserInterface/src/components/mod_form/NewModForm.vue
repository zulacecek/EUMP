<script setup lang="ts">
import ModForm from './ModForm.vue';
import type { ModFormInputModel } from './modFormInputModel';
import { ref } from 'vue';

var emit = defineEmits(['backButtonClick', 'nextButtonClick']);
var props = defineProps<{ modelValue: ModFormInputModel }>();

const newModFormData = ref(props.modelValue);
const modFormRef = ref();

function buttonClick(eventName: 'backButtonClick' | 'nextButtonClick') {
    if(eventName === 'backButtonClick' || modFormRef.value.validate()) {
        emit(eventName);
    }
}

</script>


<template>
    <h2> New Mod </h2>
    <ModForm ref="modFormRef" v-model="newModFormData" />
    <div class="flex-container new-mod-form-actions">
        <button class="button" @click="buttonClick('backButtonClick')"> {{ 'Back' }}</button>
        <button class="button" @click="buttonClick('nextButtonClick')"> {{ 'Next' }}</button>
    </div>
</template>

<style scoped>

.new-mod-form-actions {
    justify-content: space-between;
}

</style>