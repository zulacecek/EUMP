<script setup lang="ts">
import { onMounted, onUpdated } from 'vue'

// Imports for Vue/naive components
import missionSlot from './MissionSlot.vue'

// Imports for .ts structs
import type {  MissionNode, MissionSlot, MissionSlotViewModel, MissionTree, MissionTreeViewModel, SelectedMission } from '../../structs/missionStructs'
import { getCurrentRemPixels } from '../../scripts/uiControllers/uiController';
import { getMissionNodeOriginalMissionSlot, getRequiredMissions } from '@/scripts/repositories/missionTreeRepository';

// Defines
var props = defineProps<{ viewModel: MissionTreeViewModel }>()
const emit = defineEmits(['selectedMissionChanged', 'missionAdded', 'missionPositionChanged', 'missionSlotChanged', 'missionCloned', 'missionRemoved', 'missionInserted']);
defineExpose({ rerenderMissionConnections });

// Typescript functions
function missionSelectionChange(changeArguments: SelectedMission) {
   emit('selectedMissionChanged', changeArguments);
}

function emitMissionAdded(addArguments: any) {
    emit('missionAdded', addArguments);
}

function emitMissionPositionChange(change: number) {
    emit('missionPositionChanged', change);
}

function emitMissionSlotChange(change: number) {
    emit('missionSlotChanged', change);
}

function emitMissionCloned(missioNode: MissionNode) {
  emit('missionCloned', missioNode);
}

function emitMissionRemoved(missioNode: MissionNode) {
  emit('missionRemoved', missioNode);
}

function emitMissionInserted(missioNode: MissionNode, position: number) {
  emit('missionInserted', missioNode, position);
}

function recalculateRequiredMissions(parentMission: MissionNode, missionTree: MissionTree, offset: DOMRect) {
  if(parentMission.position == 1 || !missionTree) {
    return;
  }

  var missions = getRequiredMissions(parentMission.requiredMissionIds, missionTree);

  missions.forEach(requiredMission => {
    calculateMissionsConnection(parentMission, requiredMission, offset);
  });
}

function calculateMissionsConnection(parentMission: MissionNode, requiredMission: MissionNode, offset: DOMRect) : any[] {
  var yDifference =  parentMission.position - requiredMission.position;
  if(yDifference <= 0){
    return [];
  }

  var parentElement = document.getElementById(parentMission.id) as HTMLElement;
  if(!parentElement) {
    return [];
  }  
  const parentRect = parentElement.getBoundingClientRect();
  const parentWidth = parentRect.width;
  const parentX = parentRect.x - offset.x;
  const parentY = parentRect.y - offset.y;

  var requredMissionElement = document.getElementById(requiredMission.id) as HTMLElement;
  const requredMissionRect = requredMissionElement.getBoundingClientRect();
  const requredMissionWidth = requredMissionRect.width;
  const requredMissionHeight = requredMissionRect.height;
  const requredMissionX = requredMissionRect.x - offset.x;
  const requredMissionY = requredMissionRect.y - offset.y;

  var polylinePoints = [];

  var childConnectionPoint = { x: requredMissionX + requredMissionWidth / 2, y: requredMissionY + requredMissionHeight };
  polylinePoints.push(childConnectionPoint);

  offsetMultipler = 0.5;
  var parentMissionSlot = getMissionNodeOriginalMissionSlot(parentMission, props.viewModel.mission_tree);
  var requiredMissionSlot = getMissionNodeOriginalMissionSlot(requiredMission, props.viewModel.mission_tree);
  if(parentMissionSlot.number != requiredMissionSlot.number) {
    var offsetMultipler = 0.25;
    if(parentMissionSlot.number < requiredMissionSlot.number) {
      offsetMultipler = 0.75;
    }

    var connectingPoints = calculateXStepPoints(parentRect, requredMissionRect, offset, offsetMultipler);
    polylinePoints.push(connectingPoints[0]);
    
    if(connectingPoints[1]) {
      polylinePoints.push(connectingPoints[1]);
    }
  }

  var parentConnectionPoint = { x: (parentX + parentWidth * offsetMultipler), y: parentY };
  polylinePoints.push(parentConnectionPoint);

  var color = "rgba(158, 130, 38)";
  if(Math.abs(parentMissionSlot.number - requiredMissionSlot.number) > 0 && Math.abs(parentMission.position - requiredMission.position) > 1) {
    color = "darkred";
    polylinePoints.push({ x: parentConnectionPoint.x - 5 , y: parentConnectionPoint.y - 5 });
    polylinePoints.push({ x: parentConnectionPoint.x + 5, y: parentConnectionPoint.y + 5 });
    polylinePoints.push({ x: parentConnectionPoint.x, y: parentConnectionPoint.y});
    polylinePoints.push({ x: parentConnectionPoint.x + 5, y: parentConnectionPoint.y - 5 });
    polylinePoints.push({ x: parentConnectionPoint.x - 5, y: parentConnectionPoint.y + 5 });
  }
  else {
    polylinePoints.push({ x: parentConnectionPoint.x - 6 , y: parentConnectionPoint.y - 7 });
    polylinePoints.push({ x: parentConnectionPoint.x, y: parentConnectionPoint.y});
    polylinePoints.push({ x: parentConnectionPoint.x + 6 , y: parentConnectionPoint.y - 7 });
  }

  var newPolyline = instantiatePolyline(polylinePoints, "3", color);
  var newPolyline1 = instantiatePolyline(polylinePoints, "8", "black");
  var svg = document.getElementById('background-svg') as HTMLElement;
  svg.appendChild(newPolyline1);
  svg.appendChild(newPolyline);

  return polylinePoints;
}

function calculateXStepPoints(parent: DOMRect, child: DOMRect, offset: DOMRect, offsetMultipler: number) : any[] {
  var points = [];
  var x = child.x - offset.x + child.width / 2;
  var y = parent.y - offset.y - getCurrentRemPixels();
  points.push({ x, y });

  x = parent.x - offset.x + parent.width * offsetMultipler;
  y = parent.y - offset.y - getCurrentRemPixels();
  points.push({ x, y });

  return points;
}

function instantiatePolyline(points : any[], strokeWidth: string, color: string) : SVGPolygonElement {
  var polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  var pointsString = points.map(point => `${point.x},${point.y}`).join(' ');
  polyline.setAttribute('points', pointsString);
  polyline.setAttribute('stroke', color);
  polyline.setAttribute('stroke-width', strokeWidth);
  polyline.setAttribute('fill', "none");
  return polyline;
}

function rerenderMissionConnections() {  
  var svg = document.getElementById('background-svg') as HTMLElement;
  var svgBoundingBox = svg.getBoundingClientRect();

  if(!svg) {
    return;
  }
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  if(props?.viewModel?.mission_tree?.missionSlots?.constructor.name != 'Array'){
    return;
  }

  props?.viewModel?.mission_tree?.missionSlots?.forEach(slot => {
    slot?.missions?.forEach(mission => {
      recalculateRequiredMissions(mission, props.viewModel.mission_tree, svgBoundingBox);
    });
  });
}

function handleSizeChange(entries: ResizeObserverEntry[]) {
  var svg = document.getElementById('background-svg') as HTMLElement;
  if(!svg){
    return;
  }

  for (const entry of entries) {          
    const { width } = entry.contentRect;
    const height = entry.target.scrollHeight;
    svg.removeAttribute('viewBox');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}` );
  }
};

function getMissionSlotViewModel(missionSlot: MissionSlot) : MissionSlotViewModel {
  var missionSlotViewModel = <MissionSlotViewModel>({
    mission_slot: missionSlot,
    settings: props.viewModel.settings,
    mission_tree: props.viewModel.mission_tree
  });
  
  // rerenderMissionConnections();
  return missionSlotViewModel;
}

onMounted(async () => {
  var treeScrollElement = document.getElementById('mission-tree-scroll-content') as HTMLElement;
  if(treeScrollElement) {
    const resizeObserver = new ResizeObserver(handleSizeChange);
    resizeObserver.observe(treeScrollElement);
  }

  rerenderMissionConnections();
});

onUpdated(() => {
  rerenderMissionConnections();
});

</script>

<template>    
<div class="mission-tree-container flex-container-vertical">
  <h2 class="mission-tree-title">
    <label class="simplest-text-input"> {{ props.viewModel.mission_tree.name  }} </label>
  </h2>
  <div id="mission-tree-scroll-content" class="mission-tree-scroll golden-border">
    <svg id="background-svg" class="background-svg" viewBox="0 0 550 950">
    </svg>
    <div class="flex-container mission-tree-scroll-content">
      <div class="grid-item" v-for="slot in props.viewModel.mission_tree.missionSlots">
          <missionSlot :view-model="getMissionSlotViewModel(slot)" 
          @selected-mission-changed="missionSelectionChange" 
          @mission-added="emitMissionAdded" 
          @mission-slot-changed="emitMissionSlotChange" 
          @mission-position-changed="emitMissionPositionChange" 
          @mission-cloned="emitMissionCloned"
          @mission-inserted="emitMissionInserted"
          @mission-removed="emitMissionRemoved"
          />
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>

.mission-tree-scroll-content {
  height: 100%;
}

.background-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.mission-tree-scroll {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  background-color: var(--color-background-mute)
}

.mission-tree-container {
  height: 100%;
}

.mission-tree-title {
  width: 100%;
  text-align: center;
}

.grid-container {
  display: grid;
  gap: 2rem 1rem;
}

.grid-item {
  width: 20%;
}

</style>
