import { ExternalEditorType } from "@/structs/editorStructs";
import { initializeMessageReceiver } from "../layerCommunication/baseLayerCommunication";
import { loadAppSettings } from "../repositories/settingsRepository";
import { useSettingsStore } from "@/stores/settingsStore";
import { checkAvailableEditors } from "../layerCommunication/systemCommunication";

export const isDebug = true;

export async function initApp() {
    initializeMessageReceiver();
    preventContextMenu();
    await initAppSettings();
    await checkExternalEditors();
}

export async function initAppSettings() {
    await loadAppSettings();
}

function preventContextMenu() {
    if(!isDebug) {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
}

export async function checkExternalEditors() {
    var settingsStore = useSettingsStore();
    var appSettings = settingsStore.getAppSettings();

    var editorsToCheck = [ExternalEditorType.Notepad as string, ExternalEditorType.NotepadPlusPlus as string, ExternalEditorType.VSCode as string, ExternalEditorType.VSCodium as string];
    
    appSettings.availableEditors = await checkAvailableEditors(editorsToCheck);
}