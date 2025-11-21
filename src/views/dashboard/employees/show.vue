<template>
  <div>
    <b-card>
      <b-row>
        <b-col>
          <h4 class="mb-1">
            {{ employee.name }}
          </h4>
          <div class="text-muted">
            {{ employee.email }}
          </div>
        </b-col>
      </b-row>
    </b-card>
    <BaseTable
      title="Attendance"
      :items="flatRecords"
      :fields="fields"
      :paginated="true"
      :per-page="perPage"
    >
      <!-- format date cell -->
      <template #cell(date)="data">
        {{ formatDate(data.item.date) }}
      </template>

      <template #cell(check_in)="data">
        {{ data.item.check_in || '—' }}
      </template>

      <template #cell(check_out)="data">
        {{ data.item.check_out || '—' }}
      </template>

      <template #cell(hours)="data">
        {{ data.item.hours !== null ? data.item.hours : '—' }}
      </template>
    </BaseTable>
  </div>
</template>

<script>
import api from '@/libs/axios'
import moment from 'moment' // optional
import  BaseTable  from '@/views/components/my-components/table.vue'
export default {
  name: 'EmployeeAttendanceUsingBaseTable',
  components: { BaseTable },
  data() {
    return {
        employeeId: this.$route.params.employeeId,
        employee: {},
      attendanceGrouped: [], // API grouped by date
      flatRecords: [],       // flattened rows
      perPage: 10,
      fields: [
        { key: 'date', label: 'Date' },
        { key: 'check_in', label: 'Check In' },
        { key: 'check_out', label: 'Check Out' },
        { key: 'hours', label: 'Hours Worked' },
      ],
    }
  },
  methods: {
    async load() {
      try {
        const res = await api.get(`/employees/${this.employeeId}/attendance`)
        // adapt to your API response shape:
        // either res.data.attendance (grouped) or res.data (if already grouped)
        // console.log(res.data.attendance)
        this.attendanceGrouped = res.data.attendance || res.data
        this.employee = res.data.employee
        this.flatten()
      } catch (e) {
        console.error(e)
      }
    },
    flatten() {
      var flat = []
      
       if(this.attendanceGrouped.length === 0){
        return;
       }

      (this.attendanceGrouped).forEach(day => {
        const date = day.date
        if(day.records.length === 0){
          return;
        }
        (day.records).forEach(rec => {
          flat.push({
            date,
            check_in: rec.check_in || null,
            check_out: rec.check_out || null,
            hours: typeof rec.hours !== 'undefined' ? rec.hours : this.calcHours(rec.check_in, rec.check_out),
          })
         
          
        })
      })
      // optional sorting newest first
      flat.sort((a, b) => (a.date === b.date ? (a.check_in > b.check_in ? 1 : -1) : (a.date < b.date ? 1 : -1)))
      this.flatRecords = flat
    },
    calcHours(checkIn, checkOut) {
      if (!checkIn || !checkOut) return null
      const inTime = new Date(checkIn.length === 5 ? `1970-01-01T${checkIn}:00` : checkIn)
      const outTime = new Date(checkOut.length === 5 ? `1970-01-01T${checkOut}:00` : checkOut)
      const secs = (outTime - inTime) / 1000
      if (isNaN(secs) || secs <= 0) return null
      return Math.round((secs / 3600) * 100) / 100
    },
    formatDate(dateStr) {
      if (!dateStr) return '—'
      return (typeof moment !== 'undefined') ? moment(dateStr).format('YYYY-MM-DD') : dateStr
    }
  },
  created() { this.load() }
}
</script>
