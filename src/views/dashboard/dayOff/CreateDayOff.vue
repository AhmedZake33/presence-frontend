<template>
  <div>
    <b-card>
      <b-card-header>
        <h4>Request Day Off</h4>
      </b-card-header>
      <b-card-body>
        <b-form @submit.prevent="submitRequest">
          <b-row>
            <b-col md="6">
              <b-form-group label="Leave Type" label-for="leave-type">
                <b-form-select
                  id="leave-type"
                  v-model="requestForm.day_off_type_id"
                  required
                  :options="leaveTypeOptions"
                  @change="onLeaveTypeChange"
                />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <div class="text-right">
               
                <div v-if="selectedLeaveType && selectedLeaveType.working_days" class="text-muted small">
                  <strong>Working Days:</strong> {{ formattedWorkingDays }}
                </div>
              </div>
            </b-col>
          </b-row>

          <b-row>
            <b-col md="4">
              <b-form-group label="From Date">
                <b-form-datepicker
                  v-model="requestForm.from_date"
                  required
                  @input="onDateChange"
                />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="To Date">
                <b-form-datepicker
                  v-model="requestForm.to_date"
                  :min="requestForm.from_date || null"
                  required
                  @input="onDateChange"
                />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="Duration" v-if="showDurationOptions">
                <b-form-checkbox
                  v-model="requestForm.is_half_day"
                >
                  Half Day
                </b-form-checkbox>

                <b-form-select
                  v-if="requestForm.is_half_day"
                  v-model="requestForm.half_day_type"
                  :options="halfDayOptions"
                  required
                />
              </b-form-group>
              <div v-else class="text-muted small mt-4">
                <em>Half-day option only available for single day requests</em>
              </div>
            </b-col>
          </b-row>

          <b-form-group label="Reason">
            <b-form-textarea
              v-model="requestForm.reason"
              rows="3"
              required
              placeholder="Please provide a reason for your leave request..."
            />
          </b-form-group>

          <b-form-group label="Emergency Contact (Optional)">
            <b-form-input
              v-model="requestForm.emergency_contact"
              placeholder="Phone number or contact details"
            />
          </b-form-group>

          <div v-if="calculatedDays > 0" class="mb-3">
            <b-alert variant="info" show>
              <strong>Request Summary:</strong><br>
              • Duration: {{ calculatedDays }} working day(s)<br>
              • Type: {{ selectedLeaveTypeName }}<br>
              • Working Days: {{ formattedWorkingDays }}<br>
              • Status: Will be {{ requiresApproval ? 'pending approval' : 'auto-approved' }}
            </b-alert>
          </div>

          <b-button 
            type="submit" 
            variant="primary" 
            :disabled="submitting || !selectedLeaveType"
          >
            <b-spinner small v-if="submitting" class="mr-1"></b-spinner>
            Submit Request
          </b-button>
        </b-form>
      </b-card-body>
    </b-card>

    <!-- My Requests Section -->
    <b-card class="mt-4">
      <b-card-header>
        <h5>My Leave Requests</h5>
      </b-card-header>
      <b-card-body>
        <BaseTable
          title=""
          :items="myRequests"
          :fields="requestFields"
          :paginated="true"
          :per-page="perPage"
          :total-rows="totalRows"
          :current-page="currentPage"
          @page-changed="onPageChange"
          @per-page-changed="onPerPageChange"
        >
          <template #cell(from_date)="data">
            {{ formatDate(data.value) }}
          </template>
          
          <template #cell(to_date)="data">
            {{ formatDate(data.value) }}
          </template>
          
          <template #cell(status)="data">
            <b-badge :variant="getStatusVariant(data.value)">
              {{ data.value }}
            </b-badge>
          </template>
          
          <template #cell(total_days)="data">
            {{ data.item.is_half_day ? '0.5' : data.value }}
          </template>
          
          <template #cell(working_days)="data">
            {{ formatWorkingDays(data.item.working_days) }}
          </template>
          
          <template #cell(actions)="data">
            <b-button 
              size="sm" 
              variant="outline-info"
              @click="showRequestDetails(data.item)"
              class="mr-1"
            >
              <feather-icon icon="EyeIcon" size="14" />
            </b-button>
            <b-button 
              v-if="data.item.status === 'pending'" 
              size="sm" 
              variant="outline-danger"
              @click="confirmDeleteRequest(data.item)"
              :disabled="deletingRequestId === data.item.id"
            >
              <b-spinner small v-if="deletingRequestId === data.item.id"></b-spinner>
              <feather-icon v-else icon="TrashIcon" size="14" />
            </b-button>
            <span v-else class="text-muted">-</span>
          </template>
        </BaseTable>
      </b-card-body>
    </b-card>

    <!-- Delete Confirmation Modal -->
    <b-modal 
      v-model="showDeleteModal" 
      title="Delete Leave Request" 
      @ok="deleteRequest" 
      @hidden="cancelDelete"
      ok-variant="danger"
      ok-title="Delete"
      cancel-title="Cancel"
    >
      <p>Are you sure you want to delete this pending leave request?</p>
      <div v-if="selectedRequestToDelete" class="alert alert-info">
        <strong>Request Details:</strong><br>
        • Type: {{ selectedRequestToDelete.type ? selectedRequestToDelete.type.name : 'N/A' }}<br>
        • Dates: {{ formatDate(selectedRequestToDelete.from_date) }} to {{ formatDate(selectedRequestToDelete.to_date) }}<br>
        • Working Days: {{ formatWorkingDays(selectedRequestToDelete.working_days) }}<br>
        • Duration: {{ selectedRequestToDelete.is_half_day ? '0.5' : selectedRequestToDelete.total_days }} day(s)
      </div>
      <p class="text-danger"><strong>This action cannot be undone.</strong></p>
    </b-modal>

    <!-- Request Details Modal -->
    <b-modal 
      v-model="showDetailsModal" 
      :title="`Request Details - ${selectedRequestDetails ? selectedRequestDetails.type.name : ''}`"
      size="lg"
      ok-only
      ok-title="Close"
    >
      <div v-if="selectedRequestDetails">
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
                    <b-badge :variant="getLeaveTypeVariant(selectedRequestDetails.type.name)" class="ml-2">
                      {{ selectedRequestDetails.type.name }}
                    </b-badge>
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Period:</strong> {{ formatDate(selectedRequestDetails.from_date) }} to {{ formatDate(selectedRequestDetails.to_date) }}
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Duration:</strong> {{ selectedRequestDetails.total_days }} working day(s)
                    <span v-if="selectedRequestDetails.is_half_day">(Half Day - {{ selectedRequestDetails.half_day_type }})</span>
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedRequestDetails.working_days">
                    <strong>Working Days:</strong> {{ formatWorkingDays(selectedRequestDetails.working_days) }}
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Status:</strong> 
                    <b-badge :variant="getStatusVariant(selectedRequestDetails.status)" class="ml-2">
                      {{ selectedRequestDetails.status }}
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
                    <strong>Submitted:</strong> {{ formatDateTime(selectedRequestDetails.created_at) }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedRequestDetails.approved_by">
                    <strong>Approved By:</strong> {{ selectedRequestDetails.approver ? selectedRequestDetails.approver.name : 'N/A' }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedRequestDetails.approved_at">
                    <strong>Approved At:</strong> {{ formatDateTime(selectedRequestDetails.approved_at) }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedRequestDetails.approval_notes">
                    <strong>Approval Notes:</strong> {{ selectedRequestDetails.approval_notes }}
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
            <p>{{ selectedRequestDetails.reason }}</p>
            
            <div v-if="selectedRequestDetails.emergency_contact">
              <strong>Emergency Contact:</strong>
              <p>{{ selectedRequestDetails.emergency_contact }}</p>
            </div>
          </b-card-body>
        </b-card>
      </div>
    </b-modal>
  </div>
</template>

<script>
import api from "@/libs/axios";
import BaseTable from '@/views/components/my-components/table.vue'

export default {
  name: 'EmployeeLeaveRequest',
  components: {
    BaseTable
  },
  data() {
    return {
      requestForm: {
        day_off_type_id: null,
        from_date: '',
        to_date: '',
        is_half_day: false,
        half_day_type: null,
        reason: '',
        emergency_contact: ''
      },
      leaveTypes: [],
      myRequests: [],
      allocations: [],
      submitting: false,
      deletingRequestId: null,
      showDeleteModal: false,
      showDetailsModal: false,
      selectedRequestToDelete: null,
      selectedRequestDetails: null,
      halfDayOptions: [
        { value: 'first_half', text: 'First Half' },
        { value: 'second_half', text: 'Second Half' }
      ],
      
      // Day mapping
      dayMap: {
        'sun': 0,
        'mon': 1,
        'tue': 2,
        'wed': 3,
        'thu': 4,
        'fri': 5,
        'sat': 6
      },
      dayNameMap: {
        'sun': 'Sunday',
        'mon': 'Monday',
        'tue': 'Tuesday',
        'wed': 'Wednesday',
        'thu': 'Thursday',
        'fri': 'Friday',
        'sat': 'Saturday'
      },
      
      // Pagination
      currentPage: 1,
      perPage: 10,
      totalRows: 0,
      
      requestFields: [
        { key: 'type.name', label: 'Type' },
        { key: 'from_date', label: 'From' },
        { key: 'to_date', label: 'To' },
        { key: 'total_days', label: 'Working Days' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions' }
      ]
    };
  },
  computed: {
    leaveTypeOptions() {
      return [
        { value: null, text: 'Select Leave Type', disabled: true },
        ...this.leaveTypes.map(type => ({
          value: type.id,
          text: `${type.name} (${this.getAllocationRemaining(type.id) === 0 ? type.max_days_per_year : this.getAllocationRemaining(type.id)} days left)  (${type.requires_approval ? 'Requires Approval' : 'No Approval Required'})` 
        }))
      ];
    },
    selectedLeaveType() {
      return this.leaveTypes.find(type => type.id === this.requestForm.day_off_type_id);
    },
    selectedLeaveTypeName() {
      return this.selectedLeaveType ? this.selectedLeaveType.name : '';
    },
    requiresApproval() {
      return this.selectedLeaveType ? this.selectedLeaveType.requires_approval : true;
    },
    remainingDays() {
      return this.selectedLeaveType ? this.getAllocationRemaining(this.selectedLeaveType.id) : 0;
    },
    formattedWorkingDays() {
      if (!this.selectedLeaveType || !this.selectedLeaveType.working_days) {
        return 'No working days configured';
      }
      
      return this.formatWorkingDays(this.selectedLeaveType.working_days);
    },
    // Get working days from selected leave type
    currentWorkingDays() {
      if (!this.selectedLeaveType || !this.selectedLeaveType.working_days) {
        return [];
      }
      return this.selectedLeaveType.working_days;
    },
    calculatedDays() {
      if (!this.requestForm.from_date || !this.requestForm.to_date) return 0;
      
      // If half-day is selected, return 0.5 regardless of date range
      if (this.requestForm.is_half_day === true) return 0.5;
      
      const start = new Date(this.requestForm.from_date);
      const end = new Date(this.requestForm.to_date);
      
      // Calculate working days between two dates using the leave type's working days
      return this.countWorkingDays(start, end, this.currentWorkingDays);
    },
    // Show duration options only for single working day requests
    showDurationOptions() {
      if (!this.requestForm.from_date || !this.requestForm.to_date || !this.selectedLeaveType) return false;
      
      const start = new Date(this.requestForm.from_date);
      const end = new Date(this.requestForm.to_date);
      
      // Check if it's a single day (same day)
      if (start.toDateString() === end.toDateString()) {
        // Check if this single day is a working day
        const dayOfWeek = start.getDay();
        const dayName = this.getDayNameFromNumber(dayOfWeek);
        return this.currentWorkingDays.includes(dayName);
      }
      
      return false;
    }
  },
  watch: {
    // Reset half-day options when dates change to multiple days
    showDurationOptions(newVal) {
      if (!newVal && this.requestForm.is_half_day) {
        // If duration options are hidden and half-day was selected, reset it
        this.requestForm.is_half_day = false;
        this.requestForm.half_day_type = null;
      }
    }
  },
  mounted() {
    this.loadData();
  },
  methods: {
    // Pagination methods
    onPageChange(page) {
      this.currentPage = page;
      this.loadMyRequests(page, this.perPage);
    },
    
    onPerPageChange(perPage) {
      this.currentPage = 1;
      this.perPage = perPage;
      this.loadMyRequests(1, perPage);
    },

    async loadData() {
      try {
        const [typesResponse, allocationsResponse] = await Promise.all([
          api.get('/day-off-types/active'),
          api.get('/leave-balances')
        ]);
        
        this.leaveTypes = typesResponse.data.data;
        this.allocations = allocationsResponse.data.data;
        
        // Load requests after types and allocations
        this.loadMyRequests(this.currentPage, this.perPage);
      } catch (error) {
        console.error('Error loading data:', error);
        this.$bvToast.toast('Error loading data', {
          variant: 'danger',
          solid: true
        });
      }
    },

    async loadMyRequests(page = 1, perPage = 10) {
      try {
        const params = {
          page: page,
          perPage: perPage,
          user_id: this.auth().id
        };

        const response = await api.get('/day-off-requests', { params });
        this.myRequests = response.data.data;
        this.totalRows = response.data.total;
        this.currentPage = response.data.current_page || page;
        this.perPage = response.data.per_page || perPage;
      } catch (error) {
        console.error('Error loading my requests:', error);
        this.$bvToast.toast('Error loading leave requests', {
          variant: 'danger',
          solid: true
        });
      }
    },
    
    /**
     * Handle leave type change
     */
    onLeaveTypeChange() {
      // Reset half-day when leave type changes
      this.requestForm.is_half_day = false;
      this.requestForm.half_day_type = null;
      
      // Trigger date recalculation
      if (this.requestForm.from_date && this.requestForm.to_date) {
        this.onDateChange();
      }
    },
    
    /**
     * Count working days between two dates using specific working days array
     */
    countWorkingDays(startDate, endDate, workingDaysArray) {
      if (!workingDaysArray || !Array.isArray(workingDaysArray) || workingDaysArray.length === 0) {
        // If no working days specified, count all days
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
      
      let count = 0;
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      // Loop through each day between start and end (inclusive)
      while (current <= end) {
        const dayOfWeek = current.getDay(); // 0=Sunday, 1=Monday, etc.
        const dayName = this.getDayNameFromNumber(dayOfWeek);
        
        // Check if this day is a working day
        if (workingDaysArray.includes(dayName)) {
          count++;
        }
        
        // Move to next day
        current.setDate(current.getDate() + 1);
      }
      
      return count;
    },
    
    /**
     * Get day name from day number
     */
    getDayNameFromNumber(dayNumber) {
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      return days[dayNumber];
    },
    
    /**
     * Get day number from day name
     */
    getDayNumberFromName(dayName) {
      return this.dayMap[dayName] || -1;
    },
    
    /**
     * Format day name for display
     */
    formatDayName(dayName) {
      return this.dayNameMap[dayName] || dayName;
    },
    
    /**
     * Format working days array for display
     */
    formatWorkingDays(workingDaysArray) {
      if (!workingDaysArray || !Array.isArray(workingDaysArray)) return 'N/A';
      
      return workingDaysArray
        .sort((a, b) => this.getDayNumberFromName(a) - this.getDayNumberFromName(b))
        .map(day => this.formatDayName(day))
        .join(', ');
    },
    
    getAllocationRemaining(typeId) {
      const allocation = this.allocations.find(a => a.day_off_type_id === typeId);
      return allocation ? allocation.remaining_days : 0;
    },
    
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    formatDateTime(datetime) {
      if (!datetime) return 'N/A';
      return new Date(datetime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    getStatusVariant(status) {
      const variants = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        cancelled: 'secondary'
      };
      return variants[status] || 'secondary';
    },

    getLeaveTypeVariant(typeName) {
      const variants = {
        'Annual Leave': 'primary',
        'Sick Leave': 'info',
        'Personal Leave': 'success',
        'Emergency Leave': 'danger'
      };
      return variants[typeName] || 'secondary';
    },
    
    // Handle date changes
    onDateChange() {
      // If dates are changed and it's more than one day, reset half-day options
      if (!this.showDurationOptions && this.requestForm.is_half_day) {
        this.requestForm.is_half_day = false;
        this.requestForm.half_day_type = null;
      }
    },
    
    async submitRequest() {
      this.submitting = true;
      try {
        const payload = {
          ...this.requestForm,
          // Note: working_days should come from the leave type in backend
          // total_days should be calculated in backend as well
        };
        
        await api.post('/day-off-requests', payload);
        
        this.$bvToast.toast('Leave request submitted successfully', {
          variant: 'success',
          solid: true
        });
        this.loadData();
        this.resetForm();
        // this.loadMyRequests(this.currentPage, this.perPage);
      } catch (error) {
        const message = error.response?.data?.message || 'Error submitting request';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.submitting = false;
      }
    },
    
    showRequestDetails(request) {
      this.selectedRequestDetails = request;
      this.showDetailsModal = true;
    },
    
    confirmDeleteRequest(request) {
      if (request.status !== 'pending') {
        this.$bvToast.toast('Only pending requests can be deleted', {
          variant: 'warning',
          solid: true
        });
        return;
      }
      
      this.selectedRequestToDelete = request;
      this.showDeleteModal = true;
    },
    
    async deleteRequest() {
      if (!this.selectedRequestToDelete) return;
      
      this.deletingRequestId = this.selectedRequestToDelete.id;
      
      try {
        await api.delete(`/day-off-requests/${this.selectedRequestToDelete.id}`);
        
        this.$bvToast.toast('Leave request deleted successfully', {
          variant: 'success',
          solid: true
        });
        
        this.loadMyRequests(this.currentPage, this.perPage);
      } catch (error) {
        const message = error.response?.data?.message || 'Error deleting request';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.deletingRequestId = null;
        this.showDeleteModal = false;
        this.selectedRequestToDelete = null;
      }
    },
    
    cancelDelete() {
      this.showDeleteModal = false;
      this.selectedRequestToDelete = null;
      this.deletingRequestId = null;
    },
    
    resetForm() {
      this.requestForm = {
        day_off_type_id: null,
        from_date: '',
        to_date: '',
        is_half_day: false,
        half_day_type: null,
        reason: '',
        emergency_contact: ''
      };
    }
  }
};
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>