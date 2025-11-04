// import { computed } from "vue";
// import { store } from "../storage";
// import type { Mod } from "../../structs/mission_structs";
// import { ChangedObjectActionType, ChangedObjectCategory } from "../../structs/mission_structs";
// import type { ObjectGroup } from "../../structs/generic_structures";
// import { addObjectChange } from "./changedObjectRepository";
// import { generateObjectId } from "../utils";

// var modData = computed(() => store.getters.getMod as Mod);

// export const groupIdToGroup = computed(() => {
//     return new Map(modData.value?.object_groups?.map(group => [group.group_id, group]));
// });

// export function createNewGroup(groupCategory: ChangedObjectCategory, groupName: string, fileName: string) : ObjectGroup {
//     var existingGroup = modData.value.object_groups.firstOrDefault(x=> x.change_category == ChangedObjectCategory.ObjectGroup);
//     if(existingGroup) {
//         var groupId = existingGroup.id;
//     }
//     else {
//         var newGroup = <ObjectGroup>({
//             change_category: ChangedObjectCategory.ObjectGroup,
//             group_id: generateObjectId(),
//             id: generateObjectId(),
//             is_imported: false,
//             group_file_name: '',
//             group_name: 'object_groups'
//         });

//         var groupId = newGroup.id;
//         addObjectChange(ChangedObjectActionType.New, ChangedObjectCategory.ObjectGroup, newGroup.id, newGroup.group_name);
//         modData.value.object_groups.push(newGroup);
//     }

//     var group = <ObjectGroup>({
//         change_category: groupCategory,
//         group_id: groupId,
//         id: generateObjectId(),
//         is_imported: false,
//         group_file_name: fileName,
//         group_name: groupName
//     });

//     var existingGroup = groupIdToGroup.value.get(group.id);
//     if(existingGroup) {
//         return existingGroup;
//     }

//     addObjectChange(ChangedObjectActionType.Update, ChangedObjectCategory.ObjectGroup, groupId, group.group_name);

//     modData.value.object_groups.push(group);

//     return group;
// }