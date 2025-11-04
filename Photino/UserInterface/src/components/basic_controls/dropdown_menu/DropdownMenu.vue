<script setup lang="ts">
import { ref } from 'vue';
import type { DropdownMenuOption, DropdownMenuViewModel } from './dropdownMenuExtender';

const props = defineProps<{viewModel: DropdownMenuViewModel }>();
const emit = defineEmits(['change', 'blur']);

const isOpen = ref(false);

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

function optionClicked(option: DropdownMenuOption) {
    option?.onClick();
    closeDropdown();
}

</script>

<template>
    <div class="custom-dropdown">
        <div v-show="isOpen" @click="closeDropdown" class="outside-click"></div>
        <div class="simple-button dropdown-label" @click="openDropdown()"> {{ viewModel.label }} </div>
        <ul v-show="isOpen" class="thin-golden-border dropdown-options">
            <ul class="dropdown-options-container">
                <li style="text-align: left;" v-for="option in viewModel.options" :key="option.id" @click="optionClicked(option)">
                    <div style="pointer-events: none; user-select: none;">{{ option.label }}</div>
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

.dropdown-label {
    user-select: none;
}

.custom-dropdown {
  display: inline-block;
  position: relative;
}

.dropdown-label {
  user-select: none;
  white-space: nowrap;
  width: fit-content;
}

.dropdown-options {
  position: absolute;
  z-index: 73;
  list-style-type: none;
  padding: 0;
  margin-top: 2px;
  background-color: var(--color-background-mute);
  width: fit-content;
  max-width: 30rem;
  padding: 3px;
  overflow-x: auto;
}

.dropdown-options-container {
  padding: 0;
  width: fit-content;
}

.dropdown-options-container li {
  cursor: pointer;
  white-space: nowrap;
  width: 100%;
  padding: 2px;
}

.dropdown-options-container li:hover {
  background-color: #777272;
}

</style>