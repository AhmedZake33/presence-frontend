<template>
  <div>
    <b-row class="mb-2 align-items-center">
      <b-col><h4>Application Settings</h4></b-col>
      <b-col cols="4" class="text-right">
        <b-button variant="primary" @click="reloadAll">Reload</b-button>
      </b-col>
    </b-row>

    <b-row>
      <b-col md="4">
        <b-card>
          <b-list-group flush>
            <b-list-group-item
              v-for="(value, key) in settingsList"
              :key="key"
              :active="selectedKey === key"
              button
              @click="selectKey(key)"
            >
              <div class="d-flex justify-content-between">
                <div>
                  <strong>{{ key }}</strong>
                  <!-- <div class="small text-muted" v-if="brief(value)">{{ brief(value) }}</div> -->
                </div>
                <div class="text-right">
                  <small class="text-muted">{{ lastUpdated(value) }}</small>
                </div>
              </div>
            </b-list-group-item>
          </b-list-group>

          <div class="mt-3">
            <b-button size="sm" variant="success" @click="openCreatePrompt">Create new setting</b-button>
          </div>
        </b-card>
      </b-col>

      <b-col md="8">
        <b-card v-if="selectedKey">
          <dynamic-setting-form
            :key-prop="selectedKey"
            :initial-value="settingsList[selectedKey]"
            @saved="onSaved"
          />
        </b-card>

        <b-card v-else class="text-center text-muted">
          Select a setting on the left to edit it.
        </b-card>
      </b-col>
    </b-row>

    <!-- Create new setting modal -->
    <b-modal id="create-setting-modal" title="Create Setting" @ok="createNewSetting">
      <b-form-group label="Key (unique)">
        <b-form-input v-model="newKey" placeholder="e.g. attendance_rules"></b-form-input>
      </b-form-group>

      <b-form-group label="Initial value (JSON)">
        <b-form-textarea v-model="newValueText" rows="6" placeholder='{"checkin_time":"09:00"}'></b-form-textarea>
      </b-form-group>

      <div v-if="createError" class="text-danger small">{{ createError }}</div>
    </b-modal>
  </div>
</template>

<script>
import DynamicSettingForm from './DynamicSettingForm.vue'
import { mapState } from 'vuex'

export default {
  name: 'SettingsManager',
  components: { DynamicSettingForm },
  data() {
    return {
      selectedKey: null,
      newKey: '',
      newValueText: '{}',
      createError: null,
    }
  },
  computed: {
    ...mapState({ allSettings: state => state.settings.all }),
    settingsList() {
      // ensure object even if empty
      return this.allSettings || {}
    },
  },
  methods: {
    brief(v) {
      try {
        const json = typeof v === 'string' ? JSON.parse(v) : v
        if (json.checkin_time || json.checkout_time) {
          return `${json.checkin_time ?? '-'} → ${json.checkout_time ?? '-'}`
        }
        if (typeof v === 'object') return JSON.stringify(v).slice(0, 60)
        return String(v).slice(0, 60)
      } catch (e) {
        return null
      }
    },
    lastUpdated(v) {
      // If server returns updated_at inside value, show it; else blank
      if (!v) return ''
      return v.updated_at ? v.updated_at : ''
    },
    selectKey(k) {
      console.log('Selecting setting key:', k, 'value:', this.settingsList[k])
      this.selectedKey = k
    },
    async reloadAll() {
      await this.$store.dispatch('settings/fetchAll')
      console.log('All settings keys:', Object.keys(this.settingsList))
      // auto-select first if none selected
      if (!this.selectedKey) {
        const keys = Object.keys(this.settingsList)
        if (keys.length) this.selectedKey = keys[0]
      }
    },
    openCreatePrompt() {
      this.newKey = ''
      this.newValueText = '{}'
      this.createError = null
      this.$bvModal.show('create-setting-modal')
    },
    async createNewSetting(bvOk) {
      // parse JSON
      try {
        const payload = JSON.parse(this.newValueText)
        // call settings update API (it will create or update)
        await this.$store.dispatch('settings/update', { key: this.newKey, payload })
        this.$bvToast.toast('Setting created', { variant: 'success', solid: true })
        await this.reloadAll()
        this.selectedKey = this.newKey
      } catch (e) {
        this.createError = e.message || 'Invalid JSON or create failed'
        // keep modal open (modal ok will still close — we prevent by throwing)
        this.$bvToast.toast('Failed to create setting', { variant: 'danger', solid: true })
        throw e
      }
    },
    onSaved({ key }) {
      // after child saves, reload list and select key
      this.reloadAll()
      this.selectedKey = key
    }
  },
  created() {
    this.reloadAll()
  }
}
</script>
