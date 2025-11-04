<script setup lang="ts">
import { ref } from 'vue';
import { type MissionTree,type TreeItemOption } from '../../../structs/missionStructs';
import { deepClone } from '../../../scripts/utils';
import { keyAvailableTreeItemMap } from '../../../scripts/appContext';
import { GetAvailableDropdownOptionsByCategory, getValueDropdownOptions } from '../../../Extenders/TreeItemExtender';
import { ValueType } from '@/structs/uiStructs';
import { TreeItemType, type Statement, type TreeItemEntry } from './builderTreeItemExtender';
import type { DropdownOptions } from '../dropdown/dropdownExtender';
import type { FilteredDropdownViewModel } from '../filtered_dropdown/FilteredDropdownOld.vue';

const props = defineProps<{ viewModel: TreeItemEntry, parentTreeItem: TreeItemEntry, missionTree: MissionTree }>();
const emit = defineEmits(["childRemoved", "childPositionChanged", "treeChanged", 'blur', 'propageChildRemoved', 'itemCloned']);

const toggle = () => {
    props.viewModel.is_opened = !props.viewModel.is_opened;
};

var entriesData = ref(props.viewModel?.child_entries);

function addChild() {
    var newEntry = <TreeItemEntry>({ child_entries: new Array(), type: TreeItemType.Clause, key_type: ValueType.None, position: entriesData.value.length + 1, key: '', category: props.viewModel.category, is_opened: true });
    if(props.parentTreeItem.type == TreeItemType.TopLevel){
        newEntry.tree_type = props.viewModel.tree_type;
    }
    entriesData.value.push(newEntry);
    treeChanged();
}

function addStatement() {
    var newEntry = <TreeItemEntry>({ child_entries: new Array(), type: TreeItemType.Statement, statement: <Statement>({ statement_type : ValueType.None, statement_category: props.viewModel.category }), position: entriesData.value.length + 1, key: '', });
    if(props.parentTreeItem.type == TreeItemType.TopLevel){
        newEntry.tree_type = props.viewModel.tree_type;
    }
    entriesData.value.push(newEntry);
    treeChanged();
}

function removeChild(childToRemove: any) {
    var missionTriggerEntry = childToRemove.removedChild;
    var indexOfRemovedChild = entriesData.value.indexOf(missionTriggerEntry);
    if(indexOfRemovedChild > -1) {
        entriesData.value.splice(indexOfRemovedChild, 1);
        treeChanged();
    }

    emit('propageChildRemoved', childToRemove);
}

function childRemoved() {
    emit('childRemoved', { removedChild: props.viewModel });
    emit('propageChildRemoved', { removedChild: props.viewModel });
}

function moveUp() {
    emit('childPositionChanged', { oldPosition: props.viewModel.position, newPosition: props.viewModel.position - 1  });
}

function moveDown() {
    emit('childPositionChanged', { oldPosition: props.viewModel.position, newPosition: props.viewModel.position + 1  });
}

function treeChanged() {
    emit('treeChanged');
}

function valueChangeFinished() {
    emit('blur');
}

function itemCloned() {
    var childToClone = props.viewModel;
    emit('itemCloned', childToClone);
}

function recalculatePositions(changedPositions: any) {
    var oldPosition = changedPositions.oldPosition;
    var newPosition = changedPositions.newPosition;
    if(newPosition < 1 || newPosition > entriesData.value.length){
        return;
    }

    var newPositionChild = entriesData.value.filter(x => x.position == newPosition)[0];
    var movedChild = entriesData.value.filter(x => x.position == oldPosition)[0];
    if(newPositionChild) {
        newPositionChild.position = oldPosition;
    }

    movedChild.position = newPosition;
    entriesData.value = entriesData.value.sort((x, y) => x.position - y.position);
    treeChanged();
}

function saveStatementKey(changeArgs: any) {
    var changedValue = changeArgs.newValue as FilteredDropdownViewModel;
    if(!changedValue.selectedValueType) {
        changedValue.selectedValueType = 'text';
    }

    if(props.viewModel.statement) {
        props.viewModel.statement.statement_type = changedValue.selectedValueType as ValueType;
        props.viewModel.statement.statement_category = changedValue.selectedCategory;
        props.viewModel.statement.key = changedValue.selectedValue;
        props.viewModel.statement.statement_value_category = changedValue.selectedValueCategory;
        changeTreeItemTypeBasedOnValueType(props.viewModel.statement.statement_type, props.viewModel, props.parentTreeItem);
        generateTreeClauseByTemplate(props.viewModel, changedValue.selectedValue);
        treeChanged();
    }
    else {
        changeTreeItemTypeBasedOnValueType(changedValue.selectedValueType as ValueType, props.viewModel, props.parentTreeItem);
        generateTreeClauseByTemplate(props.viewModel, changedValue.selectedValue);
        treeChanged();
    }
}

function saveStatementValue(changeArgs: any) {
    if(props.viewModel.statement){
        var changedValue = changeArgs.newValue as FilteredDropdownViewModel;
        props.viewModel.statement.value = changedValue.selectedValue;
        treeChanged();
    }
}

function saveKey(changeArgs: any) {
    var changedValue = changeArgs.newValue as FilteredDropdownViewModel;
    props.viewModel.keyType = changedValue.selectedValueType as ValueType;
    props.viewModel.key = changedValue.selectedValue;
    props.viewModel.category = changedValue.selectedCategory;
    changeTreeItemTypeBasedOnValueType(props.viewModel.key_type, props.viewModel, props.parentTreeItem);
    generateTreeClauseByTemplate(props.viewModel, changedValue.selectedValue);
    treeChanged();
}

function displayDropdownStament(valueType : ValueType) : Boolean {
    switch(valueType){
        case ValueType.Boolean:
        case ValueType.Category:
            return true;
        default:
            return false;
    }
}

function getStamentValueDropdownTriggers(valueType: ValueType) : DropdownOptions[] {
    switch(valueType)
    {
        case ValueType.Boolean:
            var triggerOptions = new Array();
            triggerOptions.push(<DropdownOptions>({ Value: "yes", Label: "yes", Category: ValueType.Boolean }));
            triggerOptions.push(<DropdownOptions>({ Value: "no", Label: "no", Category: ValueType.Boolean }));
            return triggerOptions;
        case ValueType.Category:
            return GetAvailableDropdownOptionsByCategory(props.viewModel.statement?.statementCategory, props.viewModel.treeType);
    }

    return new Array();
}

function getClauseDropdownTriggers(category: string, treeType: string) : DropdownOptions[] {
    return GetAvailableDropdownOptionsByCategory(category, treeType);
}

function changeTreeItemTypeBasedOnValueType(valueType: ValueType, treeItem: TreeItemEntry, parentTreeItem: TreeItemEntry) {
    if(treeItem.type === TreeItemType.TopLevel) {
        return;
    }

    var treeItemType = TreeItemType.Empty;
    if(!valueType) {
        treeItem.category = parentTreeItem.category;
        treeItem.childEntries.forEach(x => changeTreeItemTypeBasedOnValueType(valueType, x, treeItem));
    }
    else {
        switch(valueType){
            case ValueType.Clause:
                treeItemType = TreeItemType.Clause;
                break;
            default:
                treeItemType = TreeItemType.Statement;
                break;
        }
    }

    if(treeItem.type === treeItemType){
        return;
    }
    
    switch(treeItemType){
        case TreeItemType.Clause:
            if(treeItem.statement) {
                if(treeItem.statement.key){
                    treeItem.key = treeItem.statement.key;
                }
                if(treeItem.statement.statementCategory) {
                    treeItem.category = treeItem.statement.statementCategory;
                }
                treeItem.keyType = valueType;
            }

            generateTreeClauseByTemplate(treeItem, treeItem.key);
            break;
        default:
            treeItem.statement = <Statement>({ statementType : valueType, statementCategory: treeItem.category, key: treeItem.key });
            break;
    }

    if(treeItemType != TreeItemType.Empty){
        treeItem.type = treeItemType;
    }

    treeItem.isOpened = true;
}

function generateTreeClauseByTemplate(parent: TreeItemEntry, key: string) {
    var selectedOption = keyAvailableTreeItemMap.get(key) as TreeItemOption;
    if(!selectedOption || !selectedOption.ChildEntries){
        return;
    }

    parent.childEntries = new Array();
    for(var child of selectedOption.ChildEntries){
        child.allowChanges = selectedOption.AllowChanges;
        parent.childEntries.push(deepClone(child));
    }

    if(parent.childEntries && parent.childEntries.length > 0){
        parent.isOpened = true;
    }

    parent.allowChanges = true;
}

var toggler = ref(true);
function toggleOpen() {
    toggler.value = !toggler.value;
    openTreeItems(props.viewModel.childEntries);
}

function openTreeItems(items: TreeItemEntry[]) {
    for(var entry of items){
        if(!entry || !entry.childEntries){
            continue;
        }
        
        entry.isOpened = !toggler.value;
        if(entry.childEntries.length > 0){
            openTreeItems(entry.childEntries);
        }
    }
}

function cloneItem(childToClone: TreeItemEntry) {
    if(!childToClone) {
        return;
    }

    var clonedItem = deepClone(childToClone);
    clonedItem.position = entriesData.value.length + 1;
    entriesData.value.push(clonedItem);
    treeChanged();
}

function changesAllowed() : boolean {
    if(props.viewModel.allowChanges === undefined || props.viewModel.allowChanges === null) {
        return true;
    }

    return props.viewModel.allowChanges;
}



</script>
<template>
<li class="trigger-builder-item">
    <div class="trigger-builder-item-container flex-container" v-if="viewModel.type == TreeItemType.Statement" style="gap: 0px;">
        <FilteredDropdown :viewModel="getFilteredDropdownViewModel(viewModel.statement.key)" @value-changed="saveStatementKey" :availableDropdownOptions="getStamentValueDropdownTriggers(ValueType.Category)" :disabled="!changesAllowed()" />
        <FilteredDropdown v-if="displayDropdownStament(viewModel.statement.statementType)" :viewModel="getStatementFilteredDropdownViewModel(viewModel.statement.value)" @blur="valueChangeFinished" @value-changed="saveStatementValue" :availableDropdownOptions="getValueDropdownOptions(viewModel.statement.statement_type, viewModel.statement.statement_value_category, missionTree)" />
        <EditableLabel v-else class="input-filter" v-model="viewModel.statement.value" :inputType="viewModel.statement.statementType" @blur="valueChangeFinished" @value-changed="saveStatementValue" style="width: 240px" />
        <div style="position: relative; width: 25px; height: 45px; top: -9px;">
            <ConfirmPopup v-if="changesAllowed()" message="Are you sure you want to remove the item ?" :onConfirm="() => childRemoved()" >
                <template v-slot:openButton>
                <button  class="delete-button" style="margin-top: 3px; position: absolute; left: 0; top: 0px;"></button>
                </template>
            </ConfirmPopup>
            <button v-if="changesAllowed()" class="add-button clone-button" @click="itemCloned"></button>
        </div>
        <div class="movement-arrows-container">
            <button class="up-arrow up-arrow-position" @click="moveUp"></button>
            <button class="down-arrow down-arrow-position" @click="moveDown"></button>
        </div>
    </div>
    <div v-else-if="viewModel.type == TreeItemType.TopLevel">
        <div clas="flex-container"> 
            <button class="small-button" @click="toggleOpen"> Toggle open </button>
        </div>
        <ul class="lined-ul">
            <TreeItem v-for="entry in viewModel.childEntries" :viewModel="entry" :missionTree="missionTree" :parentTreeItem="props.parentTreeItem"
            @child-removed="removeChild" 
            @child-position-changed="recalculatePositions" 
            @tree-changed="treeChanged" 
            @blur="valueChangeFinished"
            @item-cloned="cloneItem" />
            <div clas="flex-container">
                <button v-if="changesAllowed()" style="margin-top: 7px;" class="smallest-button" @click="addChild">Clause</button>
                <button v-if="changesAllowed()" style="margin-top: 7px;" class="smallest-button" @click="addStatement">Statement</button>
            </div>
        </ul>
    </div>
    <div v-else>
        <div class="flex-container" style="gap: 5px;">
            <FilteredDropdown :viewModel="getFilteredDropdownViewModel(viewModel.key)" @value-changed="saveKey" :availableDropdownOptions="getClauseDropdownTriggers(viewModel.category, viewModel.treeType)" :disabled="!changesAllowed()" />
            <span>
                <button v-if="!viewModel.isOpened" class="add-button" @click="toggle"></button>
                <button v-else class="close-button" @click="toggle"></button>
            </span>
            <div>
                <div style="position: relative; width: 20px; height: 45px; top: -10px;">
                    <ConfirmPopup v-if="changesAllowed()" message="Are you sure you want to remove the item ?" :onConfirm="() => childRemoved()" >
                    <template v-slot:openButton>
                        <button class="delete-button" style="margin-top: 3px; position: absolute; left: 0; top: 0px;"></button>
                    </template>
                    </ConfirmPopup>
                    <button v-if="changesAllowed()" class="add-button clone-button" @click="itemCloned"></button>
                </div>
            </div>
            <div class="movement-arrows-container">
                <button class="up-arrow up-arrow-position" @click="moveUp"></button>
                <button class="down-arrow down-arrow-position" @click="moveDown"></button>
            </div>
        </div>
        <ul class="lined-ul nested-tree-ul" v-if="viewModel.isOpened">
            <TreeItem v-for="entry in viewModel.childEntries" :viewModel="entry" :missionTree="missionTree" :parentTreeItem="props.viewModel"
             @child-removed="removeChild" 
             @child-position-changed="recalculatePositions" 
             @tree-changed="treeChanged" 
             @blur="valueChangeFinished"
             @item-cloned="cloneItem" />
            <div clas="flex-container">
                <button style="margin-top: 7px;" class="smallest-button" @click="addChild">Clause</button>
                <button style="margin-top: 7px;" class="smallest-button" @click="addStatement">Statement</button>
            </div>
        </ul>
    </div>
</li>
</template>

<style scoped>
.clone-button {
    margin-top: 3px; 
    height: 20px; 
    width: 20px; 
    background-size: cover;  
    position: absolute; 
    left: 0; 
    top: 20px;
}
.nested-tree-ul {
    padding-left: 40px;
}

.trigger-builder-item-container {
    position: relative; 
    width: 550px;
}

.trigger-builder-item {
    margin-top: 10px;
    width: 500px;
}
.movement-arrows-container {
    position: relative;
}

.up-arrow-position {
    position: absolute;
    top: -5px;
    left: 0;
    width: 17px;
    height: 17px;
}

.down-arrow-position {
    position: absolute;
    top: 13px;
    left: 0;
    width: 17px;
    height: 17px;
}

.tree-delete-button {
  width: 20px;
  height: 20px;
  background-image: url('./../../assets/remove_button.png');
  background-repeat: no-repeat;
  background-size: cover;
}

.tree-delete-button:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  border-radius: 40px;
}

.tree-delete-button:hover:before {
  background-color: rgba(255, 255, 255, 0.2);
  z-index: 6;
}


</style>
