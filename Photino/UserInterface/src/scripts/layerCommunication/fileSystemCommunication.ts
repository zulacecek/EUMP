import { dataDir, saveDataDir } from "../appContext";
import { replaceAllCharaters } from "../utils";
import { LayerCommunicationResult, sendRequest, type BaseCommunicationRequest } from "./baseLayerCommunication";

export async function readDir(path: string) : Promise<FileSystemEntry[]> {
    var requestMessage = JSON.stringify({ path });
    var request = <BaseCommunicationRequest>({ callerName: 'ReadDir', message: requestMessage });
    var response = await sendRequest<FileSystemEntry[]>(request);

    if(response.hasPayload) {
        return response.payload;
    }

    return new Array();
}

export async function openFileDialog(parameters: openFileDialogRequest) : Promise<string[] | undefined> {
    var requestMessage = JSON.stringify(parameters);
    var request = <BaseCommunicationRequest>({ callerName: 'OpenFileDialogAsync', message: requestMessage });
    var response = await sendRequest<openFileDialogResponse>(request);

    return response.payload?.selectedPaths;
}

export async function deleteFile(filePath: string) {
    var request = <BaseCommunicationRequest>({ callerName: 'DeleteFile', message: filePath });
    await sendRequest(request);
}

export async function getUserDocumentFolder() : Promise<string | undefined> {
    if(!dataDir || dataDir === '' || dataDir === '/') {
        var request = <BaseCommunicationRequest>({ callerName: 'GetUserDocumentFolder' });
        var response = await sendRequest<openFileDialogResponse>(request);
        
        if(response.result == LayerCommunicationResult.NOK) {
            return;
        }

        saveDataDir(replaceAllCharaters(response.message, '\\\\', '/').trimEnd());
    }

    return dataDir;
}

export async function getFileMetadata(filePath: string) : Promise<GetFileMetadataResponse | undefined> {
    
    var request = <BaseCommunicationRequest>({ callerName: 'GetFileMetadata', message: filePath });
    var response = await sendRequest<GetFileMetadataResponse>(request);
        
    if(!response || response.result == LayerCommunicationResult.NOK) {
        return;
    }
    
    return response.payload;
}

export type openFileDialogRequest = {
    defaultPath: string | undefined,
    multiSelect: boolean,
    selectFolder: boolean,
    filterName: string | undefined,
    allowedExtension: string[] | undefined
}

export type openFileDialogResponse = {
    selectedPaths: string[] | undefined
}

export type GetFileMetadataResponse = {
    lastModifiedTimestamp: number
}

export type FileSystemEntry = {
    name: string,
    fullPath: string,
    extension: string,
    pathWithoutFileName: string,
    size: number,
    lastModifed: number,
    isDirectory: boolean,
    children: FileSystemEntry[]
}