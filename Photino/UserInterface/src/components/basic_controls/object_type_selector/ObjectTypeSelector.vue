<script setup lang="ts">
import Textbox from '../Textbox.vue';
import ListSelect from '../list_select/ListSelect.vue';
import { ref } from 'vue';
import type { ListSelectOption } from '../list_select/ListSelectExtender';
import { ObjectType } from '@/structs/genericStructs';

defineProps<{
    preselectedType?: ObjectType
}>();

var emit = defineEmits(['objectSelected']);
defineExpose({
    clearInputValues
});

function emitObjectSelected(selectedOption: ListSelectOption) {
    emit('objectSelected', selectedOption.id);
}

var searchValue = ref();
var listSelectRef = ref();

function getObjectTypes() : ListSelectOption[] {
    return [
      <ListSelectOption>({ id: ObjectType.MissionTree, label: 'Mission' }), 
      <ListSelectOption>({ id: ObjectType.Localisation, label: 'Localisation' }),
      <ListSelectOption>({ id: ObjectType.GFXFile, label: 'Gfx file' }),
    ].filter(x => !searchValue.value || x.label.toLowerCase().includes(searchValue.value))
}

function clearInputValues() {
    searchValue.value = '';
    listSelectRef.value.clearValue();
}

</script>

<template>
    <div class="flex-container-vertical object-type-list-container">
        <Textbox :label="'Search'" v-model="searchValue" />
        <div class="thin-golden-border object-type-list-select">
            <ListSelect :ref="listSelectRef" :options="getObjectTypes()" @value-selected="emitObjectSelected" :preselectedValueKey="preselectedType" />
        </div>
    </div>
</template>

<style scoped>

.object-type-list-container {
  height: 100%;
  padding: 2px;
  user-select: none;
  overflow: hidden;
}

.object-type-list-select {
  padding: 5px;
  overflow: auto;
  height: 100%;
}

</style>