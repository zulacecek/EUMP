import { createMemoryHistory, createRouter } from 'vue-router'

// Page imports
import MissionTreeEditorPage from '../pages/MissionTreeEditorPage.vue'
import BranchingMissionTreeEditorPage from '../pages/BranchingMissionTreeEditorPage.vue'
import ModPage from '../pages/ModPage.vue';
import HomePage from '../pages/HomePage.vue';
import LocalizationsPage from '../pages/LocalizationsPage.vue';
import MapPage from '../pages/MapPage.vue';
import DataPage from '../pages/DataPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';


const routes = [
    { path: '/', component: HomePage },
    { path: '/mod', component: ModPage },
    { path: '/missions', component: MissionTreeEditorPage },
    { path: '/branchingmissions', component: BranchingMissionTreeEditorPage },
    { path: '/localizations', component: LocalizationsPage },
    { path: '/map', component: MapPage },
    { path: '/data', component: DataPage },
    { path: '/settings', component: SettingsPage }
  ]
  
export const router = createRouter({
  history: createMemoryHistory(),
  routes
})