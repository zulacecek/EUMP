<script setup lang="ts">
// @ts-ignore
import { computed } from 'vue';
// @ts-ignore
import { useStore } from 'vuex';
import { idToHistory } from '../../scripts/repositories/provinceHistoryRepository';
import Checkbox from '../basic_controls/Checkbox.vue';
import { NFlex } from 'naive-ui';
import BetterFilteredDropdown from '../basic_controls/filtered_dropdown/FilteredDropdown.vue';
import { BetterFilteredDropdownOption, BetterFilteredDropdownViewModel } from '../../structs/missionStructs';
import { availableTags } from '../../scripts/appContext';

// const store = useStore();
// var storedData = computed(() => store.getters.getMod);

var props = defineProps({
  editedProvinceId: String
});

var editedProvince = computed(() => {
  var provinceId = props.editedProvinceId;
  if(provinceId && idToHistory.value.has(provinceId)){
    return idToHistory.value.get(provinceId);
  }
});

var availableTagsMapped = computed(() => {
  return availableTags.map(x => <BetterFilteredDropdownOption>({ value: x, label: x }));
})

function ownerValueChange(newValue: BetterFilteredDropdownOption) {
  if(editedProvince.value) {
    editedProvince.value.owner = newValue.value
  }
}

function controllerValueChange(newValue: BetterFilteredDropdownOption) {
  if(editedProvince.value) {
    editedProvince.value.controller = newValue.value
  }
}

function addCoreValueChange(newValue: BetterFilteredDropdownOption) {
  if(editedProvince.value) {
    editedProvince.value.add_core = newValue.value
  }
}

function getOwnerDropdownViewModel(availableOptions: BetterFilteredDropdownOption[], selectedValue: any) : BetterFilteredDropdownViewModel {
  var result = <BetterFilteredDropdownViewModel>({
    availableOptions: availableOptions,
    displayWithoutCategories: true,
    selectedOption: <BetterFilteredDropdownOption>({ })
  });

  if(!selectedValue){
    return result;
  }

  availableOptions = availableOptions.filter(x => x.value != selectedValue);
  
  var selectedOption = availableOptions.firstOrDefault(x => x.value == selectedValue);
  if(!selectedOption){
    var valuedOption = <BetterFilteredDropdownOption>({  value: selectedValue })
    availableOptions.push(valuedOption);
    selectedOption = valuedOption;
  }

  return <BetterFilteredDropdownViewModel>({ availableOptions: availableOptions, selectedOption: selectedOption ?? <BetterFilteredDropdownOption>({ }), dropdownOptionMaxHeight: 250, displayWithoutCategories: true });
}

</script>

<template>
  <div class="golden-border-separator-bottom edit-form-header">
      <h2> {{ editedProvince?.province_id }}</h2>
  </div>
  <div v-if="editedProvince && editedProvince">
      <div>
          <label> Base manpower </label>
          <input type="number" class="textbox" min="0" v-model="editedProvince.base_manpower" />
      </div>
      <div>
          <label> Base production </label>
          <input type="number" class="textbox" min="0" v-model="editedProvince.base_production" />
      </div>
      <div>
          <label> Base tax </label>
          <input type="number" class="textbox" min="0" v-model="editedProvince.base_tax" />
      </div>
      <div>
          <label> Extra cost </label>
          <input type="number" class="textbox" min="0" v-model="editedProvince.extra_cost" />
      </div>
      <div>
          <label> Center of trade </label>
          <input type="number" class="textbox" min="0" max="3" v-model="editedProvince.center_of_trade" />
      </div>
      <div>
          <label> Add core </label>
          <BetterFilteredDropdown :viewModel="getOwnerDropdownViewModel(availableTagsMapped, editedProvince.add_core)" @value-changed="addCoreValueChange"> </BetterFilteredDropdown>
      </div>
      <div>
          <label> Owner </label>
          <BetterFilteredDropdown :viewModel="getOwnerDropdownViewModel(availableTagsMapped, editedProvince.owner)" @value-changed="ownerValueChange"> </BetterFilteredDropdown>
      </div>
      <div>
          <label> Controller </label>
          <BetterFilteredDropdown :viewModel="getOwnerDropdownViewModel(availableTagsMapped, editedProvince.controller)" @value-changed="controllerValueChange"> </BetterFilteredDropdown>
      </div>
      <div>
          <label> Culture </label>
          <input type="text" class="textbox" min="1" max="50" v-model="editedProvince.culture" />
      </div>
      <div>
          <label> Religion </label>
          <input type="text" class="textbox" min="1" max="50" v-model="editedProvince.religion" />
      </div>
      <div>
          <label> Trade goods </label>
          <input type="text" class="textbox" min="1" max="50" v-model="editedProvince.trade_goods" />
      </div>
      <div>
          <label> Capital </label>
          <input type="text" class="textbox" min="1" max="50" v-model="editedProvince.capital" />
      </div>
      <div style="margin-bottom: 5px; margin-top: 10px;">
        <div clas="flex-container">
            <label> Is city </label>
            <Checkbox style="width: 30px; margin-top: -3px;" v-model="editedProvince.is_city"></Checkbox>
        </div>
      </div>
      <div>
        <div clas="flex-container">
            <label> Is hre </label>
            <Checkbox style="width: 30px; margin-top: -3px;" v-model="editedProvince.hre"></Checkbox>
        </div>
      </div>
  </div>
</template>

<style scoped>

.edit-form-header {
    height: 3rem;
}

</style>