import { exportAll, saveAll } from "@/components/main_controls/top_menu_bar/topMenuBarExtender";

export var keysPressed: { [key: string]: boolean } = {};

var listeningToKeyDown: Function[] = new Array();

document.addEventListener('keydown', (event) => {
    if(!keysPressed[event.key]){
        keysPressed[event.key] = true;
    }

    listeningToKeyDown.forEach(callback => {
        callback(event);
    })
});

window.addEventListener('blur', () => {
    keysPressed = {};
});

document.addEventListener('keyup', (event) => {
    if(keysPressed[event.key]) {
        keysPressed[event.key] = false;
    }
});

export function isKeyPressed(key: string): boolean {
    return keysPressed[key] === true;
}

export function listenToKeyDown(action: (keyboardEvent: KeyboardEvent) => void) {
    if(!action){
        return;
    }

    listeningToKeyDown.push(action);
}

var isSaving = false;

listenToKeyDown(async (event: KeyboardEvent) => {
    if(isKeyPressed('Control') && isKeyPressed('Alt') && event.key == "s") {
        if(!isSaving) {
            isSaving = true;
            await saveAll();
            isSaving = false;
        }
    }

    if(isKeyPressed('Control') && isKeyPressed('Alt') && event.key == "e") {
        if(!isSaving) {
            isSaving = true;
            await exportAll();
            isSaving = false;
        }
    }
});