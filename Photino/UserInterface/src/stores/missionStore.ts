import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { MissionModuleSettings, MissionTree } from '@/structs/missionStructs'

export const useMissionTreeListStore = defineStore('missionTreeList', () => {
  const missionTreeList = ref(new Array<MissionTree>());
  var settings = <MissionModuleSettings>({ countryFlags: new Array(), possibleCountryFlags: new Array() });
  
  function addMissionTree(missionTree: MissionTree) {
    missionTreeList.value.push(missionTree);
  }

  function removeMissionTree(missionTreeName: String) {
    missionTreeList.value = missionTreeList.value.filter(x => x.name !== missionTreeName);
  }

  function getMissionTrees() : MissionTree[] {
    return missionTreeList.value;
  }

  function getMissionTree(missionTreeName: string) : MissionTree | undefined{
    return missionTreeList.value.firstOrDefault(x=> x.name === missionTreeName);
  }


  function getSettings() : MissionModuleSettings {
    return settings;
  }

  function isMissionTreeLoaded(missionTreeName: string) : boolean {
    return getMissionTree(missionTreeName) !== undefined;
  }

  return { addMissionTree, removeMissionTree, getMissionTrees, getMissionTree, getSettings, isMissionTreeLoaded }
});