<template>
  <div>
    <h5 class="mb-3">Edit: <code>{{ keyProp }}</code></h5>

    <!-- If there's a schema for this key, render schema-driven form -->
    <div v-if="schema">
      <b-form @submit.prevent="onSave">

        <!-- Iterate top-level fields -->
        <div v-for="(field, idx) in schema.fields" :key="field.key" class="mb-3">

          <!-- Repeater (list of objects) -->
          <div v-if="field.type === 'repeater'">
            <label class="font-weight-bold d-block mb-2">{{ field.label }}</label>
            <b-button size="sm" variant="success" class="mb-2" @click="addRepeaterItem(field.key, field.itemFields)">
              Add {{ field.label }}
            </b-button>

            <div v-if="!Array.isArray(local[field.key]) || local[field.key].length === 0" class="text-muted small">
              No items yet
            </div>

            <div v-for="(item, i) in (local[field.key] || [])" :key="i" class="border p-3 mb-2 rounded">
              <div v-for="subField in field.itemFields" :key="subField.key" class="mb-2">
                <b-form-group :label="subField.label" :label-for="`${field.key}_${i}_${subField.key}`">
                  <component
                    :is="fieldComponent(subField.type)"
                    v-model="local[field.key][i][subField.key]"
                    :id="`${field.key}_${i}_${subField.key}`"
                    v-bind="subField.props || {}"
                    :type="subField.type === 'number' ? 'number' : 'text'"
                  />
                </b-form-group>
              </div>

              <div class="text-right">
                <b-button size="sm" variant="danger" @click="removeRepeaterItem(field.key, i)">Remove</b-button>
              </div>
            </div>
          </div>

          <!-- Group (object with subfields) -->
          <div v-else-if="field.type === 'group'">
            <label class="font-weight-bold d-block mb-2">{{ field.label }}</label>
            <div class="border p-3 rounded">
              <div v-for="subField in field.fields" :key="subField.key" class="mb-2">
                <b-form-group :label="subField.label" :label-for="`${field.key}_${subField.key}`">
                  <component
                    :is="fieldComponent(subField.type)"
                    v-model="local[field.key][subField.key]"
                    :id="`${field.key}_${subField.key}`"
                    v-bind="subField.props || {}"
                    :type="subField.type === 'number' ? 'number' : 'text'"
                  />
                </b-form-group>
              </div>
            </div>
          </div>

          <!-- Default simple field -->
          <div v-else>
            <b-form-group :label="field.label" :label-for="field.key">
              <component
                :is="fieldComponent(field.type)"
                v-model="local[field.key]"
                :id="field.key"
                v-bind="field.props || {}"
                :type="field.type === 'number' ? 'number' : 'text'"
              />
            </b-form-group>
          </div>

        </div>

        <div class="mt-4">
          <b-button type="submit" variant="primary" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </b-button>
          &nbsp;
          <b-button variant="outline-secondary" @click="onReset">Reset</b-button>
          &nbsp;
          <b-button variant="outline-info" @click="debugData">Debug Data</b-button>
        </div>
      </b-form>
    </div>

    <!-- Fallback: free JSON editor (textarea) -->
    <div v-else>
      <b-form-textarea v-model="jsonText" rows="12" />
      <div class="mt-2">
        <b-button variant="primary" @click="saveJson" :disabled="saving">Save JSON</b-button>
        &nbsp;
        <b-button variant="outline-secondary" @click="onReset">Reset</b-button>
      </div>
    </div>

    <!-- Debug output -->
    <div v-if="debug" class="mt-4 p-3 bg-light border rounded">
      <h6>Debug Data:</h6>
      <pre>{{ JSON.stringify(local, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import {
  BFormGroup,
  BFormInput,
  BFormCheckbox,
  BFormCheckboxGroup,
  BFormTimepicker,
  BFormTextarea,
  BButton,
  BFormSelect,
  BFormDatepicker
} from 'bootstrap-vue'

export default {
  name: 'DynamicSettingForm',
  components: {
    BFormGroup,
    BFormInput,
    BFormCheckbox,
    BFormCheckboxGroup,
    BFormTimepicker,
    BFormTextarea,
    BButton,
    BFormSelect,
    BFormDatepicker
  },
  props: {
    keyProp: { type: String, required: true },
    initialValue: { type: [Object, String, Array, null], default: null }
  },
  data() {
    return {
      local: {},
      jsonText: '',
      saving: false,
      debug: true, // Set to false in production
      schemaMap: {
        attendance_rules: {
          fields: [
            { key: 'checkin_time', label: 'Check-in time', type: 'time' },
            { key: 'checkout_time', label: 'Check-out time', type: 'time' },
            { key: 'late_threshold_minutes', label: 'Late threshold (minutes)', type: 'number', props: { min: 0 } },
            { key: 'early_checkout_allowed', label: 'Allow early checkout?', type: 'checkbox' },
            { key: 'working_days', label: 'Working days', type: 'checkbox-group', props: { options: [
                { text: 'Mon', value: 'mon' }, { text: 'Tue', value: 'tue' }, { text: 'Wed', value: 'wed' },
                { text: 'Thu', value: 'thu' }, { text: 'Fri', value: 'fri' }, { text: 'Sat', value: 'sat' }, { text: 'Sun', value: 'sun' }
              ] } }
          ]
        },
        presence_rules: {
          fields: [{ key: "number_of_days", label: "Number of days", type: "number", props: { min: 0 } }]
        },
        day_off_policy: {
          fields: [
            {
              key: 'types',
              label: 'Leave Types',
              type: 'repeater',
              itemFields: [
                { key: 'id', label: 'Type ID', type: 'text', required: true },
                { key: 'label', label: 'Type Name', type: 'text', required: true },
                { key: 'days_per_year', label: 'Days per Year', type: 'number', props: { min: 0 } },
                // { key: 'carry_over_allowed', label: 'Carry Over Allowed', type: 'checkbox' },
                // { key: 'max_carry_over_days', label: 'Max Carry Over Days', type: 'number', props: { min: 0 } },
                { key: 'requires_approval', label: 'Requires Approval', type: 'checkbox' }
              ]
            },
            // {
            //   key: 'global_rules',
            //   label: 'Global Rules',
            //   type: 'group',
            //   fields: [
            //     { key: 'allow_unpaid_days', label: 'Allow Unpaid Days', type: 'checkbox' },
            //     { key: 'notice_days_required', label: 'Notice Days Required', type: 'number', props: { min: 0 } }
            //   ]
            // }
          ]
        }
      }
    }
  },
  computed: {
    schema() {
      return this.schemaMap[this.keyProp] || null
    }
  },
  watch: {
    initialValue: { immediate: true, handler() { this.resetLocal() } },
    keyProp() { this.resetLocal() }
  },
  methods: {
    fieldComponent(type) {
      const map = {
        text: 'b-form-input',
        textarea: 'b-form-textarea',
        time: 'b-form-timepicker',
        number: 'b-form-input',
        checkbox: 'b-form-checkbox',
        'checkbox-group': 'b-form-checkbox-group',
        select: 'b-form-select',
        date: 'b-form-datepicker'
      }
      return map[type] || 'b-form-input'
    },

    resetLocal() {
      if (!this.schema) {
        try {
          this.jsonText = typeof this.initialValue === 'string' ? this.initialValue : JSON.stringify(this.initialValue || {}, null, 2)
        } catch (e) {
          this.jsonText = '{}'
        }
        return
      }

      const base = (typeof this.initialValue === 'object' && this.initialValue !== null) 
        ? JSON.parse(JSON.stringify(this.initialValue)) 
        : {}
      
      this.local = {}

      this.schema.fields.forEach(f => {
        if (f.type === 'repeater') {
          // Handle repeater fields
          if (Array.isArray(base[f.key])) {
            this.local[f.key] = base[f.key].map(item => {
              const normalized = {}
              f.itemFields.forEach(sf => {
                const value = item?.[sf.key]
                normalized[sf.key] = this.getDefaultValue(sf.type, value)
              })
              return normalized
            })
          } else {
            this.local[f.key] = []
          }
        } else if (f.type === 'group') {
          // Handle group fields
          this.local[f.key] = {}
          f.fields.forEach(sf => {
            const value = base?.[f.key]?.[sf.key]
            this.local[f.key][sf.key] = this.getDefaultValue(sf.type, value)
          })
        } else {
          // Handle simple fields
          const value = base[f.key]
          this.local[f.key] = this.getDefaultValue(f.type, value)
        }
      })
    },

    getDefaultValue(type, value) {
      switch (type) {
        case 'checkbox':
          return !!value
        case 'number':
          if (value === undefined || value === null || value === '') return 0
          return Number(value)
        case 'checkbox-group':
          return Array.isArray(value) ? value : []
        default:
          return value ?? ''
      }
    },

    onReset() {
      this.resetLocal()
    },

    addRepeaterItem(key, itemFields) {
      console.log('Adding repeater item:', key, itemFields)
      
      if (!Array.isArray(this.local[key])) {
        this.local[key] = []
      }
      
      const newItem = {}
      itemFields.forEach(f => {
        newItem[f.key] = this.getDefaultValue(f.type, undefined)
      })
      
      this.local[key].push(newItem)
      
      // Force Vue to update
      this.$forceUpdate()
    },
  removeRepeaterItem(key, index) {
    if (Array.isArray(this.local[key]) && this.local[key].length > index) {
      this.local[key].splice(index, 1)
      
      // Force Vue to update, same as addRepeaterItem
      this.$forceUpdate()
    }
  },

    normalizeTime(val) {
      if (!val && val !== 0) return ''
      if (val instanceof Date) {
        const hh = String(val.getHours()).padStart(2, '0')
        const mm = String(val.getMinutes()).padStart(2, '0')
        return `${hh}:${mm}`
      }
      if (typeof val === 'string') {
        const m = val.match(/^(\d{1,2}):(\d{2})/)
        if (m) return `${m[1].padStart(2,'0')}:${m[2]}`
        return val
      }
      return String(val)
    },

    async onSave() {
      this.saving = true
      try {
        const payload = JSON.parse(JSON.stringify(this.local))

        // Normalize time fields if they exist
        if (payload.checkin_time) payload.checkin_time = this.normalizeTime(payload.checkin_time)
        if (payload.checkout_time) payload.checkout_time = this.normalizeTime(payload.checkout_time)

        await this.$store.dispatch('settings/update', { key: this.keyProp, payload })
        this.$bvToast.toast('Settings saved successfully', { variant: 'success', solid: true })
        this.$emit('saved', { key: this.keyProp })
      } catch (e) {
        console.error('Save error:', e)
        this.$bvToast.toast('Save failed: ' + e.message, { variant: 'danger', solid: true })
      } finally {
        this.saving = false
      }
    },

    async saveJson() {
      this.saving = true
      try {
        const payload = JSON.parse(this.jsonText)
        await this.$store.dispatch('settings/update', { key: this.keyProp, payload })
        this.$bvToast.toast('Settings saved successfully', { variant: 'success', solid: true })
        this.$emit('saved', { key: this.keyProp })
      } catch (e) {
        this.$bvToast.toast('Invalid JSON: ' + e.message, { variant: 'danger', solid: true })
      } finally {
        this.saving = false
      }
    },

    debugData() {
      console.log('Current local data:', this.local)
      console.log('Initial value:', this.initialValue)
      console.log('Schema:', this.schema)
    }
  }
}
</script>

<style scoped>
.border { border: 1px solid #e9ecef; }
</style>