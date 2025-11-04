import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { type DataBlockDeserilized, newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments } from "./pdxSyntaxParser";

export async function importTradeNodes(path : string, fileName: string) : Promise<TradeNode[]> {
    var value : TradeNode[] = [];

    var data = await readFileContent(path);
    if(!data) {
        return value;
    }
    var lines = normalizedFileInput(data).split(newLineSeperator);
    lines.unshift('tradenodes = {');
    lines.push('}');

    var parserArguments = <ParserArguments>({
        lineNumber: 0
    });

    var parsedBlocked = parseBlock(lines, parserArguments, 'tradenodes');
    var group = createNewGroup(ChangedObjectCategory.TradeNodes, "trade_node", fileName);
    for(var block of parsedBlocked.blocks) {
        var importedTradeNode = <TradeNode>({
            members: new Array(),
            name: block.key,
            color: `${Math.random()*255} ${Math.random()*255} ${Math.random()*255}`,
            outgoing: new Array(),
            group_id: group.id,
            is_imported: true
        });

        for(var innerBlock of block.blocks) {
            if(innerBlock.key == 'color') {
                importedTradeNode.color = innerBlock.statements.firstOrDefault(_ => true)?.key ?? '';
            }
            else if(innerBlock.key == 'outgoing'){
                importedTradeNode.outgoing.push(innerBlock);
            }
            else if(innerBlock.key == 'members') {
                importedTradeNode.members.push(...innerBlock.statements.flatMap(x => x.key.split(' ')))
            }
        }

        for(var statement of block.statements) {
            if(statement.key == 'location') {
                importedTradeNode.location = statement.value;
            }
            else if(statement.key == 'inland') {
                importedTradeNode.inland = statement.value == 'yes';
            }
            else if(statement.key == 'color') {
                importedTradeNode.color = statement.value;
            }
        }

        value.push(importedTradeNode);
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.TradeNodes, group.id, 'tradenode');
    return value;
}

export type TradeNode = GroupedObject & {
    name: string;
    location: string;
    color: string;
    inland: boolean;
    outgoing: DataBlockDeserilized[];
    members: string[];
}