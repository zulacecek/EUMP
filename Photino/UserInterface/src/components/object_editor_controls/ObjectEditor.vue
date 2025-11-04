<script setup lang="ts">
import type { AvailableObject, GameObject } from '@/structs/genericStructs';
import {  ObjectType } from '@/structs/genericStructs';
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';

import Tabs from '../basic_controls/Tabs.vue';

// @ts-ignore
import MissionTreeObjectEditor from '../missions_controls/MissionTreeObjectEditor.vue';
// @ts-ignore
import LocalisationObjectEditor from '../localisation_controls/LocalisationObjectEditor.vue'
import ObjectActions from './object_actions/ObjectActions.vue';
import { getGameObject, getOpenedObjects, handleObjectCloned, handleObjectClosed, handleObjectCreated, handleObjectDeleted, handleObjectImported, handleObjectLoadedFromDesigner, handleObjectLoadedFromEditor, handleObjectOpened, handleObjectOpenedInExternalEditor, handleObjectSynchronizedFromExportedFile } from './objectEditorExtender';
import { registerForEvent, unregisterFromEvent } from '@/scripts/event_system/globalEventHandler';
import { objectOpenedEventName } from '@/scripts/event_system/objectEditorEvents';
import { ActionButtonStatus, type ActionButtonOptions } from './object_actions/objectActionsExtender';
import { useSynchStore } from '@/stores/synchronizationStore';
import AppSettingsObjectEditor from '../settings_controls/app_settings/AppSettingsObjectEditor.vue'
import ModSettingsObjectEditor from '../settings_controls/mod_settings/ModSettingsObjectEditor.vue'
import TextObjectEditor from './text_object_editor/TextObjectEditor.vue'
import GfxEditorObjectEditor from '../gfx_controls/GfxEditorObjectEditor.vue';

const editorElementDesignerName = 'designer';

var selectedEditorElement = ref(editorElementDesignerName);
var selectedObjectType = ref<ObjectType>(ObjectType.Unknown);
var selectedObjectId = ref();

onMounted(() => {
  registerForEvent(objectOpenedEventName, 'ObjectEditor', objectOpened);
});

onUnmounted(() => {
  unregisterFromEvent(objectOpenedEventName, 'ObjectEditor', objectOpened);
});

function changeObjectSelection(id: string | undefined, type: ObjectType) {
  selectedObjectType.value = type;
  selectedObjectId.value = id;
  selectedEditorElement.value = editorElementDesignerName;
}

function objectOpened(newSelectedObjectId: string, objectType: ObjectType) {
  changeObjectSelection(newSelectedObjectId, objectType);
  handleObjectOpened(objectType, newSelectedObjectId);
}

function editorElementSelected(params: any) {
  selectedEditorElement.value = params.id;
}

function objectSelected(object: AvailableObject) {
  changeObjectSelection(object.id, object.type);
}

async function objectCreated(objectName: any, objectType: any) {
  var createdObject = await handleObjectCreated(objectName as string, objectType as ObjectType);
    nextTick(() => {
        if(createdObject) {
          changeObjectSelection(createdObject.id, createdObject.type);
        }
    });
}

async function objectDeleted() {
  handleObjectDeleted(selectedObjectId.value, selectedObjectType.value);
  changeObjectSelection(undefined, ObjectType.Unknown);
}

async function objectCloned() {
  var clonedObject = handleObjectCloned(selectedObjectId.value, selectedObjectType.value);
  if(!clonedObject) {
    return;
  }

  changeObjectSelection(clonedObject.id, clonedObject.type);
}

async function objectImported(params: any) {
  var { path, generateReplacementFile, objectType } = params;
  var importedObject = await handleObjectImported(path, generateReplacementFile, objectType);
  if(!importedObject) {
    return;
  }

  changeObjectSelection(importedObject.id, importedObject.type);
}

function objectOpenInExternalEditor() {
  handleObjectOpenedInExternalEditor(selectedObjectType.value, selectedObjectId.value);
}

function objectClosed(object: AvailableObject) {
  changeObjectSelection(undefined, ObjectType.Unknown);
  handleObjectClosed(object);
}

function objectLoadedFromEditor() {
  selectedObjectId.value = handleObjectLoadedFromEditor(selectedObjectId.value, selectedObjectType.value);
}

function objectLoadedFromDesigner() {
  selectedObjectId.value = handleObjectLoadedFromDesigner(selectedObjectId.value, selectedObjectType.value);
}

async function objectSynchronizedFromExportedFile(filePath: string, objectType: ObjectType, objectName: string) {
  await handleObjectSynchronizedFromExportedFile(filePath, objectType, objectName);
}

var openedObjects = computed<AvailableObject[]>((x => {
  return getOpenedObjects();
}));

const objectEditorCloneButtonDisabled = computed(() => {
  return !isObjectSelected();
});

const objectEditorDeleteButtonDisabled = computed(() => {
  return !isObjectSelected();
});

const objectEditorOpenExternalEditorDisabled = computed(() => {
  return !isObjectSelected();
});

const objectEditorLoadObjectFromEditorButtonOptions = computed(() => {
  var objectType = selectedObjectType.value;
  if(objectType !== ObjectType.MissionTree && objectType !== ObjectType.Localisation){
    return <ActionButtonOptions>({ enabled: false, status: ActionButtonStatus.Unknown });
  }

  var synchronizationStore = useSynchStore();
  var isEditorSynched = synchronizationStore.isEditorValueSynchronizedFromEditor(selectedObjectType.value, selectedObjectId.value);
  var isDesignerSynched = synchronizationStore.isEditorValueSynchronizedFromDesigner(selectedObjectType.value, selectedObjectId.value);
  var status = ActionButtonStatus.Ok;
  
  if(!isEditorSynched) {
    status = ActionButtonStatus.Warning;

    if(!isDesignerSynched) {
      status = ActionButtonStatus.Error;
    }
  }

  return <ActionButtonOptions>({ enabled: isObjectSelected(), status: status });
});

function isObjectSelected(){
  return selectedObjectType?.value != ObjectType.Unknown && selectedObjectId.value != undefined;
}

function getTabsObjects() {
  switch(selectedObjectType.value){
    case ObjectType.MissionTree:
    case ObjectType.Localisation:
    case ObjectType.GFXFile:
      return [<AvailableObject>{ id: 'designer', name:'Designer' }, <AvailableObject>{ id: 'editor', name:'Editor' }, <AvailableObject>{ id: 'properties', name:'Properties' }];
    default: 
      return;
  }
}

function isSpecificObjectEditorVisible(objectType: ObjectType) {
  return selectedObjectType.value == objectType;
}

function getSelectedGameObject(objectType: ObjectType, objectName: string) : GameObject | undefined {
  return getGameObject(objectName, objectType);
}

function objectSynchronizationCheck(lastModified: number) {
  var gameObject = getGameObject(selectedObjectId.value, selectedObjectType.value);
  if(gameObject && gameObject.lastModifed !== lastModified) {
    gameObject.lastModifed = lastModified;
  }
}

</script>

<template>
    <ObjectActions 
      :newButtonDisabled="false" 
      :cloneButtonDisabled="objectEditorCloneButtonDisabled" 
      :deleteButtonDisabled="objectEditorDeleteButtonDisabled"
      :openExternalEditorButtonDisabled="objectEditorOpenExternalEditorDisabled"
      :gameObject="getSelectedGameObject(selectedObjectType, selectedObjectId)"
      :objectType="selectedObjectType"
      :loadObjectDataOptions="objectEditorLoadObjectFromEditorButtonOptions"
      @new-object-created="objectCreated" 
      @object-deleted="objectDeleted"
      @object-cloned="objectCloned"
      @object-loaded-from-editor="objectLoadedFromEditor"
      @emit-object-loaded-from-designer="objectLoadedFromDesigner"
      @object-imported="objectImported" 
      @object-open-in-external-editor="objectOpenInExternalEditor"
      @object-synchronization-check="objectSynchronizationCheck"
      @object-synchronized="objectSynchronizedFromExportedFile"
    />
    <div class="object-tabs-container ">
      <Tabs :show-close-button="true" :objects="openedObjects" :selectedObjectId="selectedObjectId" @object-selected="objectSelected" @object-closed="objectClosed"></Tabs>
    </div>
    <div class="object-edit-container">
      <MissionTreeObjectEditor v-if="isSpecificObjectEditorVisible(ObjectType.MissionTree)" :visibleElement="selectedEditorElement" :selectedMissionTreeName="selectedObjectId" />
      <LocalisationObjectEditor v-else-if="isSpecificObjectEditorVisible(ObjectType.Localisation)" :visibleElement="selectedEditorElement" :selectedLocalisationName="selectedObjectId"/>
      <AppSettingsObjectEditor v-else-if="isSpecificObjectEditorVisible(ObjectType.AppSettings)" :visibleElement="selectedEditorElement" />
      <ModSettingsObjectEditor v-else-if="isSpecificObjectEditorVisible(ObjectType.ModSettings)" :visibleElement="selectedEditorElement" />
      <TextObjectEditor v-else-if="isSpecificObjectEditorVisible(ObjectType.TextFile)" :selectedObjectId="selectedObjectId" />
      <GfxEditorObjectEditor v-else-if="isSpecificObjectEditorVisible(ObjectType.GFXFile)" :visible-element="selectedEditorElement" :object-name="selectedObjectId" />
    </div>
    <div class="object-edit-tabs">
      <Tabs :objects="getTabsObjects()" :selected-object-id="selectedEditorElement" @object-selected="editorElementSelected"></Tabs>
    </div>
</template>

<style scoped>

.object-tabs-container {
  width: 100%;
  padding: 3px;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: var(--vt-c-divider-dark-2);
}

.object-edit-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.object-edit-tabs {
  border-top-width: 1px;
  border-top-style: solid;
  border-top-color: var(--vt-c-divider-dark-2);
}

</style>