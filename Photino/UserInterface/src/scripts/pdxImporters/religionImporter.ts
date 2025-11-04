import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { getStatementValueTrimmed, removeComments } from "../utils";
import {type  DataBlockDeserilized, newLineSeperator, normalizedFileInput, parseBlock, type ParserArguments, readDataBlockWithValuesSeparatedByLine } from "./pdxSyntaxParser"

export async function importReligionGroup(path: string, fileName: string) : Promise<ReligionGroup[]> {
    var value: ReligionGroup[] = new Array();
    var data = await readFileContent(path);
    if(!data) {
        return value;
    }

    var lines = normalizedFileInput(data).split(newLineSeperator);
    var parserArguments = <ParserArguments>({
        lineNumber: 0
    });

    var deserilized : DataBlockDeserilized[] = new Array();
    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        var line = lines[parserArguments.lineNumber];
        if(!line || line.startsWith('#')) {
            continue;
        }

        if(line.includes('{')){
            var name = line.split('=')[0].trim();
            deserilized.push(parseBlock(lines, parserArguments, name));
        }
    }

    return parseReligionGroups(deserilized, fileName);
}

function parseReligionGroups(blocks: DataBlockDeserilized[], fileName: string) : ReligionGroup[] {
    var religionGroups : ReligionGroup[] = new Array();
    var group = createNewGroup(ChangedObjectCategory.ReligiousGroups, "religious_group", fileName);
    for(var religionGroupBlock of blocks) {
        var religionGroup = <ReligionGroup>({
            name: religionGroupBlock.key,
            religions: new Array(),
            group_id: group.id,
            is_imported: true
        });

        for(var religionBlock of religionGroupBlock.blocks) {
            if(religionBlock.key == 'religious_schools') {
                religionGroup.religious_schools = religionBlock;
            }
            else {
                religionGroup.religions.push(parseReligion(religionBlock));
            }
        }

        for(var religionGroupStatement of religionGroupBlock.statements) {
            var key = religionGroupStatement.key;
            var value = removeComments(religionGroupStatement?.value);
            switch(key) {
                case 'defender_of_faith':
                    religionGroup.defender_of_faith = value == 'yes'
                    break;
                case 'can_form_personal_unions':
                    religionGroup.can_form_personal_unions = value == 'yes'
                    break;
                case 'ai_will_propagate_through_trade':
                    religionGroup.ai_will_propagate_through_trade = value == 'yes'
                    break;
                case 'center_of_religion':
                    religionGroup.center_of_religion = value;
                    break;
                case 'flags_with_emblem_percentage':
                    religionGroup.flags_with_emblem_percentage = Number(value)
                    break;
                case 'flag_emblem_index_range':
                    religionGroup.flag_emblem_index_range = value
                    break;
                case 'harmonized_modifier':
                    religionGroup.harmonized_modifier = value
                    break;
                case 'crusade_name':
                    religionGroup.crusade_name = value
                    break;
            }
        }

        religionGroups.push(religionGroup);
    }
    
    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.ReligiousGroups, group.id, fileName);
    return religionGroups;
}

function parseReligion(block: DataBlockDeserilized) : Religion {
    var religion = <Religion>({
        name: block.key
    });

    for(var religionValueBlock of block.blocks) {
        var key = religionValueBlock.key;
        switch(key) {
            case 'allowed_conversion':
                religion.allowed_conversion = religionValueBlock.statements.map(x=> x.key);
                break;
             case 'allowed_center_conversion':
                religion.allowed_center_conversion = religionValueBlock.statements.map(x=> x.key);
                break;
            case 'aspects':
                religion.aspects = religionValueBlock.statements.map(x=> x.key);
                break;        
            case 'blessings':
                religion.blessings = religionValueBlock.statements.map(x=> x.key);
                break;
            case 'country':
                religion.country = religionValueBlock
                break;
            case 'province': 
                religion.province = religionValueBlock
                break;
            case 'country_as_secondary': 
                religion.country_as_secondary = religionValueBlock
                break;
            case 'on_convert':
                religion.on_convert = religionValueBlock
                break;
            case 'orthodox_icons':
                religion.orthodox_icons = religionValueBlock
                break;
            case 'papacy':
                religion.papacy = religionValueBlock
                break;
            case 'gurus':
                religion.gurus = religionValueBlock
                break;
            case 'will_get_center':
                religion.will_get_center = religionValueBlock
                break;
        }
    }

    for(var statement of block.statements) {
        var key = statement.key;
        var value = removeComments(statement.value);
        switch(key) {
            case 'color':
                religion.color = value;
                break;
            case 'icon':
                religion.icon = Number(value);
                break;
            case 'hre_religion':
                religion.hre_religion = value == 'yes';
                break;
            case 'allow_female_defenders_of_the_faith':
                religion.allow_female_defenders_of_the_faith = value== 'yes';
                break;
            case 'uses_anglican_power':
                religion.uses_anglican_power = value == 'yes';
                break;
            case 'uses_hussite_power':
                religion.uses_hussite_power = value == 'yes';
                break;
            case 'uses_church_power':
                religion.uses_church_power = value == 'yes';
                break;
            case 'hre_heretic_religion':            
                religion.hre_heretic_religion = value == 'yes';
                break;
            case 'fervor':
                religion.fervor = value == 'yes';
                break;
            case 'has_patriarchs':            
                religion.has_patriarchs = value == 'yes';
                break;
            case 'misguided_heretic':
                religion.misguided_heretic = value == 'yes';
                break;
            case 'uses_piety':
                religion.uses_piety = value == 'yes';
                break;
            case 'uses_karma':
                religion.uses_karma = value == 'yes';
                break;
            case 'uses_harmony':
                religion.uses_harmony = value == 'yes';
                break;
            case 'uses_isolationism':
                religion.uses_isolationism = value == 'yes';
                break;
            case 'personal_deity':
                religion.personal_deity = value == 'yes';
                break;
            case 'fetishist_cult':
                religion.fetishist_cult = value == 'yes';
                break;
            case 'ancestors':
                religion.ancestors = value == 'yes';
                break;
            case 'authority':
                religion.authority = value == 'yes';
                break;
            case 'religious_reforms':
                religion.religious_reforms = value == 'yes';
                break;
            case 'doom':
                religion.doom = value == 'yes';
                break;
            case 'declare_war_in_regency':
                religion.declare_war_in_regency = value == 'yes';
                break;
            case 'require_reformed_for_institution_development':
                religion.require_reformed_for_institution_development = value == 'yes';
                break;
            case 'can_have_secondary_religion':
                religion.can_have_secondary_religion = value == 'yes';
                break;
            case 'reform_tooltip':
                religion.reform_tooltip = value
                break;
            case 'heretic':
                religion.heretic = value
                break;
            case 'aspects_name':
                religion.aspects_name = value
                break;
            case 'holy_sites':
                religion.holy_sites = value
                break;
            case 'date':
                religion.date =  value
                break;
            case 'harmonized_modifier':
                religion.harmonized_modifier = value
                break;
        }
    }
    
    return religion;
}

export function parseReligionGroup(parserArguments: ParserArguments, lines: string[]) : ReligionGroup {
    var religionGroup = <ReligionGroup>({
        religions: new Array()
    });

    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        var line = lines[parserArguments.lineNumber];
        if(!line || line.startsWith('#')) {
            continue;
        }

        if(line.includes('{')) {
            religionGroup.name = line.split('=')[0].trim();
        }
        else if(line.startsWith('defender_of_faith')) {
            religionGroup.defender_of_faith = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('can_form_personal_unions')) {
            religionGroup.can_form_personal_unions = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('ai_will_propagate_through_trade')) {
            religionGroup.ai_will_propagate_through_trade = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('center_of_religion')) {
            religionGroup.center_of_religion = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('flags_with_emblem_percentage')) {
            religionGroup.flags_with_emblem_percentage = Number(getStatementValueTrimmed(line));
        }
        else if(line.startsWith('flag_emblem_index_range')) {
            religionGroup.flag_emblem_index_range = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('harmonized_modifier')) {
            religionGroup.harmonized_modifier = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('crusade_name')) {
            religionGroup.crusade_name = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('religious_schools')) {
            religionGroup.religious_schools = parseBlock(lines, parserArguments, 'religious_schools');
        }
        else if(line.startsWith('}')){
            break;
        }
        else {
            religionGroup.religions.push(importReligion(parserArguments, lines));
        }
    }

    return religionGroup;
}

export function importReligion(parserArguments: ParserArguments, lines: string[]) : Religion {
    var religion = <Religion>({});
    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        var line = lines[parserArguments.lineNumber];
        if(!line || line.startsWith('#')) {
            continue;
        }

        if(line.includes('{')) {
            religion.name = line.split('=')[0].trim();
        }
        else if(line.startsWith('color')) {
            religion.color = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('icon')) {
            religion.icon = Number(getStatementValueTrimmed(line));
        }
        else if(line.startsWith('allowed_conversion')) {
            religion.allowed_conversion = readDataBlockWithValuesSeparatedByLine('allowed_conversion', lines, parserArguments).values;
        }
        else if(line.startsWith('country')) {
            religion.country = parseBlock(lines, parserArguments, 'country');
        }
        else if(line.startsWith('province')) {
            religion.province = parseBlock(lines, parserArguments, 'province');
        }
        else if(line.startsWith('country_as_secondary')) {
            religion.country_as_secondary = parseBlock(lines, parserArguments, 'country_as_secondary');
        }
        else if(line.startsWith('hre_religion')) {
            religion.hre_religion = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('allow_female_defenders_of_the_faith')) {
            religion.allow_female_defenders_of_the_faith = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('uses_anglican_power')) {
            religion.uses_anglican_power = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('uses_hussite_power')) {
            religion.uses_hussite_power = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('uses_church_power')) {
            religion.uses_church_power = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('hre_heretic_religion')) {
            religion.hre_heretic_religion = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('fervor')) {
            religion.fervor = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('has_patriarchs')) {
            religion.has_patriarchs = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('misguided_heretic')) {
            religion.misguided_heretic = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('uses_piety')) {
            religion.uses_piety = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('uses_karma')) {
            religion.uses_karma = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('uses_harmony')) {
            religion.uses_harmony = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('uses_isolationism')) {
            religion.uses_isolationism = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('personal_deity')) {
            religion.personal_deity = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('fetishist_cult')) {
            religion.fetishist_cult = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('ancestors')) {
            religion.ancestors = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('authority')) {
            religion.authority = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('religious_reforms')) {
            religion.religious_reforms = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('doom')) {
            religion.doom = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('declare_war_in_regency')) {
            religion.declare_war_in_regency = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('require_reformed_for_institution_development')) {
            religion.require_reformed_for_institution_development = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('can_have_secondary_religion')) {
            religion.can_have_secondary_religion = getStatementValueTrimmed(line) == 'yes';
        }
        else if(line.startsWith('reform_tooltip')) {
            religion.reform_tooltip = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('on_convert')) {
            religion.on_convert = parseBlock(lines, parserArguments, 'on_convert');
        }
        else if(line.startsWith('orthodox_icons')) {
            religion.orthodox_icons = parseBlock(lines, parserArguments, 'orthodox_icons');
        }
        else if(line.startsWith('heretic ') || line.startsWith('heretic=')) {
            religion.heretic = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('papacy')) {
            religion.papacy = parseBlock(lines, parserArguments, 'papacy');
        }
        else if(line.startsWith('gurus')) {
            religion.gurus = parseBlock(lines, parserArguments, 'gurus');
        }
        else if(line.startsWith('will_get_center')) {
            religion.will_get_center = parseBlock(lines, parserArguments, 'will_get_center');
        }
        else if(line.startsWith('allowed_center_conversion')) {
            religion.allowed_center_conversion = readDataBlockWithValuesSeparatedByLine('allowed_center_conversion', lines, parserArguments).values;
        }
        else if(line.startsWith('aspects')) {
            religion.aspects = readDataBlockWithValuesSeparatedByLine('aspects', lines, parserArguments).values;
        }
        else if(line.startsWith('blessings')) {
            religion.blessings = readDataBlockWithValuesSeparatedByLine('blessings', lines, parserArguments).values;
        }
        else if(line.startsWith('aspects_name')) {
            religion.aspects_name = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('holy_sites')) {
            religion.holy_sites = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('date')) {
            religion.date = getStatementValueTrimmed(line);
        }
        else if(line.startsWith('harmonized_modifier')) {
            religion.harmonized_modifier = getStatementValueTrimmed(line);
        }
        else if(line.includes('}')) {
            break;
        }
    }

    return religion;
}

export type Religion = {
    name: string,
    color: string,
    icon: number,
    allowed_conversion: string[],
    country: DataBlockDeserilized,
    province: DataBlockDeserilized,
    hre_religion: boolean,
    hre_heretic_religion: boolean,
    on_convert: DataBlockDeserilized,
    will_get_center: DataBlockDeserilized,
    orthodox_icons: DataBlockDeserilized,
    heretic: string,
    allow_female_defenders_of_the_faith: boolean,
    allowed_center_conversion: string[],
    country_as_secondary: DataBlockDeserilized,
    uses_anglican_power: boolean,
    uses_hussite_power: boolean,
    uses_church_power: boolean,
    uses_piety: boolean,
    uses_karma: boolean,
    uses_harmony: boolean,
    uses_isolationism: boolean,
    fetishist_cult: boolean,
    ancestors: boolean,
    authority: boolean,
    personal_deity: boolean,
    can_have_secondary_religion: boolean,
    doom: boolean,
    religious_reforms: boolean,
    declare_war_in_regency: boolean,
    fervor: boolean,
    has_patriarchs: boolean,
    misguided_heretic: boolean,
    require_reformed_for_institution_development: boolean,
    reform_tooltip: string,
    holy_sites: string,
    blessings: string[],
    aspects: string[],
    aspects_name: string,
    date: string,
    harmonized_modifier: string,
    papacy: DataBlockDeserilized,
    gurus: DataBlockDeserilized,
}

export type ReligionGroup = GroupedObject & {
    name: string,
    defender_of_faith: boolean,
    can_form_personal_unions: boolean,
    center_of_religion: string,
    flags_with_emblem_percentage: number,
    flag_emblem_index_range: string,
    religions: Religion[],
    ai_will_propagate_through_trade: boolean
    religious_schools: DataBlockDeserilized,
    harmonized_modifier: string,
    crusade_name: string,
}