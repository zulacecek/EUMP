<script setup lang="ts">
import { onMounted, ref } from 'vue';
import feedbackMessage, { FeedbackMessageType } from '../../scripts/uiControllers/feedbackMessageController';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

var messages = ref(new Array());

onMounted(() => {
    feedbackMessage.value = { openFeedbackMessage }
});

function openFeedbackMessage(message: string, type: FeedbackMessageType) {
    var feedbackMessage = { text: message, cancelClose: false, messageType: type };
    messages.value.push(feedbackMessage);
    
    setTimeout(() => {
        if(!feedbackMessage.cancelClose) {
            closeMessage(feedbackMessage);
        }
    }, 3000);
}

function closeMessage(message: any) {
    var indexToRemove = messages.value.indexOf(message);
    if(indexToRemove > -1) { 
        messages.value.splice(indexToRemove, 1);
    }
}

function getTypeClass(type: FeedbackMessageType) : string{
    switch(type){
        case FeedbackMessageType.failure:
            return "simple-background-red";
        case FeedbackMessageType.success:
            return "simple-background-green";
        case FeedbackMessageType.warning:
            return "simple-background-yellow";
        default:
            return "simple-background";
    }
}

</script>

<template>
    <div v-if="messages.length > 0" class="feedback-messages-container">
        <Transition v-for="message in messages"  name="fade">
            <div class="feedback-message" :class="getTypeClass(message.messageType)" @click="message.cancelClose = true;">
                <p>
                    {{ message.text }}
                </p>
                
                <div class="cancel-button" @click="closeMessage(message)"> <FontAwesomeIcon :icon="'fa-xmark'" /> </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>

.feedback-messages-container {
    position: fixed;
    width: 355px;
    height: auto;
    top: 10px;
    z-index: 1500;
    left: calc(50% - 230px);
}

.feedback-message {
    position: relative;
    padding: 5px;
    margin: 5px;
    width: 350px;
    min-height: 55px;
    max-height: 250px;
    overflow-y: auto;
    border: 2px rgba(158, 130, 38) ridge;
    text-align: center;
}

.cancel-button {
    position: absolute;
    top: 5px;
    left: 92%;
    user-select: none;
    color: black;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

</style>
