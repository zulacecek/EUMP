<script setup lang="ts">
import { onMounted, ref } from 'vue';
import loadingMessage from '../../scripts/uiControllers/loadingMessageController';


var messages = ref(new Array());

onMounted(() => {
    loadingMessage.value = { openLoadingMessage }
});

function openLoadingMessage(message: string) {
    var feedbackMessage = { text: message, cancelClose: false };
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

</script>

<template>
    <div v-if="messages.length > 0" class="feedback-messages-container">
        <Transition v-for="message in messages"  name="fade">
            <div class="feedback-message"  @click="message.cancelClose = true;">
                <p>
                    {{ message.text }}
                </p>
                <div class="close-button delete-button" @click="closeMessage(message)"></div>
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

.close-button {
    position: absolute;
    top: 5px;
    left: 92%;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

</style>
