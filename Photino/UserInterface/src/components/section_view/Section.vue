<!-- Section.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import IconButton from '../basic_controls/IconButton.vue';

const sectionRef = ref<HTMLElement | null>(null)
const isVisible = ref(true);

const props = defineProps<{
  anchor?: 'left' | 'right' | 'anchored'
  initialWidth?: number
  minWidth?: number
  maxWidth?: number,
  allowToggleVisibility?: boolean
}>();

const toggleVisibilityIcon = computed(() => {
  if(isVisible.value) {
    return 'fa-solid fa-eye-slash';
  }

  return 'fa-solid fa-eye';
})

const width = ref(props.initialWidth ?? 300)
const minWidth = props.minWidth ?? 300
const maxWidth = props.maxWidth ?? 600

const isDragging = ref(false)
let startX = 0

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function onMouseDown(e: MouseEvent) {
  isDragging.value = true
  startX = e.clientX

  function onMouseMove(moveEvent: MouseEvent) {
    if (!isDragging.value || !sectionRef.value) return

    const rect = sectionRef.value.getBoundingClientRect()
    const mouseX = moveEvent.clientX

    if (props.anchor === 'left') {
      const newWidth = clamp(mouseX - rect.left, minWidth, maxWidth)
      width.value = newWidth
    } else if (props.anchor === 'right') {
      const newWidth = clamp(rect.right - mouseX, minWidth, maxWidth)
      width.value = newWidth
    }
  }

  function onMouseUp() {
    isDragging.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function toggleVisibility() {
  isVisible.value = !isVisible.value;
}

</script>

<template>
  <div v-if="isVisible" ref="sectionRef" class="section" :style="{ flex: anchor === 'anchored' ? '1' : '0 0 auto', width: anchor === null ? 'auto' : width + 'px' }">
    <slot />
    <div v-if="anchor != 'anchored'" class="resizer" :class="anchor" @mousedown.prevent="onMouseDown"></div>
  </div>
  <div v-if="allowToggleVisibility" class="right-panel">
    <IconButton class="button home-view-button" :icon="toggleVisibilityIcon" :font-size="12" @click="toggleVisibility" />
  </div>
</template>

<style scoped>

.right-panel {
  height: 100%;
  background-color: var(--vt-c-black-mute);
}

.section {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: ew-resize;
  z-index: 10;
  border-color: var(--vt-c-divider-dark-2);
  border-width: 0px;
  border-left-width: 2px;
  border-style: solid;
}

.resizer.left {
  right: 0;
}

.resizer.right {
  left: 0;
}

</style>