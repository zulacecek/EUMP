import { requestFile, requestObjectFromFile } from "../layerCommunication/fileCommunication";
import { openFileDialog, type openFileDialogRequest } from "../layerCommunication/fileSystemCommunication";

export async function readFile<T>(parameters: openFileDialogRequest) : Promise<T | undefined>{
    var result = await openFileDialog(parameters);
    if(result && result.length > 0) {
        return await requestObjectFromFile<T>(result[0]);
    }
    
    return undefined;
}

export async function readFileContent(parameters: openFileDialogRequest) : Promise<string | undefined> {
    var result = await openFileDialog(parameters);
    if(result && result.length > 0) {
        return await requestFile(result[0]);
    }
    
    return undefined;
}

export function mapImagePath(pathInAppFolder: string) {
      return `http://localhost:8080/${pathInAppFolder}`;
}