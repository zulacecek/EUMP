import { type MissionEffect, type MissionProvincesToHighlight, type MissionSlot, type MissionSlotPotential, type MissionTree, type MissionTrigger } from "../../structs/missionStructs";
import { keyAvailableTreeItemMap } from "../appContext";
import { createNewMissionTree, instantiateMissionNode, instantiateMissionSlot } from "../repositories/missionTreeRepository";
import { type DataBlockDeserilized, type DataStatementDeserialized, newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments, readDataStatementDeserilized, readPropertyKey, readPropertyValue, readPropertyValueBetweenCurlyBraces } from "./pdxSyntaxParser";
import { TreeItemType, type Statement, type TreeItemEntry } from "@/components/basic_controls/builder_tree/builderTreeItemExtender";
import { ValueType } from "@/structs/uiStructs";

export function parseMissionTree(missionTreeContent: string, missionTreeName: string) : MissionTree {
	var input = missionTreeContent;
    const lines = normalizedFileInput(input).split(newLineSeperator).map(x => x.trim());
    const missionTree = <MissionTreeDeserilized>({ MissionSlotDess: new Array() });
    
    for (var parserArguments = <ParserArguments>({ lineNumber: 0 }); parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        const slot = parseSlot(lines, parserArguments);
        if (slot) {
            missionTree.MissionSlotDess.push(slot);
        }
    }

    var newMissionTree = createNewMissionTree(missionTreeName, [], true);

    for (let slotIndex = 0; slotIndex < missionTree.MissionSlotDess.length; slotIndex++) {
        const missionSlot = missionTree.MissionSlotDess[slotIndex];
        if(!missionSlot.Name){
            continue;
        }
        
		var potentialEntries = mapBlock(Array.of(missionSlot.Potential));
		var potentielTreeItems : TreeItemEntry[] = new Array();

		var potentialBlock = potentialEntries.filter(x => x.key == "potential")[0];
		if(potentialBlock){
			potentielTreeItems.push(...potentialBlock.childEntries);
		}

		potentielTreeItems.push(...potentialEntries.filter(x => x.key != "potential"));

		var newMissionSlot = instantiateMissionSlot(missionSlot.Name, missionSlot.Number);
        newMissionSlot.ai = missionSlot.Ai, 
        newMissionSlot.generic = missionSlot.Generic, 
        newMissionSlot.hasCountryShield = missionSlot.HasCountryShield,
        newMissionSlot.builtPotential = <MissionSlotPotential>({ 
            missionSlotPotentialEntries: potentielTreeItems 
        });

		newMissionTree.missionSlots.push(newMissionSlot);
		newMissionTree.originalMissionSlots.push(newMissionSlot);

        for (let missionIndex = 0; missionIndex < missionSlot.Missions.length; missionIndex++) {
            const mission = missionSlot.Missions[missionIndex];

            var icon = mission?.Icon?.value;
            var missionPosition = calculatePosition(parseInt(mission?.Position?.value ?? missionIndex + 1, 10), newMissionSlot);
            var newMission = instantiateMissionNode(mission.Name, missionPosition, newMissionSlot);
            newMission.icon = icon;
            newMission.missionProvincesToHighlight = mapProvincesToHighlight(mission.ProvincesToHighlight);
            newMission.builtTrigger = mapTrigger(mission.Trigger);
            newMission.builtEffect = mapEffect(mission.Effect);
            newMission.requiredMissionIds = mission.RequiredMissions.map(x => x);
            newMissionSlot.missions.push(newMission);
        }
    }

    return newMissionTree;
}

function fixPositionAndOrderTreeItems(items: TreeItemEntry[]) : TreeItemEntry[] {
    var reoreredItems = new Array();
    items = items.orderBy(x => x.position);
    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if(!item) {
            continue;
        }

        item.position = index + 1;
        if(item.childEntries && item.childEntries.length > 0) {
            item.childEntries = fixPositionAndOrderTreeItems(item.childEntries);
        }
        
        reoreredItems.push(item);
    }

    return reoreredItems;
}

function mapDataBlockToTreeItem(parentBlock: DataBlockDeserilized, treeType: string, isTopLevel: boolean) : TreeItemEntry[] {
    var treeItems = new Array();
    if(!parentBlock) {
        return treeItems;
    }
    
    var skipStatements = false;
    if(parentBlock.blocks) {
        for (let blockIndex = 0; blockIndex < parentBlock.blocks.length; blockIndex++) {
            const block = parentBlock.blocks[blockIndex];
            var treeItem = <TreeItemEntry>({ 
                childEntries: new Array(), 
                allowChanges: true, 
                key: block.key, 
                type: TreeItemType.Clause, 
                position: block.position, 
                keyType: ValueType.Text, 
                statement: <Statement>({}),
                treeType: treeType
            });
            
            var treeItemOption = keyAvailableTreeItemMap.get(block.key);
            if(treeItemOption) {
                treeItem.category = treeItemOption.Category;
            }

            if(block.blocks && block.blocks.length > 0){
                treeItem.childEntries.push(...mapDataBlockToTreeItem(block, treeType, false));
            }

            if(block.statements) {
                treeItem.childEntries.push(...parseStatements(block.statements, treeType));
                skipStatements = true;
            }

            treeItems.push(treeItem);
        }
    }
    
    if(parentBlock.statements && (!skipStatements || isTopLevel)) {
        treeItems.push(...parseStatements(parentBlock.statements, treeType));
    }

    return treeItems;
}

function parseStatements(statements: DataStatementDeserialized[], treeType: string) : TreeItemEntry[] {
    var treeItems = new Array();

    for (let statementIndex = 0; statementIndex < statements.length; statementIndex++) {
        const statement = statements[statementIndex];
        var itemStatement = <Statement>({ 
            key: statement.key, 
            value: statement.value, 
            statementType: ValueType.Text,
        });

        var statementItem = <TreeItemEntry>({
            childEntries: new Array(),
            allowChanges: true, 
            key: statement.key, 
            type: TreeItemType.Statement, 
            position: statement.position,
            keyType: ValueType.Text,
            statement: itemStatement,
            treeType: treeType
        });

        var treeItemOption = keyAvailableTreeItemMap.get(statement.key);
        if(treeItemOption) {
            statementItem.key = 
            itemStatement.key = treeItemOption.Key;
            itemStatement.statementType = ValueType.Category;
            itemStatement.statementCategory = treeItemOption.Category;
            itemStatement.statementValueCategory = treeItemOption.Type;
        }
        
        treeItems.push(statementItem);
    }

    return treeItems;
}

export function mapTrigger(triggerBlock: DataBlockDeserilized) : MissionTrigger {
    return <MissionTrigger>({ missionTriggerEntries: fixPositionAndOrderTreeItems(mapDataBlockToTreeItem(triggerBlock, "Trigger", true)) });;
}

export function mapEffect(effectBlock: DataBlockDeserilized) : MissionEffect {
    return <MissionEffect>({ missionEffectEntries: fixPositionAndOrderTreeItems(mapDataBlockToTreeItem(effectBlock, "Effect", true)) });
}

export function mapProvincesToHighlight(effectBlock: DataBlockDeserilized) : MissionProvincesToHighlight {
    return <MissionProvincesToHighlight>({ missionProvincesToHighlightEntries: fixPositionAndOrderTreeItems(mapDataBlockToTreeItem(effectBlock, "ProvincesToHighlight", true)) });
}

function mapBlock(blocks: DataBlockDeserilized[]) : TreeItemEntry[] {
	var result : TreeItemEntry[] = new Array();
    for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index];
		if(!block){
			continue;
		}

		var treeItem : TreeItemEntry = <TreeItemEntry>({ key: block.key, type: TreeItemType.Clause, childEntries: new Array(), position: block.position });

		if(block.blocks && block.blocks.length > 0){
			treeItem.childEntries.push(...mapBlock(block.blocks));
		}
        
		if(block.statements && block.statements.length > 0) {
            treeItem.childEntries.push(...block.statements.map(x => <TreeItemEntry>({ type: TreeItemType.Statement, key: x.key, position: x.position, statement: <Statement>({ key: x.key, statementType: ValueType.Text, value: x.value }) })));
		}
		result.push(treeItem);
	}

	return result;
}

function calculatePosition(position: number, slot: MissionSlot) : number {
	if(slot.missions.filter(x=> x.position === position)[0]){
		return calculatePosition(position+1, slot);
	}
	else {
		return position;
	}
}

function parseSlot(lines: string[], parserArguments: ParserArguments): MissionSlotDeserilized | null {
    const slotNameRegex = new RegExp("\\w*", "s");
    const slot = <MissionSlotDeserilized>({ Missions: new Array() });

    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        const line = lines[parserArguments.lineNumber];
        if (line.includes('{')) {
            if (!slot.Name) {
                slot.Name = slotNameRegex.exec(line)?.[0] || "";
                continue;
            } 
            else {
                parseSlotBlocks(lines, parserArguments, slot);
                continue;
            }
        }

        if (!line) {
            continue;
        }

        if (line.includes('}')) {
            break;
        }
        parseSlotProperties(line, slot);
    }
    return slot;
}

function parseSlotProperties(line: string, slot: MissionSlotDeserilized): void {
    if (line.startsWith("slot")) {
        slot.Number = parseInt(readPropertyValue(line), 10);
    } 
    else if (line.startsWith("generic")) {
        slot.Generic = parseBoolean(readPropertyValue(line));
    } 
    else if (line.startsWith("ai")) {
        slot.Ai = parseBoolean(readPropertyValue(line));
    } 
    else if (line.startsWith("has_country_shield")) {
        slot.HasCountryShield = parseBoolean(readPropertyValue(line));
    }
}

function parseSlotBlocks(lines: string[], parserArguments: ParserArguments, slot: MissionSlotDeserilized): void {
    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        const line = lines[parserArguments.lineNumber];
        if (!line) {
            continue;
        }

        if (line.startsWith("potential")) {
            const potentialBlockParsed = parseBlock(lines, parserArguments, "potential");
            if (potentialBlockParsed) {
                slot.Potential = potentialBlockParsed;
            }
        }
        else if (line.startsWith("potential_on_load")) {
            parseBlock(lines, parserArguments, "potential_on_load");
        }
        else if (line.includes('{')) {
            const MissionNodeDes = parseMissionNodeDes(lines, parserArguments);
            slot.Missions.push(MissionNodeDes);
            break;
        }
        else {
			parserArguments.lineNumber--;
            break;
        }
    }
}

function parseMissionNodeDes(lines: string[], parserArguments: ParserArguments): MissionNodeDeserilized {
    const MissionNodeDes = <MissionNodeDeserilized>({});
    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {

        const line = lines[parserArguments.lineNumber];
        if (line.includes('{')) {
            if (!MissionNodeDes.Name) {
                MissionNodeDes.Name = MissionNodeDes.Id = readPropertyKey(line);
                continue;
            } 
            else {
                parseMissionNodeDesBlocks(lines, parserArguments, MissionNodeDes);
                continue;
            }
        }

        if (!line) {
            continue;
        }
        if (line.includes('}')) {
            break;
        }

        parseMissionNodeDesStatements(line, MissionNodeDes);
    }
    
    return MissionNodeDes;
}

function parseMissionNodeDesStatements(input: string, mission: MissionNodeDeserilized): void {
    if (input.startsWith("icon")) {
        mission.Icon = readDataStatementDeserilized(input);
    } 
    else if (input.startsWith("position")) {
        mission.Position = readDataStatementDeserilized(input);
    }
}

function parseMissionNodeDesBlocks(lines: string[], parserArguments: ParserArguments, mission: MissionNodeDeserilized): void {
    const line = lines[parserArguments.lineNumber];
    if (line.startsWith("required_missions")) {
        mission.RequiredMissions = parseRequiredMissions(lines, parserArguments);
    } 
    else if (line.startsWith("provinces_to_highlight")) {
        mission.ProvincesToHighlight = parseBlock(lines, parserArguments, "provinces_to_highlight");
    } 
    else if (line.startsWith("trigger")) {
        mission.Trigger = parseBlock(lines, parserArguments, "trigger");
    } 
    else if (line.startsWith("effect")) {
        mission.Effect = parseBlock(lines, parserArguments, "effect");
    }
    else if (line.startsWith("provinces_to_highlight")) {
        mission.ProvincesToHighlight = parseBlock(lines, parserArguments, "provinces_to_highlight");
    }
    else if (line.startsWith("ai_weight")) {
        parseBlock(lines, parserArguments, "ai_weight");
    }
}

function parseRequiredMissions(lines: string[], parserArguments: ParserArguments): string[] {
	var requiredMissionsArray: string[] = new Array();

    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
		const line = lines[parserArguments.lineNumber].trim();
        if (line.includes('{') && line.includes('}')) {
            const requiredMissionsContent = readPropertyValueBetweenCurlyBraces(line);
            const requiredMissions = requiredMissionsContent.split(' ');
            return requiredMissions;
        }

		if(line.includes('{')){
			var lineSplit = line.split('{');
			if(lineSplit[1] && lineSplit[1] != ' '){
				requiredMissionsArray.push(lineSplit[1]);
			}
			else continue;
		}

        if (line.includes('}')) {
            break;
        }

		if(line.includes(' ')){
			requiredMissionsArray.push(...line.split(' '));
		}
		
		requiredMissionsArray.push(line.trim());
    }
    
    return requiredMissionsArray;
}

function parseBoolean(input: string): boolean {
   return input === "yes";
}

type MissionTreeDeserilized = {
    MissionSlotDess: MissionSlotDeserilized[];
}

type MissionSlotDeserilized = {
    Name: string;
    Number: number;
    Ai: boolean;
    Generic: boolean;
    HasCountryShield: boolean;
    Potential: DataBlockDeserilized;
    Missions: MissionNodeDeserilized[];
}

type MissionNodeDeserilized = {
    Name: string;
    Id: string;
    Icon: DataStatementDeserialized;
    Position: DataStatementDeserialized;
    CompletedBy: DataStatementDeserialized;
    RequiredMissions: string[];
    ProvincesToHighlight: DataBlockDeserilized;
    Trigger: DataBlockDeserilized;
    Effect: DataBlockDeserilized;
    ParentSlot: MissionSlotDeserilized;
}