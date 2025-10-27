import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { newLineSeperator, normalizedFileInputTabForSpace, parseBlock, type ParserArguments } from "./pdxSyntaxParser";

export async function importClimateInfo(path: string) : Promise<Climate[]> {
    var value: Climate[] = new Array();
    var data = await readFileContent(path);
    if(!data) {
        return value;
    }

    var lines = normalizedFileInputTabForSpace(data).split(newLineSeperator);
    lines.unshift('climate = {')
    lines.push('}');
    var parserArguments = <ParserArguments>({
        lineNumber: 0
    });
    
    var group = createNewGroup(ChangedObjectCategory.Climate, "climate", "climate.txt");
    var climateBlock =  parseBlock(lines, parserArguments, 'climate');
    for(var block of climateBlock.blocks) {
        var climate = <Climate>({ 
            name: block.key,
            provinces: block.statements.flatMap(x => x.key.split(' ')),
            group_id: group.id,
            is_imported: true
        });

        value.push(climate);
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.Climate, group.id, 'climate');
    return value;
}

export async function importDefaultMapInfo(path: string) : Promise<MapInfo | undefined> {
    var data = await readFileContent(path);
    if(!data) {
        return;
    }

    var lines = normalizedFileInputTabForSpace(data).split(newLineSeperator);
    lines.unshift('default = {')
    lines.push('}');
    var parserArguments = <ParserArguments>({
        lineNumber: 0
    });
    
    var group = createNewGroup(ChangedObjectCategory.Climate, "map_info", "default.txt");
    var mapInfoBlock = parseBlock(lines, parserArguments, 'default');
    var mapInfo = <MapInfo>({
        canal_definitions: new Array(),
        force_coastal: new Array(),
        sea_starts: new Array(),
        only_used_for_random: new Array(),
        lakes: new Array(),
        group_id: group.id,
        is_imported: true,
        tree: ''
    });

    for(var block of mapInfoBlock.blocks) {
        switch(block.key){
            case 'sea_starts':
                mapInfo.sea_starts = block.statements.flatMap(x => x.key.split(' '));
                break;
            case 'only_used_for_random':
                mapInfo.only_used_for_random = block.statements.flatMap(x => x.key.split(' '));
                break;
            case 'lakes':
                mapInfo.lakes = block.statements.flatMap(x => x.key.split(' '));
                break;
            case 'force_coastal':
                mapInfo.force_coastal = block.statements.flatMap(x => x.key.split(' '));
                break;
            case 'canal_definition':
                var canalDefinition = <CanalDefinition>({});

                for(var statement of block.statements) {
                    switch(statement.key) {
                        case "name":
                            canalDefinition.name = statement.value
                            break;
                        case "x":
                            canalDefinition.x = Number(statement.value)
                            break;
                        case "y":
                            canalDefinition.y = Number(statement.value)
                            break;
                    }
                }

                mapInfo.canal_definitions.push(canalDefinition);
                break;
        }
    }

    for(var statement of mapInfoBlock.statements) {
        switch(statement.key){
            case 'width':
                mapInfo.width = Number(statement.value);
                break;
            case 'height':
                mapInfo.height = Number(statement.value);
                break;
            case 'max_provinces':
                mapInfo.max_provinces = Number(statement.value);
                break;
            case 'definitions':
                mapInfo.definitions = statement.value;
                break;
            case 'provinces':
                mapInfo.provinces = statement.value;
                break;
            case 'positions':
                mapInfo.positions = statement.value;
                break;
            case 'terrain':
                mapInfo.terrain = statement.value;
                break;
            case 'rivers':
                mapInfo.rivers = statement.value;
                break;
            case 'terrain_definition':
                mapInfo.terrain_definition = statement.value;
                break;
            case 'heightmap':
                mapInfo.heightmap = statement.value;
                break;
            case 'tree_definition':
                mapInfo.tree_definition = statement.value;
                break;
            case 'continent':
                mapInfo.continent = statement.value;
                break;
            case 'adjacencies':
                mapInfo.adjacencies = statement.value;
                break;
            case 'climate':
                mapInfo.climate = statement.value;
                break;
            case 'region':
                mapInfo.region = statement.value;
                break;
            case 'superregion':
                mapInfo.superregion = statement.value;
                break;
            case 'area':
                mapInfo.area = statement.value;
                break;
            case 'provincegroup':
                mapInfo.provincegroup = statement.value;
                break;
            case 'ambient_object':
                mapInfo.ambient_object = statement.value;
                break;
            case 'seasons':
                mapInfo.seasons = statement.value;
                break;
            case 'trade_winds':
                mapInfo.trade_winds = statement.value;
                break;
            case 'tree':
                mapInfo.tree = statement.value;
                break;
        }
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.MapInfo, mapInfo.group_id as string, 'map_info');
    return mapInfo;
}

export type Climate =  GroupedObject &{ 
    name: string,
    provinces: string[]
}

export type CanalDefinition = { 
    name: string,
    x: number,
    y: number
}

export type MapInfo = GroupedObject & {
    width: number,
    height: number,
    max_provinces: number,
    sea_starts: string[],
    only_used_for_random: string[],
    lakes: string[],
    force_coastal: string[],
    canal_definitions: CanalDefinition[],
    tree: string,
    definitions: string,
    provinces: string,
    positions: string,
    terrain: string,
    rivers: string,
    terrain_definition: string,
    heightmap: string,
    tree_definition: string,
    continent: string,
    adjacencies: string,
    climate: string,
    region: string,
    superregion: string,
    area: string,
    provincegroup: string,
    ambient_object: string,
    seasons: string,
    trade_winds: string,
}