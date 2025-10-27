<script setup lang="ts">
import { NFlex } from 'naive-ui';
import SimpleCheckbox from './SimpleCheckbox.vue';

const props = defineProps({ checked: Boolean, name: String, text: String });
const emit = defineEmits();

function valueChanged(args: any) {
    emit('valueChanged', { value: args.checked, name: props.name })
}

</script>

<template>
    <div class="container flex-container">
        <label class="checkbox-label"> {{text}} </label>
        <SimpleCheckbox :checked="checked" @value-changed="valueChanged"></SimpleCheckbox>
    </div>
</template>

<style scoped>
.container{
    align-items: center;
    padding: 1px;
}
.checkbox-label{
    text-align: center;
    margin-left: 5px;
}
</style>