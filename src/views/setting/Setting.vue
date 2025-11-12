<template>
  <b-card>
    <b-row class="mb-3">
      <b-col><h4>Attendance Settings</h4></b-col>
      <b-col cols="4" class="text-right">
        <b-button variant="primary" @click="load">Reload</b-button>
      </b-col>
    </b-row>

    <b-form @submit.prevent="save">
      <b-form-row>
        <b-col md="3">
          <b-form-group label="Check-in time">
            <b-form-timepicker v-model="form.checkin_time" :hour-step="1" :minute-step="1" :show-seconds="false" required></b-form-timepicker>
          </b-form-group>
        </b-col>

        <b-col md="3">
          <b-form-group label="Check-out time">
            <b-form-timepicker v-model="form.checkout_time" :hour-step="1" :minute-step="1" :show-seconds="false" required></b-form-timepicker>
          </b-form-group>
        </b-col>

        <b-col md="3">
          <b-form-group label="Late threshold (minutes)">
            <b-form-input type="number" v-model.number="form.late_threshold_minutes" min="0"></b-form-input>
          </b-form-group>
        </b-col>

        <b-col md="3">
          <b-form-group label="Allow early checkout">
            <b-form-checkbox v-model="form.early_checkout_allowed">Allowed</b-form-checkbox>
          </b-form-group>
        </b-col>
      </b-form-row>

      <b-form-group label="Working days">
        <b-form-checkbox-group v-model="form.working_days" stacked>
          <b-form-checkbox value="mon">Monday</b-form-checkbox>
          <b-form-checkbox value="tue">Tuesday</b-form-checkbox>
          <b-form-checkbox value="wed">Wednesday</b-form-checkbox>
          <b-form-checkbox value="thu">Thursday</b-form-checkbox>
          <b-form-checkbox value="fri">Friday</b-form-checkbox>
          <b-form-checkbox value="sat">Saturday</b-form-checkbox>
          <b-form-checkbox value="sun">Sunday</b-form-checkbox>
        </b-form-checkbox-group>
      </b-form-group>

      <b-button type="submit" variant="primary" :disabled="saving">Save settings</b-button>
      &nbsp;
      <b-button variant="outline-secondary" @click="reset">Reset</b-button>
    </b-form>
  </b-card>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'SettingsAttendance',
  data() {
    return {
      form: {
        checkin_time: '09:00',
        checkout_time: '17:00',
        late_threshold_minutes: 15,
        early_checkout_allowed: false,
        working_days: ['mon','tue','wed','thu','fri']
      },
      saving: false,
    }
  },
  computed: {
    ...mapGetters({
      getSetting: 'settings/get',
      isLoggedIn: 'auth/isLoggedIn'
    })
  },
  methods: {
     normalizeTime(val) {
    if (!val && val !== 0) return ''
    // if Date object
    if (val instanceof Date) {
      const hh = String(val.getHours()).padStart(2, '0')
      const mm = String(val.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    }
    // string: "09:04:00" or "09:04"
    if (typeof val === 'string') {
      const m = val.match(/^(\d{1,2}):(\d{2})/)
      if (m) return `${m[1].padStart(2,'0')}:${m[2]}`
      return val
    }
    return String(val)
  },

    async load() {
      await this.$store.dispatch('settings/fetch', 'attendance_rules')
      const data = this.getSetting('attendance_rules')
      if (data) {
        // normalize times as HH:mm
        this.form = {
        checkin_time: this.normalizeTime(data.checkin_time) || this.form.checkin_time,
        checkout_time: this.normalizeTime(data.checkout_time) || this.form.checkout_time,
          late_threshold_minutes: data.late_threshold_minutes ?? this.form.late_threshold_minutes,
          early_checkout_allowed: data.early_checkout_allowed ?? this.form.early_checkout_allowed,
          working_days: data.working_days && data.working_days.length ? data.working_days : this.form.working_days
        }
      }
    },
    reset() {
      this.load()
    },
    async save() {
      this.saving = true
      try {
        const payload = { 
        ...this.form,
        checkin_time: this.normalizeTime(this.form.checkin_time),
        checkout_time: this.normalizeTime(this.form.checkout_time)
     }
        await this.$store.dispatch('settings/update', { key: 'attendance_rules', payload })
        this.$bvToast.toast('Settings saved', { variant: 'success', solid: true })
      } catch (err) {
        this.$bvToast.toast('Failed to save settings', { variant: 'danger', solid: true })
      } finally {
        this.saving = false
      }
    }
  },
  created() {
    this.load()
  }
}
</script>
