import type { GfxFile } from "@/structs/gfxStructs";
import type { TriggerOptions, ProvinceOptions, TreeItemOption } from "../structs/missionStructs";

export const modVersion = '0.2.12';

export var dataDir = "";
export function saveDataDir(dir: string) {
    dataDir = `${dir}/`;
}

export var vanillaIconsGfxFile : GfxFile | undefined;
export function saveVanillaIconsGfxFile(gfxFile: GfxFile | undefined) {
    vanillaIconsGfxFile = gfxFile;
}

export var vsCodeAvailable = false;
export function saveVsCodeAvailablity(isAvailable: boolean){
    vsCodeAvailable = isAvailable;
}

export var availableTriggers = new Array<TriggerOptions>();
export function saveAvailableTriggers(triggers: TriggerOptions[]) {
    availableTriggers = triggers;
}

export var availableTradeNodes = new Array<string>();
export function saveAvailableTradeNodes(tradeNodes: string[]) {
    availableTradeNodes = tradeNodes;
}

export var availableTags = new Array<string>();
export function saveAvailableTags(tags: string[]) {
    availableTags = tags;
}

export var availableAreas = new Array<string>();
export function saveAvailableAreas(areas: string[]) {
    availableAreas = areas;
}

export var availableTreeItems = new Array<TreeItemOption>();
export var keyAvailableTreeItemMap = new Map();
export function appendAvailableTreeItems(treeItems: TreeItemOption[]){
    treeItems.forEach(treeItem => {
        if(availableTreeItems.filter(x => x.Key == treeItem.Key).length == 0){
            availableTreeItems.push(treeItem);
        }
    });
}

export function calculateAvailableItemsMap() {
    keyAvailableTreeItemMap = new Map(availableTreeItems.map(x => [x.Key, x]));
}

export function saveAvailableTreeItems(treeItems: TreeItemOption[]) {
    availableTreeItems = treeItems;
}

export var availableScopes = ["ROOT", "FROM", "PREV", "THIS", "owner", "controller", "overfloard", "capital", "emperor"];
export var availableBinaryOperators = ["OR", "AND", "NOT"];

export var availableProvinces = new Array<ProvinceOptions>();
export function saveAvailableProvinces(provinces: ProvinceOptions[]) {
    availableProvinces = provinces;
}

export const gameLanguages = ["english", "french", "spanish", "german"];

