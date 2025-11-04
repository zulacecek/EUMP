import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { AvailableObject, ChangedObjects } from '@/structs/genericStructs';
import type { Mod } from '@/structs/modStructs';

export const useModStore = defineStore('modStore', () => {
  const mod = ref<Mod>();
  var openedObjects = ref(new Array<AvailableObject>());
  var changedObjects = ref(<ChangedObjects>({ changedObjects: new Map() }));

  function setMod(newMod: Mod)
  {
    mod.value = newMod;
  }

  function getMod() : Mod | undefined {
    return mod.value;
  }

  function openObject(openedObject: AvailableObject) {
    var existingObject = openedObjects.value.firstOrDefault(x=> x.id === openedObject.id);
    if(!existingObject) {
      openedObjects.value.push(openedObject);
    }
  }

  function closeObject(objectId: string) {
    var objectInList = openedObjects.value.firstOrDefault(x=> x.id == objectId);
    if(objectInList) {
      var index = openedObjects.value.indexOf(objectInList);
      openedObjects.value.splice(index, 1);
    }
  }

  function setOpenedObjects(newObjects: AvailableObject[]) {
    openedObjects.value = newObjects;
  }

  function getOpenedObjects() {
    return openedObjects.value;
  }

  function getOpenedObject(objectName: string) {
    return openedObjects.value.firstOrDefault(x=> x.id === objectName);
  }

  function getOpenedObjectsRef() {
    return openedObjects;
  }

  function getChangedObjects() {
    return changedObjects.value;
  }

  return { setMod, getMod, openObject, closeObject, getOpenedObjects, getOpenedObject, setOpenedObjects, getChangedObjects, getOpenedObjectsRef }
});