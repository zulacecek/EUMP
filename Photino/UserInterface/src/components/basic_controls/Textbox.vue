<script setup lang="ts">

defineProps({ 
    modelValue: String,
    label: String,
    disabled: Boolean,
    placeholder: String
});

 defineEmits(['update:modelValue']);

</script>

<template>
    <div class="text-box-container">
        <label> {{ label }} </label>
        <input type="text" :value="modelValue" :placeholder="placeholder" @input="$emit('update:modelValue', ($event?.target as HTMLInputElement)?.value)" class="textbox" :disabled="disabled" />
    </div>
</template>

<style scoped>

.text-box-container {
    width: 100%;
}

</style>