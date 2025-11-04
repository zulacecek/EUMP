<script setup lang="ts">
import { RouterView } from 'vue-router'
import TopMenuBar from './components/main_controls/top_menu_bar/TopMenuBar.vue';
import { computed, onMounted } from 'vue';
import { initApp } from './scripts/core/core';
import Loader from './components/common_controls/Loader.vue';
import { loaderText, loaderVisible } from './scripts/uiControllers/appController';
import GlobalConfirmPopup from './components/basic_controls/confirm_popup/GlobalConfirmPopup.vue'
import FeedbackMessage from './components/common_controls/FeedbackMessage.vue';

onMounted(async () => {
  await initApp();
});

const globalLoaderVisibile = computed(() => {
  return loaderVisible.value;
});

const globalLoaderText = computed(() => {
  return loaderText.value;
});

</script>

<template>
  <div class="app-container"> 
    <Loader :display="globalLoaderVisibile" :text="globalLoaderText" />
    <GlobalConfirmPopup />
    <FeedbackMessage />
    <div class="header">
      <TopMenuBar />
    </div>
    <div class="main-body">
      <RouterView />
    </div>
    <div class="footer">
    </div>
  </div>
</template>

<style scoped>

.app-container {
  padding-left: 5px;
  padding-right: 5px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.footer,
.header {
  height: 2rem;
  width: 100%;
  flex-shrink: 0;
  background-color: var(--color-background-mute);
}

.main-body {
  overflow: hidden;
  flex: 1;
}

</style>
