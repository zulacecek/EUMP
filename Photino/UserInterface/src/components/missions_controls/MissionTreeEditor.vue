<script setup lang="ts">
import { ref, onUnmounted, computed, watch } from 'vue'
import { addObjectChange } from '../../scripts/repositories/changedObjectRepository';
import { deepClone, toSnakeCase } from '../../scripts/utils';
import { isKeyPressed } from '../../scripts/uiControllers/keyboardController';
import { createNewMissionTree, getMissionNodeOriginalMissionSlot, instantiateMissionNode, instantiateMissionSlot, isSlotHidden, mergeSlots, prepareTagSlotPotential } from '../../scripts/repositories/missionTreeRepository';

// Imports for Vue/naive components
import missionTree from './MissionTree.vue';
import missionEdit from './MissionEdit.vue';
import Loader from '../common_controls/Loader.vue';

// Imports for .ts structs
import type { MissionEditViewModel, MissionTree, MissionNode, MissionSlot, SelectedMission, MissionTreeViewModel } from "../../structs/missionStructs";
import { useMissionTreeListStore } from '@/stores/missionStore';
import { ChangedObjectActionType, ObjectType } from '@/structs/genericStructs';
import { handleObjectOpenedById } from '../object_editor_controls/objectEditorStructureTreeExtender';
import { fireEvent } from '@/scripts/event_system/globalEventHandler';
import { objectOpenedEventName } from '@/scripts/event_system/objectEditorEvents';
import { useSynchStore } from '@/stores/synchronizationStore';
import { getValidObjectName } from '../object_editor_controls/objectEditorExtender';

var props = defineProps({ selectedMissionTreeName: String });

onUnmounted(() => {
  missionTreeData.value = emptyTree;
  missionEditViewModel.value.selected_mission.selected_mission_node.isSelected = false;
  missionEditViewModel.value.selected_mission = selectedMissionData.value = emptySelectedMission;
});

// Variables
var emptySelectedMission = instantiateEmptySelectedMission();
var selectedMission: SelectedMission = emptySelectedMission;
var instantiatedMissionsNumber = 0;

// Reactive data
var showLoaderForMissionOpening = ref(false);
var emptyTree = createNewMissionTree('', new Array(), true);
var missionTreeData = ref(emptyTree);
var selectedMissionData = ref(selectedMission);
var missionTreeComponent = ref();
var missingTreeNotExists = ref(false);

var hideMissionTreeDisable = computed(() => {
  return missionTreeData.value.name != undefined || showLoaderForMissionOpening.value;
});

var missionEditViewModel = ref(<MissionEditViewModel>(
{
  position: selectedMission.selected_mission_node.position, 
  slot: getMissionNodeOriginalMissionSlot(selectedMissionData.value.selected_mission_node, missionTreeData.value)?.number,
  selected_mission: selectedMissionData.value, 
  settings: missionTreeData.value.settings,
  selected_tree: missionTreeData.value
}));

function instantiateEmptySelectedMission() : SelectedMission {
  return <SelectedMission>({ selected_mission_node: ({ position: 1 }) });
}

function missionSelectionChanged(changeArguments: SelectedMission, ignoreKeyboard: boolean = false) {
  if(!ignoreKeyboard) {
    if(isKeyPressed('Control')) {
      if(!selectedMissionData.value.selected_mission_node.requiredMissionIds){
        selectedMissionData.value.selected_mission_node.requiredMissionIds = new Array();
      }
      
      var indexOfNewMission = selectedMissionData.value.selected_mission_node.requiredMissionIds.indexOf(changeArguments.selected_mission_node.id);
      if(indexOfNewMission === -1) {
        selectedMissionData.value.selected_mission_node.requiredMissionIds.push(changeArguments.selected_mission_node.id);
      }
      else {
        selectedMissionData.value.selected_mission_node.requiredMissionIds.splice(indexOfNewMission, 1);
      }

      missionTreeComponent.value.rerenderMissionConnections();
      logMissionTreeChange();
      return;
    }

    if(isKeyPressed('Alt')){
      var newSlot = getMissionNodeOriginalMissionSlot(changeArguments.selected_mission_node, missionEditViewModel.value.selected_tree);
      if(!newSlot){
        return;
      }

      var selectedMission = selectedMissionData.value.selected_mission_node;
      var oldSlot = getMissionNodeOriginalMissionSlot(selectedMission, missionEditViewModel.value.selected_tree);
      if(!oldSlot || !oldSlot.missions) {
        return;
      }

      var indexOfMission = oldSlot.missions.indexOf(selectedMission);
      if(indexOfMission > -1){
        oldSlot.missions.splice(indexOfMission, 1);
      }

      var openPosition = tryFindOpenNode(selectedMission.position, newSlot, selectedMission.position);
      if(selectedMission.position !== openPosition) {
        selectedMission.position = openPosition;
        missionEditViewModel.value.position = openPosition;
      }

      selectedMission.originalMissionSlotName = newSlot.name;
      newSlot.missions.push(selectedMission);

      selectMissionTree(missionTreeData.value.name);
      missionSelectionChanged(<SelectedMission>({ selectedMissionElement: {}, selected_mission_node: selectedMission }), true);
      logMissionTreeChange();
      return;
    }
  }

  selectedMissionData.value.selected_mission_node.isSelected = false;
  selectedMissionData.value = changeArguments;
  if(selectedMissionData.value != null){
    if(selectedMissionData.value.selected_mission_node != undefined) {
      selectedMissionData.value.selected_mission_node.isSelected = false;
    }
  }
  changeArguments.selected_mission_node.isSelected = true;

  missionEditViewModel.value.position = selectedMissionData.value.selected_mission_node.position;
  missionEditViewModel.value.slot = getMissionNodeOriginalMissionSlot(selectedMissionData.value.selected_mission_node, missionEditViewModel.value.selected_tree).number;
  missionEditViewModel.value.selected_mission = selectedMissionData.value;
}

function missionAdded(addArguments: any) {
  var slotNumber = addArguments.slotNumber;
  var position = addArguments.index;

  var possibleSlots = missionTreeData.value.originalMissionSlots.filter(x=> x.number == slotNumber);
  var slot = possibleSlots.filter(x=> !isSlotHidden(x, missionTreeData.value))[0];
  var renderedMissionSlot = missionTreeData.value.missionSlots.filter(x=> x.number == slotNumber)[0];

  if(isKeyPressed('Alt') || !slot || (renderedMissionSlot.missions.length == 0 && slot.missions.length > 0)) {
    var tagPotentialEntries = prepareTagSlotPotential(missionTreeData.value.tags);
    var slotName = getValidObjectName(`${missionTreeData.value.name}_${slotNumber}`, missionTreeData.value.originalMissionSlots.map(x=> x.name))
    slot = instantiateMissionSlot(slotName, slotNumber);
    if(tagPotentialEntries) {
      slot.builtPotential.missionSlotPotentialEntries.push(...tagPotentialEntries);
    }
    missionTreeData.value.originalMissionSlots.push(slot);
  }

  var name = findNewMissionAvailableName();

  var existingMission = slot.missions.filter(x => x.position == position)[0];

  if(existingMission != null && existingMission != undefined) {
    slot.missions.splice(slot.missions.indexOf(existingMission), 1);
  }

  var missionNode = instantiateMissionNode(name, position, slot);
  slot.missions.push(missionNode);

  selectedMissionData.value.selected_mission_node.isSelected = false;
  missionNode.isSelected = true;
  selectedMissionData.value = <SelectedMission> ({ selectedMissionElement: {}, selected_mission_node: missionNode });
  missionEditViewModel.value.selected_mission = selectedMissionData.value;
  missionEditViewModel.value.position = selectedMissionData.value.selected_mission_node.position;

  var missionSlot = getMissionNodeOriginalMissionSlot(selectedMissionData.value.selected_mission_node, missionEditViewModel.value.selected_tree);
  missionEditViewModel.value.slot = missionSlot.number;

  logMissionTreeChange();
  selectMissionTree(missionTreeData.value.name);
  missionSelectionChanged(<SelectedMission>({ selectedMissionElement: {}, selected_mission_node: missionNode }));
}

function findNewMissionAvailableName() {
  var name = `New mission`;
  while(instantiatedMissionsNumber < 1000) {
    name = `New mission ${instantiatedMissionsNumber}`;
    var missionId = toSnakeCase(name);
    if(missionTreeData.value.originalMissionSlots.flatMap(x => x.missions).filter(x => x.id == missionId).length > 0) {
      instantiatedMissionsNumber++;
    } 
    else {
      break;
    }
  }

  return name;
}

function missionCloned(missionToClone: MissionNode) {
  var clonedMission = deepClone(missionToClone);
  clonedMission.name = clonedMission.name + "_clone";
  clonedMission.id = toSnakeCase(clonedMission.name);

  var missionSlot = getMissionNodeOriginalMissionSlot(selectedMissionData.value.selected_mission_node, missionEditViewModel.value.selected_tree);
  missionSlot.missions.push(clonedMission);
  missionSelectionChanged(<SelectedMission>({ selectedMissionElement: {}, selected_mission_node: clonedMission }));
  missionPositionChanged({ position: clonedMission.position + 1, slot: missionSlot.number });
}

function missionInserted(originalNode: MissionNode, direction: number) {
  if(!originalNode) {
    return
  }

  var slot = getMissionNodeOriginalMissionSlot(originalNode, missionEditViewModel.value.selected_tree);
  if(!slot) {
    return;
  }

  var name = findNewMissionAvailableName();

  var newNodePosition = originalNode.position;
  // Insert below
  if(direction === -1) {
    newNodePosition += 1;
  }

  var insertedMissionNode = instantiateMissionNode(name, newNodePosition, slot);
  // Insert below
  if(direction === -1) {
    var missionsToMove = slot.missions.filter(x => x.position > originalNode.position);
    var firstMission = missionsToMove[0];
    if(firstMission) {
      firstMission.requiredMissionIds = new Array();
    }
  }
  else {
    var missionsToMove = slot.missions.filter(x => x.position >= originalNode.position);
    originalNode.requiredMissionIds = new Array();
  }

  for(var mission of missionsToMove) {
    mission.position += 1;
  }

  slot.missions.push(insertedMissionNode);

  logMissionTreeChange();
  selectMissionTree(missionTreeData.value.name);
  missionSelectionChanged(<SelectedMission>({ selectedMissionElement: {}, selected_mission_node: insertedMissionNode }));
}

function missionPositionChanged(changedMission: any) {
  if(!changedMission) {
    return;
  }

  changedMission.position = Math.max(changedMission.position, 1);

  var missionSlot = getMissionNodeOriginalMissionSlot(selectedMissionData.value.selected_mission_node, missionEditViewModel.value.selected_tree);
  if(!missionSlot){
    return;
  }

  if(changedMission.slot <= 0 || changedMission.slot > 5) {
    changedMission.slot = missionSlot.number;
  }
  
  var missionNode = selectedMissionData.value.selected_mission_node;
  if(!missionNode) {
    return;
  }

  if(missionSlot.number !== changedMission.slot) {
    var possibleSlots = missionTreeData.value.originalMissionSlots.filter(x=> x.number == changedMission.slot);
    var newSlot = possibleSlots.firstOrDefault(x=> !isSlotHidden(x, missionTreeData.value));
    if(!newSlot) {
      return;
    }

    var openPosition = tryFindOpenNode(missionNode.position, newSlot, missionNode.position);
    if(missionNode.position !== openPosition) {
      missionNode.position = openPosition;
      missionEditViewModel.value.position = openPosition;
      changedMission.position = openPosition;
    }

    missionNode.parentSlotName = newSlot.name;
    missionSlot.missions.splice(missionSlot.missions.indexOf(missionNode), 1);
    newSlot.missions.push(missionNode);
    missionEditViewModel.value.slot = newSlot.number;
  }
  
  if(missionNode.position !== changedMission.position) {
    missionNode.position = tryFindOpenNode(missionNode.position, missionSlot, changedMission.position);
    missionEditViewModel.value.position = missionNode.position;
  }

  logMissionTreeChange();
  selectMissionTree(missionTreeData.value.name);
  missionSelectionChanged(<SelectedMission>({ selectedMissionElement: {}, selected_mission_node: missionNode }));
}

async function selectMissionTree(missionTreeName: string) {
  if(!missionTreeName){
    missingTreeNotExists.value = true;
    return;
  }

  var missionStore = useMissionTreeListStore();
  var selectedMissionTree = missionStore.getMissionTree(missionTreeName);
  if(!selectedMissionTree) {
    await handleObjectOpenedById(missionTreeName, ObjectType.MissionTree);
    selectedMissionTree = missionStore.getMissionTree(missionTreeName);
    if(!selectedMissionTree) {
      missingTreeNotExists.value = true;
      return;
    }

    fireEvent(objectOpenedEventName, missionTreeName, ObjectType.MissionTree);
  }

  missingTreeNotExists.value = false;

  selectedMissionTree.missionSlots = mergeSlots(selectedMissionTree.originalMissionSlots, selectedMissionTree);
  
  missionTreeData.value = selectedMissionTree;
  if(selectedMissionData.value && selectedMissionData.value.selected_mission_node){
    selectedMissionData.value.selected_mission_node.isSelected = false;
  }

  if(missionEditViewModel.value) {
    missionEditViewModel.value.selected_tree = selectedMissionTree;
    missionEditViewModel.value.selected_mission = selectedMissionData.value = emptySelectedMission;
  }

  missionTreeComponent?.value?.rerenderMissionConnections();
  showLoaderForMissionOpening.value = false;
}

function missionRemoved(removedMission: MissionNode) {
  if(!removedMission) {
    return;
  }

  var parentSlot = getMissionNodeOriginalMissionSlot(removedMission, missionEditViewModel.value.selected_tree);
  parentSlot?.missions?.splice(parentSlot.missions.indexOf(removedMission), 1);

  missionEditViewModel.value.selected_mission = selectedMissionData.value = emptySelectedMission;
  missionEditViewModel.value.slot = 1;
  missionEditViewModel.value.position = 1;

  for(var slot of missionTreeData.value.missionSlots){
    for(var mission of slot.missions){
      if(!mission?.requiredMissionIds || !removedMission){
        continue;
      }

      var removedMissionInRequired = mission.requiredMissionIds.firstOrDefault(requiredMissionId => requiredMissionId === removedMission.id);
      if(removedMissionInRequired){
        var indexOfTheMission = mission.requiredMissionIds.indexOf(removedMissionInRequired);
        if(indexOfTheMission > -1) {
          mission.requiredMissionIds.splice(indexOfTheMission, 1);
        }
      }
    }
  }
  
  logMissionTreeChange();
  selectMissionTree(missionTreeData.value.name);
}

function tryFindOpenNode(oldPosition: number, slot: MissionSlot, newPosition: number) : number {
  if(slot.missions.filter(x => x.position == newPosition).length === 0){
      return newPosition;
  }

  var freeSlot = newPosition;
  var isPositionMovementUp = oldPosition <= newPosition;
  if(isPositionMovementUp) {
    var missionsAbove = slot.missions.filter(x => x.position >= newPosition).sort((x, y) => x.position - y.position);    
    for (let index = 0; index < calculateMaxPositionNumber(missionsAbove); index++) {
      const mission = missionsAbove.firstOrDefault(x => x.position === freeSlot);
      if(mission === null || mission === undefined){
        return index + newPosition;
      }
      
      if(mission.position != freeSlot) {
        freeSlot = mission.position;
        return freeSlot;
      }
      freeSlot++;
    }
  }
  else {
    var missionsBellow = slot.missions.filter(x => x.position <= newPosition).sort((x, y) => x.position + y.position);
    for (let index = calculateMaxPositionNumber(missionsBellow); index >= 0; index--) {
      const mission = missionsBellow.filter(x => x.position === freeSlot)[0];
      if(mission === null || mission === undefined){
        return index;
      }
      if(mission.position != freeSlot) {
        return mission.position;
      }
      
      freeSlot--;
      if(freeSlot <= 0){
        return oldPosition;
      }
    }
  }
  
  return freeSlot;
}

function calculateMaxPositionNumber(missions: MissionNode[]) : number {
    if(missions === undefined || missions === null || missions?.length == 0) {
        return 6;
    }

    return missions.reduce(function(prev, current) { return (prev && prev.position > current.position) ? prev : current }).position;
}

function getMissionTreeViewModel(missionTreeData: MissionTree) : MissionTreeViewModel {
  var missionTreeViewModel = <MissionTreeViewModel>({
    mission_tree: missionTreeData,
    settings: missionTreeData.settings
  });

  return missionTreeViewModel;
}

function logMissionTreeChange(ignoreChangeCheck: boolean = false) {
  var synchronizationStore = useSynchStore();
  addObjectChange(ChangedObjectActionType.Update, ObjectType.MissionTree, missionTreeData.value.name, missionTreeData.value.name, ignoreChangeCheck);
  synchronizationStore.setEditorValueNotSynchronizedFromDesigner(ObjectType.MissionTree, missionTreeData.value.name);
}

function treeChanged() {
  selectMissionTree(missionTreeData.value.name);
}

watch(
  () => props.selectedMissionTreeName,
  async (newSelectedMissionTreeName) => {
    selectMissionTree(newSelectedMissionTreeName ?? '');
  },
  { immediate: true }
);

</script>

<template>
  <div v-if="missingTreeNotExists">
    This mission tree doesn't seem to exist :(
  </div>
  <div v-else class="mission-tree-editor-content flex-container">
    <div class="relative">
      <div class="edit-disable" :hidden="hideMissionTreeDisable"></div>
      <Loader :display="showLoaderForMissionOpening"></Loader>
      <missionTree ref="missionTreeComponent" :view-model="getMissionTreeViewModel(missionTreeData)" 
      @selected-mission-changed="missionSelectionChanged" 
      @mission-added="missionAdded" 
      @mission-slot-changed="missionPositionChanged" 
      @mission-position-changed="missionPositionChanged"
      @mission-cloned="missionCloned"
      @mission-inserted="missionInserted"
      @mission-removed="missionRemoved"
      />
    </div>
    <div class="relative" style="width: 100%;">
      <missionEdit :view-model="missionEditViewModel" 
        @change-mission-position="missionPositionChanged" 
        @remove-mission="missionRemoved" 
        @mission-changed="logMissionTreeChange" 
        @mission-added="missionPositionChanged" 
        @mission-cloned="missionCloned" 
        @tree-changed="treeChanged"/>
    </div>
  </div>
</template>

<style scoped>

.edit-disable {
  top: 0;
  left: 0;
  z-index: 50;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  position: absolute;
}

.mission-tree-editor-content { 
  position: relative;
  height: 100%;
}

</style>
