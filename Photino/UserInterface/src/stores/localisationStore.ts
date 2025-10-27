import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LanguageLocalisation } from '@/structs/localisationStructs';

export const useLocalisationStore = defineStore('localisationList', () => {
  const localisationList = ref(new Array<LanguageLocalisation>());
  
  function addLocalisation(localisation: LanguageLocalisation){
    localisationList.value.push(localisation);
  }

  function removeLocalisation(localisationName: string) {
    localisationList.value = localisationList.value.filter(x => x.name !== localisationName);
  }

  function getLocalisations() : LanguageLocalisation[] {
    return localisationList.value;
  }

  function getLocalisation(localisationName: string) : LanguageLocalisation | undefined{
    return localisationList.value.firstOrDefault(x=> x.name === localisationName);
  }

  function isLocalisationLoaded(localisationName: string) : boolean {
    return getLocalisation(localisationName) !== undefined;
  }

  return { addLocalisation, removeLocalisation, getLocalisations, getLocalisation, isLocalisationLoaded }
});