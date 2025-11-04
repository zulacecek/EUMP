<script setup lang="ts">
import Section from './Section.vue'

var props = defineProps<{ 
  hideLeftSection?: Boolean, 
  hideRightSection?: Boolean, 
  allowToggleVisibility?: string[]
}>();

function allowToggleVisibility(section: string) {
  if(!props.allowToggleVisibility) {
    return false;
  }

  return props.allowToggleVisibility.includes(section);
}

</script>

<template>
  <div class="container">
    <Section v-if="!hideLeftSection" anchor="left" :allowToggleVisibility="allowToggleVisibility('left')">
      <slot name="left" />
    </Section>

    <Section anchor='anchored' :allowToggleVisibility="allowToggleVisibility('center')">
      <slot name="center" />
    </Section>

    <Section v-if="!hideRightSection" anchor="right" :allowToggleVisibility="allowToggleVisibility('right')">
      <slot name="right" />
    </Section>
  </div>
</template>

<style scoped>

.container {
  display: flex;
  width: 100%;
  height: 100%;
}

</style>