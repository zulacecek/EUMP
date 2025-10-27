<script setup lang="ts">
import { ValueType } from '@/structs/uiStructs';
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: String,
  inputType: ValueType,
  disabled?: boolean
}>();

const editedValue = ref(props.modelValue);
const emit = defineEmits();

function updateParent(newValue: string) {
  editedValue.value = newValue;
  if(newValue == ''){
    emit('valueCleared');
  }
  
  emit('update:modelValue', editedValue.value);
};

watch(editedValue, (newValue) => {
  emit('update:modelValue', newValue);
});

const isInput = ref(false);
const inputRef = ref();

const edit = () => {
  if(props.disabled){
    return;
  }

  isInput.value = true;
  nextTick(() => {
    inputRef?.value?.focus();
  });
  emit('focus');
};

function finishEdit() {
  isInput.value = false;
  emit('blur');
}

function filterInputs(e: any) {
  if(e.code == "Enter" || e.code == "ArrowUp" || e.code == "ArrowDown"){
    e.preventDefault();
    inputRef.value.focus();
  }
}

function getInputType() : string {
  switch(props.inputType){
    case ValueType.Float:
    case ValueType.Int:
      return "number";
    case ValueType.Text:
    default:
      return "text";
  }
}

function getStepSize() : number {
  switch(props.inputType){
    case ValueType.Float:
      return 0.05;
    case ValueType.Int:
      return 1;
    default:
      return 0;
  }
}

addEventListener("keydown", (event) => {
    if(isInput.value && event.code === "Enter" || event.code === 'NumpadEnter') {
      finishEdit();
      emit('enterPressed', editedValue.value);
    }
});

</script>

<template>
  <div v-if="!isInput" class="editable-label textbox" @click="edit">
    <div v-if="disabled" class="input-disabler"></div>
    <div style="gap: 0;" class="editable-input-container">
      <span class="editable-input-label"> {{ modelValue }} </span>
      <span v-if="modelValue" class="editable-input-cancel cancel-button" @click="updateParent('')"></span>
    </div>
  </div>
  <div v-else>
    <input class="editable-input textbox" :type="getInputType()" :step="getStepSize()" :value="modelValue" @blur="finishEdit" ref="inputRef" @input="(e) => updateParent((e as any).target.value)" @keydown="(e: any) => filterInputs(e)" />
  </div>
</template>

<style scoped>
.input-disabler {
  background-color: rgba(0,0,0,0.4); 
  position:absolute; 
  width: 100%; 
  height: 100%; 
  z-index: 100;
}

.editable-input-label {
  width: 100%;
  overflow: hidden;
}

.editable-input-cancel{
  position: absolute;
  right: 10px;
  top: 2.5px;
}

.editable-input-container {
  width: 100%;
  position: relative;
}

.editable-label {
  height: 100%;
  width: 100%;
  text-align: center;
}

.editable-input {
  display: inline-block;
  width: 100%; 
  height: 100%;
  text-align: center;
}

</style>