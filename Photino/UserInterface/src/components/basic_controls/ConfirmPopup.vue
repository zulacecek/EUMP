<script setup lang="ts">

import { ref, watchEffect } from 'vue';

const props = defineProps({ message: String, onConfirm: Function, onCancel: Function, additionalAction: Function, additionalActionText: String, openButtonDisabledCondition: Boolean, confirmButtonText: String });
const visible = ref(false);
const popupStyle = ref({});
const triggerButtonRef = ref();
const popupRef = ref();
const justOpened = ref(false);

const handleClickOutside = (event : Event) => {
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

const toggleVisibility = () => {
  if(props.openButtonDisabledCondition) {
    return;
  }

  justOpened.value = true;
  visible.value = !visible.value;
  if (visible.value) {
    addClickOutsideListener();
  } else {
    removeClickOutsideListener();
  }
};

const handleConfirm = () => {
    if(props.onConfirm) {
      props.onConfirm();
    }
    
    toggleVisibility();
};

const handleCancel = () => {
    if(props.onCancel) {
      props.onCancel();
    }

    toggleVisibility();
};

const handleAdditionalAction = () => {
    if(props.additionalAction) {
      props.additionalAction();
    }

    toggleVisibility();
};

const calculatePopupPosition = () => {
  var triggerButton = triggerButtonRef.value.querySelector('#openButtonSlot') as HTMLElement;
  if (triggerButton) {
    var triggerButtonPosition = triggerButton.getBoundingClientRect();
    const popupWidth = 400;
    const popupHeight = 100;

    var top = triggerButtonPosition.top - popupHeight - triggerButtonPosition.height;
    var left = triggerButtonPosition.left + triggerButtonPosition.width / 2 - popupWidth / 2;

    if(top < 0){
      top = triggerButtonPosition.top + triggerButtonPosition.height + 5;
    }
    else if(top > window.innerHeight){
      top = triggerButtonPosition.top - triggerButtonPosition.height - popupHeight;
    }

    if(left < 0) {
      left = triggerButtonPosition.left;
    }
    else if(left > window.innerWidth) {
      left = triggerButtonPosition.left - triggerButtonPosition.width;
    }

    popupStyle.value = {
      top: `${top}px`,
      left: `${left}px`,
    };
  }
};

watchEffect(() => {
  if (visible.value) {
    calculatePopupPosition();
  }
});

</script>

<template>
  <transition name="fade">
    <div ref="popupRef" v-if="visible" class="action-confirmation-popup simple-background thin-golden-border" :style="popupStyle">
      <div class="action-confirmation-popup-content flex-container-vertical">
        <p class="height-100">{{ message }}</p>
        <div class="action-confirmation-popup-button-container flex-container" justify="space-around">
          <button class="button" @click="handleCancel">Cancel</button>
          <div clas="flex-container">
            <button class="button" @click="handleAdditionalAction" :class="{ 'hidden' : !additionalAction }"> {{ additionalActionText }}</button>
            <button class="button" @click="handleConfirm">{{ confirmButtonText ?? 'Ok'}}</button>
          </div>
        </div>
      </div>
    </div>
  </transition>
  <div ref="triggerButtonRef" @click="toggleVisibility"><div id="openButtonSlot"><slot name="openButton"></slot></div></div>
</template>
  
<style scoped>
.action-confirmation-popup-button-container {
  justify-content: space-between;
  padding: 3px;
}

.action-confirmation-popup {
  height: 6rem;
  width: 25rem;
  position: fixed;
  z-index: 100;
}

.action-confirmation-popup .action-confirmation-popup-content {
  text-align: center;
  height: 100%;
}

.action-confirmation-popup button {
  margin-right: 10px;
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