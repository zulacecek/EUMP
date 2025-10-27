    <script setup lang="ts">
import { computed } from 'vue';
import type { MultiSelectorValue } from './multiSelectorExtender';
import Icon from '../Icon.vue';
import FilteredDropdown from '../filtered_dropdown/FilteredDropdown.vue';
import type { FilteredDropdownOption } from '../filtered_dropdown/filteredDropdownExtender';

const props = defineProps<{ label?: string, values?: MultiSelectorValue[], options?: FilteredDropdownOption[], allowCustomValue?: boolean }>();
const emit = defineEmits(['valueAdded', 'valueRemoved']);

const valuesData = computed(() => {
    return props?.values ?? new Array();;
});

const allowCustomValueData = computed(() => {
    return props.allowCustomValue ?? true;
})

function valueAdded(value: string) {
    emit('valueAdded', value);
}

function emitValueClosed(value: MultiSelectorValue) {
    emit('valueRemoved', value.key);
}

</script>

<template>
    <div class="flex-container-vertical">
        <FilteredDropdown
            v-if="allowCustomValueData"
            :availableOptions="options ?? new Array()" 
            :displayWithoutCategories="true"
            :dropdownOptionMaxHeight="250"
            :label="label"
            @value-changed="valueAdded" 
        />

        <div v-if="valuesData && valuesData.length > 0" class="flex-container thin-golden-border multi-selector-values">
            <div v-for="value in valuesData" class="flex-container multi-selector-value-container" v-tooltip="value.tooltip ?? ''">
                <div class="multi-selector-value-label"> {{ value.label }} </div>
                <div v-if="!value.disableClose" class="multi-selector-value-remove-button flex-container" @click='emitValueClosed(value)'>
                    <Icon :icon="'fa-solid fa-xmark'"></Icon>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

.multi-selector-values {
    flex-wrap: wrap;
}

.multi-selector-value-container {
    width: 49%;
    margin: 0.5%;
    padding: 5px;
    background-color: var(--color-background-mute);
}

.multi-selector-value-label {
  width: 100%;
  height: 1.5rem;
  position: relative;
  display: inline-block;
  overflow: hidden; 
  white-space: nowrap;
}

.multi-selector-value-remove-button {
  z-index: 15;
  align-items: center;
}

</style>