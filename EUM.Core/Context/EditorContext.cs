namespace EUM.Core.Context
{
    public static class EditorContext
    {
        public static Mod? OpenedMod { get; set; }
        public static ModSettings? ModSettings { get; set; }
        public static bool ForceClose { get; set; }
    }
}
