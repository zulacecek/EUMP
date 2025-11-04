import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import type { DataStatementDeserialized, ParserArguments } from "./pdxSyntaxParser";
import { newLineSeperator, normalizedFileInput, parseBlock } from "./pdxSyntaxParser";

export async function importColonialRegions(path : string) : Promise<ColonialRegion[]> {
    var value : ColonialRegion[] = [];

    var data = await readFileContent(path);
    if(!data) {
        return value;
    }
    var lines = normalizedFileInput(data).split(newLineSeperator);
    lines.unshift('colonialregion = {');
    lines.push('}');

    var parserArguments = <ParserArguments>({
        lineNumber: 0
    });

    var parsedBlocked = parseBlock(lines, parserArguments, 'colonialregion');
    var group = createNewGroup(ChangedObjectCategory.ColonialRegions, "colonial_region", "colonialregion.txt");
    for(var block of parsedBlocked.blocks) {
        var importedColonialRegion = <ColonialRegion>({
            provinces: new Array(),
            name: block.key,
            color: `${Math.random()*255} ${Math.random()*255} ${Math.random()*255}`,
            trade_goods: new Array(),
            culture: new Array(),
            religion: new Array(),
            names: new Array(),
            group_id: group.id,
            is_imported: true
        });

        for(var innerBlock of block.blocks) {
            var key = innerBlock.key;
            switch(key){
                case 'trade_goods':
                    importedColonialRegion.trade_goods.push(...innerBlock.statements);
                    break;
                case 'culture':
                    importedColonialRegion.culture.push(...innerBlock.statements);
                    break;
                case 'religion':
                    importedColonialRegion.religion.push(...innerBlock.statements);
                    break;
                case 'provinces':
                    importedColonialRegion.provinces.push(...innerBlock.statements.flatMap(x=> x.key.split(' ')));
                    break;
                case 'names':
                    importedColonialRegion.names.push(...innerBlock.statements);
                    break;
            }
        }

        for(var statement of block.statements) {
            if(statement.key == 'color'){
                importedColonialRegion.color = statement.value;
            }
        }
        
        value.push(importedColonialRegion);
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.ColonialRegions, group.id, 'colonial_regions');
    return value;
}

export type ColonialRegion = GroupedObject & {
    name: string;
    color: string;
    tax_income: number;
    native_size: number;
    native_ferocity: number;
    native_hostileness: number;
    trade_goods: DataStatementDeserialized[];
    culture: DataStatementDeserialized[];
    religion: DataStatementDeserialized[];
    names: DataStatementDeserialized[];
    provinces: string[];
}