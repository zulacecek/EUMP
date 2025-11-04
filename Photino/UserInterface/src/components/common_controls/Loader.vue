<script setup lang="ts">
import { onUnmounted, watch } from 'vue';


var props = defineProps({ display: Boolean, text: String });

watch(
  () => props.display,
  (newVal) => {
    document.body.classList.toggle('no-scroll', newVal);
  },
  { immediate: true }
);

onUnmounted(() => {
  document.body.classList.remove('no-scroll');
});

</script>

<template>
<div class="loader" v-if="display">
    <div class="loader-container">
        <div class="loader-disabler"></div>
        <div class="loader-animation-text-container">
          <div class="loader-animation"></div>
          <div class="loader-text"> {{ text }}</div>
        </div>
    </div>
</div>
</template>

<style scoped>

.loader {
    width: 100%;
    height: 100%;
    position: absolute;
}

.loader-container {
    width: 100%;
    height: 100%;
    position: relative;
}

.loader-disabler {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 99;
    background-color: rgba(0, 0, 0, 0.6);
}

.loader-animation-text-container {
  position: relative;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.loader-animation {
  border: 8px solid rgb(62, 87, 110);
  border-top: 8px ridge rgb(192, 173, 65);
  border-radius: 50%;
  width: 4rem; 
  height: 4rem; 
  animation: spin 1s linear infinite;
}

.loader-text {
  width: 100%;
  text-align: center;
  height: 2rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

</style>
