<script setup lang="ts">
import CheckboxWithLabel from './CheckboxWithLabel.vue';
import { onMounted, ref } from 'vue';

export type CheckboxGroupValue = {
  name: string,
  text: string,
  isSelected: boolean
}

const props = defineProps<{values: CheckboxGroupValue[]}>();

var valuesReferenced = ref(props.values);

const emit = defineEmits();

onMounted(() => {
  if(props.values.length > 0 && !props.values.find(x => x.isSelected)) {
    valuesReferenced.value[0].isSelected = true;
  }
});

function valueChanged(args: any) {
  if(!args || !args.name) {
    return;
  }

  var newSelectedValue = '';
  for(var value of valuesReferenced.value) {
    if(value.name == args.name) {
      value.isSelected = true;
      newSelectedValue = value.name;
      continue;
    }

    value.isSelected = false;
  }

  emit('valueChanged', { value: newSelectedValue });
}

</script>

<template>
    <div class="container flex-container" v-for="value of valuesReferenced">
      <CheckboxWithLabel class="checkbox-group-checkbox" @value-changed="valueChanged" :name="value.name" :text="value.text" :checked="value.isSelected"></CheckboxWithLabel>
    </div>
</template>

<style scoped>
.checkbox-group-checkbox{
  min-width: 100px;
}
.container{
    align-items: center;
    padding: 1px;
}
.checkbox-label{
    text-align: center;
    margin-left: 5px;
}
</style>