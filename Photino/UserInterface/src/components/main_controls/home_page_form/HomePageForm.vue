awa<script setup lang="ts">
import IconButton from '@/components/basic_controls/IconButton.vue';
import type { ModFormInputModel } from '@/components/mod_form/modFormInputModel';
import NewModForm from '@/components/mod_form/NewModForm.vue';
import { saveVanillaIconsGfxFile } from '@/scripts/appContext';
import { fireEvent } from '@/scripts/event_system/globalEventHandler';
import { missionIconsLoadedEventName } from '@/scripts/event_system/missionEvents';
import type { FileSystemCachedObject } from '@/scripts/file_system/fileSystemCache';
import { readFile } from '@/scripts/file_system/fileSystemService';
import { type openFileDialogRequest } from '@/scripts/layerCommunication/fileSystemCommunication';
import { renderVanillaIcons } from '@/scripts/layerCommunication/gfx/gfxCommunication';
import { sendModToBackend } from '@/scripts/layerCommunication/objects/objectCommunication';
import { loadOpenedObjects } from '@/scripts/repositories/editorRepository';
import { readCachedVanillaMissionIcons } from '@/scripts/repositories/iconRepository';
import { createNewMod, loadSavedCreateModData, saveCreateModDataForNextUse, saveMod } from '@/scripts/repositories/modRepository';
import { createNewAndSaveAppSettings, createNewAndSaveModSettings, loadModSettings } from '@/scripts/repositories/settingsRepository';
import { displayGlobalLoader } from '@/scripts/uiControllers/appController';
import { useModStore } from '@/stores/modStore';
import type { GfxFile } from '@/structs/gfxStructs';
import type { Mod } from '@/structs/modStructs';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

var router  = useRouter();
var modStore = useModStore();
var formData = ref(<ModFormInputModel>({ supportedVersion:'1.36.*', modVersion: '0.1.1' }));

var showNewModForm = ref();
var showButtons = ref(true);

onMounted(async () => {
    await getSavedFormData();
});

function navigateToMain(){
    router.push('/main');
}

function toggleNewModForm(visibility: boolean) {
    showNewModForm.value = visibility;
    showButtons.value = !visibility;
}

async function confirmNewModCreation() {
    var data = formData.value;
    var newMod = createNewMod(data.projectName, data.modName, data.gameFolder, data.workingFolder, data.modFolder, data.modVersion, data.supportedVersion, true);
    modStore.setMod(newMod);
    
    saveCreateModDataForNextUse(newMod);

    saveMod(newMod);
    await sendModToBackend(newMod);
    await initVanillaIcons();
    createNewAndSaveModSettings();
    createNewAndSaveAppSettings();
    navigateToMain();
}

async function openExistingMod() {
    var dialogParameters = <openFileDialogRequest>({ filterName: "EUM mod", allowedExtension: ['eu4mod'],  selectFolder: false });
    var mod = await readFile<Mod>(dialogParameters);
    if(!mod) {
        return;
    }

    displayGlobalLoader('Loading mod');

    modStore.setMod(mod);
    await sendModToBackend(mod);
    await initVanillaIcons();
    await loadOpenedObjects();
    await loadModSettings();
    navigateToMain();
}

async function initVanillaIcons() {
    var vanillaIcons = await readCachedVanillaMissionIcons();
    if(vanillaIcons) {
        await processVanillaIcons(vanillaIcons);
        return;
    }

    renderVanillaIcons().then(async () => {
        var vanillaIcons = await readCachedVanillaMissionIcons();
        if(vanillaIcons) {
            await processVanillaIcons(vanillaIcons);
        }
    });
}   

async function processVanillaIcons(vanillaMissionIconsGfxFile: GfxFile) {
    saveVanillaIconsGfxFile(vanillaMissionIconsGfxFile);
    fireEvent(missionIconsLoadedEventName);
}

async function getSavedFormData() {
    var savedData = await loadSavedCreateModData();

    formData.value.gameFolder = savedData.eu4Directory;
    formData.value.modFolder = savedData.eu4ModDirectory;
    formData.value.workingFolder = savedData.workDirectory;
}

</script>

<template>
    <div class="flex-container-vertical home-view-container">
        <h1> EUM </h1>
        <span v-if="showButtons"> 
            <IconButton class="button home-view-button" @click="toggleNewModForm(true)" :icon="'fa-solid fa-file-circle-plus'" :text="'New Mod'" :font-size="20"/>
            <IconButton class="button home-view-button" @click="openExistingMod" :icon="'fa-solid fa-file-circle-plus'" :text="'Open existing'" :font-size="20"/>
            <IconButton class="button home-view-button hidden" :icon="'fa-solid fa-file-circle-plus'" :text="'Import'" :font-size="20"/>
        </span>

        <NewModForm v-if="showNewModForm" v-model="formData" @back-button-click="toggleNewModForm(false)" @next-button-click="confirmNewModCreation" />
    </div>
</template>

<style scoped>

.home-view-button{
  margin: 3px;
  width: 12rem;
}

.home-view-container {
  height: 100%;
  width: 25%;
  margin-top: 10%;
  margin-left: 25%;
}

</style>