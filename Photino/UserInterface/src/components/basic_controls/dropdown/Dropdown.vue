<script setup lang="ts">
import { ref } from 'vue';
import type { DropdownViewModel } from '../../../structs/controlsStructs';
import type { DropdownOptions } from './dropdownExtender';

const props = defineProps<{viewModel: DropdownViewModel }>();
const emit = defineEmits(['change', 'blur']);

const isOpen = ref(false);

function selectOption(option: DropdownOptions) {
    if(props.viewModel.selectedOption == option) {
        closeDropdown();
        return;
    }

    props.viewModel.selectedOption = option;
    isOpen.value = false;
    valueHasChanged(option);
};

function openDropdown() {
    if(!isOpen.value) {
        isOpen.value = true;
    }
};

function closeDropdown() {
    if(isOpen.value) {
        isOpen.value = false;
    }
};

function valueHasChanged(option: DropdownOptions) {
    emit('change', option);
}

function getOptionsStyle() {
    return `max-height: ${props.viewModel.dropdownMaxHeight}px;`;
}

</script>

<template>
    <div class="custom-dropdown">
        <div v-show="isOpen" @click="closeDropdown" class="outside-click"></div>
        <div class="thin-golden-border" style="min-height: 30px; text-align: center;" @click="openDropdown()"> {{ props.viewModel.selectedOption?.Label }} </div>
        <ul v-show="isOpen" class="dropdown-options simple-background thin-golden-border" :style="getOptionsStyle()">
            <ul class="dropdown-options-container">
                <li style="text-align: left;" v-for="option in viewModel.availableOptions" :key="option.Value" @click="selectOption(option)">
                    <span style="pointer-events: none;">{{ option.Label }}</span>
                </li>
            </ul>
        </ul>
    </div>
</template>
  
<style scoped>

li:empty {
    display: none;
}

.outside-click {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 70;
}

.custom-dropdown {
    width: 100%;
    position: relative;
    height: 35px;
    padding-bottom: 5px;
}
  
.dropdown-options {
  position: absolute;
  z-index: 73;
  list-style-type: none;
  padding: 0;
  margin-top: 5px;
  width: 100%;
  max-height: 500px;
  overflow-x: hidden;
  overflow-y: scroll;
}
  
.dropdown-options li {
  padding: 8px;
}

.dropdown-options-container {
    padding: 1px;
    width: 100%;
}

.dropdown-options-container li {
    width: 250px;
    cursor: pointer;
}
  
.dropdown-options-container li:hover {
  background-color: #777272;
  width: 100%;
}
</style>