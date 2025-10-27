<script setup lang="ts">
import type { MissionProvincesToHighlight, MissionTree, TreeItemEntry } from "../../structs/missionStructs";
import { TreeItemType } from "../../structs/missionStructs";
import TreeItem from "../basic_controls/builder_tree/BuilderTreeItem.vue";

var props = defineProps<{ viewModel: MissionProvincesToHighlight, missionTree: MissionTree }>();

function getViewModel() {
    return <TreeItemEntry>({ type: TreeItemType.TopLevel, child_entries: props.viewModel?.mission_provinces_to_highlight_entries, position: props?.viewModel?.mission_provinces_to_highlight_entries?.length + 1, tree_type: "ProvincesToHighlight" });
}

const emit = defineEmits(["treeChanged"]);
function treeChanged() {
    emit('treeChanged');
}

</script>

<template>
<h2> Provinces to highlight </h2>
<TreeItem :viewModel="getViewModel()" :parentTreeItem="<TreeItemEntry>({ type: TreeItemType.TopLevel, tree_type: 'ProvincesToHighlight' })" :missionTree="missionTree" @tree-changed="treeChanged" />
</template>

<style scoped>
</style>
