<script setup lang="ts">
import type { TreeNode } from './treeNode';
import TreeItem from './TreeItem.vue';

const props = defineProps<{
  nodes: TreeNode[];
}>();

var emit = defineEmits(['endNodeClicked']);

function handleEndNodeClick(node: TreeNode) {
  emit('endNodeClicked', node);
}

</script>

<template>
  <div class="tree-container">
    <ul class="tree">
      <TreeItem v-for="node in nodes" :key="node.id" :node="node" @end-node-clicked="handleEndNodeClick"/>
    </ul>
  </div>
</template>


<style scoped>

.tree-container {
  display: flex;
  width: 100%;
  height: 100%;
}

.tree {
  list-style: none;
  padding-left: 0;
  width: 100%;
}
</style>