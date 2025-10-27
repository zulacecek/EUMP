import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { type DataBlockDeserilized, newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments } from "./pdxSyntaxParser";

export async function importTradeGoods(path : string, fileName: string) : Promise<TradeGood[]> {
    var value : TradeGood[] = [];

    var data = await readFileContent(path);
    if(!data) {
        return value;
    }
    var lines = normalizedFileInput(data).split(newLineSeperator);
    lines.unshift('tradegoods = {');
    lines.push('}');

    var parserArguments = <ParserArguments>({
        lineNumber: 0
    });

    var parsedBlocked = parseBlock(lines, parserArguments, 'tradegoods');
    var group = createNewGroup(ChangedObjectCategory.TradeGoods, "trade_good", fileName);
    for(var block of parsedBlocked.blocks) {
        var importedTradeGood = <TradeGood>({
            name: block.key,
            color: `${Math.random()*255} ${Math.random()*255} ${Math.random()*255}`,
            group_id: group.id,
            is_imported: true
        });

        for(var innerBlock of block.blocks) {
            var key = innerBlock.key;
            switch(key) {
                case 'modifier':
                    importedTradeGood.modifier = innerBlock
                    break;
                case 'province':
                    importedTradeGood.province = innerBlock
                    break;
                case 'chance':
                    importedTradeGood.chance = innerBlock
                    break;
            }
        }

        for(var statement of block.statements) {
            if(statement.key == 'color') {
                if(statement.value.split(' ').filter(x => Number(x) < 1).length > 0) {
                    importedTradeGood.color = statement.value.split(' ').map(x => Number(x) * 255).join(' ');
                }
                else {
                    importedTradeGood.color = statement.value.split(' ').map(x => Number(x)).join(' ');
                }
            }
        }

        value.push(importedTradeGood);
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.TradeGoods, group.id, 'trade_goods');
    return value;
}

export type TradeGood = GroupedObject & {
    name: string;
    color: string;
    modifier: DataBlockDeserilized;
    province: DataBlockDeserilized;
    chance: DataBlockDeserilized;
}