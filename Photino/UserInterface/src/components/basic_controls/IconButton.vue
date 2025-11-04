<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const props = defineProps({
    icon: String,
    text: String,
    fontSize: Number
});

</script>

<template>
    <button class="icon-button-container flex-container">
        <span v-if="icon">
            <div class="icon-button">
                <FontAwesomeIcon :icon="(icon as string)" :style="{ fontSize: fontSize }"></FontAwesomeIcon>
            </div>
        </span>
        <div class="flex-container icon-button-text">
            {{ text }}
        </div>
    </button>
</template>

<style scoped>

.icon-button-text {
    align-items: center;
}

.icon-button {
    font-size: 12px;
    height: 100%;
    display: flex;
    align-items: center;
}

/* .icon-button:hover {
    background-color: rgba(255, 255, 255, 0.5);
    color: rgba(0, 0, 0, 0.7);
} */

</style>