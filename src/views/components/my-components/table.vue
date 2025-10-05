<template>
  <div>
    <!-- Title (optional) -->
    <h4 v-if="title" class="mb-2">{{ title }}</h4>

    <!-- Table -->
    <b-table
      :items="items"
      :fields="fields"
      :striped="striped"
      :hover="hover"
      :bordered="bordered"
      :responsive="responsive"
      small
    >
      <!-- Example for slot customization -->
      <template v-for="field in fields" v-slot:[`cell(${field.key})`]="data">
        <!-- If slot provided in parent -->
        <slot
          :name="`cell(${field.key})`"
          v-bind="data"
        >
          <!-- Default rendering -->
          {{ data.value }}
        </slot>
      </template>
    </b-table>

    <!-- Pagination (optional) -->
    <b-pagination
      v-if="paginated"
      v-model="currentPage"
      :total-rows="items.length"
      :per-page="perPage"
      align="center"
      class="mt-2"
    />
  </div>
</template>

<script>
import { BTable, BPagination } from 'bootstrap-vue'

export default {
  name: 'BaseTable',
  components: {
    BTable,
    BPagination,
  },
  props: {
    title: {
      type: String,
      default: '',
    },
    items: {
      type: Array,
      required: true,
    },
    fields: {
      type: Array,
      required: true,
    },
    striped: {
      type: Boolean,
      default: true,
    },
    hover: {
      type: Boolean,
      default: true,
    },
    bordered: {
      type: Boolean,
      default: false,
    },
    responsive: {
      type: Boolean,
      default: true,
    },
    paginated: {
      type: Boolean,
      default: true,
    },
    perPage: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      currentPage: 1,
    }
  },
}
</script>
