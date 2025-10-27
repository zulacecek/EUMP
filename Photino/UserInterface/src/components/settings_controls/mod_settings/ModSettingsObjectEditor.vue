<script setup lang="ts">
import ModSettingsForm from './ModSettingsForm.vue'

var props = defineProps({ visibleElement: String });
</script>
<template>
    <span v-show="visibleElement === 'designer'">
        <ModSettingsForm />
    </span>
</template>
<style scoped>

</style>