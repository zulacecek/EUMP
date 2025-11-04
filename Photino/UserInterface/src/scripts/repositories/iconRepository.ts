
import type { GfxFile } from "@/structs/gfxStructs";
import { requestObjectFromFile } from "../layerCommunication/fileCommunication";
import { getUserDocumentFolder } from "../layerCommunication/fileSystemCommunication";
import { formatFileSystemPath } from "../utils";

const vanillaIconsCacheFolderName = "vanilla_mission_icons";
const vanillaIconsCacheFileName = "vanilla_icons.txt";

export async function readCachedVanillaMissionIcons() : Promise<GfxFile | undefined> {
    var documentFolder = await getUserDocumentFolder();

    return await requestObjectFromFile<GfxFile>(formatFileSystemPath(documentFolder, vanillaIconsCacheFolderName, vanillaIconsCacheFileName));
}