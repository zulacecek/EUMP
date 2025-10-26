using EUM.Core.Context;
using EUM.Core.Serialization;
using EUM.EU4Parser.Objects;
using EUM.Utils;
using System.Text;

namespace EUM.EU4Parser.ObjectExport
{
    public class MissionTreeExporter
    {
        internal const string MissionTreeExportFolder = "missions";

        public static void LoadAndExportMissionTrees()
        {
            var savePath = Path.Combine(ExportUtils.GetBaseModPath(), ObjectType.MissionTree.ToString());

            var missionTreeFiles = Directory.GetFiles(savePath);
            if (missionTreeFiles is null)
            {
                return;
            }

            var missionTrees = new List<MissionTree>();
            foreach (var missionTreeName in missionTreeFiles)
            {
                var missionTreePath = Path.Combine(savePath, missionTreeName);
                if (!File.Exists(missionTreePath))
                {
                    continue;
                }

                var fileContent = File.ReadAllText(missionTreePath);
                if (string.IsNullOrEmpty(fileContent))
                {
                    continue;
                }

                var missionTree = JsonSerializerExtender.Deserialize<MissionTree>(fileContent);
                if (missionTree is null)
                {
                    continue;
                }

                missionTrees.Add(missionTree);
            }

            var exportedObjects = ExportMissionTrees(missionTrees);
            ExportUtils.WriteExportedFiles(exportedObjects);
        }

        public static List<ExportedObject> ExportMissionTrees(List<MissionTree> missionTrees)
        {
            var result = new List<ExportedObject>();
            foreach (var missionTree in missionTrees)
            {
                var builder = new StringBuilder();
                var slots = missionTree.OriginalMissionSlots ?? [];
                var sortedSlots = slots
                    .Where(slot => slot is not null && slot.Number > 0 && slot.Number <= 5 && slot.Missions?.Count > 0)
                    .OrderBy(slot => slot.Number)
                    .ToList();

                foreach (var slot in sortedSlots)
                {
                    if (slot is null || slot.Missions is null)
                    {
                        continue;
                    }

                    builder.AppendLine($"{UtilTools.ToSnakeCase(slot.Name)} = {{");
                    builder.AppendLine($"{ExportUtils.GetTabs()}slot = {slot.Number}");
                    builder.AppendLine($"{ExportUtils.GetTabs()}generic = {(slot.Generic == true ? "yes" : "no")}");
                    builder.AppendLine($"{ExportUtils.GetTabs()}ai = {(slot.Ai == true ? "yes" : "no")}");
                    builder.AppendLine($"{ExportUtils.GetTabs()}has_country_shield = {(slot.HasCountryShield == true ? "yes" : "no")}");

                    if (slot.BuiltPotential?.MissionSlotPotentialEntries?.Count > 0)
                    {
                        var potential = ExportBuiltPotential(slot.BuiltPotential);
                        builder.AppendLine($"{ExportUtils.GetTabs()}potential = {{{Environment.NewLine}{potential}{Environment.NewLine}{ExportUtils.GetTabs()}}}");
                    }
                    else
                    {
                        builder.AppendLine($"{ExportUtils.GetTabs()}potential = {{ }}");
                    }

                    var missions = slot.Missions
                        .OrderBy(m => m.Position)
                        .ToList();

                    var tabCount = 2;
                    foreach (var mission in missions)
                    {
                        builder.AppendLine($"{Environment.NewLine}{ExportUtils.GetTabs()}{mission.Id ?? string.Empty} = {{");

                        builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}icon = {mission.Icon}");

                        builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}position = {mission.Position}");

                        var requiredMissions = mission.RequiredMissionIds ?? [];
                        if (requiredMissions.Any())
                        {
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}required_missions = {{");
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount + 1)}{string.Join(" ", requiredMissions)}");
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)} }}");
                        }
                        else
                        {
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}required_missions = {{ }}");
                        }

                        if (mission.MissionProvincesToHighlight?.MissionProvincesToHighlightEntries?.Count > 0)
                        {
                            var provinces = ExportBuiltProvincesToHighlight(mission.MissionProvincesToHighlight);
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}provinces_to_highlight = {{{Environment.NewLine}{provinces}{Environment.NewLine}{ExportUtils.GetTabs(tabCount)}}}");
                        }
                        else
                        {
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}provinces_to_highlight = {{ }}");
                        }

                        if (mission.BuiltTrigger?.MissionTriggerEntries?.Count > 0)
                        {
                            var trigger = ExportBuiltTrigger(mission.BuiltTrigger, tabCount);
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}trigger = {{{Environment.NewLine}{trigger}{Environment.NewLine}{ExportUtils.GetTabs(tabCount)}}}");
                        }
                        else
                        {
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}trigger = {{ }}");
                        }

                        if (mission.BuiltEffect?.MissionEffectEntries?.Count > 0)
                        {
                            var effect = ExportBuiltEffect(mission.BuiltEffect, tabCount);
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}effect = {{{Environment.NewLine}{effect}{Environment.NewLine}{ExportUtils.GetTabs(tabCount)}}}");
                        }
                        else
                        {
                            builder.AppendLine($"{ExportUtils.GetTabs(tabCount)}effect = {{ }}");
                        }

                        builder.AppendLine($"{ExportUtils.GetTabs()}}}");
                    }

                    builder.AppendLine("}");
                }

                result.Add(new ExportedObject
                {
                    Name = missionTree.Name ?? string.Empty,
                    ObjectContent = builder.ToString(),
                    GenerateReplacementFile = missionTree.GenerateReplacementFile,
                    OriginalFileName = missionTree.OriginalFileName,
                    ObjectExportFolder = MissionTreeExportFolder,
                    ObjectType = ObjectType.MissionTree
                });
            }

            return result;
        }

        internal static string ExportBuiltEffect(MissionEffect missionEffect, int? level = null)
        {
            var result = string.Empty;
            if (missionEffect.MissionEffectEntries == null)
            {
                return result;
            }

            foreach (var entry in missionEffect.MissionEffectEntries)
            {
                if ((entry.EntryType ?? string.Empty) == "empty")
                {
                    continue;
                }

                int childLevel = level ?? 2;
                result += ExportBuiltEntryChild(entry, childLevel);
            }

            return result;
        }

        internal static string ExportBuiltProvincesToHighlight(MissionProvincesToHighlight provinces)
        {
            var result = string.Empty;
            if (provinces.MissionProvincesToHighlightEntries == null)
            {
                return result;
            }

            foreach (var entry in provinces.MissionProvincesToHighlightEntries)
            {
                if ((entry.EntryType ?? string.Empty) == "empty")
                {
                    continue;
                }

                int childLevel = 2;
                result += ExportBuiltEntryChild(entry, childLevel);
            }

            return result;
        }

        internal static string ExportBuiltTrigger(MissionTrigger trigger, int? level = null)
        {
            var result = string.Empty;
            if (trigger.MissionTriggerEntries == null)
            {
                return result;
            }

            foreach (var entry in trigger.MissionTriggerEntries)
            {
                if ((entry.EntryType ?? string.Empty) == "empty")
                {
                    continue;
                }

                int childLevel = level ?? 2;
                result += ExportBuiltEntryChild(entry, childLevel);
            }

            return result;
        }

        internal static string ExportBuiltPotential(MissionSlotPotential potential)
        {
            var result = string.Empty;
            if (potential.MissionSlotPotentialEntries == null)
            {
                return result;
            }

            foreach (var entry in potential.MissionSlotPotentialEntries)
            {
                if ((entry.EntryType ?? string.Empty) == "empty")
                {
                    continue;
                }

                int childLevel = 1;
                result += ExportBuiltEntryChild(entry, childLevel);
            }

            return result;
        }

        internal static string ExportBuiltEntryChild(TreeItemEntry entry, int level)
        {
            var result = string.Empty;
            var tabs = ExportUtils.GetTabs(level);
            var entryKey = entry.Key ?? string.Empty;

            if (entry.EntryType == "statement" && entry.Statement != null)
            {
                var statement = entry.Statement;
                result += $"{tabs}{statement.Key} = {statement.Value}{Environment.NewLine}";
            }
            else if (entry.ChildEntries != null && entry.ChildEntries.Count > 0)
            {
                if (entryKey == "effect_tooltip" || entryKey == "first_limit" || entryKey == "first_effect" ||
                    entryKey == "second_limit" || entryKey == "second_effect")
                {
                    result += $"{tabs}{entry.Key ?? string.Empty} = \"{Environment.NewLine}";
                }
                else
                {
                    result += $"{tabs}{entry.Key ?? string.Empty} = {{{Environment.NewLine}";
                }

                foreach (var childEntry in entry.ChildEntries)
                {
                    result += ExportBuiltEntryChild(childEntry, level + 1);
                }

                if (entryKey == "effect_tooltip" || entryKey == "first_limit" || entryKey == "first_effect" ||
                    entryKey == "second_limit" || entryKey == "second_effect")
                {
                    result += $"{tabs}\"{Environment.NewLine}";
                }
                else
                {
                    result += $"{tabs}}}{Environment.NewLine}";
                }
            }

            return result;
        }
    }
}
