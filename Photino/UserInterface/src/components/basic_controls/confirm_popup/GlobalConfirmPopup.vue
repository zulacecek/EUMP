<script setup lang="ts">

import { globalConfirmWindowAdditionalActionButtonText, globalConfirmWindowAdditionalActionFunction, globalConfirmWindowCancelFunction, globalConfirmWindowConfirmButtonText, globalConfirmWindowConfirmedFunction, globalConfirmWindowMessage, globalConfirmWindowVisible } from '@/scripts/uiControllers/appController';
import { ref, watch } from 'vue';
import { hideGlobalConfirmWindow } from '../../../scripts/uiControllers/appController';

watch(() => globalConfirmWindowVisible.value, (newVisibility) => {
  toggleVisibility(newVisibility);
});

const visible = ref(false);
const popupStyle = ref({});
const popupRef = ref();
const justOpened = ref(false);

const handleClickOutside = () => {
  var popup = popupRef.value as HTMLElement;
  if(!popup){
    removeClickOutsideListener();
  }
  
  if(!justOpened.value) {
    handleCancel();
  }
  
  justOpened.value = false;
};

const addClickOutsideListener = () => {
  document.addEventListener('click', handleClickOutside);
};

const removeClickOutsideListener = () => {
  document.removeEventListener('click', handleClickOutside);
};

const toggleVisibility = (visibility: boolean) => {
  justOpened.value = true;
  visible.value = visibility;
  if (visible.value) {
    addClickOutsideListener();
  } else {
    removeClickOutsideListener();
    hideGlobalConfirmWindow();
  }
};

const handleConfirm = () => {
  var confirmFunction = globalConfirmWindowConfirmedFunction.value;
  if(confirmFunction) {
    confirmFunction();
  }
    
  toggleVisibility(false);
};

const handleCancel = () => {
  var cancelFunction = globalConfirmWindowCancelFunction.value;
  if(cancelFunction) {
    cancelFunction();
  }

  toggleVisibility(false);
};

const handleAdditionalAction = () => {
  var additionalFunction = globalConfirmWindowAdditionalActionFunction.value;
  if(additionalFunction) {
    additionalFunction();
  }

  toggleVisibility(false);
};

</script>

<template>
  <div v-show="visible" @click="handleClickOutside" class="screen-disabler"></div>
  <div ref="popupRef" v-if="visible" class="action-confirmation-popup thin-golden-border" :style="popupStyle">
    <div class="action-confirmation-popup-content flex-container-vertical">
      <div class="height-100" style="margin: 1rem;">{{ globalConfirmWindowMessage ?? 'Are you sure ?' }}</div>
      <div class="action-confirmation-popup-button-container flex-container" justify="space-around">
        <button class="button" @click="handleCancel"> Cancel </button>
        <div clas="flex-container">
          <button class="button" @click="handleAdditionalAction" :class="{ 'hidden' : !globalConfirmWindowAdditionalActionFunction }"> {{ globalConfirmWindowAdditionalActionButtonText ?? 'Action' }}</button>
          <button class="button" @click="handleConfirm"> {{ globalConfirmWindowConfirmButtonText ?? 'Ok'  }} </button>
        </div>
      </div>
    </div>
  </div>
</template>
  
<style scoped>

.action-confirmation-popup-button-container {
  height: 2rem;
  margin: 1rem;
  justify-content: space-between;
}

.action-confirmation-popup {
  background-color: var(--vt-c-black-mute);
  left: 40%;
  top: 33%;
  height: 20rem;
  width: 30rem;
  position: fixed;
  z-index: 100;
}

.action-confirmation-popup .action-confirmation-popup-content {
  text-align: center;
  margin-bottom: 10px;
  margin-left: 10px;
  margin-right: 10px;
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

</style>