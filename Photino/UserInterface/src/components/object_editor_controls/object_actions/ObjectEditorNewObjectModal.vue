<script setup lang="ts">
import { ObjectType } from '@/structs/genericStructs';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ModalWindow from '@/components/common_controls/ModalWindow.vue';
import Textbox from '@/components/basic_controls/Textbox.vue';
import Icon from '@/components/basic_controls/Icon.vue';
import type { TooltipOptions } from '@/scripts/uiControllers/tooltipDirective';
import ObjectTypeSelector from '@/components/basic_controls/object_type_selector/ObjectTypeSelector.vue';
import { getGoldenText } from '@/scripts/uiControllers/htmlController';
import { openNewObjectModalEventName } from './objectActionsExtender';
import { registerForEvent, unregisterFromEvent } from '@/scripts/event_system/globalEventHandler';

var emit = defineEmits(['newObjectCreated']);
defineProps({ disabled: Boolean });

var selectedObjectType = ref();
var objectName = ref();
var searchValue = ref();
var objectTypeSelectorRef = ref();
var modalRef = ref();

const disableConfirmButtonCondition = computed(() => {
  return !selectedObjectType.value || !objectName.value;
});

function objectTypeSelected(objectType: ObjectType){
    selectedObjectType.value = objectType;
    objectName.value = `New ${objectType}`;
}

function clearValues() {
  selectedObjectType.value = undefined;

  searchValue.value =
  objectName.value = '';
}

function onModalConfirmed() {
  emit('newObjectCreated', objectName.value, selectedObjectType.value);
  clearValues();
}

function openModal(preselectedType: ObjectType) {
  objectTypeSelected(preselectedType)
  modalRef.value?.openModal();
}

onMounted(() => {
  registerForEvent(openNewObjectModalEventName, 'ObjectEditorNewObjectModal', openModal);
});

onUnmounted(() => {
  unregisterFromEvent(openNewObjectModalEventName, 'ObjectEditorNewObjectModal', openModal);
});

</script>

<template>
    <ModalWindow ref="modalRef" :width-percentage="30" :height-percentage="50" :keepRendered="false" :onCancel="clearValues" :onConfirm="onModalConfirmed" :disabledOpenButton="disabled" :disableConfirmButton="disableConfirmButtonCondition">
      <template v-slot:modalContent>
       <div class="flex-container-vertical new-object-modal-container">
        <ObjectTypeSelector :ref="objectTypeSelectorRef" @object-selected="objectTypeSelected" :preselectedType="selectedObjectType" />
        <Textbox :label="'Name*'" v-model="objectName" :disabled="!selectedObjectType" />
       </div>
      </template>
      <template v-slot:openButton>
        <span v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getGoldenText('New') }">
          <Icon class="new-object-button" :icon="'fa-square-plus'" :fontSize="22" :disabled="disabled"></Icon>
        </span>
      </template>
    </ModalWindow>
</template>

<style scoped>

.new-object-modal-container {
  height: 100%;
  padding: 2px;
  user-select: none;
}

.new-object-modal-list-select {
  padding: 5px;
  flex: 1;
  overflow: auto;
  height: 100%;
}

</style>