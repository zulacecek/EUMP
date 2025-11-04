import type { ModFile } from "@/scripts/pdxImporters/modFileImporter";
import type { ImportModParameters } from "@/scripts/pdxImporters/pdxModImporter";

export type Mod = {
    modName: string;
    projectName: string;
    workDirectory: string;
    eu4Directory: string;
    eu4ModDirectory: string;
    isCreated: boolean;
    supportedVersion: string;
    modVersion: string;
    modTags: string[];
    createdInVersion: string;
    modFile: ModFile;
    parentModName: string;
    importModParameters: ImportModParameters;
}

export type ModSettings = {
    beautifySavedObjects: boolean,
    exportType: ExportType
}

export enum ExportType {
    WorkingFolder = "workingfolder",
    ModFolder = "modfolder",
}