using System.Text.Json.Serialization;

namespace EUM.EU4Parser.Objects
{
    public class MissionTree
    {
        public required string Name { get; set; }
        public string? OriginalFileName { get; set; } = string.Empty;
        public bool? GenerateReplacementFile { get; set; } = false;
        public List<MissionSlot>? OriginalMissionSlots { get; set; }
    }

    public class MissionSlot
    {
        public required string Name { get; set; }
        public int Number { get; set; }
        public List<MissionNode>? Missions { get; set; }
        public bool Ai { get; set; }
        public bool HasCountryShield { get; set; }
        public bool Generic { get; set; }
        public MissionSlotPotential? BuiltPotential { get; set; }
    }

    public class MissionNode
    {
        public string? Id { get; set; }
        public string? Icon { get; set; }
        public int? Position { get; set; }
        public List<string>? RequiredMissionIds { get; set; }
        public MissionTrigger? BuiltTrigger { get; set; }
        public MissionEffect? BuiltEffect { get; set; }
        public MissionProvincesToHighlight? MissionProvincesToHighlight { get; set; }
    }

    public class TreeItemEntry
    {
        public string? EntryType { get; set; }

        public string? Key { get; set; }

        public Statement? Statement { get; set; }

        public List<TreeItemEntry>? ChildEntries { get; set; }
    }

    public class MissionTrigger
    {
        public List<TreeItemEntry>? MissionTriggerEntries { get; set; }
    }

    public class MissionEffect
    {
        public List<TreeItemEntry>? MissionEffectEntries { get; set; }
    }

    public class MissionSlotPotential
    {
        public List<TreeItemEntry>? MissionSlotPotentialEntries { get; set; }
    }

    public class MissionProvincesToHighlight
    {
        public List<TreeItemEntry>? MissionProvincesToHighlightEntries { get; set; }
    }

    public class Statement
    {
        public string StatementType { get; set; } = string.Empty;
        public string StatementCategory { get; set; } = string.Empty;
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
