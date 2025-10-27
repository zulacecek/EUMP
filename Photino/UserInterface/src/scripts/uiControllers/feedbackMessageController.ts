import { ref } from "vue";

const feedbackMessage = ref<{
    openFeedbackMessage?: (msg: string, type: FeedbackMessageType) => void;
  }>();

export function openFeedbackMessage(message: string, type: FeedbackMessageType) {
    if(feedbackMessage.value && feedbackMessage.value.openFeedbackMessage) {
        feedbackMessage.value.openFeedbackMessage(message, type);
    }
}

export default feedbackMessage;

export enum FeedbackMessageType {
    default = 0,
    success = 1,
    failure = 2,
    warning = 3
}
