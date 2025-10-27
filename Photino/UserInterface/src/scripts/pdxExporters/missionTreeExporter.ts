import type { MissionEffect, MissionProvincesToHighlight, MissionSlotPotential, MissionTree, MissionTrigger } from "@/structs/missionStructs";
import { toSnakeCase } from "../utils";
import { getTabs } from "./exportUtils";
import type { TreeItemEntry } from "@/components/basic_controls/builder_tree/builderTreeItemExtender";

export function exportMissionTrees(missionTrees: MissionTree[]): string[] {
    const result: string[] = [];

    for (const missionTree of missionTrees) {
        result.push(exportMissionTree(missionTree));
    }

    return result;
}

export function exportMissionTree(missionTree: MissionTree) : string {
    const builder: string[] = [];
    const slots = missionTree.originalMissionSlots ?? [];
    const sortedSlots = slots
        .filter(slot => slot && slot.number > 0 && slot.number <= 5 && slot.missions?.length > 0)
        .sort((a, b) => a.number - b.number);

    for (const slot of sortedSlots) {
        if (!slot || !slot.missions) {
            continue;
        }

        var tabCount = 1;

        builder.push(`${toSnakeCase(slot.name)} = {`);
        builder.push(`${getTabs(tabCount)}slot = ${slot.number}`);
        builder.push(`${getTabs(tabCount)}generic = ${slot.generic ? 'yes' : 'no'}`);
        builder.push(`${getTabs(tabCount)}ai = ${slot.ai ? 'yes' : 'no'}`);
        builder.push(`${getTabs(tabCount)}has_country_shield = ${slot.hasCountryShield ? 'yes' : 'no'}`);

        if (slot.builtPotential?.missionSlotPotentialEntries?.length > 0) {
            const potential = exportBuiltPotential(slot.builtPotential, tabCount + 1);
            builder.push(`${getTabs(tabCount)}potential = {\n${potential}${getTabs(tabCount)}}`);
        } 
        else {
            builder.push(`${getTabs(tabCount)}potential = { }`);
        }

        const missions = [...slot.missions].sort((a, b) => a.position - b.position);
       
        for (const mission of missions) {
            builder.push(`\n${getTabs(tabCount)}${mission.id ?? ''} = {`);
            tabCount += 1;
            builder.push(`${getTabs(tabCount)}icon = ${mission.icon}`);
            builder.push(`${getTabs(tabCount)}position = ${mission.position}`);

            const requiredMissions = mission.requiredMissionIds ?? [];
            if (requiredMissions.length > 0) {
                builder.push(`${getTabs(tabCount)}required_missions = {`);
                builder.push(`${getTabs(tabCount + 1)}${requiredMissions.join(' ')}`);
                builder.push(`${getTabs(tabCount)}}`);
            } else {
                builder.push(`${getTabs(tabCount)}required_missions = { }`);
            }

            if (mission.missionProvincesToHighlight?.missionProvincesToHighlightEntries?.length > 0) {
                const provinces = exportBuiltProvincesToHighlight(mission.missionProvincesToHighlight, tabCount + 1);
                builder.push(`${getTabs(tabCount)}provinces_to_highlight = {\n${provinces}${getTabs(tabCount)}}`);
            } else {
                builder.push(`${getTabs(tabCount)}provinces_to_highlight = { }`);
            }

            if (mission.builtTrigger?.missionTriggerEntries?.length > 0) {
                const trigger = exportBuiltTrigger(mission.builtTrigger, tabCount + 1);
                builder.push(`${getTabs(tabCount)}trigger = {\n${trigger}${getTabs(tabCount)}}`);
            } else {
                builder.push(`${getTabs(tabCount)}trigger = { }`);
            }

            if (mission.builtEffect?.missionEffectEntries?.length > 0) {
                const effect = exportBuiltEffect(mission.builtEffect, tabCount + 1);
                builder.push(`${getTabs(tabCount)}effect = {\n${effect}${getTabs(tabCount)}}`);
            } else {
                builder.push(`${getTabs(tabCount)}effect = { }`);
            }

            tabCount -= 1;
            builder.push(`${getTabs(tabCount)}}`);
        }

        builder.push(`}\n`);
    }

    return builder.join('\n');
}

function exportBuiltEffect(effect: MissionEffect, level: number = 2): string {
    if (!effect.missionEffectEntries) return '';

    let result = '';
    for (const entry of effect.missionEffectEntries) {
        if ((entry.type ?? '') === 'empty') continue;

        result += exportBuiltEntryChild(entry, level);
    }

    return result;
}

function exportBuiltTrigger(trigger: MissionTrigger, level: number = 2): string {
    if (!trigger.missionTriggerEntries) return '';

    let result = '';
    for (const entry of trigger.missionTriggerEntries) {
        if ((entry.type ?? '') === 'empty') continue;

        result += exportBuiltEntryChild(entry, level);
    }

    return result;
}

function exportBuiltProvincesToHighlight(provinces: MissionProvincesToHighlight, level: number): string {
    if (!provinces.missionProvincesToHighlightEntries) return '';

    let result = '';
    for (const entry of provinces.missionProvincesToHighlightEntries) {
        if ((entry.type ?? '') === 'empty') continue;

        result += exportBuiltEntryChild(entry, level);
    }

    return result;
}

function exportBuiltPotential(potential: MissionSlotPotential, level: number): string {
    if (!potential.missionSlotPotentialEntries) return '';

    let result = '';
    for (const entry of potential.missionSlotPotentialEntries) {
        if ((entry.type ?? '') === 'empty') continue;

        result += exportBuiltEntryChild(entry, level);
    }

    return result;
}

function exportBuiltEntryChild(entry: TreeItemEntry, level: number): string {
    let result = '';
    const tabs = getTabs(level);
    const entryKey = entry.key ?? '';

    if (entry.type === 'statement' && entry.statement) {
        const statement = entry.statement;
        result += `${tabs}${statement.key} = ${statement.value}\n`;
    } else if (entry.childEntries && entry.childEntries.length > 0) {
        const isWrapped = ['effect_tooltip', 'first_limit', 'first_effect', 'second_limit', 'second_effect'].includes(entryKey);

        if (isWrapped) {
            result += `${tabs}${entryKey} = "\n`;
        } else {
            result += `${tabs}${entryKey} = {\n`;
        }

        for (const childEntry of entry.childEntries) {
            result += exportBuiltEntryChild(childEntry, level + 1);
        }

        if (isWrapped) {
            result += `${tabs}"\n`;
        } else {
            result += `${tabs}}\n`;
        }
    }

    return result;
}