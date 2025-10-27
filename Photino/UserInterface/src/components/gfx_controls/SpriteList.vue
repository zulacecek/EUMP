<script setup lang="ts">
import { mapImagePath } from '@/scripts/file_system/fileSystemService';
import type { SpriteType } from '@/structs/gfxStructs';
import { computed, type StyleValue } from 'vue';

const props = defineProps<{
    sprites: SpriteType[],
    renderFolder: string
}>();

const filteredSprites = computed(() => {
  return props.sprites;
});

const emit = defineEmits(['spriteSelected']);

function emitSpriteSelected(iconName: string) {
    emit('spriteSelected', iconName);
}

function getSpritePath(iconName: string) : string {
  if(!iconName) {
    return '';
  }

  return mapImagePath(`${props.renderFolder}/${iconName}.png`);
}

</script>

<template>
    <div class="flex-container sprite-container">
      <img v-for="sprite in filteredSprites" class="sprite-image" loading="lazy" :src="getSpritePath(sprite.name)" @click="emitSpriteSelected(sprite.name)" />
    </div>
</template>

<style scoped>

.sprite-container {
  height: 100%; 
  overflow-y: auto;
  flex-wrap: wrap;
  overflow-y: auto;
}

.sprite-image {
  height: 60px;
  width: 60px;
}

</style>