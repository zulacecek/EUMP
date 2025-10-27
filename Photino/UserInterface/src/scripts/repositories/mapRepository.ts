// import { computed } from "vue";
// import type{ DataBlockDeserilized } from "../pdxImporters/pdxSyntaxParser";
// import { store } from "../storage";
// import type { Mod } from "../../structs/mission_structs";

// var modData = computed(() => store.getters.getMod as Mod);

// export var defaultMapInfo : DataBlockDeserilized;
// export function saveDafaultMapInfo(mapInfo: DataBlockDeserilized) {
//     defaultMapInfo = mapInfo;
// }

// export var savedClimateInfo : DataBlockDeserilized;
// export function saveclimateInfo(climateInfo: DataBlockDeserilized) {
//     savedClimateInfo = climateInfo;
// }

// export const waterIds = computed(() => {
//     if(!modData.value.map_info) {
//         return;
//     }

//     var lakes = modData.value.map_info.lakes;
//     var seas = modData.value.map_info.sea_starts;
    
//     if(lakes && seas) {
//         var result = lakes?.concat(seas);
//         return new Set(result);
//     }
// });

// export const wastelandIds = computed(() => {
//     var wastelands = modData.value.climates.filter(x=> x.name == 'impassable').flatMap(x => x.provinces.map(y => y));
//     return new Set(wastelands);
// });

// export const provinceIdToClimate = computed(() => {
//     var tropical = new Map(modData.value.climates.filter(x=> x.name == 'tropical').flatMap(x => x.provinces.map(y => [y, 'tropical'])));
//     var arid = new Map(modData.value.climates.filter(x=> x.name == 'arid').flatMap(x => x.provinces.map(y => [y, 'arid'])));
//     var arctic = new Map(modData.value.climates.filter(x=> x.name == 'arctic').flatMap(x => x.provinces.map(y => [y, 'arctic'])));
    
//     return new Map([...tropical, ...arid, ...arctic]);
// });

// export const provinceIdToWeather = computed(() => {
//     var mildWinter = new Map(modData.value.climates.filter(x=> x.name == 'mild_winter').flatMap(x => x.provinces.map(y => [y, 'mild_winter'])));
//     var normalWinter = new Map(modData.value.climates.filter(x=> x.name == 'normal_winter').flatMap(x => x.provinces.map(y => [y, 'normal_winter'])));
//     var severeWinter = new Map(modData.value.climates.filter(x=> x.name == 'severe_winter').flatMap(x => x.provinces.map(y => [y, 'severe_winter'])));

//     var mildMonsoon = new Map(modData.value.climates.filter(x=> x.name == 'mild_monsoon').flatMap(x => x.provinces.map(y => [y, 'mild_monsoon'])));
//     var normalMonsoon = new Map(modData.value.climates.filter(x=> x.name == 'normal_monsoon').flatMap(x => x.provinces.map(y => [y, 'normal_monsoon'])));
//     var severeMonsoon = new Map(modData.value.climates.filter(x=> x.name == 'severe_monsoon').flatMap(x => x.provinces.map(y => [y, 'severe_monsoon'])));

//     return new Map([...mildWinter, ...normalWinter, ...severeWinter, ...mildMonsoon, ...normalMonsoon, ...severeMonsoon]);
// });

// export const provinceIdToArea = computed(() => {
//     return new Map(modData.value.areas.flatMap(area => area.province_ids.map(id => [id, area])));
// });

// export const areaToRegion = computed(() => {
//     return new Map(modData.value.regions.flatMap(region => region.areas.map(area => [area, region])));
// });

// export const regionToSuperRegion = computed(() => {
//     return new Map(modData.value.super_regions.flatMap(superRegion => superRegion.regions.map(region => [region, superRegion])));
// });

// export const provinceIdToColonialRegion = computed(() => new Map(modData.value.colonial_regions.flatMap(colonial => colonial.provinces.map(provinceId => [provinceId, colonial] ) )));