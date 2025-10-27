<script setup lang="ts">
import DropdownMenu from '@/components/basic_controls/dropdown_menu/DropdownMenu.vue';
import { getFileMenuViewModel } from './topMenuBarExtender';

</script>

<template>
  <div class="nav-container">
    <div class="file-dropdown">
      <DropdownMenu :view-model="getFileMenuViewModel()" />
    </div>
  </div>
</template>

<style scoped>

.file-dropdown {
  height: 100%;
}

.nav-container{ 
  display: flex;
  height: 100%;
  width: 100%;
  border-bottom: 1px solid var(--vt-c-divider-dark-2);
}

</style>