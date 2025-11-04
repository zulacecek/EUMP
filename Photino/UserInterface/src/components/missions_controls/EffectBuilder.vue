<script setup lang="ts">
import { type MissionEffect, type MissionTree, type TreeItemEntry, TreeItemType } from '../../structs/missionStructs';
import TreeItem from '../basic_controls/builder_tree/BuilderTreeItem.vue';

var props = defineProps<{ viewModel: MissionEffect, missionTree: MissionTree }>();

function getViewModel() {
    return <TreeItemEntry>({ 
        type: TreeItemType.TopLevel, 
        child_entries: 
        props.viewModel?.mission_effect_entries, 
        position: props?.viewModel?.mission_effect_entries?.length + 1, 
        tree_type: "Effect" 
    });
}

const emit = defineEmits(["treeChanged"]);
function treeChanged() {
    emit('treeChanged');
}

</script>

<template>
<h2> Effect </h2>
<TreeItem :viewModel="getViewModel()" :parentTreeItem="<TreeItemEntry>({ type: TreeItemType.TopLevel, tree_type: 'Effect' })" :missionTree="missionTree" @tree-changed="treeChanged" />
</template>

<style scoped>
</style>
