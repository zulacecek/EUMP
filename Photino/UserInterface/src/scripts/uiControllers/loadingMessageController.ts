import { ref } from "vue";

const loadingMessage = ref<{
    openLoadingMessage?: (msg: string) => void;
  }>();

export function openLoadingMessage(message: string) {
    if(loadingMessage.value && loadingMessage.value.openLoadingMessage) {
        loadingMessage.value.openLoadingMessage(message);
    }
}

export default loadingMessage;