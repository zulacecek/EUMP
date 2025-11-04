<script setup lang="ts">
import { ref } from 'vue';
import Textbox from '../Textbox.vue';

var props = defineProps({ 
    modelValue: String,
    label: String,
    disabled: Boolean,
    placeholder: String
});

var emit = defineEmits(['update:modelValue']);

const input = ref(props.modelValue);

function emitModelUpdate() {
    emit('update:modelValue', input.value);
}

function clearInput() {
    input.value = '';
    emitModelUpdate();
}

</script>

<template>
    <div class="text-box-container flex-container">
        <Textbox v-model="input" :label="label" :disabled="disabled" :placeholder="placeholder" @update:model-value="emitModelUpdate" />
        <button class="button" :disabled="disabled" @click="clearInput"> Clear </button>
    </div>
</template>

<style scoped>

.text-box-container {
    width: 100%;
    align-items: center;
}

</style>