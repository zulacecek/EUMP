<script setup lang="ts">
import { MissionSlotPotential, MissionTree, TreeItemEntry, TreeItemType } from "../../structs/missionStructs";
import TreeItem from "../basic_controls/builder_tree/BuilderTreeItem.vue";

var props = defineProps<{ viewModel: MissionSlotPotential, missionTree: MissionTree }>();

function getViewModel() {
    return <TreeItemEntry>({ type: TreeItemType.TopLevel, child_entries: props.viewModel?.mission_slot_potential_entries, position: props?.viewModel?.mission_slot_potential_entries?.length + 1, tree_type: "SlotPotential" });
}

const emit = defineEmits(["treeChanged", 'blur', 'childRemoved', "propageChildRemoved"]);
function treeChanged() {
    emit('treeChanged');
}

function propageChildRemoved(childToRemove: any) {
    emit('propageChildRemoved', childToRemove);
}

</script>

<template>
<h2> Potential </h2>
<TreeItem :viewModel="getViewModel()" :parentTreeItem="<TreeItemEntry>({ type: TreeItemType.TopLevel, tree_type: 'SlotPotential' })" :missionTree="missionTree" @tree-changed="treeChanged" @propage-child-removed="propageChildRemoved" @blur="emit('blur')" />
</template>

<style scoped>
</style>
