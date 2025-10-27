import { ref } from 'vue'
import { defineStore } from 'pinia'
import type {  ModSettings } from '@/structs/modStructs';
import type { AppSettings } from '@/structs/editorStructs';

export const useSettingsStore = defineStore('settingsStore', () => {
    const modSettings = ref();
    const appSettings = ref();

    function getModSettings() : ModSettings {
        return modSettings.value;
    }

    function getAppSettings() : AppSettings {
        return appSettings.value;
    }

    function setModSettings(settings: ModSettings) {
        modSettings.value = settings;
    }

    function setAppSettings(settings: AppSettings) {
        appSettings.value = settings;
    }

  return { getModSettings, getAppSettings, setModSettings, setAppSettings }
});