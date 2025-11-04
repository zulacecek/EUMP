import { replaceSpaceCharacter } from "../utils";

export function parseBlock(lines: string[], parserArguments: ParserArguments, parentKey: string, isParsingQutesBlock: boolean = false): DataBlockDeserilized {
    const parsedBlock = <DataBlockDeserilized>({ blocks: new Array(), statements: new Array(), position: parserArguments.lineNumber });
    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        var line = lines[parserArguments.lineNumber];
        if (!line) {
            continue;
        }

        var lineTestForQuote = replaceSpaceCharacter(line, '');
        if(lineTestForQuote.includes('="') && !lineTestForQuote.includes('=""')) {
            var lineSplit = line.split('"');
            if(!lineSplit[1]) {
                line = line.replace('"', '{');
                isParsingQutesBlock = true;
            }
            else {
                var numberOfStatements = lineSplit[1].split('=').length;
                if(numberOfStatements > 1) {
                    line = line.replace('"', '{');
                    line = line.slice(0 ,-1) + '}';
                }
            }
        }

        if (line.includes('{') && line.includes('}')) {
            const oneLineBlock = <DataBlockDeserilized>({ blocks: new Array(), statements: new Array(), position: parserArguments.lineNumber });
            oneLineBlock.key = readPropertyKey(line);
            var nestingCount = line.split('{').length;
            if(nestingCount > 2){
                var result = extractInnerCurlyBraces(line);
                var parsedNestedOnelineBlocks = parseBlock(result, <ParserArguments>({ lineNumber: 0 }), '', isParsingQutesBlock);
                parsedBlock.blocks.push(parsedNestedOnelineBlocks);
                continue;
            }

            const blockContent = readPropertyValueBetweenCurlyBraces(line);
            if(!blockContent){
                if(parserArguments.continueOnEmptyOnelineBlock){
                    continue;
                }
                
                break;
            }

            var singleLineBlocks = readSingleLineBlock(blockContent, oneLineBlock.key);
            var counter = 0;

            for(var singleLineBlock of singleLineBlocks) {
                singleLineBlock.position = parserArguments.lineNumber + counter;
                counter++;
                if(singleLineBlock.key == oneLineBlock.key) {
                    parsedBlock.statements.push(singleLineBlock);
                }
                else {
                    oneLineBlock.statements.push(singleLineBlock);
                }
            }

            if(oneLineBlock.blocks.length > 0 || oneLineBlock.statements.length > 0){
                parsedBlock.blocks.push(oneLineBlock);
            }

            if(parentKey && oneLineBlock.key == parentKey){
                break;
            }

            continue;
        }

        if(isParsingQutesBlock && line.endsWith('"') && !line.endsWith('\\"')) {
            line = line.slice(0 ,-1);
            lines.splice(parserArguments.lineNumber + 1, 0, '}');
            isParsingQutesBlock = false;
        }

        if (line.includes('}')) {
            break;
        }

        if (line.includes('{')) {
            if (!parsedBlock.key) {
                parsedBlock.key = readPropertyKey(line);
                continue;
            }
            else {
                parsedBlock.blocks.push(parseBlock(lines, parserArguments, '', isParsingQutesBlock));
                continue;
            }
        }

        const statement = readDataStatementDeserilized(line);
        if (statement) {
            statement.position = parserArguments.lineNumber;
            if(statement.key || statement.value) {
                parsedBlock.statements.push(statement);
            }
        }
    }

    return parsedBlock;
}

function extractInnerCurlyBraces(input: string): string[] {
    const modifiedInput = input
        .replace(/{/g, '{\n')
        .replace(/}/g, '\n}\n')
        .replace(/= /g, '=')
        .replace(/ =/g, '=')
        .replace(/ /g, "\n");
    return modifiedInput.split('\n');
}

export function normalizedFileInput(input: string) : string {
    const removeCommentsRegex = new RegExp("#.*", "g");
    return input.replace(/\t/g, "").replace(/\r/g, '').replace(removeCommentsRegex, "");
}

export function normalizedFileInputTabForSpace(input: string) : string {
    const removeCommentsRegex = new RegExp("#.*", "g");
    return input.replace(/\t/g, " ").replace('{}', '{ \n }').replace(removeCommentsRegex, "");
}

export function readPropertyValue(input: string): string {
    return input.split("=")[1].trim();
}

export function readPropertyKey(input: string): string {
    return input.split("=")[0].trim();
}

export function readPropertyValueBetweenCurlyBraces(input: string): string {
    return new RegExp("\\{([^}]*)\\}").exec(input)?.[1].trim() || "";
}

export function readSingleLineBlock(input: string, key: string): DataStatementDeserialized[] {
    const DataStatementDess: DataStatementDeserialized[] = [];
    const normalizedInput = input.replace(/ =/g, "=").replace(/= /g, "=");
    if(!normalizedInput.includes("=")){
        var onelinerDataStatement = <DataStatementDeserialized>({ key: key, value: normalizedInput })
        DataStatementDess.push(onelinerDataStatement);
        return DataStatementDess;
    }

    const underscoredValues = normalizedInput.replace(/"([^"]*)"/g, (match) => {
        return match.replace(/ /g, '_');
    });

    const lineSplit = underscoredValues.split(' ');
    for (const statement of lineSplit) {
        const trimmed = statement.trim();
        const reversed = trimmed.replace(/"([^"]*)"/g, (match) => {
            return match.replace(/_/g, ' ');
        });
        const DataStatementDes = readDataStatementDeserilized(reversed);
        if (DataStatementDes) {
            DataStatementDess.push(DataStatementDes);
        }
    }

    return DataStatementDess;
}

export function readDataStatementDeserilized(input: string): DataStatementDeserialized {
    const lineSplit = input.replace('""', "").split('=');
    const DataStatementDes = <DataStatementDeserialized>({});
    if (lineSplit.length > 0) {
        DataStatementDes.key = lineSplit[0].trim();
    }
    if (lineSplit.length > 1) {
        DataStatementDes.value = lineSplit[1].trim();
    }

    return DataStatementDes;
}

export function readDataBlockWithValuesSeparatedByLine(key: string, lines: string[], parserArguments: ParserArguments) : ListWithKey {
    var list: ListWithKey = <ListWithKey>({
        key: key,
        values: new Array()
    });

    var parsingValues = false;
    for (; parserArguments.lineNumber < lines.length; parserArguments.lineNumber++) {
        var line = lines[parserArguments.lineNumber];
        if(parsingValues){
            if(line.includes('}')) {
                break;
            }

            list.values.push(line);
            continue;
        }

        if(line.startsWith(key)) {
            parsingValues = true;
            continue;
        }
    }

    return list;
}

export type ParserArguments = {
	lineNumber: number;
    continueOnEmptyOnelineBlock: boolean;
}

export type ListWithKey = {
    key: string,
    values: string[]
}

export type DataBlockDeserilized = {
    key: string;
    statements: DataStatementDeserialized[];
    blocks: DataBlockDeserilized[];
    position: number;
}

export type DataStatementDeserialized = {
    key: string;
    value: string;
    position: number;
}

export const newLineSeperator = "\n";