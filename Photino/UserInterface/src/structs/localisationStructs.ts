import type { GameObject, KeyValuePair } from "./genericStructs";

export type LanguageLocalisation = GameObject & {
    language: string;
    localisationMap: KeyValuePair<string, string>[];
}