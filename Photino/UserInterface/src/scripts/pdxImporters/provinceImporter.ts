import type { GroupedObject } from "../../structs/genericStructs";
import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/missionStructs";
import { readFileContent } from "../backendControllers/backendCommunication";
import { addObjectChange } from "../repositories/changedObjectRepository";
import { createNewGroup } from "../repositories/groupRepository";
import { newLineSeperator } from "./pdxSyntaxParser";

export async function importProvinces(path : string) : Promise<ProvinceDefinition[]> {
    var value : ProvinceDefinition[] = [];

    var input = await readFileContent(path);
    if(!input) {
        return value;
    }

    var lines = input.split(newLineSeperator);
    var group = createNewGroup(ChangedObjectCategory.ProvinceDefinition, "provinces", "definition.csv");
    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        if(line.includes('province')){
            continue;
        }

        var splitLine = line.split(';');
        var provinceDefinition = <ProvinceDefinition>({
            id: splitLine[0] ?? '',
            color: `${splitLine[1]}-${splitLine[2]}-${splitLine[3]}`,
            name: splitLine[4] ?? '',
            group_id: group.id,
            is_imported: true
        });

        value.push(provinceDefinition);
    }

    addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.ProvinceDefinition, group.id, 'provinces');
    return value;
}

export type ProvinceDefinition = GroupedObject & {
    id : string;
    name : string;
    color: string;
}