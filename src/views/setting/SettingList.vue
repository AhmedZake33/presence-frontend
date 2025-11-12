<template>
  <div>
    <b-card>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h4 class="mb-0">Settings</h4>
        <b-button size="sm" variant="primary" @click="reload">Reload</b-button>
      </div>

      <base-table :items="rows" :fields="fields" :paginated="false">
        <template #cell(value)="row">
          <pre style="white-space:pre-wrap; max-height:120px; overflow:auto;">
            {{ pretty(row.item.value) }}
          </pre>
        </template>

        <template #cell(actions)="row">
          <b-button size="sm" variant="info" @click="edit(row.item.key)">Edit</b-button>
        </template>
      </base-table>
    </b-card>
  </div>
</template>

<script>
import BaseTable from '@/components/BaseTable.vue'

export default {
  name: 'SettingList',
  components: { BaseTable },
  data() {
    return {
      fields: [
        { key: 'key', label: 'Key' },
        { key: 'value', label: 'Value' },
        { key: 'actions', label: 'Actions' }
      ],
    }
  },
  computed: {
    rows() {
      // settings stored as key => value in Vuex
      return Object.keys(this.$store.state.settings.all || {}).map(k => ({
        key: k,
        value: this.$store.state.settings.all[k]
      }))
    }
  },
  methods: {
    pretty(v) {
      try { return JSON.stringify(v, null, 2) } catch { return String(v) }
    },
    reload() {
      this.$store.dispatch('settings/fetchAll')
    },
    edit(key) {
      // navigate to an edit page (optional)
      this.$router.push({ name: 'settings-edit', params: { key } })
    }
  },
  created() {
    this.reload()
  }
}
</script>
