<script setup lang="ts">
import { ref, watch } from 'vue';
import Textbox from '../basic_controls/Textbox.vue';
import { handleObjectOpenedById } from '../object_editor_controls/objectEditorStructureTreeExtender';
import { ChangedObjectActionType, ObjectType } from '@/structs/genericStructs';
import Checkbox from '../basic_controls/Checkbox.vue';
import { addObjectChange } from '@/scripts/repositories/changedObjectRepository';
import { useSynchStore } from '@/stores/synchronizationStore';
import type { LanguageLocalisation } from '@/structs/localisationStructs';
import { useLocalisationStore } from '@/stores/localisationStore';

const props = defineProps({ objectName: String });

const objectData = ref<LanguageLocalisation>();
const objectNotExists = ref(false);
const objectType = ObjectType.Localisation;

async function openObject(objectName: string | undefined) {
    if(!objectName){
        return;
    }

    var objectStore = useLocalisationStore();
    var selectedObject = objectStore.getLocalisation(objectName);
    if(!selectedObject) {
        await handleObjectOpenedById(objectName, objectType);
        selectedObject = objectStore.getLocalisation(objectName);
        if(!selectedObject) {
            objectNotExists.value = true;
            return;
        }
    }

    objectData.value = selectedObject;
}

function addSelectedObjectChange() {
    if(!objectData.value) {
        return;
    }

    addObjectChange(ChangedObjectActionType.Update, objectType, objectData.value.name, objectData.value.name);
    var synchronizationStore = useSynchStore();
    synchronizationStore.setEditorValueNotSynchronizedFromDesigner(objectType, objectData.value.name);
}

watch(() => props.objectName, async (newObjectName) => {
   await openObject(newObjectName);
},
    { immediate: true}
);

</script>

<template>
    <div v-if="objectNotExists || !objectData">
        This localisation doesn't seem to exist :(
    </div>
    <div v-else class="flex-container-vertical object-properties-container">
        <Textbox v-model="objectData.name" :label="'Localisation name'" @update:modelValue="addSelectedObjectChange" />
        <Checkbox v-model="objectData.generateReplacementFile" :label="'Generate replacement file'" @update:modelValue="addSelectedObjectChange" />
    </div>
</template>

<style scoped>

.object-properties-container {
    width: 25%;
    padding: 1rem;
}

</style>