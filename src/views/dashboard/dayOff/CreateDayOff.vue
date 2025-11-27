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
                />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="To Date">
                <b-form-datepicker
                  v-model="requestForm.to_date"
                  :min="requestForm.from_date || minDate"
                  required
                />
              </b-form-group>
            </b-col>
            <b-col md="4">
                <b-form-group label="Duration">
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
            <b-spinner small v-if="submitting" class="mr-1" />
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
              v-if="data.item.canBeCancelled" 
              size="sm" 
              variant="outline-danger"
              @click="cancelRequest(data.item)"
            >
              Cancel
            </b-button>
          </template>
        </b-table>
      </b-card-body>
    </b-card>
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
    }
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
      return this.leaveTypes.find(type => type.id == this.requestForm.day_off_type_id);
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
      
      // Simple calculation - you might want to exclude weekends
      return diffDays;
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
          api.get('/employee-allocations')
        ]);
        
        this.leaveTypes = typesResponse.data.data;
        this.myRequests = requestsResponse.data.data;
        this.allocations = allocationsResponse.data.data;
      } catch (error) {
        console.error('Error loading data:', error);
      }
    },
    
    getAllocationRemaining(typeId) {
      const allocation = this.allocations.find(a => a.day_off_type_id == typeId);
      return allocation ? allocation.remaining_days : 0;
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString();
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
    
    async cancelRequest(request) {
      try {
        await api.patch(`/day-off-requests/${request.id}/cancel`);
        
        this.$bvToast.toast('Request cancelled successfully', {
          variant: 'success',
          solid: true
        });
        
        this.loadData();
      } catch (error) {
        this.$bvToast.toast('Error cancelling request', {
          variant: 'danger',
          solid: true
        });
      }
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
}
</script>