import { saveAll } from "@/components/main_controls/top_menu_bar/topMenuBarExtender";
import { hasAnyObjectChanged } from "../repositories/changedObjectRepository";
import { displayGlobalConfirmWindowWithAdditionalAction } from "../uiControllers/appController";
import { sendRequest, type BaseCommunicationRequest } from "./baseLayerCommunication";

export function confirmClose() {
    if(hasAnyObjectChanged()) {
        displayGlobalConfirmWindowWithAdditionalAction(saveAndClose, 'There are unsaved changes. Do you want to save the mod and exit ?', close, 'Close without save', undefined, 'Save and close');
    }
    else {
        close();
    }
}

async function saveAndClose() {
    await saveAll();
    await close();
}

async function close() {
    await closeApp();
}

export async function closeApp() : Promise<string[] | undefined> {
    var request = <BaseCommunicationRequest>({ callerName: 'CloseApp', message: '' });
    await sendRequest(request);
    return undefined;
}

export async function checkAvailableEditors(editors: string[]) : Promise<string[]> {
    var request = <BaseCommunicationRequest>({ callerName: 'CheckAvailableEditors', message: JSON.stringify({ editors })});
    var result = await sendRequest<string[]>(request);
    if(result.hasPayload) {
        return result.payload;
    }
    
    return [];
}

export function openFolder(path: string) {
    var request = <BaseCommunicationRequest>({ callerName: 'OpenFolder', message: path});
    sendRequest<string[]>(request);
}