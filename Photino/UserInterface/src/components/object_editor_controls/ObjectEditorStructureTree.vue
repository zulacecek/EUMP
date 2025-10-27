<script setup lang="ts">
import type { AvailableObject } from '@/structs/genericStructs';
import Tabs from '../basic_controls/Tabs.vue';
import Tree from '../tree_view/Tree.vue';
import { getExportedObjectsTreeStructure, getObjectTreeStructure, handleObjectOpened, renderModStructureEventName } from './objectEditorStructureTreeExtender';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { TreeNodeType, type TreeNode } from '../tree_view/treeNode';
import { useModStore } from '@/stores/modStore';
import { registerForEvent, unregisterFromEvent } from '@/scripts/event_system/globalEventHandler';
import { getExportFolder, modExportedEventName } from '@/scripts/pdxExporters/exportUtils';
import IconButton from '../basic_controls/IconButton.vue';
import { getGoldenText } from '@/scripts/uiControllers/htmlController';
import type { TooltipOptions } from '@/scripts/uiControllers/tooltipDirective';
import { openFolder } from '@/scripts/layerCommunication/systemCommunication';
import { getProjectFolder } from '@/scripts/utils';
import ClearableTextbox from '../basic_controls/clearable_textbox/ClearableTextbox.vue';

var modExplorerNodes = ref<TreeNode[]>(new Array());
var exportedExplorerNodes = ref<TreeNode[]>(new Array());
const selectedTab = ref('mod');

const tabs = computed(() => {
    return [<AvailableObject>{ id: 'mod', name: 'Mod' }, <AvailableObject>{ id: 'exported', name: 'Exported' }];
});

const openedObjects = useModStore().getOpenedObjectsRef();
const filter = ref();

watch(openedObjects, () => {
    loadData();
}, { immediate: true, deep: true });

async function getModExplorerValuesToRender() {
    modExplorerNodes.value = await getObjectTreeStructure(filter.value);
}

async function getExportedExplorerValuesToRender() {
    exportedExplorerNodes.value = await getExportedObjectsTreeStructure(filter.value);
}

async function objectSelected(objectedSelected: TreeNode) {
    await handleObjectOpened(objectedSelected);
}

function tabSelected(object: AvailableObject) {
    selectedTab.value = object.id;
    loadData();
}

function loadData() {
    if(selectedTab.value === 'mod') {
        getModExplorerValuesToRender();
    }
    else {
        getExportedExplorerValuesToRender();
    }
}

function filterUpdate(value: string) {
    filter.value = value;
    loadData();
}

onMounted(() => {
    registerForEvent(modExportedEventName, "ObjectEditorStructureTree", getExportedExplorerValuesToRender);
    registerForEvent(renderModStructureEventName, "ObjectEditorStructureTree", getModExplorerValuesToRender);
});

onUnmounted(() => {
    unregisterFromEvent(modExportedEventName, "ObjectEditorStructureTree", getExportedExplorerValuesToRender);
    unregisterFromEvent(renderModStructureEventName, "ObjectEditorStructureTree", getModExplorerValuesToRender);
});

function realodStructure() {
    loadData();
}

function exploreFolder() {
    var folderPath = getExportFolder();
    if(selectedTab.value === 'mod') {
        folderPath = getProjectFolder();
    }

    openFolder(folderPath);
}

</script>

<template>
    <div class="flex-container-vertical tree-container">
        <div class="struture-actions-container flex-container golden-divider">
            <IconButton :icon="'fa-solid fa-rotate'" v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getGoldenText('Reload structure') }" :font-size="16" @click="realodStructure"/>
            <IconButton :icon="'fa-solid fa-folder-open'" v-tooltip="<TooltipOptions>{ disableLock: true, tooltip: getGoldenText('Explore folder') }" :font-size="16" @click="exploreFolder"/>
        </div>
        <div class="struture-filter-container flex-container golden-divider">
           <ClearableTextbox v-model="filter" :placeholder="'Search'" @update:model-value="filterUpdate" />
        </div>
        <Tree v-if="selectedTab === 'mod'" :nodes="modExplorerNodes" @end-node-clicked="objectSelected" />
        <Tree v-if="selectedTab === 'exported'" :nodes="exportedExplorerNodes" @end-node-clicked="objectSelected" />
        <div>
            <Tabs :objects="tabs" :selected-object-id="selectedTab" @object-selected="tabSelected"></Tabs>
        </div>
    </div>
</template>

<style scoped>
.struture-filter-container {
    padding: 3px;
    width: 100%;
    align-items: center;
}

.struture-actions-container {
    height: 2rem;
    background-color: var(--color-background-mute);
}

.tree-container {
    height: 100%;
    width: 100%;
    white-space: nowrap;
    flex-wrap: nowrap;
}

</style>