<script setup lang="ts">
import { useSettingsStore } from '@/stores/settingsStore';
import { computed, ref } from 'vue';
import FilteredDropdown from '@/components/basic_controls/filtered_dropdown/FilteredDropdown.vue'
import type { FilteredDropdownOption } from '@/components/basic_controls/filtered_dropdown/filteredDropdownExtender';
import { addObjectChange } from '@/scripts/repositories/changedObjectRepository';
import { ChangedObjectActionType, ObjectType } from '@/structs/genericStructs';
import { AppSettingsFileName } from '@/scripts/repositories/settingsRepository';
import FilePicker from '@/components/basic_controls/file_picker/FilePicker.vue';
import { ExternalEditorType, type CustomExternalEditor } from '@/structs/editorStructs';
import { getFileName } from '@/scripts/utils';
import MultiSelector from '@/components/basic_controls/multi_selector/MultiSelector.vue';
import type { MultiSelectorValue } from '@/components/basic_controls/multi_selector/multiSelectorExtender';

const locatedEditor = ref();
const filePickerRef = ref();

const appSettingsData = computed(() => {
    var settingsStore = useSettingsStore();
    return settingsStore.getAppSettings();
});

const manuallyAddedEditors = computed(() => {
    if(!appSettingsData.value.customLocatedEditors) {
        return new Array();
    }

    return appSettingsData.value.customLocatedEditors.map(x => <MultiSelectorValue>({ key: x.path, label: x.name, tooltip: x.path }))
});

const dropdownOptions = computed(() => {
    var availableEditors = appSettingsData.value.availableEditors;
    var options = new Array();
    options.push(<FilteredDropdownOption>({ 
        key: ExternalEditorType.Default,
        label: 'default'
    }));

    for(var editor of availableEditors) {
        options.push(
             <FilteredDropdownOption>({
                key: editor,
                label: editor
            })
        )
    }

    var manualEditors = appSettingsData.value.customLocatedEditors;
    for(var manualEditor of manualEditors) {
        options.push(
             <FilteredDropdownOption>({
                key: manualEditor.path,
                label: manualEditor.name
            })
        )
    }
    
    return options;
});

function changeExternalEditor(newValue: string) {
    appSettingsData.value.externalEditor = newValue;
    addSettingsChanged();
}

function addSettingsChanged() {
    addObjectChange(ChangedObjectActionType.Update, ObjectType.AppSettings, AppSettingsFileName, AppSettingsFileName);
}

function addCustomEditor() {
    if(!appSettingsData.value.customLocatedEditors){
        appSettingsData.value.customLocatedEditors = new Array();
    }

    var customExternalEditor = <CustomExternalEditor>({
        name: getFileName(locatedEditor.value),
        path: locatedEditor.value
    });

    appSettingsData.value.customLocatedEditors.push(customExternalEditor);
    locatedEditor.value = '';
    filePickerRef.value?.resetValue();
    addSettingsChanged();
}

function customEditorRemoved(removedEditor: string) {
    if(!appSettingsData.value.customLocatedEditors){
        return;
    }

    appSettingsData.value.customLocatedEditors = appSettingsData.value.customLocatedEditors.filter(x => x.path !== removedEditor);
    if(appSettingsData.value.externalEditor === removedEditor) {
        appSettingsData.value.externalEditor = ExternalEditorType.Default;
    }

    addSettingsChanged();
}

</script>
<template>
    <div v-if="appSettingsData" class="app-settings-container">
        <h3> App settings </h3>
        <FilteredDropdown
            :availableOptions="dropdownOptions ?? new Array()" 
            :selectedOptionKey="appSettingsData?.externalEditor"
            :displayWithoutCategories="true"
            :dropdownOptionMaxHeight="250"
            :label="'External editor'"
            @value-changed="changeExternalEditor"
        />
        <div class="hint-text">
            The app natively supports: "Notepad", "Notepad++", "VSCode", "VSCodium".
            If you don't see these in the dropdown, please consult the internet on how to add them to the windows PATH. Especially Notepad++ is guilty of not being added automatically by the installer.
        </div>
        <h3> Locate editor manually </h3>
        <MultiSelector style="margin-bottom: 5px;" :label="'Munally added editors'" :values="manuallyAddedEditors" :allowCustomValue="false" @value-removed="customEditorRemoved" />
        <FilePicker ref="filePickerRef" :label="'Editor path'" v-model="locatedEditor" :selectFolder="false" :displaySelectedPath="true" />
        <button class="button" :disabled="!locatedEditor" @click="addCustomEditor"> Add located editor </button>
    </div>
    <div v-else>
        Something went wrong and the settings don't exist :(
    </div>
</template>
<style scoped>

.app-settings-container {
    width: 33%;
    padding: 1rem;
}
</style>