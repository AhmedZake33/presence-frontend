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
            :items="paginatedItems"
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

            <!-- Pagination -->
            <b-pagination
            v-if="paginated"
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            align="center"
            class="mt-2"
            @input="onPageChange"
            />

            <!-- Items per page selector -->
            <div v-if="paginated" class="d-flex justify-content-between align-items-center mt-2">
                <div class="text-muted small">
                    Showing {{ startItem }} to {{ endItem }} of {{ totalRows }} entries
                </div>
                <div>
                    <b-form-select
                        v-model="perPage"
                        :options="perPageOptions"
                        size="sm"
                        class="w-auto"
                        @change="onPerPageChange"
                    />
                </div>
            </div>

        </b-card-body>
    </b-card>
  </div>
</template>

<script>
import { BTable, BPagination, BFormSelect } from 'bootstrap-vue'

export default {
  name: 'BaseTable',
  components: {
    BTable,
    BPagination,
    BFormSelect,
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
    totalRows: {
      type: Number,
      default: 0,
    },
    add: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      currentPage: 1,
      perPageOptions: [
        { value: 5, text: '5 per page' },
        { value: 10, text: '10 per page' },
        { value: 20, text: '20 per page' },
        { value: 50, text: '50 per page' },
      ]
    }
  },
  computed: {
    // Calculate paginated items for client-side pagination
    paginatedItems() {
      if (!this.paginated || this.totalRows > 0) {
        return this.items
      }
      
      const start = (this.currentPage - 1) * this.perPage
      const end = start + this.perPage
      return this.items.slice(start, end)
    },
    
    // Calculate start and end items for display
    startItem() {
      if (this.totalRows > 0) {
        return ((this.currentPage - 1) * this.perPage) + 1
      }
      return (this.currentPage - 1) * this.perPage + 1
    },
    
    endItem() {
      if (this.totalRows > 0) {
        const end = this.currentPage * this.perPage
        return end > this.totalRows ? this.totalRows : end
      }
      const end = this.currentPage * this.perPage
      return end > this.items.length ? this.items.length : end
    }
  },
  methods: {
    onPageChange(page) {
      this.$emit('page-changed', {
        page: page,
        perPage: this.perPage
      })
    },
    
    onPerPageChange(perPage) {
      this.currentPage = 1 // Reset to first page when changing perPage
      this.$emit('per-page-changed', {
        page: this.currentPage,
        perPage: perPage
      })
    },
    
    // Method to reset to first page (useful when filtering)
    resetPagination() {
      this.currentPage = 1
    }
  },
  watch: {
    // Reset to first page when items change (for client-side pagination)
    items() {
      if (this.totalRows === 0) {
        this.currentPage = 1
      }
    }
  }
}
</script>