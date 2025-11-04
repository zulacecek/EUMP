<script setup lang="ts">
import TreeItem from "../basic_controls/builder_tree/BuilderTreeItem.vue";
import { TreeItemType, type TreeItemEntry } from "../basic_controls/builder_tree/builderTreeItemExtender";

var props = defineProps<{ viewModel: MissionTrigger, missionTree: MissionTree }>();

function getViewModel() {
    return <TreeItemEntry>({ type: TreeItemType.TopLevel, child_entries: props.viewModel?.mission_trigger_entries, position: props?.viewModel?.mission_trigger_entries?.length + 1, tree_type: "Trigger" });
}

const emit = defineEmits(["treeChanged"]);
function treeChanged() {
    emit('treeChanged');
}

</script>

<template>
<h2> Trigger </h2>
<TreeItem :viewModel="getViewModel()" :parentTreeItem="<TreeItemEntry>({ type: TreeItemType.TopLevel, tree_type:'Trigger' })" :missionTree="missionTree" @tree-changed="treeChanged" />
</template>

<style scoped>
</style>
