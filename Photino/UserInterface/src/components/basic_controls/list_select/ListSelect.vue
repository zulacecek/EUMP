<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ListSelectOption } from './ListSelectExtender';

var props = defineProps<{ options: ListSelectOption[], preselectedValueKey?: string }>();
var emit = defineEmits(['valueSelected']);
defineExpose({
    clearValue
});

var selectedValue = ref();

watch(() => props.preselectedValueKey, (newValue) => {
    selectedValue.value = props.options.firstOrDefault(x=> x.id == newValue);
}, { immediate: true });

function optionClicked(option: ListSelectOption) {
    selectedValue.value = option;
    emit('valueSelected', option);
}

function clearValue() {
    selectedValue.value = undefined;
}

</script>
<template>
    <div class="select-list-container flex-container-vertical" >
        <div v-for="option in options" @click="optionClicked(option)" class="select-list-option flex-container" :class="{ 'select-list-option-selected': selectedValue?.id == option.id }">
            <div class="select-list-option-label">
                {{ option.label }}
            </div>
        </div>
    </div>
</template>
<style scoped>

.select-list-container {
    gap: 5px;
}

.select-list-option {
    height: 3rem;
    background-color: var(--color-background-mute);
    align-items: center;
    text-align: center;
}

.select-list-option:hover {
    background-color: gray;
}

.select-list-option-selected {
    background-color: gray!important;
}

.select-list-option-label {
    width: 100%;
    user-select: none;
}

</style>