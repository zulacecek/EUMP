<script setup lang="ts">

import type { AvailableObject } from '../../structs/genericStructs';
import { computed, onMounted, onUpdated, ref, watch } from 'vue';
import Icon from './Icon.vue';
import type { TooltipOptions } from '@/scripts/uiControllers/tooltipDirective';
import { hasObjectChanged } from '@/scripts/repositories/changedObjectRepository';
import { displayGlobalConfirmWindow } from '@/scripts/uiControllers/appController';

const props = defineProps({
    objects: Array<AvailableObject>,
    showCloseButton: Boolean,
    selectedObjectId: String,
    disabled: Boolean
});

const renderedObjects = computed(() => {
  return props.objects;
});

var emit = defineEmits(['objectSelected', 'objectClosed']);

const selectedObjectId = computed(() => {
  return props.selectedObjectId;
});

const selectedObject = ref();
const valueWasSelected = ref(false);
var objectWasJustClosed = false;

function emitObjectSelected(object: AvailableObject) {
  emit('objectSelected', object);
}

function objectSelected(object: AvailableObject) {
  if(objectWasJustClosed){
    objectWasJustClosed = false;
    return;
  }

  valueWasSelected.value = true;
  selectedObject.value = object;
  emitObjectSelected(object);
}

function objectClosed(object: AvailableObject) {
  objectWasJustClosed = true;
  emit('objectClosed', object);
}

function preselectObject() {
  if(props.selectedObjectId && !valueWasSelected.value){
    selectedObject.value = props.objects?.firstOrDefault(x => x.id === props.selectedObjectId);
  }
}

onMounted(() => {
  preselectObject();
});

onUpdated(() => {
  preselectObject();
});

function confirmClose(object: AvailableObject) {
    if(hasObjectChanged(object.id, object.type)) {
        displayGlobalConfirmWindow(() => closeObject(object), 'There are unsaved changes. Are you sure you want to close the object ?', undefined, 'Close');
    }
    else {
        closeObject(object);
    }
}

function closeObject(object: AvailableObject) {
  objectClosed(object)
}

function handleMiddleMouseButtonClick(event: any, object: AvailableObject) {
  if (event.button === 1) {
    confirmClose(object);
  }
}

</script>

<template>
<div class="object-top-bar">
  <div class="flex-container object-flex-container">
    <span v-for="openedObject in renderedObjects" class="object-button-container flex-container" 
    v-tooltip="<TooltipOptions>({ disableLock: true, tooltip: openedObject.name })" 
    :class="{ 'object-button-container-selected': selectedObjectId == openedObject?.id }" 
    @click="objectSelected(openedObject)"
    @auxclick="(e: any) => handleMiddleMouseButtonClick(e, openedObject)">
        <div class="object-button simple-button" :class="{ 'disabled': disabled }"> {{ openedObject.name }} </div>
        <div v-if="showCloseButton && !disabled" class="object-close-button flex-container" @click='confirmClose(openedObject)'>
          <Icon :icon="'fa-solid fa-xmark'"></Icon>
        </div>
    </span>
  </div>
</div>
</template>

<style scoped>

.object-flex-container {
  flex-wrap: wrap;
  gap: 2px;
  padding-bottom: 3px;
}

.object-button-container {
  max-width: 20rem;
  min-width: 5rem;
  height: 1.5rem;
  background-color: var(--color-background-mute);
  position: relative;
  overflow: visible;
}

.object-button-container:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.object-button-container:hover:before {
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 2;
}

.object-button-container.object-button-container-selected:after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  background-color: rgba(255, 255, 255, 0.2);
  border-top-color: var(--vt-c-divider-dark-2);
  border-top-width: 2px;
  border-top-style: solid;
}

.object-button-container:disabled {
  pointer-events: none;
}

.object-button {
  width: 100%;
  height: 1.5rem;
  position: relative;
  display: inline-block;
  overflow: hidden; 
  white-space: nowrap;
}

.object-close-button{
  z-index: 15;
  align-items: center;
}

.object-top-bar {
  max-height: 5rem;
  width: 100%;
  overflow-x: auto;
  user-select: none;
}

</style>
