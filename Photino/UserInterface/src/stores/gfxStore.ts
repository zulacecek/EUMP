import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { GfxFile, SpriteType } from '@/structs/gfxStructs';
import { cachedVanillaIcons } from '@/scripts/appContext';

export const useGfxStore = defineStore('gfxStore', () => {
  const gfxFileList = ref(new Array<GfxFile>());
  
  function addGfxFile(gfxFile: GfxFile){
    gfxFileList.value.push(gfxFile);
  }

  function removeGfxFile(objectName: string) {
    gfxFileList.value = gfxFileList.value.filter(x => x.name !== objectName);
  }

  function getGfxFiles() : GfxFile[] {
    return gfxFileList.value;
  }

  function getGfxFile(objectName: string) : GfxFile | undefined{
    var object = gfxFileList.value.firstOrDefault(x=> x.name === objectName);
    if(object && cachedVanillaIcons) {
      object.sprites = cachedVanillaIcons.map(x => <SpriteType>({ name: x, textureFile: x }));
    }
    return object;
  }

  function isGfxLoaded(objectName: string) : boolean {
    return getGfxFile(objectName) !== undefined;
  }

  return { addGfxFile, removeGfxFile, getGfxFiles, getGfxFile, isGfxLoaded }
});