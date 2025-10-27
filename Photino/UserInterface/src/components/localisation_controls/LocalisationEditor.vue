<script setup lang="ts">
import { ref, watch } from 'vue';
import ObjectList  from '../common_controls/ObjectList.vue';
import { ObjectType } from '../../structs/genericStructs';
import { useLocalisationStore } from '@/stores/localisationStore';
import { handleObjectOpenedById } from '../object_editor_controls/objectEditorStructureTreeExtender';
import { fireEvent } from '@/scripts/event_system/globalEventHandler';
import { objectOpenedEventName } from '@/scripts/event_system/objectEditorEvents';


const emit = defineEmits(['keyValueAdded']);
const props = defineProps({ selectedLocalisationName: String });

const columns = [
  { key: "key", label: "Key", type: "input" },
  { key: "value", label: "Translation", type: "input" },
];

const editedLocalisation = ref();

async function selectLocalisation(localisationName: string) {
  if(!localisationName) {
    return;
  }

  var localisationStore = useLocalisationStore();

  editedLocalisation.value = localisationStore.getLocalisation(localisationName);
  if(!editedLocalisation.value){
    await handleObjectOpenedById(localisationName, ObjectType.Localisation);
    editedLocalisation.value = localisationStore.getLocalisation(localisationName);
    fireEvent(objectOpenedEventName, localisationName, ObjectType.Localisation);
  }
}

watch(
  () => props.selectedLocalisationName,
  async (newSelectedLocalisationName) => {
    await selectLocalisation(newSelectedLocalisationName ?? '');
  },
  { immediate: true }
);

</script>

<template>
  <div class="localisation-page-container simple-background">
    <ObjectList v-if="editedLocalisation?.localisationMap" :data="editedLocalisation.localisationMap" :columns="columns" :itemsPerPage="10" :objectId="editedLocalisation.name" :objectCategory="ObjectType.Localisation" :key="editedLocalisation.name" />
  </div>
</template>

<style scoped>

.localisation-page-container {
  position: relative;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

</style>