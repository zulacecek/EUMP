<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Textbox from '../basic_controls/Textbox.vue';
import { useMissionTreeListStore } from '@/stores/missionStore';
import { handleObjectOpenedById } from '../object_editor_controls/objectEditorStructureTreeExtender';
import { ChangedObjectActionType, ObjectType } from '@/structs/genericStructs';
import { type MissionTree } from '@/structs/missionStructs';
import Checkbox from '../basic_controls/Checkbox.vue';
import FilteredDropdown from '../basic_controls/filtered_dropdown/FilteredDropdown.vue';
import { getExistingLocalisationNames } from '../../scripts/repositories/localisationRepository';
import type { FilteredDropdownOption } from '../basic_controls/filtered_dropdown/filteredDropdownExtender';
import { addObjectChange } from '@/scripts/repositories/changedObjectRepository';
import MultiSelector from '../basic_controls/multi_selector/MultiSelector.vue'
import type { MultiSelectorValue } from '../basic_controls/multi_selector/multiSelectorExtender';
import { recalculateTagsInPotential } from '@/scripts/repositories/missionTreeRepository';
import { useSynchStore } from '@/stores/synchronizationStore';

const props = defineProps({ missionTreeName: String });

const missionTreeData = ref<MissionTree>();
const missionTreeNotExist = ref(false);
const dropdownOptions = ref();

const tagsValue = computed(() => {
    if(!missionTreeData.value?.tags){
        return;
    }

    return missionTreeData.value.tags.map(x => <MultiSelectorValue>({ key: x, label: x }));
});

async function openMissionTree(missionTreeName: string | undefined) {
    if(!missionTreeName){
        return;
    }

    var missionStore = useMissionTreeListStore();
    var selectedMissionTree = missionStore.getMissionTree(missionTreeName);
    if(!selectedMissionTree) {
        await handleObjectOpenedById(missionTreeName, ObjectType.MissionTree);
        selectedMissionTree = missionStore.getMissionTree(missionTreeName);
        if(!selectedMissionTree) {
            missionTreeNotExist.value = true;
            return;
        }
    }

    missionTreeData.value = selectedMissionTree;
}

async function getLocalisationDropdownViewModel() {
    var localisations = await getExistingLocalisationNames();
    dropdownOptions.value = localisations.map(x => <FilteredDropdownOption>({ key: x, label: x, category: '' }));
}

function changeLocalisationId(value: string) {
    if(!missionTreeData.value) {
        return;
    }

    missionTreeData.value.localisationFileId = value;
    addMissionTreeChange();
}

function tagAdded(value: string) {
    if(!missionTreeData.value) {
        return;
    }

    if(!missionTreeData.value.tags) {
        missionTreeData.value.tags = new Array();
    }

    missionTreeData.value.tags.push(value);
    addMissionTreeChange();
}

function tagRemoved(value: string) {
    if(!missionTreeData.value?.tags) {
        return;
    }

    missionTreeData.value.tags = missionTreeData.value.tags.filter(x => x !== value);
    addMissionTreeChange();
}

function calculateTagsPotential() {
    if(!missionTreeData.value) {
        return;
    }

    recalculateTagsInPotential(missionTreeData.value);
    addMissionTreeChange();
}

function addMissionTreeChange() {
    if(!missionTreeData.value) {
        return;
    }

    addObjectChange(ChangedObjectActionType.Update, ObjectType.MissionTree, missionTreeData.value.name, missionTreeData.value.name);
    var synchronizationStore = useSynchStore();
    synchronizationStore.setEditorValueNotSynchronizedFromDesigner(ObjectType.MissionTree, missionTreeData.value.name);
}

watch(() => props.missionTreeName, async (newMissionTreeName) => {
   await openMissionTree(newMissionTreeName);
   await getLocalisationDropdownViewModel();
},
    { immediate: true}
);

</script>

<template>
    <div v-if="missionTreeNotExist || !missionTreeData">
        This mission tree doesn't seem to exist :(
    </div>
    <div v-else class="flex-container-vertical mission-tree-properties-container">
        <Textbox v-model="missionTreeData.name" :label="'Mission tree name'" @update:modelValue="addMissionTreeChange" />
        <Checkbox v-model="missionTreeData.generateReplacementFile" :label="'Generate replacement file'" @update:modelValue="addMissionTreeChange" />
        <FilteredDropdown
            :availableOptions="dropdownOptions ?? new Array()" 
            :selectedOptionKey="missionTreeData?.localisationFileId"
            :displayWithoutCategories="true"
            :dropdownOptionMaxHeight="250"
            :label="'Localisation file'"
            @value-changed="changeLocalisationId"
        />
        <MultiSelector style="margin-bottom: 5px;" :label="'Tags'" :values="tagsValue" @value-added="tagAdded" @value-removed="tagRemoved" />
        <button @click="calculateTagsPotential"> Generate mission tree tags potential </button>
    </div>
</template>

<style scoped>

.mission-tree-properties-container {
    width: 25%;
    padding: 1rem;
}

</style>