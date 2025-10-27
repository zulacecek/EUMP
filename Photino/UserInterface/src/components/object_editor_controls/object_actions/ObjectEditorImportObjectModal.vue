<script setup lang="ts">
import Icon from '@/components/basic_controls/Icon.vue';
import ModalWindow from '@/components/common_controls/ModalWindow.vue';
import type { TooltipOptions } from '@/scripts/uiControllers/tooltipDirective';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ObjectType } from '@/structs/genericStructs';
import ObjectTypeSelector from '@/components/basic_controls/object_type_selector/ObjectTypeSelector.vue';
import Checkbox from '@/components/basic_controls/Checkbox.vue';
import FilePicker from '@/components/basic_controls/file_picker/FilePicker.vue';
import { getGoldenText } from '@/scripts/uiControllers/htmlController';
import { useModStore } from '@/stores/modStore';
import { formatFileSystemPath } from '@/scripts/utils';
import { gameMissionFolderName } from '@/scripts/repositories/missionTreeRepository';
import { gameLocalisationFolderName } from '@/scripts/repositories/localisationRepository';
import { registerForEvent, unregisterFromEvent } from '@/scripts/event_system/globalEventHandler';
import { openImportObjectModalEventName } from './objectActionsExtender';

const { disabled } = defineProps<{ disabled: boolean }>();
const emit = defineEmits(['objectImported']);

var pickedPath = ref();
var generateReplacementFile = ref();
var selectedObjectType = ref();
var objectTypeSelectorRef = ref();
var modalRef = ref();

const disableConfirmButtonCondition = computed(()=> {
    return false;
});

const defaultPath = computed(() => {
    var modStore = useModStore();
    var basePath = modStore.getMod()?.eu4Directory;
    var modulePath = '';

    switch(selectedObjectType.value) {
        case ObjectType.MissionTree:
            modulePath = gameMissionFolderName;
            break;
        case ObjectType.Localisation:
            modulePath = gameLocalisationFolderName;
            break;
    }

    var path = formatFileSystemPath(basePath, modulePath);
    return path;
});

function objectTypeSelected(objectType: ObjectType){
    selectedObjectType.value = objectType;
}

function clearValues() {
    generateReplacementFile.value = false;
    selectedObjectType.value = ObjectType.Unknown;
    pickedPath.value = '';
    objectTypeSelectorRef.value.clearInputValues();
}

function onModalConfirmed() {
    emitObjectImported();
    clearValues();
}

function emitObjectImported() {
    emit('objectImported', { path: pickedPath.value, generateReplacementFile: generateReplacementFile.value, objectType: selectedObjectType.value });
}

function openModal(preselectedType: ObjectType) {
    selectedObjectType.value = preselectedType;
    modalRef.value?.openModal();
}

onMounted(() => {
  registerForEvent(openImportObjectModalEventName, 'ObjectEditorNewObjectModal', openModal);
});

onUnmounted(() => {
  unregisterFromEvent(openImportObjectModalEventName, 'ObjectEditorNewObjectModal', openModal);
});

</script>

<template>
    <ModalWindow ref="modalRef" :width-percentage="30" :height-percentage="50" :keepRendered="false" :onCancel="clearValues" :onConfirm="onModalConfirmed" :disabledOpenButton="disabled" :disableConfirmButton="disableConfirmButtonCondition">
      <template v-slot:modalContent>
            <div class="flex-container-vertical height-100">
                <ObjectTypeSelector ref="objectTypeSelectorRef" @object-selected="objectTypeSelected" :preselectedType="selectedObjectType" />
                <div style="padding: 5px;">
                    <FilePicker :label="'Mission tree path'" v-model="pickedPath" :selectFolder="false" :displaySelectedPath="true" :disabled="!selectedObjectType" :defaultPath="defaultPath" />
                    <Checkbox v-model="generateReplacementFile" :label="'Generate replacement file'" />
                </div>
            </div>
      </template>
      <template v-slot:openButton>
        <span v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getGoldenText('Import') }">
            <Icon class="new-object-button" :icon="'fa-square-arrow-up-right'" :fontSize="22" :disabled="disabled"></Icon>
        </span>
      </template>
    </ModalWindow>
</template>

<style>

</style>