<script setup lang="ts">

import { ref, defineProps, defineEmits, computed } from 'vue';
import type { TreeNode } from './treeNode';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps<{
  node: TreeNode;
  depth?: number;
}>();

var emit = defineEmits(['endNodeClicked']);

const open = ref(props.node.isOpen);
const isOpen = computed(() => {
  return props.node.isOpen || open.value;
});

const depth = props.depth ?? 0;

function toggle() {
  open.value = !open.value;
  props.node.isOpen = open.value;
}

function handleClick() {
  if (props.node.type === 'endNode') {
    emit('endNodeClicked', props.node);
  }
}

function displayOpenButton(node: TreeNode) {
  return node.type=== 'parentNode' && node.children?.length && node.children.length > 0;
}

</script>

<template>
  <li class="tree-item">
    <div class="tree-item-clickbox" v-context-menu="node.contextMenuObject" @click="toggle" @dblclick="handleClick" >
      <font-awesome-icon v-if="displayOpenButton(node)" :icon="isOpen ? 'fa-solid fa-angle-down' : 'fa-solid fa-angle-right'"/>
      <font-awesome-icon v-else icon="fa-solid fa-angle-right" class="empty-arrow"/>
      <span>
        <span>
          <font-awesome-icon v-if="node.type=== 'parentNode'" icon="fa-solid fa-folder" />
          <font-awesome-icon v-if="node.type=== 'endNode'" icon="fa-solid fa-file" />
        </span>
        <span class="node-label">
          {{ node.label }}
        </span>
      </span>
    </div>
    <ul v-if="isOpen && node.children">
      <TreeItem v-for="child in node.children" :key="child.id" :node="child" :depth="depth + 1" @end-node-clicked="$emit('endNodeClicked', $event)" />
    </ul>
  </li>
</template>

<style scoped>

ul, li {
  list-style: none;
  padding-left: 0.4rem;
}

.tree-item {
  user-select: none;
}

.tree-item-clickbox:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.toggle-btn {
  margin-right: 4px;
}

.node-label {
  margin-left: 4px;
}

.empty-arrow {
  visibility: hidden;
}

</style>