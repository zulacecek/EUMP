<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

var emit = defineEmits(['click']);

var props = defineProps({
    icon: String,
    fontSize: Number,
    disabled: Boolean,
    disableHoverEffect: Boolean,
    fontColor: String
});

function clicked() {
    if(!props.disabled) {
        emit('click');
    }
}

</script>

<template>
    <FontAwesomeIcon :class="{'icon-button-disabled' : disabled, 'icon-button-without-hover': disableHoverEffect || disabled, 'icon-button': !disableHoverEffect && !disabled }" :icon="(icon as string)" :style="{ fontSize: fontSize, color: fontColor }" @click="clicked"></FontAwesomeIcon>
</template>

<style scoped>

.icon-button-without-hover,
.icon-button {
    font-size: 16px;
    display: flex;
    align-items: center;
    user-select: none;
}

.icon-button-disabled {
    background-color: rgb(37, 40, 43) !important;
    color: gray !important;
    cursor: default;
}

.icon-button:hover {
    background-color: rgba(255, 255, 255, 0.5);
}

</style>