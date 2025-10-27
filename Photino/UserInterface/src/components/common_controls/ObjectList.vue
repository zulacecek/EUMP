<script setup lang="ts">
import { ref, computed, type PropType, watch } from "vue";
import { addObjectChange } from "../../scripts/repositories/changedObjectRepository";
import { deepClone } from "../../scripts/utils";
import ConfirmPopup from "../basic_controls/ConfirmPopup.vue";
import { ChangedObjectActionType, type ObjectType } from "@/structs/genericStructs";
import Icon from "../basic_controls/Icon.vue";

interface Column extends Record<string, any> {}
interface DataItem extends Record<string, any> {}

const { data, columns, itemsPerPage = 20, objectCategory, objectId } = defineProps<{
  data: DataItem[];
  columns: Column[];
  itemsPerPage?: number;
  objectCategory: ObjectType;
  objectId: string;
}>(); 

const searchQuery = ref("");
const currentPage = ref(1);

const filteredData = computed(() => {
  if (!searchQuery.value) {
    return data;
  }

  return data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredData.value.slice(start, start + itemsPerPage);
});

const goToPage = (page : any) => {
  if (page > 0 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const handleInputChange = (rowIndex : any, colKey: any, event: any) => {
  data[rowIndex][colKey] = event.target.value;
};

const handleCheckboxChange = (rowIndex: any, colKey: any, event: any) => {
  data[rowIndex][colKey] = event.target.checked;
};

function pushObjectChange() {
  addObjectChange(ChangedObjectActionType.Update, objectCategory, objectId, objectId);
}

const addRow = (position: "first" | "last") => {
  const newRow: Record<string, any> = {};
  columns.forEach(col => {
    if (col.type === "checkbox") {
      newRow[col.key] = false;
    } else {
      newRow[col.key] = "";
    }
  });

  if (position === "first") {
    var index = 10 * Math.max(currentPage.value - 1, 0);
    data.splice(index, 0, newRow);
  } else {
    data.push(newRow);
    currentPage.value = totalPages.value;
  }
};

function removeObject(object: Record<string, any>) {
  var index = data.indexOf(object);
  if(index > -1) {
    data.splice(index, 1);
  }
}

function cloneObject(object: Record<string, any>) {
  var newObject = deepClone(object);
  var index = 10 * Math.max(currentPage.value - 1, 0);
  data.splice(index, 0, newObject);
}

watch(
  () => objectId,
  () => {
    currentPage.value = 1;
    searchQuery.value = "";
  }
);

</script>

<template>
  <div v-if="data" class="flex-container-vertical" style="height: 100%;">    
    <input v-model="searchQuery" type="text" placeholder="Search..." class="textbox object-list-search-bar"> </input>
    <div style="flex: 1;">
      <table class="object-list-table golden-border-separator">
        <thead>
          <tr class="bg-gray-200">
            <th></th>
            <th v-for="col in columns" :key="col.key" class="border p-2">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td :colspan="columns.length" >
              <div class="flex-container add-object-row">
                <Icon :icon="'fa-solid fa-square-plus'" :font-size="25" @click="addRow" />
              </div>
            </td>
          </tr>
          <tr v-for="(item, rowIndex) in paginatedData" :key="rowIndex" class="object-list-table-row">
            <td style="width: 2.5rem;">
              <ConfirmPopup message="Are you sure you want to delete the row ?" :onConfirm="() => removeObject(item)" >
                <template v-slot:openButton>
                  <Icon :icon="'fa-solid fa-square-minus'" :font-size="25"/>
                </template>
              </ConfirmPopup>
              <Icon :icon="'fa-solid fa-square-arrow-up-right'" :font-size="25" @click="cloneObject(item)" />
            </td>
            <td v-for="col in columns" :key="col.key" class="object-list-table-cell">
              <div v-if="col.type === 'text'">
                  <textarea class="textbox object-list-textarea" spellcheck="false" rows="4" :value="item[col.key]" @input="handleInputChange(rowIndex, col.key, $event)" disabled />
              </div>
              <div v-else-if="col.type === 'input'">
                <textarea class="textbox object-list-textarea" spellcheck="false" rows="4" v-model="item[col.key]" @input="pushObjectChange" />
              </div>
              <div v-else-if="col.type === 'checkbox'">
                <input type="checkbox" :checked="item[col.key]" @change="handleCheckboxChange(rowIndex, col.key, $event)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex-container object-list-button-container">
        <button @click="goToPage(1)" :disabled="currentPage === 1" class="button object-list-control-button">
            First
        </button>
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="button object-list-control-button">
            Prev
        </button>
        <span class="no-user-select flex-container" style="align-items: center;"> Page {{ currentPage }} of {{ totalPages }} </span>
        <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="button object-list-control-button">
            Next
        </button>
        <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages" class="button object-list-control-button">
            Last
        </button>
    </div>
  </div>
</template>

<style scoped>
.object-list-control-button {
  margin: 5px;
}

.object-list-button-container {
  justify-content: center;
}

.add-object-row {
  justify-content: center;
  width: 100%;
}

.object-list-search-bar {
  width: 100%;
}

.object-list-table {
    width: 100%;
    margin-bottom: 15px;
}

.object-list-table-row {
    width: 100%;
}

.object-list-textarea {
    width: 100%;
}

</style>