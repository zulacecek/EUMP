<script setup lang="ts">

// Imports for Vue/naive components
import missionNode from './MissionNode.vue';

// Imports for .ts structs
import type { MissionNode, MissionNodeViewModel, MissionSlotViewModel, SelectedMission } from '../../structs/missionStructs'
import { onBeforeUpdate, ref } from 'vue';

// Vue defines
const props = defineProps<{ viewModel: MissionSlotViewModel }>()
const emit = defineEmits(['selectedMissionChanged', 'missionAdded', 'missionPositionChanged', 'missionSlotChanged', 'missionCloned', 'missionRemoved', 'missionInserted']);

// Typescript functions
function getMissionNodeToRender(missions: MissionNode[], index: number): MissionNode | null {
    if(missions.filter(x => x.position === index).length > 0)
    {
        return missions.filter(x => x.position === index)[0];
    }
    else
    {
        return null;
    }
}

function emitMissionSelectionChange(changeArguments: SelectedMission){
    emit('selectedMissionChanged', changeArguments);
}

function emitMissionAdded(addArguments: any) {
    emit('missionAdded', { slotNumber: props.viewModel.mission_slot.number, index: addArguments.index });
}

function emitMissionPositionChange(change: number) {
    emit('missionPositionChanged', change);
}

function emitMissionSlotChange(change: number) {
    emit('missionSlotChanged', change);
}

function emitMissionCloned(missioNode: MissionNode) {
  emit('missionCloned', missioNode);
}

function emitMissionRemoved(missioNode: MissionNode) {
  emit('missionRemoved', missioNode);
}

function emitMissionInserted(missioNode: MissionNode, position: number) {
  emit('missionInserted', missioNode, position);
}

function calculateId(slotNumber: number, position: number): string {
    return `slot${slotNumber}position${position}`;
}

function calculateMaxPositionNumber(missions: MissionNode[]) : number {
    if(missions === undefined || missions === null || missions?.length == 0) {
        return 0;
    }

    return missions.reduce(function(prev, current) { return (prev && prev.position > current.position) ? prev : current }).position;
}

function getMissionNodeViewModel(index: number, withNullNode: boolean) : MissionNodeViewModel {
    var missionNodeViewModel = <MissionNodeViewModel>({
        mission_node: withNullNode ? null : getMissionNodeToRender(props.viewModel.mission_slot.missions, index),
        index: index,
        slot: props.viewModel.mission_slot.number,
        settings: props.viewModel.settings,
        mission_tree: props.viewModel.mission_tree,
    });
    return missionNodeViewModel;
}

const missionNodes = ref<Array<any>>(new Array())
const setRefs = (el: any) => {
  if (el) {
    missionNodes.value.push(el);
  }
}

defineExpose({
  getListElements: () => {
    return missionNodes.value.map(x => x.getElement());
  }
});

onBeforeUpdate(() => {
  missionNodes.value = new Array();
});;

</script>

<template>
    <span v-for="index in calculateMaxPositionNumber(props.viewModel.mission_slot.missions)">
        <span :id="calculateId(viewModel.mission_slot.number, index)">
            <missionNode :ref="setRefs" :view-model="getMissionNodeViewModel(index, false)" 
            @selected-mission-changed="emitMissionSelectionChange" 
            @mission-added="emitMissionAdded" 
            @mission-slot-changed="emitMissionSlotChange" 
            @mission-position-changed="emitMissionPositionChange"
            @mission-cloned="emitMissionCloned"
            @mission-inserted="emitMissionInserted"
            @mission-removed="emitMissionRemoved"
            />
        </span>
    </span>
    <span v-for="i in props.viewModel.mission_tree?.settings?.emptyMissions ?? 6">
        <missionNode :view-model="getMissionNodeViewModel(calculateMaxPositionNumber(props.viewModel.mission_slot.missions)+i, true)" @mission-added="emitMissionAdded" />
    </span>
</template>

<style scoped>
</style>
