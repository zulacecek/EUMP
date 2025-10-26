namespace EUM.PDXParser
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.RegularExpressions;

    public static class ParserOptimized
    {
        private static readonly Regex QuotedTextRegex = new Regex("\"([^\"]*)\"", RegexOptions.Compiled);

        public static DataBlock ParseBlock(List<string> lines, ParserArguments parserArguments, string parentKey, bool isParsingQuotesBlock = false)
        {
            var parsedBlock = new DataBlock
            {
                Key = string.Empty,
                Blocks = [],
                Statements = [],
                Position = parserArguments.LineNumber
            };

            for (; parserArguments.LineNumber < lines.Count; parserArguments.LineNumber++)
            {
                var line = lines[parserArguments.LineNumber];
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                if (line.Contains("=\"") && !line.Contains("=\"\""))
                {
                    var lineSplit = line.Split('"');
                    if (lineSplit.Length < 2 || string.IsNullOrEmpty(lineSplit[1]))
                    {
                        line = line.Replace("\"", "{");
                        isParsingQuotesBlock = true;
                    }
                    else
                    {
                        var equalsCount = lineSplit[1].Count(c => c == '=');
                        if (equalsCount > 1)
                        {
                            line = line.Replace("\"", "{");
                            line = line[..^1] + "}";
                        }
                    }
                }

                if (line.Contains('{') && line.Contains('}'))
                {
                    var oneLineBlock = new DataBlock
                    {
                        Key = string.Empty,
                        Blocks = [],
                        Statements = [],
                        Position = parserArguments.LineNumber
                    };

                    oneLineBlock.Key = ReadPropertyKey(line);
                    var nestingCount = line.Split('{').Length;

                    if (nestingCount > 2)
                    {
                        var result = ExtractInnerCurlyBraces(line);
                        var parsedNestedOneLineBlocks = ParseBlock(result, new ParserArguments { LineNumber = 0 }, "", isParsingQuotesBlock);
                        parsedBlock.Blocks.Add(parsedNestedOneLineBlocks);
                        continue;
                    }

                    var blockContent = ReadPropertyValueBetweenCurlyBraces(line);
                    if (string.IsNullOrEmpty(blockContent))
                    {
                        if (parserArguments.ContinueOnEmptyOnelineBlock)
                            continue;
                        break;
                    }

                    var singleLineBlocks = ReadSingleLineBlock(blockContent, oneLineBlock.Key);
                    int counter = 0;
                    foreach (var singleLineBlock in singleLineBlocks)
                    {
                        singleLineBlock.Position = parserArguments.LineNumber + counter++;
                        if (singleLineBlock.Key == oneLineBlock.Key)
                            parsedBlock.Statements.Add(singleLineBlock);
                        else
                            oneLineBlock.Statements.Add(singleLineBlock);
                    }

                    if (oneLineBlock.Blocks.Count > 0 || oneLineBlock.Statements.Count > 0)
                        parsedBlock.Blocks.Add(oneLineBlock);

                    if (!string.IsNullOrEmpty(parentKey) && oneLineBlock.Key == parentKey)
                        break;

                    continue;
                }

                if (isParsingQuotesBlock && line.EndsWith("\"") && !line.EndsWith("\\\""))
                {
                    line = line[..^1];
                    lines.Insert(parserArguments.LineNumber + 1, "}");
                    isParsingQuotesBlock = false;
                }

                if (line.Contains('}'))
                    break;

                if (line.Contains('{'))
                {
                    if (string.IsNullOrEmpty(parsedBlock.Key))
                    {
                        parsedBlock.Key = ReadPropertyKey(line);
                        continue;
                    }

                    parsedBlock.Blocks.Add(ParseBlock(lines, parserArguments, "", isParsingQuotesBlock));
                    continue;
                }

                var statement = ReadDataStatement(line);
                if (statement != null && (!string.IsNullOrEmpty(statement.Key) || !string.IsNullOrEmpty(statement.Value)))
                {
                    statement.Position = parserArguments.LineNumber;
                    parsedBlock.Statements.Add(statement);
                }
            }

            return parsedBlock;
        }

        private static List<string> ExtractInnerCurlyBraces(string input)
        {
            var modifiedInput = input
                .Replace("{", "{\n")
                .Replace("}", "\n}\n");

            modifiedInput = Regex.Replace(modifiedInput, @"\s*=\s*", "=");
            modifiedInput = modifiedInput.Replace(" ", "\n");

            return modifiedInput.Split(['\n'], StringSplitOptions.RemoveEmptyEntries).ToList();
        }

        public static string NormalizedFileInput(string input)
        {
            return Regex.Replace(input.Replace("\t", "").Replace("\r", ""), "#.*", "");
        }

        public static string NormalizedFileInputTabForSpace(string input)
        {
            return Regex.Replace(input.Replace("\t", " ").Replace("{}", "{ \n }"), "#.*", "");
        }

        public static string ReadPropertyValue(string input)
        {
            var index = input.IndexOf('=');
            return index >= 0 ? input.AsSpan(index + 1).Trim().ToString() : string.Empty;
        }

        public static string ReadPropertyKey(string input)
        {
            var index = input.IndexOf('=');
            return index >= 0 ? input.AsSpan(0, index).Trim().ToString() : input.Trim();
        }

        public static string ReadPropertyValueBetweenCurlyBraces(string input)
        {
            var match = Regex.Match(input, "\\{([^}]*)\\}");
            return match.Success ? match.Groups[1].Value.Trim() : "";
        }

        public static List<DataStatement> ReadSingleLineBlock(string input, string key)
        {
            var result = new List<DataStatement>();
            var normalizedInput = Regex.Replace(input, @"\s*=\s*", "=");

            if (!normalizedInput.Contains('='))
            {
                result.Add(new DataStatement { Key = key, Value = normalizedInput });
                return result;
            }

            var underscoredValues = QuotedTextRegex.Replace(normalizedInput, m => m.Value.Replace(" ", "_"));

            var lineSplit = underscoredValues.Split(' ');
            foreach (var statement in lineSplit)
            {
                var trimmed = statement.Trim();
                var reversed = QuotedTextRegex.Replace(trimmed, m => m.Value.Replace("_", " "));
                var dataStatement = ReadDataStatement(reversed);
                if (dataStatement != null)
                    result.Add(dataStatement);
            }

            return result;
        }

        public static DataStatement ReadDataStatement(string input)
        {
            var lineSplit = input.Replace("\"\"", "").Split('=');
            var dataStatement = new DataStatement
            {
                Key = lineSplit[0].Trim(),
                Value = lineSplit.Length > 1 ? lineSplit[1].Trim() : string.Empty
            };
            return dataStatement;
        }

        public static ListWithKey ReadDataBlockWithValuesSeparatedByLine(string key, List<string> lines, ParserArguments parserArguments)
        {
            var list = new ListWithKey
            {
                Key = key,
                Values = []
            };

            var parsingValues = false;
            for (; parserArguments.LineNumber < lines.Count; parserArguments.LineNumber++)
            {
                var line = lines[parserArguments.LineNumber];
                if (parsingValues)
                {
                    if (line.Contains('}'))
                        break;

                    list.Values.Add(line);
                    continue;
                }

                if (line.StartsWith(key))
                {
                    parsingValues = true;
                    continue;
                }
            }

            return list;
        }

        private static string ReplaceSpaceCharacter(string input, string replacement)
        {
            return input.Replace(" ", replacement);
        }

        public const string NewLineSeparator = "\n";
    }
}