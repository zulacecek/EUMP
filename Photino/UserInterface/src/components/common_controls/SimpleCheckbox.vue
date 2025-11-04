<script setup lang="ts">

const props = defineProps({ checked: Boolean });

const emit = defineEmits();

const valueChanged = () => {
  emit('valueChanged', { checked: !props.checked});
};

</script>

<template>
    <label class="container">
      <input type="checkbox" :checked="checked" @change="valueChanged"> 
      <img class="img-unchecked" src="../../assets/checkbox_unchecked.png" >
      <img class="img-checked" src="../../assets/checkbox_checked.png">
    </label>
</template>

<style scoped>

.container:before {
  content: "";
  position: absolute;
  width: 25px;
  height: 25px;
  margin-left: 2px;
  margin-top: 2px;
  z-index: 1;
  pointer-events: none;
}

.container:hover:before {
  background-color: rgba(255, 255, 255, 0.2);  
  border-radius: 5px;
  z-index: 2;
}

.container {
  position: relative;
	font-size: 15px;
	cursor: pointer;
  caret-color: transparent;
	display: flex;
  align-items: center;
}
img { padding-right: 5px;}


/* Hide the browser's default checkbox */
.container input {
  display: none;
}

/* Hide the checked checkbox */
.img-checked {
	display: none;
}

.container input:checked ~ .img-checked {
	display: inline;
}


.container input:checked ~ .img-unchecked {
	display: none;
}

</style>