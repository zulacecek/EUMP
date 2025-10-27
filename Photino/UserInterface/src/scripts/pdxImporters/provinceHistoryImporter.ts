import type { GroupedObject } from "../../structs/genericStructs"
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs"
import { readDirFileNames, readFileContent } from "../backendControllers/backendCommunication"
import { addObjectChange } from "../repositories/changedObjectRepository"
import { createNewGroup } from "../repositories/groupRepository"
import { type DataBlockDeserilized, type DataStatementDeserialized, newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments } from "./pdxSyntaxParser"

export type ProvinceHistory = GroupedObject & {
    name: string,
    province_id: string,
    add_core: string,
    owner: string,
    controller: string,
    culture: string,
    religion: string,
    hre: boolean,
    base_tax: number,
    base_production: number,
    base_manpower: number,
    trade_goods: string,
    capital: string,
    is_city: boolean,
    extra_cost: number,
    center_of_trade: number,
    discovered_by: string[],
    histories: DataBlockDeserilized[],
    pernament_province_modifiers: DataBlockDeserilized[],
    add_buildings: DataStatementDeserialized[]
}

export type HistoryDate = {
    date: string,
    histories: DataBlockDeserilized[]
}

export async function parseAllProvincesHistory(path: string) : Promise<ProvinceHistory[]> {
    var historyPaths = await readDirFileNames(path);
    var histories : ProvinceHistory[] = new Array();

    // File name is not aplicable as it is used for export and histories are exported into their separate files by their name.
    var group = createNewGroup(ChangedObjectCategory.ProvinceHistory, "province_history", "N_A");
    for(var historyName of historyPaths) {
        var historyPath = `${path}\\${historyName}`
        histories.push(await parseProvinceHistory(historyPath, historyName.split('.')[0], group.id));
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.ProvinceHistory, group.id, 'province_history');
    return histories;
}

export async function parseProvinceHistory(path: string, historyName: string, groupId: string) : Promise<ProvinceHistory> {
    var pathSplit = historyName.split('-');
    var history = <ProvinceHistory>({
        discovered_by: new Array(),
        histories: new Array(),
        pernament_province_modifiers: new Array(),
        add_buildings: new Array(),
        province_id: pathSplit[0]?.trim(),
        name: pathSplit[1]?.trim(),
        group_id: groupId,
        is_imported: true
    });

    var data = await readFileContent(path);
    if(!data) {
        return history;
    }

    var lines = normalizedFileInput(data).split(newLineSeperator);
    lines.unshift('provincehistory = {');
    lines.push('}');
    
    var parserArguments = <ParserArguments>({
        lineNumber: 0
    });

    var parsedBlock = parseBlock(lines, parserArguments, 'provincehistory');
    for(var statement of parsedBlock.statements) {
        switch (statement.key) {
            case "add_core":
                history.add_core = statement.value;
                break;
            case "owner":
                history.owner = statement.value;
                break;
            case "controller":
                history.controller = statement.value;
                break;
            case "culture":
                history.culture = statement.value;
                break;
            case "religion":
                history.religion = statement.value;
                break;
            case "hre":
                history.hre = statement.value === "yes";
                break;
            case "base_tax":
                if (!history.base_tax) {
                    history.base_tax = Number(statement.value);
                }
                break;
            case "base_production":
                if (!history.base_production) {
                    history.base_production = Number(statement.value);
                }
                break;
            case "base_manpower":
                if (!history.base_manpower) {
                    history.base_manpower = Number(statement.value);
                }
                break;
            case "trade_goods":
                history.trade_goods = statement.value;
                break;
            case "capital":
                history.capital = statement.value;
                break;
            case "is_city":
                history.is_city = statement.value === "yes";
                break;
            case "discovered_by":
                history.discovered_by.push(statement.value);
                break;
            case "extra_cost":
                history.extra_cost = Number(statement.value);
                break;
            case "center_of_trade":
                history.center_of_trade = Number(statement.value);
                break;
            default:
                history.add_buildings.push(statement)
        }
    }

    for(var block of parsedBlock.blocks) {
        if(block.key == "add_permanent_province_modifier") {
            history.pernament_province_modifiers.push(block);
            continue;
        }
        else {
            history.histories.push(block);
        }
    }

    return history;
}