import type { GroupedObject } from "../../structs/genericStructs";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments } from "./pdxSyntaxParser";

export async function importAreas(path : string) : Promise<Area[]> {
    var value : Area[] = [];
    var input = await readFileContent(path);
    if(!input) {
        return value;
    }
    
    var lines = normalizedFileInput(input).split(newLineSeperator);
    lines.unshift('areas = {');
    lines.push('}');

    var parserArguments = <ParserArguments>({
        lineNumber: 0,
        continueOnEmptyOnelineBlock: true
    });

    var parsedBlocked = parseBlock(lines, parserArguments, 'areas');
    var group = createNewGroup(ChangedObjectCategory.Area, "area", "area.txt");
    for(var block of parsedBlocked.blocks) {
        var importedArea = <Area>({
            province_ids: new Array(),
            name: block.key,
            group_id: group.id,
            is_imported: true
        });
        
        for(var statement of block.statements) {
            if(statement.key == 'color'){
                importedArea.color = statement.value;
            }
            else {
                importedArea.province_ids.push(...statement.key.split(' '));
            }
        }

        value.push(importedArea);
    }

    for(var area of value) {
        // if color missing generate a random one
        if(!area.color) {
            area.color = `${Math.random()*255} ${Math.random()*255} ${Math.random()*255}`;
        }
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.Area, group.id, 'areas');
    return value;
}

export type Area = GroupedObject & {
    name : string;
    color: string;
    province_ids : string[];
}