<script setup lang="ts">
import AppSettingsForm from './AppSettingsForm.vue'

var props = defineProps({ visibleElement: String, selectedLocalisationName: String });

</script>
<template>
    <span v-show="visibleElement === 'designer'">
        <AppSettingsForm />
    </span>
</template>
<style scoped>
</style>