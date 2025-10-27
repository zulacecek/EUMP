<script setup lang="ts">
import { ref, computed } from 'vue';
import BetterEditableLabel from '@/components/common_controls/BetterEditableLabel.vue';
import type { FilteredDropdownOption } from './filteredDropdownExtender';
import { ValueType } from '@/structs/uiStructs';

const props = defineProps<{ 
    availableOptions?: FilteredDropdownOption[],
    selectedOptionKey?: String,
    displayWithoutCategories?: Boolean,
    disabled?: Boolean,
    changeOnInput?: Boolean,
    dropdownOptionMaxHeight?: Number,
    label?: String 
}>();

const emit = defineEmits(['valueChanged', 'blur']);
var filter = ref('');

const options = computed(() => {
    return props?.availableOptions ?? new Array();
});

const selectedKey = computed(() => {
    return props?.selectedOptionKey as string;
});

const categories = computed(() => {
    return Array.from(options.value.map(option => option.category)).map(category => ({ label: category, value: category }));
});

const isOpen = ref(false);

const selectedCategory = computed(() => {
    return selectedOption.value?.category;
});

var selectedOption = computed<FilteredDropdownOption | undefined>(() => {
    return getSelectedOption(selectedKey.value);
});

const filteredCategory = ref(selectedCategory.value);
function filteredOptions(category : string | undefined) : FilteredDropdownOption[] {
    return computed(() => {
        const filterLowerCase = filter.value?.toLowerCase();
        var filteredOptions = options.value.filter(x => x.label && x.key);

        if(filterLowerCase && filterLowerCase !== selectedKey.value) {
            if(!category) {
                var filteredOptions = filteredOptions.filter(option => option.label?.toLowerCase()?.includes(filterLowerCase));                
            }
            else {
                filteredOptions = filteredOptions.filter(option =>
                    option.category === category && option?.label?.toLowerCase()?.includes(filterLowerCase)
                );
            }

            if(filteredOptions.length > 0){
                return filteredOptions;
            }
            else {
                var literalValueDropdown = new Array();
                literalValueDropdown.push(<FilteredDropdownOption>({ key: filter.value, label: filter.value, category: category }))
                return literalValueDropdown;
            }
        }

        if(!props.displayWithoutCategories && filteredCategory.value){
            return options.value.filter(x=> x.category === filteredCategory.value);
        }

        return filteredOptions;
    }).value as FilteredDropdownOption[];
}

function isCategoryDisplayed(value: string) : boolean {
    if(!selectedOption.value?.key) {
        return true;
    }

    return filteredOptions(value).length > 0;
}

var categoriesToDisplay = computed(() => {
    if(filteredCategory.value) {
        return categories.value.filter(x => x.value === filteredCategory.value)
    }
    else {
        return categories.value;
    }
});
  
function selectOption(option: FilteredDropdownOption) {
    if(selectedOption.value?.key == option.key) {
        closeDropdown();
        return;
    }

    filteredCategory.value = option.category;
    isOpen.value = false;
    valueHasChanged(option.key);
};

function openDropdown() {
    if(!isOpen.value && options.value && options.value.length > 0){
        isOpen.value = true;
    }
};

function closeDropdown() {
    if(isOpen.value) {
        isOpen.value = false;
    }
};

function filterByCategory(categoryKey: string) {
    var selectedOptionKey = selectedOption.value?.key;
    if(selectedOptionKey){
        valueHasChanged(selectedOptionKey);
    }

    filteredCategory.value = categoryKey;
}

function valueHasChanged(changedValue: string) {
    filter.value = '';
    emit('valueChanged', changedValue);
}

function onInput(input: string,) {
    if(props.changeOnInput) {
        valueHasChanged(input)
    }

    filter.value = input;
}

function getStyleAttribute() {
    if(!props.displayWithoutCategories && isOpen.value && filteredCategory.value){
        return 'padding-left: 90px; padding-right: 5px;';``
    }
}

function editableLabelValueCleared() {
    filteredCategory.value = '';
    valueHasChanged('');
}

function getDropdownOptionsStyle() : string {
    if(props.dropdownOptionMaxHeight){
        return `max-height: ${props.dropdownOptionMaxHeight}px;`
    }

    return '';
}

function labelClosedByEnterPress(value: string) {
    if(props.displayWithoutCategories) {
        var option = filteredOptions(undefined)[0];
        if(option) {
            value = option.key;
        }
    }
    else {
        option = filteredOptions(selectedCategory.value)[0];
        if(option){
            value = option.key;
        }
    }

    valueHasChanged(value);
    closeDropdown();
}

function getSelectedOption(key: string | undefined) {
    if(!key) {
        return;
    }

    return filteredOptions(key).firstOrDefault(x => x.key == key) as FilteredDropdownOption;
}

</script>

<template>
    <div v-if="availableOptions" class="custom-dropdown">
        <label style="height: 2rem;" v-if="label"> {{ label }} </label>
        <div v-show="isOpen" @click="closeDropdown" class="outside-click"></div>
        <span v-if="!displayWithoutCategories && filteredCategory && isOpen">
            <div style="gap: 0;" class="filtered-category flex-container">
                <span class="filtered-category-label">{{ filteredCategory }}:</span>
                <span class="filtered-category-cancel cancel-button" @click="filteredCategory = ''"></span>
            </div>
        </span>
        <BetterEditableLabel class="input-filter"
            :modelValue="selectedOption?.label"
            :inputType="ValueType.Text" @blur="emit('blur')"
            :style="getStyleAttribute()"
            :disabled="disabled"
            @focus="openDropdown" 
            @enter-pressed="labelClosedByEnterPress"
            @input="(e: any) => onInput(e.target.value)"  
            @value-cleared="editableLabelValueCleared()" 
        />

        <ul v-if="displayWithoutCategories" v-show="isOpen" class="dropdown-options simple-background thin-golden-border" :style="getDropdownOptionsStyle()">
            <li>
                <ul class="dropdown-options-container">
                    <li style="text-align: left;" v-for="option in filteredOptions(undefined)" :key="option.key" @click="selectOption(option)">
                        <span style="pointer-events: none;">{{ option.label }}</span>
                    </li>
                </ul>
            </li>
        </ul>
        <ul v-else v-show="isOpen" class="dropdown-options simple-background thin-golden-border" :style="getDropdownOptionsStyle()">
            <li v-for="category in categoriesToDisplay" :key="category.value" @click="filterByCategory(category.value)">
                <span v-if="isCategoryDisplayed(category.value)">
                    <div class="category-label">{{ category.label }}</div>
                    <ul class="dropdown-options-container">
                        <li style="text-align: left;" v-for="option in filteredOptions(category.value)" :key="option.key" @click="selectOption(option)">
                            <span style="pointer-events: none;">{{ option.label }}</span>
                        </li>
                    </ul>
                </span>
            </li>
        </ul>
    </div>
</template>
  
<style scoped>

li:empty {
    display: none;
}

.filtered-category-cancel {
    top: -2px;
}

.filtered-category-label {
    width: 60px;
    height: 15px;
    pointer-events: none;
    overflow: hidden;
}

.filtered-category {
    position: absolute;
    font-size: 12px;
    color: lightgray;
    z-index: 72;
    top: 7px;
    left: 10px;
    width: 90px;
}

.input-filter {
    height: 2rem;
    width: 100%;
    position: absolute;
    z-index: 71;
}

.outside-click {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 70;
}

.category-label {
    cursor: pointer;
    width: 100%;
    text-align: left;
    border-bottom: 2px rgba(158, 130, 38) ridge;
}

.category-label:hover {
  background-color: #777272;
}
  
.custom-dropdown {
  position: relative;
  min-width: 250px;
  height: 4rem;
  width: 100%;
  padding-bottom: 3px;
}
  
.dropdown-options {
  position: absolute;
  z-index: 73;
  list-style-type: none;
  padding: 0px;
  margin-top: 35px;
  min-width: 250px;
  width: 100%;
  max-height: 500px;
  overflow-x: hidden;
  overflow-y: scroll;
}
  
.dropdown-options li {
  padding: 3px;
}

.dropdown-options-container {
    padding: 0;
    min-width: 250px;
    list-style-type: none;
}

.dropdown-options-container li {
    width: 100%;
    cursor: pointer;
}
  
.dropdown-options-container li:hover {
  background-color: #777272;
  min-width: 250px;
}
</style>