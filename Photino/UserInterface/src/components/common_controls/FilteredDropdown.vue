<script setup lang="ts">
import { ref, computed } from 'vue';
import EditableLabel from './EditableLabel.vue';
import type { DropdownOptions, FilteredDropdownViewModel } from '../../structs/missionStructs';
import { ValueType } from '../../structs/missionStructs';

const props = defineProps<{viewModel: FilteredDropdownViewModel, availableDropdownOptions: DropdownOptions[], disabled?: boolean}>();

const emit = defineEmits(['valueChanged', 'blur']);

const options = computed(() => {
    return props.availableDropdownOptions?.map(x => { return { category: x.Category, label: x.Label, value: x.Value, type: x.ValueType, valueCategory: x.ValueCategory } });
})

const categories = computed(() => {
    return Array.from(new Set(options.value.map(option => option.category))).map(category => ({ label: category, value: category }));
});

const isOpen = ref(false);

const filteredCategory = ref(props.viewModel.selectedCategory);
if(props.viewModel.selectedValue) {
    var option = options.value.filter(x => x.value == props.viewModel.selectedValue)[0];
    if(option) {
        filteredCategory.value = option.category;
    }
}

function filteredOptions(category : string) {
    return computed(() => {
        const filterLowerCase = props.viewModel.selectedValue.toLowerCase();
        var filteredOptions = options.value;

        if(filterLowerCase) {
            return filteredOptions.filter(option =>
                option.category === category && option?.label?.toLowerCase()?.includes(filterLowerCase)
            );
        }

        if(props.viewModel.allowAllAvailableCategories){
            if(filteredCategory.value){
                filteredOptions = options.value.filter(x=> x.category === filteredCategory.value);
            }

            return filteredOptions;
        }

        if(filteredCategory.value){
            return options.value.filter(x=> x.category === filteredCategory.value);
        }

        return new Array(); 
    }).value;
}

function isCategoryDisplayed(value: string) : boolean {
    if(!props.viewModel.selectedValue) {
        return true;
    }

    return filteredOptions(value).length > 0;
}

var categoriesToDisplay = computed(() => {
    if(props.viewModel.selectedValue.startsWith(":")){
        var filteredCategories = categories.value.filter(x => x.value.toLowerCase().includes(props.viewModel.selectedValue.toLowerCase().replace(':', "")));
        firstOption.value = '';
        firstCategoryOption.value = filteredCategories[0]?.value ?? '';
        return filteredCategories;
    }

    firstCategoryOption.value = '';

    if(filteredCategory.value) {
        return categories.value.filter(x => x.value === filteredCategory.value)
    } 
    else {
        return categories.value;
    }
});
  
function selectOption(option: any) {
    if(props.viewModel.selectedValue == option.value) {
        closeDropdown();
        return;
    }

    props.viewModel.selectedValue = option.value;
    filteredCategory.value = option.category;
    isOpen.value = false;
    valueHasChanged(option);
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
    if(props.viewModel.selectedValue){
        var pickedOption = options.value.filter(x=> x.value === props.viewModel.selectedValue)[0];
        props.viewModel.selectedValue = '';
        valueHasChanged(pickedOption);
    }

    filteredCategory.value = categoryKey;
}

function valueHasChanged(option: any) {
    if(!option) {
        props.viewModel.selectedValue = '';
        props.viewModel.selectedCategory = '';
        props.viewModel.selectedValueType = '';
    }
    else {
        props.viewModel.selectedValue = option.value;
        props.viewModel.selectedCategory = option.category;
        props.viewModel.selectedValueType = option.type;
        props.viewModel.selectedValueCategory = option.valueCategory;
    }
    
    emit('valueChanged', { newValue: props.viewModel } );
}

var firstOption = ref();
var firstCategoryOption = ref('');
addEventListener("keydown", (event) => {
    if(event.code === "Enter") {
        if(firstCategoryOption.value) {
            filteredCategory.value = firstCategoryOption.value;
            props.viewModel.selectedValue = '';
            firstCategoryOption.value = '';
            valueHasChanged(null);
        }
        else if(firstOption.value) {            
            props.viewModel.selectedValue = firstOption.value.value;
            var activeElement = document?.activeElement as HTMLElement;
            var option = options.value.filter(x=> x.value === firstOption.value)[0];
            if(option) {
                filteredCategory.value = option.category;
            }
            activeElement?.blur();
            closeDropdown();
            valueHasChanged(firstOption.value);
        }
    }
});

function selectFirst(f: number, n: number, option: any) {
    if(f === 0 && n === 0){
        firstOption.value = option;
    }
}

function onInput(input: string) {
    var option = { category: '', label: '', value: input, type: '' };
    valueHasChanged(option)
}

function getStyleAttribute() {
    if(isOpen.value && filteredCategory.value){
        return 'padding-left: 90px; padding-right: 5px;';
    }
    else {
        return 'width: 240px';
    }
}

function editableLabelValueCleared() {
    filteredCategory.value = '';
    valueHasChanged(undefined);
}

</script>

<template>
    <div class="custom-dropdown">
        <div v-show="isOpen" @click="closeDropdown" class="outside-click"></div>
        <span v-if="filteredCategory && isOpen">
            <div style="gap: 0;" class="filtered-category flex-container">
                <span class="filtered-category-label">{{ filteredCategory }}:</span>
                <span class="filtered-category-cancel cancel-button" @click="filteredCategory = ''"></span>
            </div>
        </span>
        <EditableLabel class="input-filter" v-model="props.viewModel.selectedValue" @focus="openDropdown" :inputType="ValueType.Text" @blur="emit('blur')" @input="(e: any) => onInput(e.target.value)" :style="getStyleAttribute()" @value-cleared="editableLabelValueCleared()" :disabled="disabled" />
        <ul v-show="isOpen" class="dropdown-options simple-background thin-golden-border">
            <li v-for="(category, categoryIndex) in categoriesToDisplay" :key="category.value" @click="filterByCategory(category.value)">
                <span v-if="isCategoryDisplayed(category.value)">
                    <div class="category-label">{{ category.label }}</div>
                    <ul class="dropdown-options-container">
                        <li style="text-align: left;" v-for="(option, optionIndex) in filteredOptions(category.value)" :key="option.value" @click="selectOption(option)" :selectFirst="selectFirst(categoryIndex, optionIndex, option)">
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
  height: 35px;
  width: 250px;
  padding-bottom: 5px;
}
  
.dropdown-options {
  position: absolute;
  z-index: 73;
  list-style-type: none;
  padding: 0;
  margin-top: 35px;
  width: 250px;
  max-height: 500px;
  overflow-x: hidden;
  overflow-y: scroll;
}
  
.dropdown-options li {
  padding: 8px;
}

.dropdown-options-container {
    padding: 1px;
    width: 250px;
}

.dropdown-options-container li {
    width: 250px;
    cursor: pointer;
}
  
.dropdown-options-container li:hover {
  background-color: #777272;
  width: 250px;
}
</style>