<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  floating?: boolean;
  anchor?: "left" | "right";
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: 100,
  maxWidth: 600,
  initialWidth: 300,
  floating: false,
  anchor: "left",
});

const width = ref<number>(props.initialWidth);
const isResizing = ref<boolean>(false);
const overlay = ref<HTMLDivElement | null>(null);

const startResizing = (event: MouseEvent) => {
  isResizing.value = true;
  if (overlay.value) overlay.value.style.display = "block";

  const startX = event.clientX;
  const startWidth = width.value;

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isResizing.value) return;

    let newWidth;
    if (props.anchor === "left") {
      newWidth = startWidth + (moveEvent.clientX - startX);
    } else {
      newWidth = startWidth - (moveEvent.clientX - startX);
    }

    width.value = Math.max(props.minWidth, Math.min(props.maxWidth, newWidth));
  };

  const onMouseUp = () => {
    isResizing.value = false;
    if (overlay.value) overlay.value.style.display = "none";

    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

const panelStyles = computed<Record<string, string>>(() => ({
  width: `${width.value}px`,
  position: props.floating ? "absolute" : "relative",
  right: props.anchor === "right" ? "0" : "auto",
  left: props.anchor === "left" ? "0" : "auto",
  height: "100%",
  top: "0",
}));

const resizerStyles = computed(() => ({
  left: props.anchor === "right" ? "0" : "auto",
  right: props.anchor === "left" ? "0" : "auto",
}));
</script>

<template>
  <div class="resizable-container">
    <div class="resizable-panel simple-background" :style="panelStyles">
      <slot />
      <div class="resizer" :style="resizerStyles" @mousedown="startResizing"></div>
    </div>
    <div ref="overlay" class="resize-overlay"></div>
  </div>
</template>

<style scoped>

.resizable-container {
  position: relative;
  height: 100%;
}

.resizable-panel {
  height: 100%;
  z-index: 10;
  padding-left: 15px;
  padding-right: 15px;
  border-style: ridge;
  border-width: 2px;
  border-color: rgba(158, 130, 38);
  overflow-y: scroll;
}

.resizer {
  width: 5px;
  height: 100%;
  background: #888;
  cursor: ew-resize;
  position: absolute;
  top: 0;
}

.resizer:hover {
  background: #555;
}

.resize-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  cursor: ew-resize;
  background: transparent;
  z-index: 9999;
}
</style>