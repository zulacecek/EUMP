<script setup lang="ts">

// Imports for .ts structs
import { computed, ref, type StyleValue } from 'vue';
import type { MissionNode, MissionNodeViewModel, MissionSlot, MissionTree, SelectedMission } from '../../structs/missionStructs';
import { getObjectLocalisationMap } from '../../scripts/repositories/localisationRepository';
import { getMessageForMissionEffect, getMessageForMissionTrigger } from '../../scripts/uiControllers/test';
import { mapImagePath } from '@/scripts/file_system/fileSystemService';
import { getGoldenText } from '@/scripts/uiControllers/htmlController';
import type { ContextMenuItem } from '@/scripts/uiControllers/contextMenuDirective';

const props = defineProps<{ viewModel: MissionNodeViewModel }>()

const emit = defineEmits(['selectedMissionChanged', 'missionAdded', 'missionPositionChanged', 'missionSlotChanged', 'missionCloned', 'missionRemoved', 'missionInserted']);

function emitMissionSelected(event: Event) {
  emit('selectedMissionChanged', <SelectedMission>({ selectedMissionElement: event.target as HTMLElement, selected_mission_node: props.viewModel.mission_node }))
}

function emitMissionAdded() {
  emit('missionAdded', { index: props.viewModel.index } )
}

function emitPositionChanged(change: number) {
  if(props?.viewModel?.mission_node === null || props?.viewModel?.mission_node === undefined) {
    return;
  }

  var position = props.viewModel.mission_node.position + change;
  emit('missionPositionChanged', { position, slot: originalSlot.value.number });
}

function emitSlotChanged(change: number) {
  var slot = originalSlot.value.number + change;
  emit('missionSlotChanged', { position: props.viewModel?.mission_node?.position, slot });
}

function emitMissionCloned() {
  emit('missionCloned', props.viewModel.mission_node);
}

function emitMissionRemoved() {
  emit('missionRemoved', props.viewModel.mission_node );
}

function emitMissionInserted(change: number) {
  emit('missionInserted', props.viewModel.mission_node, change);
}

function displayEmptyMission(missionNode : MissionNode | null) : boolean {
  return missionNode === null || missionNode === undefined;
}

var renderedIcon = computed(() => props.viewModel?.mission_node?.icon);
function getIconStyle(iconName: string | undefined) : StyleValue {
  if(!iconName) {
    return '';
  }

  var imagePath = mapImagePath(`vanilla_mission_icons/${iconName}.png`);

  return `background-image: url('${imagePath}');`;
}

function getNameStyle(color: string) : StyleValue {
  if(!color){
    return "";
  }

  return `color: ${color}`;
}

function getNormalizedMissionId() {
  return props.viewModel?.mission_node?.id ?? '';
}

function getMissionNameText() : string {
  var missionTree = props.viewModel.mission_tree;
  if(!missionTree){
    return getNormalizedMissionId();
  }

  var localisationMap = getObjectLocalisationMap(missionTree?.localisationFileId ?? '');
  if(!localisationMap) {
    return getNormalizedMissionId();
  }

  var missionNameLocalisationKey = `${props.viewModel?.mission_node?.id}_title`;
  var nameMapped = localisationMap.get(missionNameLocalisationKey);
  return nameMapped?.value ?? getNormalizedMissionId();
}

var descriptionTooltip = computed(() => {
  var missionName = getMissionNameText();
  if(!props.viewModel?.mission_tree?.localisationFileId){
    return '';
  }

  var localisationMap = getObjectLocalisationMap(props.viewModel.mission_tree.localisationFileId);
  if(!localisationMap) {
    return '';
  }

  var missionDescriptionLocalisationKey = `${props.viewModel?.mission_node?.id}_desc`;
  var descriptionMapped = localisationMap.get(missionDescriptionLocalisationKey);
  return  `${getGoldenText(missionName)}<br>${descriptionMapped?.value ?? ''}`;
});

function generateTriggerTooltip() {
  if(props.viewModel.mission_node) {
    return getMessageForMissionTrigger(props.viewModel.mission_node, props.viewModel.mission_tree ?? <MissionTree>({ tags: ["ROOT"] }));
  }
}

function generateEffectTooltip() {
  if(props.viewModel.mission_node) {
    return getMessageForMissionEffect(props.viewModel.mission_node);
  }
}

const contextMenuOptions = {
  getMenu: (e: any) => {
    return [
      { label: 'Remove', value: 'remove' },
      { label: 'Clone', value: 'clone' },
      { label: 'Insert one below', value: 'insertBelow' },
      { label: 'Insert one above', value: 'insertAbove' },
    ];
  },
  onSelect: (item: ContextMenuItem) => {
    switch(item.value) {
      case 'remove':
        emitMissionRemoved();
        break;
      case 'clone':
        emitMissionCloned();
        break;
      case 'insertBelow':
        emitMissionInserted(-1);
        break;
      case 'insertAbove':
        emitMissionInserted(1);
        break;
    }
  },
};

const nodeElement = ref()
defineExpose({
  getElement: () => nodeElement.value
});

var originalSlot = computed(() => {
  return props.viewModel.mission_tree?.originalMissionSlots.firstOrDefault(x=> x.name == props.viewModel.mission_node?.originalMissionSlotName) as MissionSlot;
});

</script>

<template>
  <span :ref="nodeElement">
    <div v-if="displayEmptyMission(viewModel.mission_node)" class="mission-node">
      <div class="mission-node-clickbox" :class="{ 'hidden': viewModel.settings.isPreview || viewModel.mission_tree?.name == undefined }">
        <div class="empty-mission-node-hover"></div>
        <div class="mission-node-background-plus"></div>
        <div class="mission-node-selector" :class="{ 'mission-node-selected': viewModel.mission_node?.isSelected }" @click="emitMissionAdded()" ></div>
      </div>
    </div>
    <div v-else class="mission-node" :id="viewModel.mission_node?.id">
      <div class="mission-node-clickbox" v-context-menu="contextMenuOptions">
          <div class="mission-node-background"></div>
          <div class="mission-node-icon" :style="getIconStyle(renderedIcon)"></div>
          <div class="mission-node-name" :style="getNameStyle(originalSlot.missionTextColor ?? 'white')"> {{ getMissionNameText() }} </div>
          <div class="mission-node-selector" v-tooltip="descriptionTooltip" data-disable-lock="true" :class="{ 'mission-node-selected': viewModel.mission_node?.isSelected }"  @click="(e : Event) => emitMissionSelected(e)"></div>
          <div class="mission-node-trigger" v-tooltip="generateTriggerTooltip"></div>
          <div class="mission-node-effect" v-tooltip="generateEffectTooltip"></div>
          <span v-if="viewModel.mission_node?.isSelected && !viewModel.settings?.isPreview">
            <div v-if="originalSlot?.number > 1" class="position-left-arrow left-arrow" @click="emitSlotChanged(-1)"> </div>
            <div v-if="originalSlot?.number < 5" class="position-right-arrow right-arrow" @click="emitSlotChanged(1)"> </div>
            <div v-if="viewModel?.mission_node?.position > 1" class="position-up-arrow up-arrow" @click="emitPositionChanged(-1)"> </div>
            <div class="position-down-arrow down-arrow" @click="emitPositionChanged(1)"> </div>
          </span>
      </div>
    </div>
  </span>
</template>

<style scoped>

.position-left-arrow {
  height: 2rem;
  width: 2rem;
  position: absolute;
  margin-top: 3rem;
  z-index: 15;
  background: url("@/assets/small_arrow_left.png") no-repeat;
}

.position-right-arrow {
  height: 2rem;
  width: 2rem;
  position: absolute;
  margin-top: 3rem;
  margin-left: 5rem;
  z-index: 15;
  background: url("@/assets/small_arrow_right.png") no-repeat;
}

.position-up-arrow {
  height: 2rem;
  width: 2rem;
  position: absolute;
  margin-left: 2.5rem;
  z-index: 15;
  background: url("@/assets/small_arrow_up.png") no-repeat;
}

.position-down-arrow {
  height: 2rem;
  width: 2rem;
  position: absolute;
  margin-top: 5.9em;
  margin-left: 2.5rem;
  z-index: 15;
  background: url("@/assets/small_arrow_down.png") no-repeat;
}

.hidden {
  display: none;
}

.mission-node {
  display: flex;
  flex-direction: column;
  width: 6rem;
  height: 7rem;
  color: white;
  margin-left: 2px;
  margin-right: 2px;
  margin-bottom: 1.5rem;
}

.empty-mission-node-hover {
  position: absolute;
  margin-top: 10px;
  margin-left: 5px;
  border-radius: 10px;
  width: 100%;
  height: 100%;
}

.mission-node-name {
  position: absolute;
  z-index: 5;
  user-select: none;
  text-align: center;
  height: 100%;
  font-size: 0.8rem;
  width: 100%;
  top: 4.6rem;
  overflow: hidden;
}

.mission-node-spacer-top {
  height: 80px;
}

.mission-node-selector {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10;
}

.mission-node-selector:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 15px;
}

.mission-node-selected {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
}

.mission-node-trigger {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  left: 0.2rem;
  top: 0.6rem;
  z-index: 22;
  background: url("@/assets/mission_effect.png") no-repeat;
  background-size: cover;
}

.mission-node-effect {
  position: absolute;
  width: 1.5rem;
  height: 1.5rem;
  left: 4.3rem;
  top: 0.6rem;
  z-index: 22;
  background: url("@/assets/mission_trigger.png") no-repeat;
  background-size: cover;
}

.mission-node-background {
  position: absolute;
  pointer-events: none;
  width: 100%;
  height: 100%;
  z-index: 5;
  background: url("@/assets/mission_icons_frame.png") no-repeat;
  background-size: cover;
}

.mission-node-background-plus {
  opacity: .5;
  position: absolute;
  pointer-events: none;
  width: 100%;
  height: 100%;
  z-index: 5;
  background: url("@/assets/mission_icons_frame_plus.png") no-repeat;
  background-size: cover;
}

.mission-node-icon {
  position: absolute;
  margin-top: 1rem;
  margin-left: 1rem;
  z-index: 1;
  width: 4rem;
  height: 4rem;
  pointer-events: none;
  background-size: cover;
}

.mission-node-clickbox {
  position: relative;
  width: 100%;
  height: 100%;
}

</style>
