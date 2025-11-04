<script setup lang="ts">

import { computed, onMounted, ref, watch } from 'vue';
import { listenToKeyDown } from '../../scripts/uiControllers/keyboardController';

const props = defineProps({ message: String, onConfirm: Function, onConfirmAsync: Function, onCancel: Function, onBeforeOpen: Function, closeCondition: Boolean, hideCancelButton: Boolean, disableConfirmButton: Boolean, disabledOpenButton: Boolean,
   width: {
    type: Number,
    default: 500
   }, 
   height: {
    type: Number,
    default: 500
   },
   widthPercentage: {
    type: Number
   }, 
   heightPercentage: {
    type: Number
   },
   keepRendered: {
    type: Boolean,
    default: true
   }
  });

defineExpose({ openModal });

const visible = ref(false);
const disableConfirmButtonData = computed(() => props.disableConfirmButton );
const hideConditionData = computed(() => props.closeCondition );

watch(hideConditionData, (newValue) => {
  if(visible.value && newValue) {
    visible.value = false;
  }
});

const handleClickOutside = () => {
  handleCancel();
};

function setModalVisibility(visibility: boolean, event: Event | null = null) {
  visible.value = visibility;
  if(event){
    event?.stopPropagation();
  }
}

const handleConfirm = async () => {
  try {
    if(props.onConfirm) {
      props.onConfirm();
    }

    if(props.onConfirmAsync){
      await props.onConfirmAsync();
    }

    setModalVisibility(false);
  }
  catch(_){
    setModalVisibility(false);
  }
};

const handleCancel = () => {
  try {
    if(props.onCancel) {
        props.onCancel();
    }
    setModalVisibility(false);
  }
  catch(_) {
    setModalVisibility(false);
  }
};

const getStyle = () => {
  var style = '';
  if(props.widthPercentage){
    style += `width: ${props.widthPercentage}%;`;
  }
  else {
    style += `width: ${props.width}px;`;
  }

  if(props.heightPercentage){
    style += `height: ${props.heightPercentage}%;`;
  }
  else {
    style += `height: ${props.height}px;`;
  }
  
  return style;
}

function handleKeyDown(event: KeyboardEvent){
  if(!visible){
    return;
  }

  if(event.key == "Escape") {
    visible.value = false;
    event?.stopPropagation();
  }
}

onMounted(() => {
  listenToKeyDown(handleKeyDown);
});

function openModal(e: any) {
  if(props.onBeforeOpen){
    props.onBeforeOpen();
  }

  setModalVisibility(true, e)
}

</script>

<template>
  <span v-if="keepRendered">
    <div v-show="visible" @click="handleClickOutside" class="screen-disabler"></div>
    <div v-show="visible" :style="getStyle()" class="modal-window simple-background thin-golden-border">
      <div class="modal-window-content flex-container-vertical">
        <div class="content-slot"><slot name="modalContent"></slot></div>
        <div class="modal-window-button-container flex-container" justify="end">
          <button v-if="!hideCancelButton" class="button" @click="handleCancel">Cancel</button>
          <button class="button" @click="handleConfirm" :disabled="disableConfirmButtonData">Ok</button>
        </div>
      </div>
    </div>
  </span>
  <span v-else>
    <div v-if="visible" @click="handleClickOutside" class="screen-disabler"></div>
    <div v-if="visible" :style="getStyle()" class="modal-window simple-background thin-golden-border">
      <div class="modal-window-content flex-container-vertical">
        <div class="content-slot"><slot name="modalContent"></slot></div>
        <div class="modal-window-button-container flex-container" justify="end">
          <button v-if="!hideCancelButton" class="button" @click="handleCancel">Cancel</button>
          <button class="button" @click="handleConfirm" :disabled="disableConfirmButtonData">Ok</button>
        </div>
      </div>
    </div>
  </span>
  <button class="modal-window-open-button" @click="openModal" :disabled="hideConditionData || disabledOpenButton"><slot name="openButton"></slot></button>
</template>
  
<style scoped>

.modal-window-open-button {
  all: unset;
}

modal-window-open-button:hover {
  all: unset;
}

.modal-window-button-container {
  height: 2rem;
  margin-top: 1rem;
  justify-content: space-between;
}

.content-slot {
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.modal-window {
  position: fixed;
  padding: 10px;
  z-index: 90;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.modal-window .modal-window-content {
  height: 100%;
  text-align: center;
  flex-direction: column;
}

.modal-window button {
  margin-right: 10px;
}

</style>