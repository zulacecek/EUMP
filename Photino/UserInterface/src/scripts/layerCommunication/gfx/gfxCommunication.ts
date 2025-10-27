import { sendRequest, type BaseCommunicationRequest } from "../baseLayerCommunication"

export async function renderVanillaIcons() {
    await sendRequest(<BaseCommunicationRequest>({ callerName: "RenderVanillaIcons"}));
}