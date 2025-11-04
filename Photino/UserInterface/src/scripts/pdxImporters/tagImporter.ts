import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent, readFileContentIgnoreMissing } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { getStatementValueTrimmed, removeAllQuotes, removeCommentsBySplit } from "../utils";
import { newLineSeperator, type ParserArguments, readDataBlockWithValuesSeparatedByLine } from "./pdxSyntaxParser";

export async function importTags(path : string, fileName: string) : Promise<CountryTag[]> {
    var input = await readFileContent(path);
    var value : CountryTag[] = [];
    if(!input) {
        return value;
    }

    var lines = input.split(newLineSeperator);
    var group = createNewGroup(ChangedObjectCategory.CountryTags, "country_tag", fileName.split('.')[0]);
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if(line.startsWith('#')){
            continue;
        }

        if(line.includes('=')){
            var lineSplit = line.split('=');
            var importedTag = <CountryTag>({
                tag: lineSplit[0].trim(),
                file_name: removeCommentsBySplit(removeAllQuotes(lineSplit[1])).replace('countries/', '').trim(),
                group_id: group.id,
                is_imported: true
            });

            importedTag.name = importedTag.file_name.split('.')[0];
            value.push(importedTag);
        }
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.CountryTags, group.id, 'country_tags');

    return value;
}

export async function importCountries(path: string, tags: CountryTag[]) : Promise<Country[]> {
    var value: Country[] = new Array();

    // File name is not applicable as each country is exported to separate file by its name
    var group = createNewGroup(ChangedObjectCategory.Country, "country", "N_A");
    for(var tag of tags) {
        var countryPath = `${path}\\${tag.file_name}`;
        var fileContent = await readFileContentIgnoreMissing(countryPath);
        if(fileContent) {
            var parsedCountry = parseCountryFile(fileContent);
            parsedCountry.tag = tag.tag;
            parsedCountry.name = tag.name;
            parsedCountry.group_id = group.id;
            value.push(parsedCountry);
        }
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.Country, group.id, 'countries');
    return value;
}

function parseCountryFile(fileContent: string) : Country {
    var country = <Country>({ 
        historical_idea_groups: new Array(),
        historical_units: new Array(),
        monarch_names: new Array(),
        leader_names: new Array(),
        ship_names: new Array(),
        army_names: new Array(),
        fleet_names: new Array(),
        is_imported: true
    });

    var lines = fileContent.split(newLineSeperator);
    var parserArguments = <ParserArguments>({ lineNumber: 0 });
    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        var line = lines[parserArguments.lineNumber];
        if(line.startsWith('graphical_culture')) {
            country.graphical_culture = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('color')) {
            country.color = parseColorFromFile(line);
        }
        else if(line.startsWith('revolutionary_colors')){
            country.revolutionary_colors = parseColorFromFile(line);
        }
        else if(line.startsWith('historical_idea_groups')) {
            var result = readDataBlockWithValuesSeparatedByLine('historical_idea_groups', lines, parserArguments);
            if(result) {
                country.historical_idea_groups.push(...result.values);
            }
        }
        else if(line.startsWith('historical_units')) {
            var result = readDataBlockWithValuesSeparatedByLine('historical_units', lines, parserArguments);
            if(result) {
                country.historical_units.push(...result.values);
            }
        }
        else if(line.startsWith('monarch_names')) {
            var result = readDataBlockWithValuesSeparatedByLine('monarch_names', lines, parserArguments);
            if(result) {
                country.monarch_names.push(...result.values);
            }
        }
        else if(line.startsWith('leader_names')) {
            var result = readDataBlockWithValuesSeparatedByLine('leader_names', lines, parserArguments);
            if(result) {
                country.leader_names.push(...result.values);
            }
        }
        else if(line.startsWith('ship_names')) {
            var result = readDataBlockWithValuesSeparatedByLine('ship_names', lines, parserArguments);
            if(result) {
                country.ship_names.push(...result.values);
            }
        }
        else if(line.startsWith('army_names')) {
            var result = readDataBlockWithValuesSeparatedByLine('ship_names', lines, parserArguments);
            if(result) {
                country.army_names.push(...result.values);
            }
        }
        else if(line.startsWith('fleet_names')) {
            var result = readDataBlockWithValuesSeparatedByLine('ship_names', lines, parserArguments);
            if(result) {
                country.fleet_names.push(...result.values);
            }
        }
    }

    return country
}


function parseColorFromFile(input: string) : string {
    return input.split('=')[1].replace('{', '').replace('}', '').trim();
}

export type CountryTag = GroupedObject & {
    name: string;
    tag: string;
    file_name: string;
}

export type Country =  GroupedObject & {
    tag: string,
    name: string,
    color: string,
    revolutionary_colors: string,
    graphical_culture: string,
    historical_idea_groups: string[],
    historical_units: string[],
    monarch_names: string [],
    leader_names: string[],
    ship_names: string[],
    army_names: string[],
    fleet_names: string[]
}