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
            <!-- Field: allow_any_time -->
            <b-form-group v-if="field.key === 'allow_any_time'" :label="field.label" :label-for="field.key">
              <b-form-checkbox
                v-model="local[field.key]"
                :id="field.key"
                @change="onAllowAnyTimeChange"
                switch
              >
                {{ local[field.key] ? 'Enabled' : 'Disabled' }}
              </b-form-checkbox>
              <small class="text-muted">
                When enabled, employees can check in and out at any time regardless of fixed schedules
              </small>
            </b-form-group>
            
            <!-- Field: working_days (always shown) -->
            <b-form-group v-else-if="field.key === 'working_days'" :label="field.label" :label-for="field.key">
              <b-form-checkbox-group
                v-model="local[field.key]"
                :id="field.key"
                :options="dayOptions"
                stacked
              />
              <small class="text-muted">
                Select days when attendance rules apply
              </small>
            </b-form-group>
            
            <!-- Time-related fields (conditionally shown) -->
            <b-form-group 
              v-else-if="isTimeRelatedField(field.key) && !local.allow_any_time" 
              :label="field.label" 
              :label-for="field.key"
            >
              <component
                :is="fieldComponent(field.type)"
                v-model="local[field.key]"
                :id="field.key"
                v-bind="field.props || {}"
                :type="field.type === 'number' ? 'number' : 'text'"
              />
              <!-- Helper text for specific fields -->
              <small v-if="field.key === 'late_threshold_minutes'" class="text-muted">
                Minutes after check-in time when employee is marked as late
              </small>
              <small v-if="field.key === 'early_checkout_allowed'" class="text-muted">
                Allow employees to check out before the scheduled check-out time
              </small>
            </b-form-group>
            
            <!-- Other fields -->
            <b-form-group v-else-if="!isTimeRelatedField(field.key)" :label="field.label" :label-for="field.key">
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
      <p>Allow Any Time: {{ local.allow_any_time }}</p>
      <p>Show time fields: {{ !local.allow_any_time }}</p>
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
      debug: false,
      dayOptions: [
        { text: 'Monday', value: 'mon' },
        { text: 'Tuesday', value: 'tue' },
        { text: 'Wednesday', value: 'wed' },
        { text: 'Thursday', value: 'thu' },
        { text: 'Friday', value: 'fri' },
        { text: 'Saturday', value: 'sat' },
        { text: 'Sunday', value: 'sun' }
      ],
      timeRelatedFields: ['checkin_time', 'checkout_time', 'late_threshold_minutes', 'early_checkout_allowed'],
      schemaMap: {
        attendance_rules: {
          fields: [
            { key: 'allow_any_time', label: 'Allow any time', type: 'checkbox' },
            { key: 'checkin_time', label: 'Check-in time', type: 'time' },
            { key: 'checkout_time', label: 'Check-out time', type: 'time' },
            { key: 'late_threshold_minutes', label: 'Late threshold (minutes)', type: 'number', props: { min: 0 } },
            { key: 'early_checkout_allowed', label: 'Allow early checkout?', type: 'checkbox' },
            { key: 'working_days', label: 'Working days', type: 'checkbox-group' }
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
                { key: 'requires_approval', label: 'Requires Approval', type: 'checkbox' }
              ]
            }
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

    isTimeRelatedField(fieldKey) {
      return this.timeRelatedFields.includes(fieldKey)
    },

    onAllowAnyTimeChange(value) {
      console.log('Allow any time changed to:', value)
      // Force Vue to re-render by updating a reactive property
      this.local = { ...this.local, allow_any_time: value }
      
      // If switching to "allow any time", we can optionally clear time fields
      if (value === true) {
        // Optional: Clear time fields when allowing any time
        this.timeRelatedFields.forEach(field => {
          if (field === 'late_threshold_minutes') {
            this.local[field] = 0
          } else if (field === 'early_checkout_allowed') {
            this.local[field] = false
          } else {
            this.local[field] = ''
          }
        })
      }
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
      
      // Initialize local with default structure
      const newLocal = {}

      this.schema.fields.forEach(f => {
        if (f.type === 'repeater') {
          // Handle repeater fields
          if (Array.isArray(base[f.key])) {
            newLocal[f.key] = base[f.key].map(item => {
              const normalized = {}
              f.itemFields.forEach(sf => {
                const value = item?.[sf.key]
                normalized[sf.key] = this.getDefaultValue(sf.type, value)
              })
              return normalized
            })
          } else {
            newLocal[f.key] = []
          }
        } else if (f.type === 'group') {
          // Handle group fields
          newLocal[f.key] = {}
          f.fields.forEach(sf => {
            const value = base?.[f.key]?.[sf.key]
            newLocal[f.key][sf.key] = this.getDefaultValue(sf.type, value)
          })
        } else {
          // Handle simple fields
          const value = base[f.key]
          newLocal[f.key] = this.getDefaultValue(f.type, value)
        }
      })
      
      // Ensure allow_any_time has a default value
      if (newLocal.allow_any_time === undefined) {
        newLocal.allow_any_time = false
      }
      
      // Ensure working_days has a default value
      if (!newLocal.working_days || !Array.isArray(newLocal.working_days)) {
        newLocal.working_days = ['mon', 'tue', 'wed', 'thu', 'fri']
      }
      
      // Update local reactively
      this.local = newLocal
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
        this.$set(this.local, key, [])
      }
      
      const newItem = {}
      itemFields.forEach(f => {
        newItem[f.key] = this.getDefaultValue(f.type, undefined)
      })
      
      this.local[key].push(newItem)
    },

    removeRepeaterItem(key, index) {
      if (Array.isArray(this.local[key]) && this.local[key].length > index) {
        this.local[key].splice(index, 1)
        // Force reactivity
        this.$set(this.local, key, [...this.local[key]])
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
        
        // Ensure allow_any_time is boolean
        if (payload.allow_any_time !== undefined) {
          payload.allow_any_time = !!payload.allow_any_time
        }

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
        console.log('Saving JSON payload for key', this.keyProp, payload)
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
      this.debug = !this.debug
    }
  }
}
</script>

<style scoped>
.border { border: 1px solid #e9ecef; }
</style>