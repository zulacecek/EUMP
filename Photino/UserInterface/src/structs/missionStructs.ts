import type { TreeItemEntry } from "@/components/basic_controls/builder_tree/builderTreeItemExtender";
import type { GameObject } from "./genericStructs";

export type MissionSlot = {
    name: string;
    number: number;
    missions: MissionNode[];
    ai: boolean;
    generic: boolean;
    hasCountryShield: boolean;
    builtPotential: MissionSlotPotential;
    missionTextColor: string;
};

export type MissionNode = {
    id: string;
    isSelected: boolean;
    parentSlotName: string;
    name: string;
    icon: string;
    position: number;
    requiredMissionIds: string[];
    missionProvincesToHighlight: MissionProvincesToHighlight;
    builtTrigger: MissionTrigger;
    builtEffect: MissionEffect;
    originalMissionSlotName: string;
};

export type MissionTrigger = {
    missionTriggerEntries: TreeItemEntry[];
}

export type MissionEffect = {
    missionEffectEntries: TreeItemEntry[];
}

export type MissionSlotPotential = {
    missionSlotPotentialEntries: TreeItemEntry[];
}

export type MissionProvincesToHighlight = {
    missionProvincesToHighlightEntries: TreeItemEntry[];
}

export type MissionTree = GameObject & {
    tags: string[];
    missionSlots: MissionSlot[];
    originalMissionSlots: MissionSlot[];
    settings: MissionModuleSettings;
    originalFileName: string;
    localisationFileId: string;
}

export type SelectedMission = {
    selected_mission_node: MissionNode;
}

export type MissionTreeViewModel = {
    mission_tree: MissionTree;
    settings: MissionModuleSettings;
}

export type MissionSlotViewModel = {
    mission_slot: MissionSlot;
    mission_tree: MissionTree | null;
    settings: MissionModuleSettings;
}

export type MissionNodeViewModel = {
    mission_node: MissionNode | null;
    mission_tree: MissionTree | null;
    index: number;
    slot: number;
    settings: MissionModuleSettings;
}

export type MissionEditViewModel = {
    selected_mission: SelectedMission;
    selected_tree: MissionTree;
    position: number;
    slot: number;
    settings: MissionModuleSettings;
    mission_connection_message: string;
}

export type MissionModuleSettings = {
    isPreview: boolean;
    emptyMissions: number;
    countryFlags: string[];
    possibleCountryFlags: string[];
    isRevolutionaryTarget: boolean;
}

export type MissionTreeModalViewModel = {
    name: string;
    tag: string;
    localisation_id: string;
}

export type TriggerOptions = {
    Value: string;
    Label: string;
    Type: string;
    Scope: string;
}

export type TreeItemOption = {
    Key: string;
    Label: string;
    Type: string;
    Category: string;
    ChildEntries: TreeItemEntry[];
    AllowChanges: boolean;
}

export type ProvinceOptions = {
    ProvinceID: string;
    ProvinceName: string;
}

export enum FileSynchronizationStatus {
    Unknown = "Unknown",
    NotExported = "NotExported",
    UpToDate = "UpToDate",
    FileBehind = "FileBehind",
    FileAhead = "FileAhead"
}