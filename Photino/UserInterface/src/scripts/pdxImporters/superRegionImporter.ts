import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments } from "./pdxSyntaxParser";

export async function importSuperRegions(path : string) : Promise<SuperRegion[]> {
    var value : SuperRegion[] = [];

    var data = await readFileContent(path);
    if(!data) {
        return value;
    }

    var lines = normalizedFileInput(data).split(newLineSeperator);
    lines.unshift('superregion = {');
    lines.push('}');
    var parserArguments = <ParserArguments>({
        lineNumber: 0,
        continueOnEmptyOnelineBlock: true
    });

    var group = createNewGroup(ChangedObjectCategory.SuperRegions, "super_region", "superregion.txt");
    var parsedBlocked = parseBlock(lines, parserArguments, 'superregion');
    for(var block of parsedBlocked.blocks) {
        var importedSuperregion = <SuperRegion>({
            regions: new Array(),
            name: block.key,
            color: `${Math.random()*255} ${Math.random()*255} ${Math.random()*255}`,
            group_id: group.id,
            is_imported: true
        });

        for(var statement of block.statements) {
            importedSuperregion.regions.push(statement.key);
        }
        
        value.push(importedSuperregion);
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.SuperRegions, group.id, 'superregion');
    return value;
}

export type SuperRegion = GroupedObject & {
    name : string;
    color: string;
    regions : string[];
}