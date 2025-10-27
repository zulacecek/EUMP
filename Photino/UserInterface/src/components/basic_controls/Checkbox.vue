<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps({ modelValue: Boolean, label: String });

const isChecked = ref(props.modelValue);
const emit = defineEmits();

const updateParent = (event : any) => {
  isChecked.value = event.target.checked;
  emit('update:modelValue', isChecked.value);
  emit('valueChanged', isChecked.value);
};

watch(isChecked, (newValue) => {
  emit('update:modelValue', newValue);
});

</script>

<template>
  <label class="custom-checkbox">
    <input type="checkbox" v-model="isChecked" :checked="modelValue" @change="updateParent"> 
    <span class="checkmark"></span>
    {{ label }}
  </label>
</template>

<style scoped>

.custom-checkbox {
  position: relative;
  padding-left: 35px;
  cursor: pointer;
  font-size: 16px;
  user-select: none;
  display: inline-block;
}

.custom-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.custom-checkbox .checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 1.5rem;
  width: 1.5rem;
  border: 2px solid var(--vt-c-divider-dark-2);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.custom-checkbox:hover .checkmark {
  box-shadow: 0 0 4px white;
}

.custom-checkbox input:checked ~ .checkmark {
  border-color: var(--vt-c-divider-dark-2);
}

.custom-checkbox .checkmark::after {
  content: "";
  position: absolute;
  display: none;
}

.custom-checkbox input:checked ~ .checkmark::after {
  display: block;
}

.custom-checkbox .checkmark::after {
  left: 6px;
  width: 0.5rem;
  height: 1rem;
  border: solid gold;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

</style>