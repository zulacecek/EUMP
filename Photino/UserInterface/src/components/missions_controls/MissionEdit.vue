<script setup lang="ts">

// Imports for .ts/structs
import { computed, onMounted, onUnmounted, ref, type StyleValue } from 'vue';
import { type MissionEditViewModel } from '../../structs/missionStructs';

// Imports for Vue/naive components
import Checkbox from '../basic_controls/Checkbox.vue';
import ConfirmPopup from '../basic_controls/ConfirmPopup.vue';
import ModalWindow from '../common_controls/ModalWindow.vue';
import { cachedVanillaIcons } from '../../scripts/appContext';
import { collectMissionSlotFlags, getMissionNodeOriginalMissionSlot } from '../../scripts/repositories/missionTreeRepository';
import { getLocalisation, getObjectLocalisationMap } from '../../scripts/repositories/localisationRepository';
import { ChangedObjectActionType, ObjectType, type KeyValuePair } from '../../structs/genericStructs';
import { openLink, toSnakeCaseWithoutLowerCase } from '../../scripts/utils';
import { addObjectChange } from '../../scripts/repositories/changedObjectRepository';
import { registerForEvent, unregisterFromEvent } from '@/scripts/event_system/globalEventHandler';
import { mapImagePath } from '@/scripts/file_system/fileSystemService';
import { missionIconsLoadedEventName } from '@/scripts/event_system/missionEvents';

// Defines
const props = defineProps<{ viewModel: MissionEditViewModel }>();
const emit = defineEmits(['changeMissionPosition', 'removeMission', 'missionChanged', 'missionCloned', 'update:modelValue', 'treeChanged' ]);

function change_mission_location(position: number, slot: number) {
  emit('changeMissionPosition', { position: Number(position), slot: Number(slot) });
}

function missionChanged() {
  emit('missionChanged');
}

function change_mission_position(position: any) {
  change_mission_location(Number(position), 0);
}

function change_mission_slot(slot: any) {
  change_mission_location(props.viewModel.selected_mission.selected_mission_node.position, Number(slot));
}

function removeMission(){
  emit('removeMission', props.viewModel.selected_mission.selected_mission_node);
}

function missionCloned() {
  var missionToClone = props.viewModel.selected_mission.selected_mission_node;
  emit('missionCloned', missionToClone);
}

function treeChanged() {
  emit('treeChanged');
}

var availableIconsData = ref<IconModalIcon[]>(new Array());
var availableIconsComputed = computed(() => availableIconsData.value);
var openButtonDisabled = computed(() => false);

var originalMissionSlot = computed(() => {
  return getMissionNodeOriginalMissionSlot(props.viewModel.selected_mission.selected_mission_node, props.viewModel.selected_tree);
});

function signalIconsLoaded(forceLoad: boolean) {
  if((forceLoad || !availableIconsData.value || availableIconsData.value.length == 0)) {
    if(cachedVanillaIcons && cachedVanillaIcons.length > 0){
      availableIconsData.value = cachedVanillaIcons.map(x=> <IconModalIcon>{ name: x, displayIcon: true });
    }
  }
}

function joinRequiredMissions(requiredMissions: string[]) : string {
  var missionNames = requiredMissions?.map(x => getMissionNameText(x));
  return missionNames?.join(",");
}

var pickedIcon = ref('');
var oldIcon = ref('');
function pickIconConfirmed() {
  props.viewModel.selected_mission.selected_mission_node.icon = pickedIcon.value;
  missionChanged();
}

function pickIconCanceled() {
  pickedIcon.value = oldIcon.value;
}

function getIconStyle(iconName: string) : StyleValue {
  if(!iconName) {
    return '';
  }

  var imagePath = mapImagePath(`vanilla_mission_icons/${iconName}.png`);
  
  return `background-image: url('${imagePath}');`;
}

function pickIcon(name: string) {
  oldIcon.value = props.viewModel.selected_mission.selected_mission_node.icon;
  pickedIcon.value = name;
}

function filterIcons() {
  var filteringValue = filterInput.value.toLowerCase();
  if(filterInput.value.length < 3){
    filteringValue = '';
  }
  
  availableIconsData.value.forEach(x => {
    x.displayIcon = x.name.toLowerCase().includes(filteringValue);
  });
}

var filterInput = ref('');
function clearFilter() {
  filterInput.value = '';
  filterIcons();
}

function slotPotentialChanged() {
  var potentialEntries = originalMissionSlot.value?.builtPotential?.missionSlotPotentialEntries;
  if(potentialEntries && potentialEntries.length){
    var flags = collectMissionSlotFlags(potentialEntries, "");
    
    var treeSettings = props.viewModel?.selected_tree?.settings;
    if(treeSettings){
      for(var flag of flags) {
        var flagValue = flag.flagValue;
        if(!flagValue){
          continue;
        }

        if(treeSettings.possibleCountryFlags.includes(flagValue)){
          continue;
        }

        treeSettings.possibleCountryFlags.push(flagValue);
        treeSettings.countryFlags.push(flagValue);
      }
    }
  }
}

function missionNameTextChanged(event : any) {
  if(!props.viewModel.selected_tree.localisationFileId){
    return;
  }

  var localisationMap = getObjectLocalisationMap(props.viewModel.selected_tree.localisationFileId);
  if(!localisationMap) {
    return;
  }

  var inputValue = event.target.value;
  var missionNameLocalisationKey = `${props.viewModel.selected_mission.selected_mission_node.id}_title`;
  var nameMapped = localisationMap.get(missionNameLocalisationKey);
  
  if(nameMapped) {
    nameMapped.value = inputValue;
  }
  else {
    var localisationFile = getLocalisation(props.viewModel.selected_tree.localisationFileId);
    if(localisationFile) { 
      var newKeyValue = <KeyValuePair<string, string>>({ key: missionNameLocalisationKey, value: inputValue });
      localisationFile?.localisationMap.push(newKeyValue);
    }
  }

  addObjectChange(ChangedObjectActionType.Update, ObjectType.Localisation, props.viewModel.selected_tree.localisationFileId, props.viewModel.selected_tree.localisationFileId);
  missionChanged();
}

function missionDescriptionTextChanged(event : any) {
  if(!props.viewModel.selected_tree.localisationFileId){
    return;
  }

  var localisationMap = getObjectLocalisationMap(props.viewModel.selected_tree.localisationFileId);
  if(!localisationMap) {
    return;
  }

  var inputValue = event.target.value;
  var missionDescriptionLocalisationKey = `${props.viewModel.selected_mission.selected_mission_node.id}_desc`;
  var descriptionMapped = localisationMap.get(missionDescriptionLocalisationKey);
  if(descriptionMapped) {
    descriptionMapped.value = inputValue;
  }
  else {
    var localisationFile = getLocalisation(props.viewModel.selected_tree.localisationFileId);
    if(localisationFile) { 
      var newKeyValue = <KeyValuePair<string, string>>({ key: missionDescriptionLocalisationKey, value: inputValue });
      localisationFile?.localisationMap.push(newKeyValue);
    }
  }

  addObjectChange(ChangedObjectActionType.Update, ObjectType.Localisation, props.viewModel.selected_tree.localisationFileId, props.viewModel.selected_tree.localisationFileId);
  missionChanged();
}

function getMissionNameText(missionId: string) : string {
  if(!props?.viewModel?.selected_tree?.localisationFileId){
    return missionId;
  }

  var localisationMap = getObjectLocalisationMap(props.viewModel.selected_tree.localisationFileId);
  if(!localisationMap) {
    return missionId;
  }

  var missionNameLocalisationKey = `${missionId}_title`;
  var nameMapped = localisationMap.get(missionNameLocalisationKey);
  return nameMapped?.value ?? missionId;
}

function getMissionDescriptionText() : string {
  if(!props.viewModel?.selected_tree?.localisationFileId){
    return '';
  }

  var localisationMap = getObjectLocalisationMap(props.viewModel.selected_tree.localisationFileId);
  if(!localisationMap) {
    return '';
  }

  var missionDescriptionLocalisationKey = `${props.viewModel.selected_mission.selected_mission_node.id}_desc`;
  var descriptionMapped = localisationMap.get(missionDescriptionLocalisationKey);
  return descriptionMapped?.value ?? '';
}

function handleMissionIdChange(event: any) {
  var inputValue = toSnakeCaseWithoutLowerCase(event.target.value);
  var oldValue = props.viewModel.selected_mission.selected_mission_node.id;

  var localisationMap = getObjectLocalisationMap(props.viewModel.selected_tree.localisationFileId);
  if(!localisationMap) {
    return '';
  }

  var missionNameLocalisationKey = `${oldValue}_title`;
  var nameMapped = localisationMap.get(missionNameLocalisationKey);
  if(nameMapped) {
    nameMapped.key = `${inputValue}_title`;
  }

  var missionDescriptionLocalisationKey = `${oldValue}_desc`;
  var descriptionMapped = localisationMap.get(missionDescriptionLocalisationKey);
  if(descriptionMapped) {
    descriptionMapped.key = `${inputValue}_desc`;
  }

  props.viewModel.selected_mission.selected_mission_node.id = inputValue;
  missionChanged();
}

async function toggleActiveFlag(flag: string, checkboxValue: boolean) {
  var missionTree = props.viewModel.selected_tree;
  if(checkboxValue){
    if(!missionTree.settings.countryFlags.includes(flag)) {
      missionTree.settings.countryFlags.push(flag);
    }
  }
  else {
    var indexOfFlag = missionTree.settings.countryFlags.indexOf(flag);
    if(indexOfFlag > - 1){
      missionTree.settings.countryFlags.splice(indexOfFlag, 1);
    }
  }

  treeChanged();
}

function isFlagChecked(flag: string) : boolean {
  return props.viewModel.selected_tree.settings.countryFlags.includes(flag);
}

type IconModalIcon = {
  name: string,
  displayIcon: boolean
}

onUnmounted(() => {
  unregisterFromEvent(missionIconsLoadedEventName, "MissionIconsModal", signalIconsLoaded);
});

onMounted(() => {
  registerForEvent(missionIconsLoadedEventName, "MissionIconsModal", signalIconsLoaded);
  signalIconsLoaded(false);
});

</script>

<template>

<div class="mission-editor-container flex-container">
  <div class="edit-field-group flex-container-vertical" style="flex: 1;" >
    <div class="flex-container-vertical mission-edit-block" v-if="props.viewModel.selected_tree.settings">
      <h3> Controls </h3>
      <Checkbox :label="'Preview mode'" v-model="props.viewModel.selected_tree.settings.isPreview" />      
    </div>
    <div class="flex-container-vertical mission-edit-block" v-if="props.viewModel.selected_tree.settings">
      <h3> Branching missions </h3>
      <Checkbox :label="'Is revolutionary target'" v-model="props.viewModel.selected_tree.settings.isRevolutionaryTarget" @value-changed="treeChanged" />
      <Checkbox :label="value" :modelValue="isFlagChecked(value)" v-for="value in props.viewModel.selected_tree.settings.possibleCountryFlags" @value-changed="(newValue : boolean) => toggleActiveFlag(value, newValue)" />
    </div>
    <div v-if="originalMissionSlot">
      <h3> Edit Slot </h3>
      <div>
        <div class="checkbox-label-group flex-container" justify="space-between">
          <Checkbox v-model="originalMissionSlot.ai" :label="'Is AI'" @change="missionChanged"></Checkbox>
        </div>
      </div>
      <div>
        <div class="checkbox-label-group flex-container" justify="space-between">
          <Checkbox v-model="originalMissionSlot.generic" :label="'Is Generic'" @change="missionChanged"></Checkbox>
        </div>
      </div>
      <div>
        <div class="checkbox-label-group flex-container" justify="space-between">
          <Checkbox v-model="originalMissionSlot.hasCountryShield" :label="'Has country shield'" @change="missionChanged"></Checkbox>
        </div>
      </div>
      <div class="hidden">
        <label> Potential </label>
        <!-- <span style="color: green;" v-if="hasValue(originalMissionSlot?.builtPotential?.missionSlotPotentialEntries)">(has value)</span> -->
        <ModalWindow :width-percentage="50" :height-percentage="92" :hideCancelButton="true" :keepRendered="false">
          <template v-slot:modalContent>
            <!-- <SlotPotentialBuilder :viewModel="originalMissionSlot.builtPotential" :missionTree="props.viewModel.selected_tree" @tree-changed="missionChanged" @propage-child-removed="functionRemoveCountryFlag" @blur="slotPotentialChanged" ></SlotPotentialBuilder> -->
          </template>
          <template v-slot:openButton>
            Builder
          </template>
        </ModalWindow>
      </div>
      <div>
        <label> Slot name </label>          
        <textarea class="textbox" rows="5"  v-model="originalMissionSlot.name" @change="missionChanged" />
      </div>
      <div>
        <label> Color </label>
        <input style="width: 93%;" type="color" v-model="originalMissionSlot.missionTextColor" @change="missionChanged">
      </div>
    </div>
  </div>
  <div class="flex-container-vertical" style="flex: 1;" v-if="viewModel.selected_mission.selected_mission_node.id">
    <h3> Edit Mission </h3>
    <div class="edit-field-group">
      <label> Mission id </label>
      <input type="text" class="textbox" :value="viewModel.selected_mission.selected_mission_node.id" @change="(event) => { handleMissionIdChange(event) }" />
    </div>
    <div class="edit-field-group">
      <label> Mission name </label>
      <input type="text" class="textbox" :value="getMissionNameText(props.viewModel.selected_mission.selected_mission_node.id)" @input="(e) => { missionNameTextChanged(e) }" />
    </div>
    <div class="edit-field-group" style="flex: 100%!important;">
      <label> Mission description </label>
      <textarea class="textbox" rows="5" :value="getMissionDescriptionText()" @input="missionDescriptionTextChanged" @change="missionChanged" />
    </div>
    <div class="edit-field-group">
      <label> Required missions </label>
      <textarea class="textbox" rows="5" :value="joinRequiredMissions(props.viewModel.selected_mission.selected_mission_node.requiredMissionIds)" @update="viewModel.selected_mission.selected_mission_node.requiredMissionIds" disabled />
      <div class="error-text" v-if="viewModel.mission_connection_message != '' && viewModel.mission_connection_message != undefined"> {{ viewModel.mission_connection_message }}</div>
    </div>
    <div class="edit-field-group-25 flex-container" style="max-height: 3rem;">
      <ModalWindow :onCancel="pickIconCanceled" :onConfirm="pickIconConfirmed" :width-percentage="50" :height-percentage="90" :closeCondition="openButtonDisabled" >
        <template v-slot:modalContent>
          <div class="flex-container-vertical" style="overflow: hidden; height: 100%;">
            <div style="width: 100%; margin-bottom: 1rem; border-bottom: 2px rgba(158, 130, 38) ridge;">
              <h2> Pick icon </h2>
              <div style="position: relative; height: 130px; width: 100px; margin-left: auto; margin-right: auto;">
                <div class="mission-node-background"></div>
                <div class="mission-node-name"> {{ viewModel.selected_mission.selected_mission_node.name }} </div> 
                <div class="mission-node-preview-icon" :style="getIconStyle(pickedIcon)"></div>
              </div>
              <div> {{ pickedIcon }} </div>
              <div style="margin-bottom: 10px;"> 
                <input style="width: 50%; margin-right: 5px;" type="text" class="textbox" v-model="filterInput" v-on:input="filterIcons" /> 
                <button class="button" @click="clearFilter"> Clear </button> 
              </div>
            </div>
            <div class="flex-container icons-container" style="height: 100%; overflow-y: auto;">
              <div v-for="icon in availableIconsComputed.filter(x => x.displayIcon)" class="mission-node-icon" :style="getIconStyle(icon.name)" @click="pickIcon(icon.name)"></div>
            </div>
          </div>
        </template>
        <template v-slot:openButton>
          <div clas="flex-container">
            <button class="button" @click="pickedIcon = viewModel.selected_mission.selected_mission_node.icon" :disabled="openButtonDisabled"> Pick icon </button>
            <!-- <SmallLoader :display="openButtonDisabled"></SmallLoader> -->
          </div>
        </template>
      </ModalWindow>
      <input type="text" class="textbox" :value="viewModel?.selected_mission?.selected_mission_node?.icon" disabled />
    </div>
    <div class="edit-field-group-25 hidden">
      <label> Provinces to highlight </label>
      <!-- <span style="color: green;" v-if="hasValue(props.viewModel?.selected_mission?.selected_mission_node?.missionProvincesToHighlight?.missionProvincesToHighlightEntries)">(has value)</span> -->
      <ModalWindow :width-percentage="50" :height-percentage="92" :hideCancelButton="true" :keepRendered="false">
        <template v-slot:modalContent>
          <!-- <ProvincesToHighlightBuilder :viewModel="props.viewModel.selected_mission.selected_mission_node.missionProvincesToHighlight" @tree-changed="missionChanged" :missionTree="props.viewModel.selected_tree"></ProvincesToHighlightBuilder> -->
        </template>
        <template v-slot:openButton>
          Builder
        </template>
      </ModalWindow>
    </div>
    <div class="edit-field-group-25 hidden">
      <label> Trigger </label> 
      <!-- <span style="color: green;" v-if="hasValue(props.viewModel?.selected_mission?.selected_mission_node?.builtTrigger?.missionTriggerEntries)">(has value)</span> -->
      <ModalWindow :width-percentage="50" :height-percentage="92" :hideCancelButton="true" :keepRendered="false">
        <template v-slot:modalContent>
          <!-- <TriggerBuilder :viewModel="props.viewModel.selected_mission.selected_mission_node.builtTrigger" @tree-changed="missionChanged" :missionTree="props.viewModel.selected_tree"></TriggerBuilder> -->
        </template>
        <template v-slot:openButton>
          Builder
        </template>
      </ModalWindow>
      <button class="smallest-button" @click="openLink('https://eu4.paradoxwikis.com/Triggers')"> Wiki </button>
    </div>
    <div class="edit-field-group-25 hidden">
      <label> Effect </label>
      <!-- <span style="color: green;" v-if="hasValue(props.viewModel?.selected_mission?.selected_mission_node?.builtEffect?.missionEffectEntries)">(has value)</span> -->
      <ModalWindow :width-percentage="50" :height-percentage="92" :hideCancelButton="true" :keepRendered="false">
        <template v-slot:modalContent>
          <!-- <EffectBuilder :viewModel="props.viewModel.selected_mission.selected_mission_node.builtEffect" :missionTree="props.viewModel.selected_tree" @tree-changed="missionChanged"></EffectBuilder> -->
        </template>
        <template v-slot:openButton>
          Builder
        </template>
      </ModalWindow>
      <button class="smallest-button" @click="openLink('https://eu4.paradoxwikis.com/Effects')"> Wiki </button>
    </div>
    <div class="flex-container-vertical edit-field-group">
      <div style="flex: 0 100% 0 0"> 
        <h3> Edit position </h3>
      </div>
      <div>
        <label> Mission position </label>
        <input type="number" class="textbox" min="1" max="50" :value="viewModel.selected_mission.selected_mission_node.position" @change="(e) => { change_mission_position((e.target as any).value) }" />
      </div>
      <div>
        <label> Mission slot </label>
        <input type="number" class="textbox" min="1" max="5" :value="originalMissionSlot?.number" @change="(e) => { change_mission_slot((e.target as any).value) }" />
      </div>
      <div>
        <h3> Actions </h3>
        <div class="flex-container">
          <ConfirmPopup message="Are you sure you want to delete the mission ?" :onConfirm="removeMission" >
            <template v-slot:openButton>
              <button class="button"> Remove mission </button>
            </template>
          </ConfirmPopup>
          <button class="button" @click="missionCloned()"> Clone mission </button>
        </div>
      </div>
    </div>
  </div>

</div>

</template>

<style scoped>

.mission-edit-block {
  padding-bottom: 1rem;
}

.icons-container {
  flex-wrap: wrap;
  gap: 2px;
}

.mission-editor-container {
  flex-wrap: wrap;
}

.mission-node-name {
  position: absolute;
  z-index: 5;
  user-select: none;
  text-align: center;
  height: 42px;
  width: 88px;
  font-size: 13px;
  margin-top: 10px;
  margin-left: 8px;
  margin-right: 3px;
  margin-bottom: 5px;
  padding-top: 70px;
  overflow: hidden;
}

.mission-node-background {
  position: absolute;
  pointer-events: none;
  width: 103px;
  height: 123px;
  z-index: 5;
  background: url("./../../assets/mission_icons_frame.png") no-repeat;
}

.mission-node-icon {
  border-color: white;
  border-width: 1px;
  border-style: solid;
  width: 58px;
  height: 63px;
  background-color: gray;
}

.mission-node-preview-icon {
  position: absolute;
  margin-top: 20px;
  margin-left: 23px;
  z-index: 1;
  width: 59px;
  height: 63px;
}

.edit-field-group-25 {
  float: left;
  flex: 25%;
  padding: 0.5rem;
}

.edit-field-group {
  float: left;
  height: 100%;
  flex: 50%;
  padding: 0.5rem;
}

</style> 