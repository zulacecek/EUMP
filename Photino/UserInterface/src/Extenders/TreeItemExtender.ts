import type { DropdownOptions } from '@/components/basic_controls/dropdown/dropdownExtender';
import { availableScopes, availableTreeItems } from '../scripts/appContext';
import { type MissionTree } from '../structs/missionStructs';
import { ValueType } from '@/structs/uiStructs';

var categoriesMap = new Map<string, string[]>([
    ["Trigger", ["Country", "TradingNode", "TradeNode", "Tag", "Operator", "Scope", "Area", "ProvinceID", "Province", "Global", "Clause"]],
    ["Country", ["Country", "Operator", "Global", "Scope"]],
    ["TradingNode", ["TradeNode", "TradingNode", "Operator", "Global", "Scope"]],
    ["TradeNode", ["TradeNode"]],
    ["Tag", ["Tag", "Country", "Operator", "Global", "Scope", "CountryEffect",
        "General", "Economy", "Trade", "Government", "Culture", "Religion", "Technology", "Court", "Stability", "Military", "Diplomacy", "EstatesAndFactions", "Ruler", "Consort", "Heir", "Empires", "AI"
    ]],
    ["Operator", ["Country", "TradingNode", "Tag", "Operator", "Scope", "Area", "ProvinceID", "Global" ]],
    ["Scope", ["Country", "TradingNode", "Tag", "Operator", "Scope", "Area", "ProvinceID", "Global",
        "General", "Economy", "Trade", "Government", "Culture", "Religion", "Technology", "Court", "Stability", "Military", "Diplomacy", "EstatesAndFactions", "Ruler", "Consort", "Heir", "Empires", "AI",
        "ProvinceGeneral", "Development", "Society", "Unrest", "Colonisation", "ProvinceDiplomacy", "ProvinceMilitary", "ProvinceTrade", "FlowControl", "ProvinceID"
     ]],
    ["Area", ["Area", "Province", "Oprator", "Global", "Scope"]],
    ["ProvinceID", ["ProvinceID", "Province", "Operator", "Global", "Scope",
        "ProvinceGeneral", "Development", "Society", "Unrest", "Colonisation", "ProvinceDiplomacy", "ProvinceMilitary", "ProvinceTrade", "FlowControl", "Tag", "Scope"
    ]],
    ["Province", ["Province", "Operator", "Global", "Scope"]],
    ["Global", ["Province", "Operator", "Global", "Scope"]],
    ["Clause", ["Clause"]],

    ["SlotPotential", ["Operator"]],

    ["ProvincesToHighlight", ["Operator", "ProvinceID", "Area"]],

    ["Effect", ["General", "Economy", "Trade", "Government", "Culture", "Religion", "Technology", "Court", "Stability", "Military", "Diplomacy", "EstatesAndFactions", "Ruler", "Consort", "Heir", "Empires", "AI", 
        "ProvinceGeneral", "Development", "Society", "Unrest", "Colonisation", "ProvinceDiplomacy", "ProvinceMilitary", "ProvinceTrade", "FlowControl", "Tag", "Scope", "ProvinceID", "CountryEffect"]],
    ["General", ["General"]],
    ["CountryEffect", ["CountryEffect"]],
    ["Economy", ["Economy"]],
    ["Trade", ["Trade"]],
    ["Government", ["Government"]],
    ["Culture", ["Culture"]],
    ["Religion", ["Religion"]],
    ["Religion", ["Religion"]],
    ["Technology", ["Technology"]],
    ["Court", ["Court"]],
    ["Stability", ["Stability"]],
    ["Military", ["Military"]],
    ["Diplomacy", ["Diplomacy"]],
    ["EstatesAndFactions", ["EstatesAndFactions"]],
    ["Ruler", ["Ruler"]],
    ["Consort", ["Consort"]],
    ["Heir", ["Heir"]],
    ["Empires", ["Empires"]],
    ["AI", ["AI"]],
    ["ProvinceGeneral", ["ProvinceGeneral"]],
    ["Development", ["Development"]],
    ["Society", ["Society"]],
    ["Unrest", ["Unrest"]],
    ["Colonisation", ["Colonisation"]],
    ["ProvinceDiplomacy", ["ProvinceDiplomacy"]],
    ["ProvinceMilitary", ["ProvinceMilitary"]],
    ["ProvinceTrade", ["ProvinceTrade"]],
    ["ProvinceTrade", ["FlowControl"]]
]);

var valuesMap = new Map<string, string[]>([
    ["SlotPotential", ["tag", "has_country_flag"]],
    ["ProvincesToHighlight", ["country_or_non_sovereign_subject_holds"]]
]);

export function GetAvailableDropdownOptionsByCategory(category: string | undefined, tree_type: string) : DropdownOptions[] {
    if(!categoriesMap.has(tree_type)){
        return new Array();
    }

    var treeTypeCategories = categoriesMap.get(tree_type) as string[];
    var returnValue : DropdownOptions[] = new Array();

    if(!category){
        for (let index = 0; index < treeTypeCategories.length; index++) {
            const treeTypeCategory = treeTypeCategories[index];
            if(!categoriesMap.has(treeTypeCategory)){
                continue;
            }
            else {
                var categoryValues = availableTreeItems.filter(x => x.Category == treeTypeCategory);
                categoryValues.forEach(categoryValue => {
                    returnValue.push(<DropdownOptions>({ Category: categoryValue.Category, ValueType: parseStatementType(categoryValue.Type), ValueCategory: categoryValue.Type, Label: categoryValue.Label, Value: categoryValue.Key }) )
                });
            }
        }
    }
    else {
        if(categoriesMap.has(category)){
            var categoryMapped = categoriesMap.get(category) as string[];
            for (let index = 0; index < categoryMapped.length; index++) {
                const categoryKey = categoryMapped[index];
                var categoryValues = availableTreeItems.filter(x => x.Category == categoryKey);
                categoryValues.forEach(categoryValue => {
                    if(treeTypeCategories.includes(categoryKey)) {
                        returnValue.push(<DropdownOptions>({ Category: categoryValue.Category, ValueType: parseStatementType(categoryValue.Type), ValueCategory: categoryValue.Type, Label: categoryValue.Label, Value: categoryValue.Key }) )
                    }
                });
            }
        }
    }

    if(valuesMap.has(tree_type)) {
        var valuesMapped = valuesMap.get(tree_type) as string[];
        for (let index = 0; index < valuesMapped.length; index++) {
            const valueKey = valuesMapped[index];
            var value = availableTreeItems.filter(x => x.Key == valueKey)[0];
            if(value) {
                returnValue.push(<DropdownOptions>({ Category: value.Category, ValueType: parseStatementType(value.Type), ValueCategory: value.Type, Label: value.Label, Value: value.Key }) )
            }
        }
    }
    
    return returnValue;
}

var statementValuesMap = new Map<string, string[]>([
    ["Tag", ["Tag"]]
]);

export function getValueDropdownOptions(valueType: ValueType, valueCategories: string, missionTree: MissionTree) : DropdownOptions[] {
    var returnValue = new Array();
    if(!valueType || !valueCategories){
        return returnValue;
    }

    var valueCategoriesSplit = valueCategories.split(', ');
    if(valueType == ValueType.Category) {
        for(var category of valueCategoriesSplit) {
            if(category == "Scope"){
                for(var scope of availableScopes) {
                    returnValue.push(instantiateDropdownOptions(category, category, scope, scope));
                }
            }

            if(category == "CountryFlag")
            {
                return missionTree.settings.possibleCountryFlags.map(x => instantiateDropdownOptions("Possible flags", valueType, x, x));
            }
            
            if(statementValuesMap.has(category)) {
                var valueMapped = statementValuesMap.get(category);
                if(valueMapped){
                    var mappedValueValue = valueMapped[0]
                    var availableItems = availableTreeItems.filter(x => x.Category == mappedValueValue);
                    for(var item of availableItems){
                        returnValue.push(instantiateDropdownOptions(item.Category, item.Type, item.Label, item.Key));
                    }
                }
            }
        }

        return returnValue;
    }

    if(valueType == ValueType.Boolean) {
        returnValue.push(<DropdownOptions>({ Value: "yes", Label: "yes", Category: ValueType.Boolean }));
        returnValue.push(<DropdownOptions>({ Value: "no", Label: "no", Category: ValueType.Boolean }));
        return returnValue;
    }
    
    return returnValue;
}

function instantiateDropdownOptions(category: string, type: string, label: string, key: string) : DropdownOptions {
    return <DropdownOptions>({ Category: category, ValueType: parseStatementType(type), ValueCategory: type, Label: label, Value: key })
}

var statementValueTypeMap = new Map<string, ValueType>([
    ["tag", ValueType.Category],
    ["countryflag", ValueType.Category]
]);


function parseStatementType(statement_type: string) : ValueType {
    var inputValueNormalized = statement_type.toLowerCase();
    if(Object.values(ValueType).includes(inputValueNormalized as ValueType)){
        return inputValueNormalized as ValueType;
    }
    else{
        var valuesSplit = inputValueNormalized.split(', ');
        for(var value of valuesSplit) {
            if(statementValueTypeMap.has(value))
            {
                return statementValueTypeMap.get(value) as ValueType;
            }
        }

        return ValueType.Text;
    }
}
