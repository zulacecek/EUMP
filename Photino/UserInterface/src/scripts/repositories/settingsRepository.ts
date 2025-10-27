import { ChangedObjectActionType, ObjectType, type AvailableObject } from "@/structs/genericStructs";
import { formatFileSystemPath, getFileSavePath } from "../utils";
import { requestObjectFromFile, saveObject } from "../layerCommunication/fileCommunication";
import { useSettingsStore } from "@/stores/settingsStore";
import type { ModSettings } from "@/structs/modStructs";
import { ExternalEditorType, type AppSettings } from "@/structs/editorStructs";
import { getUserDocumentFolder } from "../layerCommunication/fileSystemCommunication";
import { addObjectChange, hasObjectChanged, popObjectChange } from "./changedObjectRepository";
import { sendModSettingsToBackend } from "../layerCommunication/objects/objectCommunication";
export const AppSettingsFileName = 'app_settings';
export const AppSettingsSaveFolder = '.settings';

export const ModSettingsFileName = 'mod_settings';
export const ModSettingsSaveFolder=  '.settings';

export async function getAppSettingsSaveFolder() : Promise<string> {
    var documentFolder = await getUserDocumentFolder();
    return formatFileSystemPath(documentFolder, AppSettingsSaveFolder);
}

export async function getAppSettingsSavePath() : Promise<string> {
    var saveFolder = await getAppSettingsSaveFolder();
    return formatFileSystemPath(saveFolder, AppSettingsFileName);
}

export async function saveAppSettings() {
    var settingsStore = useSettingsStore();
    var appSettings = settingsStore.getAppSettings();
    if(hasObjectChanged(AppSettingsFileName, ObjectType.AppSettings)) {
        saveObject(await getAppSettingsSavePath(), appSettings);
        popObjectChange(AppSettingsFileName);
    }
}

export async function loadAppSettings() {
    var savePath = await getAppSettingsSavePath();
    var settings = await requestObjectFromFile<AppSettings>(savePath);
    if(!settings) {
        settings = createNewAndSaveAppSettings();
    }

    var settingsStore = useSettingsStore();
    settingsStore.setAppSettings(settings);
}

export function createAppSettings() : AppSettings {
    return <AppSettings>({
        availableEditors: new Array(),
        customLocatedEditors: new Array(),
        externalEditor: ExternalEditorType.Default
    });
}

export function createNewAndSaveAppSettings() : AppSettings {
    var appSettings = createAppSettings();
    var settingStore = useSettingsStore();
    settingStore.setAppSettings(appSettings);
    addObjectChange(ChangedObjectActionType.New, ObjectType.AppSettings, AppSettingsFileName, AppSettingsFileName);
    saveAppSettings();
    return appSettings;
}

export function getModSettingsSaveFolder() : string {
    return getFileSavePath(ModSettingsSaveFolder);
}

export function getModSettingsSavePath() : string {
    var saveFolder = getModSettingsSaveFolder();
    return formatFileSystemPath(saveFolder, ModSettingsFileName);
}

export async function saveModSettings() {
    var settingsStore = useSettingsStore();
    var modSettings = settingsStore.getModSettings();
    if(hasObjectChanged(ModSettingsFileName, ObjectType.ModSettings)) {
        saveObject(getModSettingsSavePath(), modSettings);
        await sendModSettingsToBackend(modSettings);
        popObjectChange(ModSettingsFileName);
    }
}

export async function loadModSettings() {
    var savePath = getModSettingsSavePath();
    var settings = await requestObjectFromFile<ModSettings>(savePath);
    if(!settings) {
        settings = createNewAndSaveModSettings();
    }

    var settingsStore = useSettingsStore();
    settingsStore.setModSettings(settings);
    await sendModSettingsToBackend(settings);
}

export function createNewAndSaveModSettings() : ModSettings {
    var modSettings = createModSettings();
    var settingStore = useSettingsStore();
    settingStore.setModSettings(modSettings);
    addObjectChange(ChangedObjectActionType.New, ObjectType.ModSettings, ModSettingsFileName, ModSettingsFileName);
    saveModSettings();
    return modSettings;
}

export function createModSettings() : ModSettings {
    return <ModSettings>({
        beautifySavedObjects: true
    });
}

export function createAvailableObjectForAppSettings() {
    return <AvailableObject>({
        name: AppSettingsFileName,
        id: AppSettingsFileName,
        type: ObjectType.AppSettings
    });
}

export function createAvailableObjectForModSettings() {
    return <AvailableObject>({
        name: ModSettingsFileName,
        id: ModSettingsFileName,
        type: ObjectType.ModSettings
    });
};