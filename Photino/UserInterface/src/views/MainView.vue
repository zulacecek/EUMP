<script setup lang="ts">

import ObjectEditor from '@/components/object_editor_controls/ObjectEditor.vue';
import ObjectEditorStructureTree from '@/components/object_editor_controls/ObjectEditorStructureTree.vue';
import SectionContainer from '@/components/section_view/SectionContainer.vue';
import { hideGlobalLoader } from '@/scripts/uiControllers/appController';
import { useModStore } from '@/stores/modStore';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

onMounted(() => {
  var modStore = useModStore();
  var mod = modStore.getMod();
  var router = useRouter();
  if(!mod) {
    router.push('/');
  }
  
  hideGlobalLoader();
})

</script>

<template>
   <SectionContainer :hide-left-section="true" :allowToggleVisibility="['right']">
    <template #left>
    </template>
    <template #center>
      <div class="flex-container-vertical center-container">
        <ObjectEditor />
      </div>
    </template>
    <template #right>
      <div class="flex-container-vertical right-container">
        <ObjectEditorStructureTree />
      </div>
    </template>
  </SectionContainer>
</template>

<style scoped>

.right-container {
  width: 100%;
  height: 100%;
}

.center-container {
  width: 100%;
  height: 100%;
}

</style>