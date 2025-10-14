<template>
  <div>

    <b-card>
        <b-card-header v-if="title" class="text-white p-0 w-100">
            <b-row class="mb-1 d-flex justify-content-between w-100 align-items-center">
                <div class="mx-2 my-1">
                    <h3 class="m-0">{{ title }}</h3>
                </div>
                <div>
                    <b-button v-if="add" class="btn-icon" @click="$emit('add', null, 3)"
                              v-b-tooltip.hover="$t('Global.add')" variant="primary">
                        <feather-icon icon="PlusIcon"/>
                    </b-button>
                </div>
            </b-row>
        </b-card-header>
        <b-card-body>

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

        </b-card-body>
    </b-card>

    
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
    add: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      currentPage: 1,
    }
  },
}
</script>
