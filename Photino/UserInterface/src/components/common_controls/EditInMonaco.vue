<script setup lang="ts">
import ModalWindow from "./ModalWindow.vue";
import MonacoEditor from "../basic_controls/monaco/MonacoEditor.vue";

defineProps({
  value: String,
  onBeforeOpen: Function,
  onSave: Function
});

const emit = defineEmits(['valueChanged']);

function emitValueChanged(e : any) {
  emit('valueChanged', { value: e.value});
}

</script>

<template>
    <ModalWindow :width-percentage="85" :height-percentage="90" :keepRendered="false" :onBeforeOpen="onBeforeOpen" :onConfirm="onSave">
      <template v-slot:modalContent>
        <MonacoEditor :value="value" @value-changed="emitValueChanged"></MonacoEditor>
      </template>
      <template v-slot:openButton>
        <div class="new-tree-button">
          <button class="smallest-button"> Editor </button>
        </div>
      </template>
    </ModalWindow>
</template>

<style scoped>


</style>