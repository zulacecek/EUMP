<script setup lang="ts">
import Icon from '@/components/basic_controls/Icon.vue';
import { getFileMetadata } from '@/scripts/layerCommunication/fileSystemCommunication';
import { getObjectExportPath } from '@/scripts/pdxExporters/exportUtils';
import { addObjectChange, detectObjectChange, hasObjectChanged } from '@/scripts/repositories/changedObjectRepository';
import { getGoldenText } from '@/scripts/uiControllers/htmlController';
import type { TooltipOptions } from '@/scripts/uiControllers/tooltipDirective';
import { ChangedObjectActionType, ObjectType, type GameObject } from '@/structs/genericStructs';
import { FileSynchronizationStatus } from '@/structs/missionStructs';
import { computed, ref, watch } from 'vue';

var emit = defineEmits(['objectSynchronizationCheck', 'objectSynchronized']);

var props = defineProps<{
  gameObject?: GameObject,
  objectType?: ObjectType
}>();

var synchronizationStatus = ref(FileSynchronizationStatus.Unknown);

const isButtonEnabled = computed(() => {
  if(!props.gameObject || !props.objectType) {
    return false;
  }

  var synchStatus = synchronizationStatus.value;
  return synchStatus !== FileSynchronizationStatus.NotExported && synchStatus !== FileSynchronizationStatus.Unknown;
});

function emitObjectSynchronitionCheck(synchronizationValue: number) {
  emit('objectSynchronizationCheck', synchronizationValue);
}

function emitObjectSynchronized(filePath: string, objectType: ObjectType, objectName: string) {
  emit('objectSynchronized', filePath, objectType, objectName);
}

watch(() => props.gameObject, async (newValue) => {
  if(synchronizationIntervalId < 1 || props.gameObject?.name != newValue?.name) {
    await synchronizeExportedFile();
    synchronizationIntervalId = setInterval(synchronizeExportedFile, 500);
  }
}, { deep: true, immediate: true });

var synchronizationIntervalId = 0;
var isSynchronizationCompleted = true;
async function synchronizeExportedFile() {
    if(!isSynchronizationCompleted) {
      return;
    }

    isSynchronizationCompleted = false;

    var objectName = props.gameObject?.name;
    var objectType = props.objectType;
    var objectLastModified = props.gameObject?.lastModifed;

    if(!objectName || !objectType) {
      return;
    }

    if(detectObjectChange(ChangedObjectActionType.New, objectName, objectType, false)) {
      synchronizationStatus.value = FileSynchronizationStatus.NotExported;
      isSynchronizationCompleted = true;
      return;
    }

    var filePath = getObjectExportPath(objectType, objectName);
    var metadata = await getFileMetadata(filePath);
    var lastModified = metadata?.lastModifiedTimestamp ?? -1;
  
    if (lastModified == 0) {
      synchronizationStatus.value = FileSynchronizationStatus.NotExported;
      isSynchronizationCompleted = true;
      return;
    }

    if(!objectLastModified || objectLastModified == 0 || objectLastModified == 1){
      objectLastModified = lastModified;
      emitObjectSynchronitionCheck(objectLastModified);
      synchronizationStatus.value = FileSynchronizationStatus.UpToDate;
      isSynchronizationCompleted = true;
      return;
    }

    if(hasObjectChanged(objectName, objectType, true)) {
      objectLastModified = Date.now();
      emitObjectSynchronitionCheck(objectLastModified);
    }

    if(lastModified != objectLastModified) {
      if (objectLastModified > lastModified && synchronizationStatus.value !== FileSynchronizationStatus.FileBehind) {
          synchronizationStatus.value = FileSynchronizationStatus.FileBehind;
        } 
        else if (objectLastModified < lastModified && synchronizationStatus.value !== FileSynchronizationStatus.FileAhead) {
          synchronizationStatus.value = FileSynchronizationStatus.FileAhead;
        }
    }
    else if(synchronizationStatus.value !== FileSynchronizationStatus.UpToDate) {
      synchronizationStatus.value = FileSynchronizationStatus.UpToDate;
    }

    if(!isSynchronizationCompleted) {
      isSynchronizationCompleted = true;
    }
}

function getSynchronizationStatusText() : String {
  switch(synchronizationStatus.value) {
    case FileSynchronizationStatus.FileAhead:
      return `${getGoldenText('File is ahead.')} \nClick to synchronize the application.`;
    case FileSynchronizationStatus.FileBehind:
      return `${getGoldenText('File is behind.')} \nExport the mod to synchronize.`;
    case FileSynchronizationStatus.UpToDate:
      return getGoldenText('Everything is up to date.');
    case FileSynchronizationStatus.NotExported:
      return `${getGoldenText('Tree is not exported.')} \nExport the mod first.`;
    default:
      return getGoldenText('Status is unknown.');
  }
}

function getSynchronizationStatusClass(status: FileSynchronizationStatus) : string {
  switch(status) {
    case FileSynchronizationStatus.FileAhead:
    case FileSynchronizationStatus.FileBehind:
      return "orange";
    case FileSynchronizationStatus.UpToDate:
      return "darkgreen";
    default:
      return "darkred";
  }
}

async function handleFileSynchronization() {
  var synchStatus = synchronizationStatus.value;
  if(synchStatus === FileSynchronizationStatus.UpToDate || synchStatus === FileSynchronizationStatus.FileBehind) {
    return;
  }

  var objectName = props.gameObject?.name;
  var objectType = props.objectType;

  if(!objectName || !objectType) {
    return;
  }

  var filePath = getObjectExportPath(objectType, objectName);
  addObjectChange(ChangedObjectActionType.Update, objectType, objectName, objectName, true);

  emitObjectSynchronized(filePath, objectType, objectName);
  emitObjectSynchronitionCheck(0);
  clearInterval(synchronizationIntervalId);
  synchronizationIntervalId = -1;
}

function getButtonTooltip() {
  return `${getSynchronizationStatusText()}`;
}

</script>

<template>
  <span v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getButtonTooltip  }">
    <Icon class="object-action-button" :icon="'fa-file-import'" :font-size="22" @click="handleFileSynchronization" :fontColor="getSynchronizationStatusClass(synchronizationStatus)" :disabled="!isButtonEnabled"></Icon>
  </span>

</template>

<script scoped>

</script>