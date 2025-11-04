<script setup lang="ts">
import { useGfxStore } from '@/stores/gfxStore';
import { ref, watch } from 'vue';
import { handleObjectOpenedById } from '../object_editor_controls/objectEditorStructureTreeExtender';
import { ObjectType } from '@/structs/genericStructs';
import { fireEvent } from '@/scripts/event_system/globalEventHandler';
import { objectOpenedEventName } from '@/scripts/event_system/objectEditorEvents';
import SpriteList from './SpriteList.vue'
import Textbox from '../basic_controls/Textbox.vue';

const props = defineProps<{
    objectName: string
}>();

const editedObject = ref();
const objectType = ObjectType.GFXFile;

async function loadGfxFile(objectName: string) {
  if(!objectName) {
    return;
  }

  var objectStore = useGfxStore();

  var loadedObject = objectStore.getGfxFile(objectName);
  if(!loadedObject){
    await handleObjectOpenedById(objectName, objectType);
    loadedObject = objectStore.getGfxFile(objectName);

    fireEvent(objectOpenedEventName, objectName, objectType);
  }

  editedObject.value = loadedObject;
}

watch(
  () => props.objectName,
  async (newObjectName) => {
    await loadGfxFile(newObjectName ?? '');
  },
  { immediate: true }
);

</script>
<template>
  <div class="flex-container">
    <div style="flex: 2;">
      <SpriteList v-if="editedObject?.sprites" :sprites="editedObject?.sprites" :render-folder="'C:\\Users\\George\\Documents\\EUM\\vanilla_mission_icons'" />
    </div>
    <div style="flex: 1; padding: 5px;">
      <h3> Sprite </h3>
      <Textbox :label="'Name'" />
      <Textbox :label="'Texture file'" />
    </div>
  </div>
</template>
<style scope>
</style>