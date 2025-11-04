<script setup lang="ts">

defineProps<{ display: boolean }>();

</script>

<template>
<div class="loader-container" v-if="display">
    <div class="loader-animation"></div>
</div>
</template>

<style scoped>

.loader-container {
    width: 20px;
    height: 20px;
    pointer-events: none;
}

.loader-animation {
  top: 50%;
  left: 45%;
  border: 3px solid rgba(158, 130, 38);
  border-top: 3px ridge #246896;
  border-radius: 50%;
  width: 15px; 
  height: 15px; 
  animation: spin 1s linear infinite;
  z-index: 1100;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

</style>
