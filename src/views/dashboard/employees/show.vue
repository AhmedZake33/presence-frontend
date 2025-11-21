<template>
  <div>
    <loading :visible="loading" text="Processing..." />
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
      :total-rows="totalRows"
      @page-changed="onPageChange"
      @per-page-changed="onPerPageChange"
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
  </div>
</template>

<script>
import api from '@/libs/axios'
import moment from 'moment' // optional
import  BaseTable  from '@/views/components/my-components/table.vue'
import loading from '@/views/components/my-components/loading.vue'

export default {
  name: 'EmployeeAttendanceUsingBaseTable',
  components: { BaseTable,loading },
  data() {
    return {
        employeeId: this.$route.params.employeeId,
        employee: {},
      attendanceGrouped: [], // API grouped by date
      flatRecords: [],       // flattened rows
      currentPage: 1,
      perPage: 10,
      totalRows: 0,
      loading: false,
      fields: [
        { key: 'date', label: 'Date' },
        { key: 'check_in', label: 'Check In' },
        { key: 'check_out', label: 'Check Out' },
        { key: 'hours', label: 'Hours Worked' },
      ],
    }
  },
  methods: {

    onPageChange(page) {
      this.$emit('page-changed', {
        page: page,
        perPage: this.perPage
      })
      this.load(page.page, this.perPage)
    },
    
    onPerPageChange(perPage) {
      this.currentPage = 1
      this.$emit('per-page-changed', {
        page: this.currentPage,
        perPage: perPage
      })
      console.log("onPerPageChange")
      console.log(perPage)
      this.load(perPage.page, perPage.perPage)
    },
    
    // Method to reset to first page (useful when filtering)
    resetPagination() {
      this.currentPage = 1
    },
    async load(page = 1, perPage = 10) {
      try {
        this.loading = true
        const payload = {
          employeeId: this.employeeId,
          perPage: perPage,
          page: page
        }
        const res = await api.post(`/employees/${this.employeeId}/attendance`, payload)
        this.attendanceGrouped = res.data.data || res.data
        console.log("attendanceGrouped")
        console.log(res.data.data)
        this.totalRows = res.data.total || res.data.length;
        this.currentPage = page;
        this.perPage = perPage;
        this.employee = res.data.employee
        this.flatten()
      } catch (e) {
        console.error(e)
        this.loading = false
      }
      this.loading = false
    },
    flatten() {

      var flat = []
      
       if(this.attendanceGrouped.length === 0){
        return;
       }

      (this.attendanceGrouped).forEach(day => {
        const date = day.date
        const check_in = day.check_in ? day.check_in : null
        const check_out = day.check_out ? day.check_out : null
        const hours = day.total_hours ? day.total_hours : null

        flat.push({
            date,
            check_in,
            check_out,
            hours,
        })
        console.log('flat')
        console.log(flat)
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
