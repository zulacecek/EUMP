import { fireEvent } from "@/scripts/event_system/globalEventHandler";
import type { AvailableObject } from "@/structs/genericStructs";

export function objectSelected(eventName: string, object: AvailableObject | undefined) {
    if(object){
        fireEvent(eventName, object.name, object.name);
    }
}