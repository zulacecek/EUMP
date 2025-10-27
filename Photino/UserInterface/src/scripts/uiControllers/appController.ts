import { ref } from "vue";

export var loaderVisible = ref(false);
export function changeGlobalLoaderVisibility(display: boolean = true) {
    loaderVisible.value = display;
}

export var loaderText = ref('');
export function changeGlobalLoaderText(text: string) {
  loaderText.value = text;
}

export function displayGlobalLoader(text: string) {
  loaderVisible.value = true;
  loaderText.value = text;
}

export function hideGlobalLoader() {
  loaderVisible.value = false;
  loaderText.value = '';
}

export var globalConfirmWindowVisible = ref(false);
export var globalConfirmWindowConfirmedFunction = ref<Function>();
export var globalConfirmWindowCancelFunction = ref<Function>();
export var globalConfirmWindowAdditionalActionFunction = ref<Function>();
export var globalConfirmWindowMessage = ref<string | undefined>();
export var globalConfirmWindowAdditionalActionButtonText = ref<string | undefined>();
export var globalConfirmWindowConfirmButtonText = ref<string | undefined>();

export function displayGlobalConfirmWindow(confirmFunction: Function, message: string, cancelFunction?: Function, confirmText?: string) {
  globalConfirmWindowConfirmedFunction.value = confirmFunction;
  globalConfirmWindowCancelFunction.value = cancelFunction;
  globalConfirmWindowConfirmButtonText.value = confirmText;
  globalConfirmWindowMessage.value = message;

  globalConfirmWindowVisible.value = true;
}

export function displayGlobalConfirmWindowWithAdditionalAction(confirmFunction: Function, message: string, actionFunction: Function, actionText: string, cancelFunction?: Function, confirmText?: string) {
  globalConfirmWindowAdditionalActionFunction.value = actionFunction;
  globalConfirmWindowAdditionalActionButtonText.value = actionText;

  displayGlobalConfirmWindow(confirmFunction, message, cancelFunction, confirmText);
}

export function hideGlobalConfirmWindow() {
  globalConfirmWindowVisible.value = false;

  globalConfirmWindowCancelFunction.value =
  globalConfirmWindowAdditionalActionFunction.value =
  globalConfirmWindowConfirmButtonText.value =
  globalConfirmWindowAdditionalActionButtonText.value =
  globalConfirmWindowConfirmedFunction.value = undefined;
}