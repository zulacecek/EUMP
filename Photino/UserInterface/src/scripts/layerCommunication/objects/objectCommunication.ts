
import type { Mod, ModSettings } from "@/structs/modStructs";
import { sendRequest, type BaseCommunicationRequest } from "../baseLayerCommunication"

export async function sendModToBackend(mod: Mod) {
    await sendRequest(<BaseCommunicationRequest>({ callerName: "OpenMod", message: JSON.stringify({ mod }) }));
}

export async function sendModSettingsToBackend(modSettings: ModSettings) {
    await sendRequest(<BaseCommunicationRequest>({ callerName: "OpenModSettings", message: JSON.stringify(modSettings) }));
}

export async function sendModForExport() {
    await sendRequest(<BaseCommunicationRequest>({ callerName: "ExportMod", message: '' }));
}

export async function openExternalEditor(pathToFile: string, editorCommand: string) {
    await sendRequest(<BaseCommunicationRequest>({ callerName: "OpenExternalEditor", message: JSON.stringify({ pathToFile, editorCommand }) }));
}