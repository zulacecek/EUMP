using System.Text.RegularExpressions;

namespace EUM.Utils
{
    public static class UtilTools
    {
        public static string ToSnakeCase(string input)
        {
            return Regex.Replace(input, @"([a-z0-9])([A-Z])", "$1_$2").ToLower();
        }
    }
}
