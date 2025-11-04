import { ref, watch } from "vue";

var registeredEventListeners = new Map<string, Function[]>();
var registeredFunctionClasses = new Map<string, string[]>();
var eventTrigger = ref(0);

export function registerForEvent(eventName: string, callerName : string, callBack: Function) {
    if(!registeredFunctionClasses.has(eventName)) {
        registeredFunctionClasses.set(eventName, [callerName]);
    }
    else {
        var existingRegistration = registeredFunctionClasses.get(eventName);
        if(existingRegistration?.includes(callerName)) {
            return;
        }
        
        existingRegistration?.push(callerName);
    }

    if(!registeredEventListeners.has(eventName)) {
        registeredEventListeners.set(eventName, [callBack]);
        return;
    }
    
    registeredEventListeners.get(eventName)?.push(callBack);
}

export function unregisterFromEvent(eventName: string, callerName: string, callBack: Function) {
    if(registeredFunctionClasses.has(eventName)){
        var registeredFunctionClass = registeredFunctionClasses.get(eventName);
        var callerIndex = registeredFunctionClass?.indexOf(callerName) ?? -1;
        if(callerIndex > -1) {
            registeredFunctionClass?.splice(callerIndex, 1);
            if(registeredFunctionClass?.length == 0){
                registeredFunctionClasses.delete(eventName);
            }
        }
    }

    if(registeredEventListeners.has(eventName)) {
        var registeredEventListener = registeredEventListeners.get(eventName);
        var existingRegisteredCallback = registeredEventListener?.firstOrDefault(x => x.name == callBack.name);
        if(existingRegisteredCallback) {
            var callBackIndex = registeredEventListener?.indexOf(existingRegisteredCallback) ?? -1;
            registeredEventListener?.splice(callBackIndex, 1);
            if(registeredEventListener?.length == 0){
                registeredEventListeners.delete(eventName);
            }
        }
    }
}

export function fireEvent(eventName: string, ...args: any) {
    if(registeredEventListeners.has(eventName)) {
        registeredEventListeners.get(eventName)?.forEach(x=> x(...args));
        
        // Needed for vue reactivity to work
        eventTrigger.value ++;
    }
}