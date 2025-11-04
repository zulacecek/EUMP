<script setup lang="ts">
import Checkbox from '@/components/basic_controls/Checkbox.vue';
import FilteredDropdown from '@/components/basic_controls/filtered_dropdown/FilteredDropdown.vue';
import type { FilteredDropdownOption } from '@/components/basic_controls/filtered_dropdown/filteredDropdownExtender';
import ModForm from '@/components/mod_form/ModForm.vue';
import type { ModFormInputModel } from '@/components/mod_form/modFormInputModel';
import { addObjectChange } from '@/scripts/repositories/changedObjectRepository';
import { ModSettingsFileName } from '@/scripts/repositories/settingsRepository';
import { useModStore } from '@/stores/modStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ChangedObjectActionType, ObjectType } from '@/structs/genericStructs';
import { ExportType, type Mod } from '@/structs/modStructs';
import { computed, ref, watch } from 'vue';

var inputModel = ref();

var modSettings = computed(() => {
    var settingsStore = useSettingsStore();
    return settingsStore.getModSettings();
});

var modData = computed(() => {
    var modStore = useModStore();
    var mod = modStore.getMod();
    return mod as Mod;
});

watch(() => modData.value, (value: Mod) => {
    inputModel.value = getModFormInputModel(value);
}, { immediate: true });

watch(() => inputModel.value, ((value) => {
    updateModValues(value);
}), { deep: true });

function getModFormInputModel(mod: Mod) {
    return <ModFormInputModel>
        ({ 
            gameFolder: mod.eu4Directory, 
            modFolder: mod.eu4ModDirectory, 
            workingFolder: mod.workDirectory, 
            modName: mod.modName, 
            projectName: mod.projectName, 
            supportedVersion: mod.supportedVersion, 
            modVersion: mod.modVersion 
        });
}

function updateModValues(value: ModFormInputModel) {
    var modStore = useModStore();
    var mod = modStore.getMod();
    if(!mod) {
        return;
    }

    mod.eu4Directory = value.gameFolder;
    mod.eu4ModDirectory = value.modFolder;
    mod.modName = value.modName;
    mod.supportedVersion = mod.supportedVersion;
    mod.modVersion = mod.modVersion;
    settingsChanged();
}

function settingsChanged() {
    addObjectChange(ChangedObjectActionType.Update, ObjectType.ModSettings, ModSettingsFileName, ModSettingsFileName);
}

function getExportTypeOptions() : FilteredDropdownOption[] {
    return [
        <FilteredDropdownOption>({
            key: ExportType.WorkingFolder,
            label: 'Working folder'
        }),
        <FilteredDropdownOption>({
            key: ExportType.ModFolder,
            label: 'Mod folder'
        }),
    ]
}

function exportTypeChanged(selectedOption: string) {
    modSettings.value.exportType = selectedOption as ExportType;
    settingsChanged();
}

</script>

<template>
    <div v-if="modSettings" class="mod-settings-container">
        <h3> Mod settings </h3>
        <div class="flex-container-vertical">
            <div class="golden-divider" style="margin-bottom: 1rem;">
                <ModForm v-if="inputModel" :modelValue="inputModel" :disableModName="true" :disableProjectName="true" :disableWorkingFolder="true" />
            </div>
            <div>
                <h3> Other options </h3>
                <Checkbox :label="'Beautify saved objects json'" v-model="modSettings.beautifySavedObjects" @value-changed="settingsChanged"/>
                <div class="hint-text">
                    This will cause the json of saved files to be "beautified" into readable form but it will significantly increase the file size. This option is useful if you put your mod into git.
                </div>
                <FilteredDropdown
                    :availableOptions="getExportTypeOptions()" 
                    :selectedOptionKey="modSettings.exportType"
                    :displayWithoutCategories="true"
                    :dropdownOptionMaxHeight="250"
                    :label="'Export directly to game mod folder'"
                    @value-changed="exportTypeChanged" 
                />
            </div>
        </div>
    </div>
    <div v-else>
        Something went wrong and the settings don't exist :(
    </div>
</template>

<style scoped>

.mod-settings-container {
    width: 33%; 
    padding: 1rem;
}

</style>