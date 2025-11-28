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
                />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <div class="text-right">
                <small class="text-muted" v-if="selectedLeaveType">
                  Remaining: {{ remainingDays }} days
                </small>
              </div>
            </b-col>
          </b-row>

          <b-row>
            <b-col md="4">
              <b-form-group label="From Date">
                <b-form-datepicker
                  v-model="requestForm.from_date"
                  :min="minDate"
                  required
                  @input="onDateChange"
                />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="To Date">
                <b-form-datepicker
                  v-model="requestForm.to_date"
                  :min="requestForm.from_date || minDate"
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
              • Duration: {{ calculatedDays }} day(s)<br>
              • Type: {{ selectedLeaveTypeName }}<br>
              • Status: Will be {{ requiresApproval ? 'pending approval' : 'auto-approved' }}
            </b-alert>
          </div>

          <b-button 
            type="submit" 
            variant="primary" 
            :disabled="submitting"
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
        <b-table 
          :items="myRequests" 
          :fields="requestFields"
          striped
          hover
          show-empty
          empty-text="No leave requests found"
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
        </b-table>
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
        • Days: {{ selectedRequestToDelete.is_half_day ? '0.5' : selectedRequestToDelete.total_days }}
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
                    <strong>Duration:</strong> {{ selectedRequestDetails.total_days }} day(s)
                    <span v-if="selectedRequestDetails.is_half_day">(Half Day - {{ selectedRequestDetails.half_day_type }})</span>
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

export default {
  name: 'EmployeeLeaveRequest',
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
      minDate: new Date().toISOString().split('T')[0],
      halfDayOptions: [
        { value: 'first_half', text: 'First Half' },
        { value: 'second_half', text: 'Second Half' }
      ],
      requestFields: [
        { key: 'type.name', label: 'Type' },
        { key: 'from_date', label: 'From' },
        { key: 'to_date', label: 'To' },
        { key: 'total_days', label: 'Days' },
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
          text: `${type.name} (${this.getAllocationRemaining(type.id)} days left)`
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
    calculatedDays() {
      if (!this.requestForm.from_date || !this.requestForm.to_date) return 0;
      
      if (this.requestForm.is_half_day === true) return 0.5;
      
      const start = new Date(this.requestForm.from_date);
      const end = new Date(this.requestForm.to_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return diffDays;
    },
    // Show duration options only for single day requests
    showDurationOptions() {
      if (!this.requestForm.from_date || !this.requestForm.to_date) return true;
      
      const start = new Date(this.requestForm.from_date);
      const end = new Date(this.requestForm.to_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Only show duration options for single day requests
      return diffDays === 1;
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
    async loadData() {
      try {
        const [typesResponse, requestsResponse, allocationsResponse] = await Promise.all([
          api.get('/day-off-types/active'),
          api.get('/day-off-requests'),
          api.get('/leave-balances')
        ]);
        
        this.leaveTypes = typesResponse.data.data;
        this.myRequests = requestsResponse.data.data;
        this.allocations = allocationsResponse.data.data;
      } catch (error) {
        console.error('Error loading data:', error);
        this.$bvToast.toast('Error loading data', {
          variant: 'danger',
          solid: true
        });
      }
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
        await api.post('/day-off-requests', this.requestForm);
        
        this.$bvToast.toast('Leave request submitted successfully', {
          variant: 'success',
          solid: true
        });
        
        this.resetForm();
        this.loadData();
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
        
        this.loadData();
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