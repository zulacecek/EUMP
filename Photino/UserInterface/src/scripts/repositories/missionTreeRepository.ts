import { type MissionModuleSettings, type MissionEffect, type MissionNode, type MissionProvincesToHighlight, type MissionSlot, type MissionTree, type MissionTrigger, type MissionSlotPotential } from "../../structs/missionStructs";
import { deepClone, enhanceFileNameWithExtension, formatFileSystemPath, getFileSavePath, removeExtensionFromFileName, toSnakeCase } from "../utils";
import type { AvailableObject, KeyValuePair } from "../../structs/genericStructs";
import { ObjectType } from "../../structs/genericStructs";
import { useMissionTreeListStore } from "@/stores/missionStore";
import { getDefaultLocalisation } from "./localisationRepository";
import { hasObjectChanged, popObjectChange } from "./changedObjectRepository";
import { requestObjectFromFile, saveObject } from "../layerCommunication/fileCommunication";
import { deleteFile, readDir } from "../layerCommunication/fileSystemCommunication";
import { displayGlobalLoader, hideGlobalLoader } from "../uiControllers/appController";
import { TreeItemType, type Statement, type TreeItemEntry } from "@/components/basic_controls/builder_tree/builderTreeItemExtender";
import { ValueType } from "@/structs/uiStructs";
import { handleSaveSynchronization } from "./baseGameObjectRepository";

export const gameMissionFolderName = 'missions';

export function getMissionTreeSaveFolder() : string {
    return getFileSavePath(ObjectType.MissionTree);
}

export async function getExistingMissionTreeNames() : Promise<string[]> {
    var fileSystemTrees =  (await readDir(getMissionTreeSaveFolder())).map(x=> removeExtensionFromFileName(x.name));
    var missionTreeStore = useMissionTreeListStore();
    var memoryMissionTrees = missionTreeStore.getMissionTrees().map(x => x.name);
    return fileSystemTrees.concat(memoryMissionTrees);
}

export async function saveMissionTrees(isSaveBeforeExport?: boolean) {
    var missionsStore = useMissionTreeListStore();
    var missionTrees = missionsStore.getMissionTrees();
    
    var baseSavePath = getMissionTreeSaveFolder();
    
    for(var missionTree of missionTrees) {
        handleSaveSynchronization(missionTree, isSaveBeforeExport);
        
        if(hasObjectChanged(missionTree.name, ObjectType.MissionTree)) {
            removeMissionTreeUnserializableFields(missionTree);
            var objectSaveName = enhanceFileNameWithExtension(missionTree.name, 'txt');
            var missionTreeSavePath = formatFileSystemPath(baseSavePath, objectSaveName);
            popObjectChange(missionTree.name);
            await saveObject(missionTreeSavePath, missionTree);
        }
    }
}

export async function removeMissionTree(missionTreeName: string) {
    var missionStore = useMissionTreeListStore();
    var existingMissionTree = missionStore.getMissionTree(missionTreeName);
    if(existingMissionTree) {
        missionStore.removeMissionTree(missionTreeName);
    }

    missionTreeName = enhanceFileNameWithExtension(missionTreeName, 'txt');
    var filePath = formatFileSystemPath(getMissionTreeSaveFolder(), missionTreeName);
    await deleteFile(filePath);
}

export function getRequiredMissions(requiredMissionsIds: string[], missionTree: MissionTree) : MissionNode[] {
    if(!missionTree){
        return [];
    }

    return missionTree?.missionSlots?.flatMap(x=> x.missions?.filter(y=> requiredMissionsIds?.includes(y.id)));
}

export function removeMissionTreeUnserializableFields(missionTree: MissionTree) {
    if(!missionTree) {
        return;
    }

    for(var slot of missionTree.missionSlots)
    {
        if(!slot) {
            continue;
        }

        for(var mission of slot.missions) {
            mission.isSelected = false;
        }
    }
}

export function getMissionNodeOriginalMissionSlot(missionNode: MissionNode, missionTree: MissionTree) : MissionSlot {
    return missionTree?.originalMissionSlots?.firstOrDefault(x=> x.name == missionNode.originalMissionSlotName) as MissionSlot;
}

export function collectMissionSlotFlags(potentials : TreeItemEntry[], parentKey: string) : any {
    var returnValue : any[] = new Array();
    if(!potentials){
        return returnValue;
    }

    for(var potentialItem of potentials){
        if(potentialItem.childEntries && potentialItem.childEntries.length > 0){
            returnValue.push(...collectMissionSlotFlags(potentialItem.childEntries, potentialItem.key));
        }

        if(potentialItem.statement && potentialItem.statement.key == "has_country_flag") {
            var flag = { negate: false, flagValue: potentialItem.statement.value };
            if(parentKey == "NOT"){
                flag.negate = true;
            }

            returnValue.push(flag);
        }
    }

    return returnValue;
}

export async function openMissionTreeFile(missionTreeName: string) : Promise<MissionTree | undefined> {
    var baseSavePath = getMissionTreeSaveFolder();
    missionTreeName = enhanceFileNameWithExtension(missionTreeName, 'txt');

    displayGlobalLoader('Loading mission tree');
    var missionTreePath = formatFileSystemPath(baseSavePath, missionTreeName);
    var result = await requestObjectFromFile<MissionTree>(missionTreePath);
    hideGlobalLoader();

    return result;
}

export function mergeSlots(slots: MissionSlot[], missionTree: MissionTree) : MissionSlot[] {
    var missionSlotsMerged : MissionSlot[] = new Array();
    if(!slots || !slots.length || slots.length == 0){
        return new Array();
    }

    for (let index = 1; index <= 5; index++) {
        var newMissingSlot = <MissionSlot>({ builtPotential: { missionSlotPotentialEntries: new Array() }, missions: new Array(), number: index, missionTextColor: "#ffffff" });
        missionSlotsMerged.push(newMissingSlot);
    }
  
    for(var slot of slots.sort((a, b) => a.number - b.number)) {
        if(!slot.number || slot.number < 1 || slot.number > 5){
            continue;
        }

        if(!isSlotVisible(slot, missionTree)){
            continue;
        }

        var existingSlotByNumber = missionSlotsMerged.filter(x => x.number == slot.number)[0];
        if(existingSlotByNumber){
            var existingSlotMaxMissionPosition = calculateMaxPositionNumber(existingSlotByNumber.missions);
            for (let index = 0; index < slot.missions.length; index++) {
                const mission = slot.missions[index];
                if(mission.position == 0) {
                    mission.position = index + existingSlotMaxMissionPosition;
                }
                
                mission.originalMissionSlotName = slot.name;
                mission.parentSlotName = existingSlotByNumber.name;
                existingSlotByNumber.missions.push(mission);
            }
        }
    }

    return missionSlotsMerged;
}

function calculateMaxPositionNumber(missions: MissionNode[]) : number {
    if(missions === undefined || missions === null || missions?.length == 0) {
        return 0;
    }

    return missions.reduce(function(prev, current) { return (prev && prev.position > current.position) ? prev : current }).position;
}

export function isSlotHidden(slot: MissionSlot, missionTree: MissionTree) : boolean {
    var countryFlags = collectMissionSlotFlags(slot.builtPotential.missionSlotPotentialEntries, "");
    for(var flag of countryFlags) {
        var flagValue = flag.flagValue;
        if(missionTree.settings.possibleCountryFlags.includes(flagValue)){
            continue;
        }
        missionTree.settings.possibleCountryFlags.push(flagValue);
    }

    var activeFlags = missionTree?.settings?.countryFlags ?? [];

    var hasExcludedFlag = false;
    for(var excludedFlag of countryFlags.filter((x:any) => x.negate)){
        if(activeFlags.includes(excludedFlag.flagValue)){
            hasExcludedFlag = true;
            break;
        }
    }

    var hasIncludedFlags = false;
    var requiresIncludedFlags = false;
    var includedTags = countryFlags.filter((x:any) => !x.negate);
    if(includedTags.length > 0){
        requiresIncludedFlags = true;
        hasIncludedFlags = includedTags.every((x: any) => activeFlags.includes(x.flagValue));
    }

    var skip = false;
    if(countryFlags.length > 0){
        if(hasExcludedFlag) {
            skip = true;
        }
        else {
            if(requiresIncludedFlags){
                skip = !hasIncludedFlags;
            }
            else {
                skip = false;
            }
        }
    }

    return skip;
}

export function mergeMissionTreeData(from: MissionTree, into: MissionTree) {
    if(!from || !into) {
        return;
    }

    into.originalMissionSlots = from.originalMissionSlots.orderBy(x => x.number);
}

export function recalculateTagsInPotential(missionTree: MissionTree | undefined) {
    if(!missionTree) {
        return;
    }

    for(var slot of missionTree.originalMissionSlots){
        if(!slot) {
            continue;
        }

        if(!slot.builtPotential?.missionSlotPotentialEntries) {
            slot.builtPotential = <MissionSlotPotential>({ 
                missionSlotPotentialEntries: new Array()
            });
        }

        var newPotentials = new Array();
        var potentialWithTags: TreeItemEntry | undefined = undefined;
        for(var potential of slot.builtPotential?.missionSlotPotentialEntries) {
            if(!potentialWithTags && potential.key == 'OR' && potential.childEntries) {
                var tagPotentials = potential.childEntries.filter(x => x.statement?.key == 'tag');
                if(tagPotentials.length == 0) {
                    continue;
                }

                potentialWithTags = potential;
                
                for(var potential of tagPotentials) {
                    if(potential.type !== TreeItemType.Statement){
                        continue;
                    }

                    for(var tag of missionTree.tags) {
                        if(potential.statement?.value === tag) {
                            if(!newPotentials.firstOrDefault(x => x.statement.value === tag)) {
                                newPotentials.push(potential);
                            }
                            continue;
                        }

                        var newPotential = createTagPotential(tag);
                        if(!newPotentials.firstOrDefault(x => x.statement.value === tag)) {
                            newPotentials.push(newPotential);
                        }
                    }
                }
            }
        }

        if(potentialWithTags){
            potentialWithTags.childEntries = newPotentials;
        }
        else {
            potentialWithTags = <TreeItemEntry>({
                allowChanges: true,
                type: TreeItemType.Clause,
                keyType: ValueType.Category,
                category: ObjectType.CountryTags,
                childEntries: new Array(),
                treeType: ObjectType.MissionTree,
                position: 1,
                key: 'OR',
            });

            for(var tag of missionTree.tags) {
                var newpotential = createTagPotential(tag);
                potentialWithTags.childEntries.push(newpotential);
            }
            
            slot.builtPotential?.missionSlotPotentialEntries.push(potentialWithTags);
        }
    }
}

function createTagPotential(tag: string) : TreeItemEntry {
    return <TreeItemEntry>({
        allowChanges: true,
        type: TreeItemType.Statement,
        keyType: ValueType.Category,
        category: ObjectType.CountryTags,
        childEntries: new Array(),
        treeType: ObjectType.MissionTree,
        statement: <Statement>{
            key: 'tag',
            statementCategory: ObjectType.CountryTags,
            statementType: ValueType.Category,
            statementValueCategory: ObjectType.MissionTree,
            value: tag
        },
        key: 'tag',
    });
}

export function createNewMissionTree(treeName: string, tags: string[], empty: boolean) : MissionTree {
    treeName = toSnakeCase(treeName.trim());
    var missionTree : MissionTree;

    var tagPotentialEntries = prepareTagSlotPotential(tags);

    var slots = [];
    if(!empty) {
        for (let index = 1; index <= 5; index++) {
            var slot = instantiateMissionSlot(`${treeName}_${index}`, index);
            slot.missions = [];
            if(tagPotentialEntries) {
                slot.builtPotential.missionSlotPotentialEntries.push(...deepClone(tagPotentialEntries));
            }

            slots.push(slot);
        }
    }

    missionTree = <MissionTree>({
        originalMissionSlots: [...slots], 
        missionSlots: [...slots], 
        tags: new Array(),
        settings: <MissionModuleSettings>({ 
            emptyMissions: 6, 
            countryFlags: new Array(), 
            possibleCountryFlags: new Array(),
      }) 
    });

    if(!empty){
        var defaultLocalisation = getDefaultLocalisation();
        missionTree.localisationFileId = defaultLocalisation.name;
    }
    
    missionTree.name = treeName;

    return missionTree;
}

export function storeMissionTree(missionTree: MissionTree) {
    var missionsStore = useMissionTreeListStore();
    missionsStore.addMissionTree(missionTree);
}

export function createAvailableObjectForMissionTree(missionTree: MissionTree) : AvailableObject {
    return <AvailableObject> ({ id: missionTree.name, name: missionTree.name, type: ObjectType.MissionTree });
}

export function instantiateMissionSlot(name: string, number: number) : MissionSlot {
  return <MissionSlot>({
    name: toSnakeCase(name),
    number: number,
    ai: true,
    generic: false,
    hasCountryShield: true,
    missions: new Array(),
    builtPotential: { 
      missionSlotPotentialEntries: new Array() 
    }, 
    missionTextColor: "#ffffff", });
}

export function prepareTagSlotPotential(tags: string[]) : TreeItemEntry[] | undefined {
    if(!tags || tags.length === 0){
        return;
    }

    var result = new Array();
    for(var tag of tags) {
        var tagItemEntry = <TreeItemEntry>({ 
            treeType: "SlotPotential", 
            type: TreeItemType.Statement, 
            position: 1, 
            statement: <Statement>({  
                key: "tag",
                statementCategory: "Country",
                statementType: "category",
                statementValueCategory: "Tag, Scope",
                value: tag
            })
        });

        result.push(tagItemEntry);
    }

    return result;
}

export function instantiateMissionNode(name: string, position: number, parentSlot: MissionSlot) : MissionNode {
    var missionId = toSnakeCase(name);

    var defaultLocalisation = getDefaultLocalisation();
    if(defaultLocalisation) {
        var nameLocalisation = <KeyValuePair<string, string>>({ key: `${missionId}`, value: name });
        defaultLocalisation.localisationMap.push(nameLocalisation);

        var nameLocalisation = <KeyValuePair<string, string>>({ key: `${missionId}_title`, value: name });
        defaultLocalisation.localisationMap.push(nameLocalisation);
    }

    return <MissionNode>({
        id: missionId,
        position: position,
        originalMissionSlotName: parentSlot.name,
        parentSlotName: parentSlot.name, 
        icon: 'mission_unite_home_region',
        requiredMissionIds: new Array(),
        missionProvincesToHighlight: <MissionProvincesToHighlight>({ missionProvincesToHighlightEntries: new Array<TreeItemEntry>() }),
        builtTrigger: <MissionTrigger>({ missionTriggerEntries: new Array<TreeItemEntry>() }),
        builtEffect: <MissionEffect>({ missionEffectEntries: new Array<TreeItemEntry>() })
    });
}

export function replaceMissionTreeContent(from: MissionTree, to: MissionTree) {
    to.missionSlots = from.missionSlots;
    to.originalMissionSlots = from.originalMissionSlots;
    to.tags = from.tags;
}

function isSlotVisible(slot: MissionSlot, missionTree: MissionTree) : boolean {
    var result = true;

    if(!slot.builtPotential) {
        return result;
    }

    for(var entry of slot.builtPotential.missionSlotPotentialEntries){
        result &&= evaluateTreeItemEntryPotential(entry, missionTree);
    }

    return result;
}

function evaluateTreeItemEntryPotential(node: TreeItemEntry, missionTree: MissionTree, isNegation: boolean = false) : boolean {
    if(!node || !node.key) {
        return true;
    }

    var nodeKey = node.key.toLowerCase();
    if (node.type == TreeItemType.Clause) {
        var isNotClause = nodeKey === 'not';
        if(nodeKey === 'and' || nodeKey === 'or' || isNotClause) {
            const childResults = node.childEntries.map(child =>
                evaluateTreeItemEntryPotential(child, missionTree, isNotClause)
            );

            let result = true;
            switch (nodeKey) {
                case 'and':
                    result = childResults.every(Boolean);
                    break;
                case 'or':
                    result = childResults.some(Boolean);
                    break;
                case 'not':
                    result = !childResults[0];
                    break;
            }

            return result;
        }
        else if(nodeKey === 'if' || nodeKey === 'else_if') {
            var limitClause = node.childEntries.firstOrDefault(x=> x.key.toLowerCase() === 'limit');
            if(!limitClause) {
                return false;
            }

            const limitResult = limitClause.childEntries.map(child =>
                evaluateTreeItemEntryPotential(child, missionTree)
            );

            var limitResultEvaluated = limitResult.every(Boolean);
            if(limitResultEvaluated) {
                const conditionResult = node.childEntries.filter(x => x.key.toLowerCase() !== 'limit').map(child =>
                    evaluateTreeItemEntryPotential(child, missionTree)
                );

                return conditionResult.every(Boolean);
            }

            return true;
        }
    }
    else if(node.type == TreeItemType.Statement && node.statement) {
        var activeCountryFlags = missionTree.settings.countryFlags;
        var isRevolutionTargetEnabled = missionTree.settings.isRevolutionaryTarget;

        if (nodeKey === 'is_revolution_target' || nodeKey === 'is_revolutionary') {
            var isYes = node.statement.value === 'yes';
            return isRevolutionTargetEnabled ? isYes : !isYes;
        }

        if(nodeKey === 'map_setup') {
            return false;
        }

        if (nodeKey === 'has_country_flag') {
            var flagValue = node.statement.value;
            if(!missionTree.settings.possibleCountryFlags.includes(flagValue)) {
                missionTree.settings.possibleCountryFlags.push(flagValue);
            }

            return activeCountryFlags.includes(flagValue);
        }

        return isNegation ? false : true;
    }
  
    return isNegation ? false : true;
}