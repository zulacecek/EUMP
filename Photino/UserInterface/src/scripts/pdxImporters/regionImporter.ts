import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments } from "./pdxSyntaxParser";

export async function importRegions(path : string) : Promise<Region[]> {
    var value : Region[] = [];

    var data = await readFileContent(path);
    if(!data) {
        return value;
    }
    var lines = normalizedFileInput(data).split(newLineSeperator);
    lines.unshift('regions = {');
    lines.push('}');

    var parserArguments = <ParserArguments>({
        lineNumber: 0,
        continueOnEmptyOnelineBlock: true
    });

    var group = createNewGroup(ChangedObjectCategory.Regions, "region", "region.txt");
    var parsedBlocked = parseBlock(lines, parserArguments, 'regions');
    for(var block of parsedBlocked.blocks) {
        var importedArea = <Region>({
            areas: new Array(),
            name: block.key,
            color: `${Math.random()*255} ${Math.random()*255} ${Math.random()*255}`,
            group_id: group.id,
            is_imported: true
        });

        for(var innerBlock of block.blocks) {
            if(innerBlock.key != 'areas') {
                break;
            }

            for(var statement of innerBlock.statements) {
                importedArea.areas.push(statement.key);
            }
        }

        value.push(importedArea);
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.Regions, group.id, 'region');
    return value;
}

export type Region = GroupedObject & {
    name : string;
    color: string;
    areas : string[];
}