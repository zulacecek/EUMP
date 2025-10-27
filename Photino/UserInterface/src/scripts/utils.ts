// @ts-ignore
import cryptojs from 'crypto-js'

import { useModStore } from '@/stores/modStore';
import type { Mod } from '@/structs/modStructs';

export function camelToSnake(camelCase: string): string {
    return camelCase.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

export function toSnakeCase(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '_');
}

export function toSnakeCaseWithoutLowerCase(text: string): string {
    return text.replace(/\s+/g, '_');
}

export function fixNameAndIdField(text: string): string {
    return text.replace(/\,|\(|\)|\{|\}|\:|\-+/g, '_');
}

export function replaceSpaceCharacter(input: string, replacement: string) : string {
    return input.replace(/ /g, replacement);
}

export function removeComments(input: string) : string {
    if(!input) {
        return '';
    }

    return input.replace(/\s*#.*$/, "");
}

export function removeCommentsBySplit(input: string) : string {
    if(!input) {
        return '';
    }

    return input.split('#')[0].trim();
}

export function deepClone<T>(obj: T, seen = new Map()): T {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    if (seen.has(obj)) {
        return seen.get(obj);
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as any;
    }

    if (Array.isArray(obj)) {
        const arrCopy = [] as any[];
        seen.set(obj, arrCopy);
        for (let i = 0; i < obj.length; i++) {
            arrCopy[i] = deepClone(obj[i], seen);
        }
        return arrCopy as any;
    }

    if (obj instanceof Set) {
        const setCopy = new Set();
        seen.set(obj, setCopy);
        for (const value of obj) {
            setCopy.add(deepClone(value, seen));
        }
        return setCopy as any;
    }

    if (obj instanceof Map) {
        const mapCopy = new Map();
        seen.set(obj, mapCopy);
        for (const [key, value] of obj) {
            mapCopy.set(key, deepClone(value, seen));
        }
        return mapCopy as any;
    }

    if (typeof obj === "object") {
        const objCopy = {} as { [key: string]: any };
        seen.set(obj, objCopy);
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                objCopy[key] = deepClone(obj[key], seen);
            }
        }
        return objCopy as T;
    }

    throw new Error("Unable to copy object! Its type isn't supported.");
}

export function getFileSystemSelectedFilePathName(filePath: string) : string {
    var pathSplit = filePath.split('\\');
    var result = pathSplit[pathSplit.length - 1]?.split('.')[0];
    return result;
}

export function getFileSystemSelectedFilePathNameIncludedExtension(filePath: string) : string {
    var pathSplit = filePath.split('\\');
    var result = pathSplit[pathSplit.length - 1];
    return result;
}

export function getFileName(filePath: string) : string {
    var splitCharacter = '\\';
    if(filePath.includes('/')) {
        splitCharacter = '/';
    }

    var pathSplit = filePath.split(splitCharacter);
    var result = pathSplit[pathSplit.length - 1].split('.')[0];
    return result;
}

export function getFileNameWithExtension(filePath: string) : string {
    var pathSplit = filePath.split('\\');
    return pathSplit[pathSplit.length - 1];
}

export function removeExtensionFromFileName(fileName: string) : string { 
    if(!fileName.includes('.'))
    {
        return fileName;
    }

    return fileName.split('.')[0];
}

export function getDirectory(filePath: string) : string {
    var fileName = getFileNameWithExtension(filePath);
    return filePath.replace(fileName, '');
}

export function removeTrailingCharacter(input: string, remove: string) : string {
    const regex = new RegExp(`${remove}+$`);
    return input.replace(regex, "");
}

export function getMissionTreeFileName(filePath: string) : string {
    var pathSplit = filePath.split('\\');
    var result = pathSplit[pathSplit.length - 1]?.replace(/\.txt$/, '');
    return result;
}

export function getLocalisationFileName(filePath: string) : string {
    var pathSplit = filePath.split('\\');
    var result = pathSplit[pathSplit.length - 1]?.replace(/\.yml$/, '');
    return result;
}

export function getLocalisationFileNameWithForwardSlash(filePath: string) : string {
    var pathSplit = filePath.split('/');
    var result = pathSplit[pathSplit.length - 1]?.replace(/\.yml$/, '').split('_l_')[0];
    return result;
}

export function generateObjectId() : string {
    return cryptojs.lib.WordArray.random(16).toString();
}

export function removeAllQuotes(input: string) : string {
    return replaceAllCharaters(input, '\"', '');
}

export function replaceAllCharaters(input: string, replace: string, by: string): string {
    const regex = new RegExp(replace, "g");
    return input.replace(regex, by);
}

export function getStatementValueTrimmed(input: string) : string {
    return input.split('=')[1].trim();
}

export async function openLink(url: string) {
    try {
      await open(url);
    } catch (_) {
    }
}

export function getArrowFunctionParams(fn: Function): string[] {
    const fnStr = fn.toString();
    const match = fnStr.match(/^\s*\(?\s*([^)=]*)\s*\)?\s*=>/);

    if (!match) return [];

    return match[1]
        .split(',')
        .map(param => param.trim().split('=')[0].trim())
        .filter(param => param.length > 0);
}

export function formatFileSystemPath(...args: any[]) : string {
    return args.filter(x=> x).join('/');
}

export function getFileSavePath(moduleName: string) {
    var modStore = useModStore();
    var mod = modStore.getMod();
    if(!mod) {
        return '';
    }

    return formatFileSystemPath(getProjectFolder(), moduleName);
}

export function getProjectFolder() {
    var modStore = useModStore();
    var mod = modStore.getMod();
    if(!mod) {
        return '';
    }

    return formatFileSystemPath(mod.workDirectory, mod.projectName);
}

export function enhanceFileNameWithExtension(fileName: string, extension: string) {
    if(fileName.endsWith(extension)) {
        return fileName;
    }

    return `${fileName}.${extension}`
}

export function stringIsEmptyOrUndentified(input: string) {
    return input === undefined || input === null || input === '';
}