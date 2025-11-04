<script setup lang="ts">
import Icon from '@/components/basic_controls/Icon.vue';
import ObjectEditorNewObjectModal from './ObjectEditorNewObjectModal.vue';
import { ActionButtonStatus, type ActionButtonOptions } from './objectActionsExtender';
import { computed, onMounted } from 'vue';
import ConfirmPopup from '@/components/basic_controls/ConfirmPopup.vue';
import ObjectEditorImportObjectModal from './ObjectEditorImportObjectModal.vue'
import type { TooltipOptions } from '@/scripts/uiControllers/tooltipDirective';
import { getGoldenText } from '@/scripts/uiControllers/htmlController';
import ObjectEditorSynchronization from './ObjectEditorSynchronization.vue'
import type { GameObject, ObjectType } from '@/structs/genericStructs';
import { isKeyPressed, listenToKeyDown } from '@/scripts/uiControllers/keyboardController';

var props
  = defineProps<{ 
    newButtonDisabled?: Boolean, 
    deleteButtonDisabled?: Boolean, 
    cloneButtonDisabled?: Boolean, 
    importButtonDisabled?: Boolean, 
    openExternalEditorButtonDisabled?: Boolean,
    loadObjectDataOptions?: ActionButtonOptions,
    gameObject?: GameObject,
    objectType?: ObjectType
  }>();

var emit = defineEmits([
  'newObjectCreated', 
  'objectDeleted', 
  'objectCloned', 
  'objectLoadedFromEditor', 
  'objectImported', 
  'emitObjectLoadedFromDesigner', 
  'objectOpenInExternalEditor',
  'objectSynchronizationCheck',
  'objectSynchronized'
]);

function emitObjectCreated(objectName: any, objectType: any) {
  emit('newObjectCreated', objectName, objectType);
}

function emitObjectDeleted() {
  emit('objectDeleted');
}

function emitObjectCloned() {
  emit('objectCloned');
}

function emitObjectLoadedFromEditor() {
  emit('objectLoadedFromEditor');
}

function emitObjectLoadedFromDesigner() {
  emit('emitObjectLoadedFromDesigner');
}

function emitObjectImported(params: any) {
  emit('objectImported', params);
}

function emitObjectOpenInExternalEditor() {
  emit('objectOpenInExternalEditor');
}

function emitObjectSynchronizationCheck(params: any) {
  emit('objectSynchronizationCheck', params);
}

function emitObjectSynchronized(filePath: string, objectType: ObjectType, objectName: string) {
  emit('objectSynchronized', filePath, objectType, objectName);
}

const objectEditorNewObjectModalDisabled = computed(() => {
  return props.newButtonDisabled as boolean;
});

const objectEditorOpenExternalEditorDisabled = computed(() => {
  return props.openExternalEditorButtonDisabled as boolean;
})

const objectEditorLoadObjectDataDisabled = computed(() => {
  if(!props.loadObjectDataOptions || props.loadObjectDataOptions.status === ActionButtonStatus.Unknown) {
    return true;
  }
  
  return !props.loadObjectDataOptions.enabled;
});

function generateObjectEditorLoadObjectDataTooltip() : string {
  var baseText = getGoldenText('Synchronize - From editor(CTRL+T) OR From designer(CTRL+D)');
  if(objectEditorLoadObjectDataDisabled.value) {
    return baseText;
  }

  switch(props.loadObjectDataOptions?.status) {
    case ActionButtonStatus.Ok:
      return `${baseText}\n Synchronized!`;
    case ActionButtonStatus.Warning:
      return `${baseText}\n Waiting for synchronization!`;
    case ActionButtonStatus.Error:
      return `${baseText}\n Changes in designer and editor!`;
    default:
      return '';
  }
}

const objectEditorLoadObjectDataFontColor = computed(() => {
  if(objectEditorLoadObjectDataDisabled.value) {
    return;
  }

  switch(props.loadObjectDataOptions?.status) {
    case ActionButtonStatus.Ok:
      return 'darkgreen';
    case ActionButtonStatus.Warning:
      return 'orange';
    case ActionButtonStatus.Error:
      return 'darkred';
    default:
      return '';
  }
});

const objectEditorDeleteButtonDisabled = computed(() => {
  return props.deleteButtonDisabled as boolean;
});

const objectEditorCloneButtonDisabled = computed(() => {
  return props.cloneButtonDisabled as boolean;
});

function handleKeyDown(event: KeyboardEvent) {
  event?.stopPropagation();

  if(isKeyPressed('Control') && event.key == "d") {
    emitObjectLoadedFromDesigner();
    return;
  }

  if(isKeyPressed('Control') && event.key == "t") {
    emitObjectLoadedFromEditor();
    return;
  }
}

onMounted(() => {
  listenToKeyDown(handleKeyDown);
});

</script>

<template>
    <div class="flex-container object-actions-container">
      <!-- new  -->
      <ObjectEditorNewObjectModal @new-object-created="emitObjectCreated" :disabled="objectEditorNewObjectModalDisabled" />
      <!-- import -->
      <ObjectEditorImportObjectModal @object-imported="emitObjectImported" :disabled="objectEditorNewObjectModalDisabled" />
      <!-- delete -->
      <ConfirmPopup message="Are you sure you want to remove the item ?" :onConfirm="() => emitObjectDeleted()" :openButtonDisabledCondition="objectEditorDeleteButtonDisabled" >
        <template v-slot:openButton>
          <span v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getGoldenText('Delete selected') }">
            <Icon class="object-action-button" :icon="'fa-square-minus'" :font-size="22" :disabled="objectEditorDeleteButtonDisabled"></Icon>
          </span>
        </template>
      </ConfirmPopup>
      <!-- clone -->
      <span v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getGoldenText('Clone selected') }">
        <Icon class="object-action-button" :icon="'fa-square-caret-down'" :font-size="22" @click="emitObjectCloned" :disabled="objectEditorCloneButtonDisabled"></Icon>
      </span>
      <!-- Load data from editor -->
      <ConfirmPopup message="Are you sure you want to override the data?" 
        :onConfirm="emitObjectLoadedFromEditor" 
        :openButtonDisabledCondition="objectEditorLoadObjectDataDisabled" 
        :additionalActionText="'From Designer'"
        :additionalAction="emitObjectLoadedFromDesigner"
        :confirmButtonText="'From Editor'">
        <template v-slot:openButton>
          <span v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: generateObjectEditorLoadObjectDataTooltip }">
            <Icon class="object-action-button" :icon="'fa-arrows-rotate'" :fontSize="22" :fontColor="objectEditorLoadObjectDataFontColor" :disabled="objectEditorLoadObjectDataDisabled"></Icon>
          </span>
        </template>
      </ConfirmPopup>
      <span v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getGoldenText('Open in external editor') }">
        <Icon class="object-action-button" :icon="'fa-file'" :font-size="22" @click="emitObjectOpenInExternalEditor" :disabled="objectEditorOpenExternalEditorDisabled"></Icon>
      </span>
      <!-- Synchronization -->
      <ObjectEditorSynchronization :gameObject="gameObject" :objectType="objectType" @object-synchronization-check="emitObjectSynchronizationCheck" @object-synchronized="emitObjectSynchronized" />
    </div>
</template>

<style scoped>

.object-action-button {
  margin-right: 3px;
}

.object-actions-container {
  padding: 3px;
  background-color: var(--color-background-mute);
}

</style>