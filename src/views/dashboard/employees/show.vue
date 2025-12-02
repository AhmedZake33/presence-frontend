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
        <b-col cols="auto">
          <b-button variant="primary" @click="showAddDayOffModal">
            <feather-icon icon="PlusIcon" class="mr-1" />
            Add Day Off
          </b-button>
        </b-col>
      </b-row>
    </b-card>

    <!-- Day Off Section -->
    <b-card class="mt-4">
      <b-card-header>
        <h5 class="mb-0">Day Off Requests</h5>
      </b-card-header>
      <b-card-body>
        <BaseTable
          title=""
          :items="dayOffRequests"
          :fields="dayOffFields"
          :paginated="true"
          :per-page="dayOffPerPage"
          :total-rows="dayOffTotalRows"
          @page-changed="onDayOffPageChange"
          @per-page-changed="onDayOffPerPageChange"
        >
          <template #cell(dates)="data">
            <div>
              <strong>{{ formatDate(data.item.from_date) }}</strong> to 
              <strong>{{ formatDate(data.item.to_date) }}</strong>
              <br>
              <small class="text-muted">
                {{ data.item.total_days }} day(s)
                <span v-if="data.item.is_half_day">(Half Day - {{ data.item.half_day_type }})</span>
              </small>
            </div>
          </template>

          <template #cell(type)="data">
            <b-badge :variant="getLeaveTypeVariant(data.item.type.name)">
              {{ data.item.type.name }}
            </b-badge>
          </template>

          <template #cell(status)="data">
            <b-badge :variant="getStatusVariant(data.item.status)">
              {{ data.item.status }}
            </b-badge>
          </template>

          <template #cell(reason)="data">
            <div class="text-truncate" style="max-width: 200px;" :title="data.item.reason">
              {{ data.item.reason }}
            </div>
          </template>

          <template #cell(actions)="data">
            <b-button-group size="sm">
              <b-button 
                v-if="data.item.status === 'pending'"
                variant="success" 
                @click="approveDayOff(data.item)"
                v-b-tooltip.hover title="Approve"
              >
                <feather-icon icon="CheckIcon" />
              </b-button>
              
              <b-button 
                v-if="data.item.status === 'pending'"
                variant="danger" 
                @click="showRejectDayOffModal(data.item)"
                v-b-tooltip.hover title="Reject"
              >
                <feather-icon icon="XIcon" />
              </b-button>

              <b-button 
                variant="info" 
                @click="showDayOffDetails(data.item)"
                v-b-tooltip.hover title="View Details"
              >
                <feather-icon icon="EyeIcon" />
              </b-button>

              <b-button 
                v-if="data.item.status === 'pending' && data.item.user_id == auth().id"
                variant="outline-danger" 
                @click="deleteDayOff(data.item)"
                v-b-tooltip.hover title="Delete"
              >
                <feather-icon icon="TrashIcon" />
              </b-button>
            </b-button-group>
          </template>
        </BaseTable>
      </b-card-body>
    </b-card>

    <!-- Attendance Section -->
    <b-card class="mt-4">
      <b-card-header>
        <h5 class="mb-0">Attendance</h5>
      </b-card-header>
      <b-card-body>
        <BaseTable
          title=""
          :items="flatRecords"
          :fields="attendanceFields"
          :paginated="true"
          :per-page="attendancePerPage"
          :total-rows="attendanceTotalRows"
          @page-changed="onAttendancePageChange"
          @per-page-changed="onAttendancePerPageChange"
        >
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
      </b-card-body>
    </b-card>

    <!-- Add Day Off Modal -->
    <b-modal v-model="showAddModal" title="Add Day Off" @ok="addDayOff" @hidden="resetDayOffForm">
      <b-form @submit.prevent="addDayOff">
        <b-form-group label="Leave Type">
          <b-form-select
            v-model="dayOffForm.day_off_type_id"
            :options="leaveTypeOptions"
            required
          />
        </b-form-group>

        <b-row>
          <b-col md="6">
            <b-form-group label="From Date">
              <b-form-datepicker
                v-model="dayOffForm.from_date"
                :min="minDate"
                required
                @input="onDateChange"
              />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="To Date">
              <b-form-datepicker
                v-model="dayOffForm.to_date"
                :min="dayOffForm.from_date || minDate"
                required
                @input="onDateChange"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <!-- Duration Section - Only show for single day requests -->
        <b-form-group label="Duration" v-if="showDurationOptions">
          <b-form-checkbox
            v-model="dayOffForm.is_half_day"
          >
            Half Day
          </b-form-checkbox>

          <b-form-select
            v-if="dayOffForm.is_half_day"
            v-model="dayOffForm.half_day_type"
            :options="halfDayOptions"
            required
          />
        </b-form-group>

        <div v-else class="alert alert-info mb-3">
          <small>
            <feather-icon icon="InfoIcon" size="14" class="mr-1" />
            Half-day option is only available for single day requests
          </small>
        </div>

        <b-form-group label="Reason">
          <b-form-textarea
            v-model="dayOffForm.reason"
            rows="3"
            required
            placeholder="Please provide a reason for the day off..."
          />
        </b-form-group>

        <b-form-group label="Emergency Contact (Optional)">
          <b-form-input
            v-model="dayOffForm.emergency_contact"
            placeholder="Phone number or contact details"
          />
        </b-form-group>

        <!-- Request Summary -->
        <div v-if="calculatedDays > 0" class="mb-3 p-3 bg-light rounded">
          <h6 class="mb-2">Request Summary:</h6>
          <div class="small">
            <strong>Duration:</strong> {{ calculatedDays }} day(s)<br>
            <strong>Type:</strong> {{ selectedLeaveTypeName || 'N/A' }}<br>
            <strong>Dates:</strong> {{ formatDate(dayOffForm.from_date) }} to {{ formatDate(dayOffForm.to_date) }}
          </div>
        </div>
      </b-form>
    </b-modal>

    <!-- Reject Day Off Modal -->
    <b-modal v-model="showRejectModal" title="Reject Day Off Request" @ok="rejectDayOff">
      <b-form-group label="Rejection Reason">
        <b-form-textarea
          v-model="rejectForm.reason"
          rows="3"
          placeholder="Please provide a reason for rejecting this day off request..."
          required
        />
      </b-form-group>
    </b-modal>

    <!-- Day Off Details Modal -->
    <b-modal v-model="showDetailsModal" :title="`Day Off Details - ${selectedDayOff ? selectedDayOff.type.name : ''}`" size="lg" ok-only>
      <div v-if="selectedDayOff">
        <b-row>
          <b-col md="6">
            <b-card no-body class="mb-3">
              <b-card-header class="bg-light">
                <h6 class="mb-0">Request Information</h6>
              </b-card-header>
              <b-card-body>
                <b-list-group flush>
                  <b-list-group-item>
                    <strong>Leave Type:</strong> 
                    <b-badge :variant="getLeaveTypeVariant(selectedDayOff.type.name)" class="ml-2">
                      {{ selectedDayOff.type.name }}
                    </b-badge>
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Period:</strong> {{ formatDate(selectedDayOff.from_date) }} to {{ formatDate(selectedDayOff.to_date) }}
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Duration:</strong> {{ selectedDayOff.total_days }} day(s)
                    <span v-if="selectedDayOff.is_half_day">(Half Day - {{ selectedDayOff.half_day_type }})</span>
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Status:</strong> 
                    <b-badge :variant="getStatusVariant(selectedDayOff.status)" class="ml-2">
                      {{ selectedDayOff.status }}
                    </b-badge>
                  </b-list-group-item>
                </b-list-group>
              </b-card-body>
            </b-card>
          </b-col>
          
          <b-col md="6">
            <b-card no-body class="mb-3">
              <b-card-header class="bg-light">
                <h6 class="mb-0">Approval Information</h6>
              </b-card-header>
              <b-card-body>
                <b-list-group flush>
                  <b-list-group-item>
                    <strong>Submitted:</strong> {{ formatDateTime(selectedDayOff.created_at) }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedDayOff.approved_by">
                    <strong>Approved By:</strong> {{ selectedDayOff.approver ? selectedDayOff.approver.name : 'N/A' }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedDayOff.approved_at">
                    <strong>Approved At:</strong> {{ formatDateTime(selectedDayOff.approved_at) }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedDayOff.approval_notes">
                    <strong>Notes:</strong> {{ selectedDayOff.approval_notes }}
                  </b-list-group-item>
                </b-list-group>
              </b-card-body>
            </b-card>
          </b-col>
        </b-row>

        <b-card no-body>
          <b-card-header class="bg-light">
            <h6 class="mb-0">Reason & Details</h6>
          </b-card-header>
          <b-card-body>
            <p><strong>Reason:</strong></p>
            <p>{{ selectedDayOff.reason }}</p>
            
            <div v-if="selectedDayOff.emergency_contact">
              <strong>Emergency Contact:</strong>
              <p>{{ selectedDayOff.emergency_contact }}</p>
            </div>
          </b-card-body>
        </b-card>
      </div>
    </b-modal>
  </div>
</template>

<script>
import api from '@/libs/axios'
import moment from 'moment'
import BaseTable from '@/views/components/my-components/table.vue'
import loading from '@/views/components/my-components/loading.vue'

export default {
  name: 'EmployeeProfileWithDayOff',
  components: { BaseTable, loading },
  data() {
    return {
      employeeId: this.$route.params.employeeId,
      employee: {},
      
      // Attendance data
      attendanceGrouped: [],
      flatRecords: [],
      attendanceCurrentPage: 1,
      attendancePerPage: 10,
      attendanceTotalRows: 0,
      
      // Day Off data
      dayOffRequests: [],
      dayOffCurrentPage: 1,
      dayOffPerPage: 10,
      dayOffTotalRows: 0,
      leaveTypes: [],
      
      // Modals
      showAddModal: false,
      showRejectModal: false,
      showDetailsModal: false,
      
      // Forms
      dayOffForm: {
        day_off_type_id: null,
        from_date: '',
        to_date: '',
        is_half_day: false,
        half_day_type: null,
        reason: '',
        emergency_contact: ''
      },
      rejectForm: {
        reason: ''
      },
      
      selectedDayOff: null,
      loading: false,
      minDate: new Date().toISOString().split('T')[0],
      
      // Field definitions
      attendanceFields: [
        { key: 'date', label: 'Date' },
        { key: 'check_in', label: 'Check In' },
        { key: 'check_out', label: 'Check Out' },
        { key: 'hours', label: 'Hours Worked' },
      ],
      dayOffFields: [
        { key: 'dates', label: 'Dates', sortable: true },
        { key: 'type', label: 'Leave Type', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'reason', label: 'Reason' },
        { key: 'actions', label: 'Actions' }
      ],
      halfDayOptions: [
        { value: 'first_half', text: 'First Half' },
        { value: 'second_half', text: 'Second Half' }
      ]
    }
  },
  computed: {
    leaveTypeOptions() {
      return [
        { value: null, text: 'Select Leave Type', disabled: true },
        ...this.leaveTypes.map(type => ({
          value: type.id,
          text: type.name
        }))
      ]
    },
    
    selectedLeaveType() {
      return this.leaveTypes.find(type => type.id === this.dayOffForm.day_off_type_id);
    },
    
    selectedLeaveTypeName() {
      return this.selectedLeaveType ? this.selectedLeaveType.name : '';
    },
    
    // Calculate total days for the request
    calculatedDays() {
      if (!this.dayOffForm.from_date || !this.dayOffForm.to_date) return 0;
      
      // If half-day is selected, return 0.5 regardless of date range
      if (this.dayOffForm.is_half_day === true) return 0.5;
      
      const start = new Date(this.dayOffForm.from_date);
      const end = new Date(this.dayOffForm.to_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return diffDays;
    },
    
    // Show duration options only for single day requests
    showDurationOptions() {
      if (!this.dayOffForm.from_date || !this.dayOffForm.to_date) return true;
      
      const start = new Date(this.dayOffForm.from_date);
      const end = new Date(this.dayOffForm.to_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Only show duration options for single day requests
      return diffDays === 1;
    }
  },
  watch: {
    // Watch for changes in duration options and reset half-day if needed
    showDurationOptions(newVal) {
      if (!newVal && this.dayOffForm.is_half_day) {
        // If duration options are hidden and half-day was selected, reset it
        this.dayOffForm.is_half_day = false;
        this.dayOffForm.half_day_type = null;
      }
    }
  },
  methods: {
    // Handle date changes
    onDateChange() {
      // If dates are changed and it's more than one day, reset half-day options
      if (!this.showDurationOptions && this.dayOffForm.is_half_day) {
        this.dayOffForm.is_half_day = false;
        this.dayOffForm.half_day_type = null;
      }
    },

    // Attendance methods
    onAttendancePageChange(page) {
      this.attendanceCurrentPage = page
      this.loadAttendance(page, this.attendancePerPage)
    },
    
    onAttendancePerPageChange(perPage) {
      this.attendanceCurrentPage = 1
      this.attendancePerPage = perPage
      this.loadAttendance(1, perPage)
    },

    // Day Off methods
    onDayOffPageChange(page) {
      this.dayOffCurrentPage = page
      this.loadDayOffRequests(page, this.dayOffPerPage)
    },
    
    onDayOffPerPageChange(perPage) {
      this.dayOffCurrentPage = 1
      this.dayOffPerPage = perPage
      this.loadDayOffRequests(1, perPage)
    },

    async loadAttendance(page = 1, perPage = 10) {
      try {
        this.loading = true
        const payload = {
          employeeId: this.employeeId,
          perPage: perPage,
          page: page
        }
        const res = await api.post(`/employees/${this.employeeId}/attendance`, payload)
        this.attendanceGrouped = res.data.data || res.data
        this.attendanceTotalRows = res.data.total || res.data.length
        this.attendanceCurrentPage = page
        this.attendancePerPage = perPage
        this.employee = res.data.employee
        this.flattenAttendance()
      } catch (e) {
        console.error('Error loading attendance:', e)
      } finally {
        this.loading = false
      }
    },

    async loadDayOffRequests(page = 1, perPage = 10) {
      try {
        const params = {
          page: page,
          perPage: perPage,
          user_id: this.employeeId
        }
        const response = await api.get('/admin/day-off-requests', { params })
        this.dayOffRequests = response.data.data
        this.dayOffTotalRows = response.data.total
        this.dayOffCurrentPage = response.data.current_page || page
        this.dayOffPerPage = response.data.per_page || perPage
      } catch (error) {
        console.error('Error loading day off requests:', error)
        this.$bvToast.toast('Error loading day off requests', {
          variant: 'danger',
          solid: true
        })
      }
    },

    async loadLeaveTypes() {
      try {
        const response = await api.get('/day-off-types/active')
        this.leaveTypes = response.data.data
      } catch (error) {
        console.error('Error loading leave types:', error)
      }
    },

    // Modal methods
    showAddDayOffModal() {
      this.showAddModal = true
    },

    showRejectDayOffModal(dayOff) {
      this.selectedDayOff = dayOff
      this.rejectForm.reason = ''
      this.showRejectModal = true
    },

    showDayOffDetails(dayOff) {
      this.selectedDayOff = dayOff
      this.showDetailsModal = true
    },

    // Day Off actions
    async addDayOff() {
      try {
        const payload = {
          ...this.dayOffForm,
          user_id: this.employeeId
        }
        await api.post('/admin/day-off-requests', payload)
        
        this.$bvToast.toast('Day off added successfully', {
          variant: 'success',
          solid: true
        })
        
        this.showAddModal = false
        this.resetDayOffForm()
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage)
      } catch (error) {
        const message = error.response?.data?.message || 'Error adding day off'
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        })
      }
    },

    async approveDayOff(dayOff) {
      try {
        await api.patch(`/admin/day-off-requests/${dayOff.id}/approve`)
        
        this.$bvToast.toast('Day off approved successfully', {
          variant: 'success',
          solid: true
        })
        
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage)
      } catch (error) {
        const message = error.response?.data?.message || 'Error approving day off'
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        })
      }
    },

    async rejectDayOff() {
      if (!this.rejectForm.reason.trim()) {
        this.$bvToast.toast('Please provide a rejection reason', {
          variant: 'warning',
          solid: true
        })
        return
      }

      try {
        await api.patch(`/admin/day-off-requests/${this.selectedDayOff.id}/reject`, {
          reason: this.rejectForm.reason
        })
        
        this.$bvToast.toast('Day off rejected successfully', {
          variant: 'success',
          solid: true
        })
        
        this.showRejectModal = false
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage)
      } catch (error) {
        const message = error.response?.data?.message || 'Error rejecting day off'
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        })
      }
    },

    async deleteDayOff(dayOff) {
      if (!confirm('Are you sure you want to delete this day off request?')) {
        return
      }

      try {
        await api.delete(`/admin/day-off-requests/${dayOff.id}`)
        
        this.$bvToast.toast('Day off request deleted successfully', {
          variant: 'success',
          solid: true
        })
        
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage)
      } catch (error) {
        const message = error.response?.data?.message || 'Error deleting day off'
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        })
      }
    },

    // Helper methods
    resetDayOffForm() {
      this.dayOffForm = {
        day_off_type_id: null,
        from_date: '',
        to_date: '',
        is_half_day: false,
        half_day_type: null,
        reason: '',
        emergency_contact: ''
      }
    },

    flattenAttendance() {
      var flat = []
      
      if (this.attendanceGrouped.length === 0) {
        return
      }

      this.attendanceGrouped.forEach(day => {
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
      })
      
      flat.sort((a, b) => (a.date === b.date ? (a.check_in > b.check_in ? 1 : -1) : (a.date < b.date ? 1 : -1)))
      this.flatRecords = flat
    },

    getStatusVariant(status) {
      const variants = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        cancelled: 'secondary'
      }
      return variants[status] || 'secondary'
    },

    getLeaveTypeVariant(typeName) {
      const variants = {
        'Annual Leave': 'primary',
        'Sick Leave': 'info',
        'Personal Leave': 'success',
        'Emergency Leave': 'danger'
      }
      return variants[typeName] || 'secondary'
    },

    formatDate(date) {
      if (!date) return '—'
      return moment ? moment(date).format('YYYY-MM-DD') : date
    },

    formatDateTime(datetime) {
      if (!datetime) return '—'
      return moment ? moment(datetime).format('YYYY-MM-DD HH:mm') : datetime
    }
  },
  created() {
    this.loadAttendance()
    this.loadDayOffRequests()
    this.loadLeaveTypes()
  }
}
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>