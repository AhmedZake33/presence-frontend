<template>
  <div>
    <loading :visible="loading" text="Processing..." />
    <b-card>
      <b-card-header>
        <h4 class="mb-0">Leave Request Approvals</h4>
        <p class="text-muted mb-0">Manage employee leave requests</p>
      </b-card-header>
      <b-card-body>
        <b-row class="mb-3">
          <b-col md="4">
            <b-form-group label="Filter by Status">
              <b-form-select v-model="filters.status" @change="handleFilterChange">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </b-form-select>
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Filter by Leave Type">
              <b-form-select v-model="filters.leave_type" @change="handleFilterChange">
                <option value="">All Types</option>
                <option v-for="type in leaveTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </b-form-select>
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Filter by Date">
              <b-form-datepicker v-model="filters.date" @input="handleFilterChange" />
            </b-form-group>
          </b-col>
        </b-row>

        <BaseTable
          title="Leave Requests"
          :items="leaveRequests"
          :fields="fields"
          :paginated="true"
          :per-page="perPage"
          :total-rows="totalRows"
          :current-page="currentPage"
          @page-changed="onPageChange"
          @per-page-changed="onPerPageChange"
        >
          <template #cell(employee)="data">
            <div>
              <strong>{{ data.item.user.name }}</strong>
              <br>
              <small class="text-muted">{{ data.item.user.email }}</small>
            </div>
          </template>

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
            <div v-if="data.item.type && !data.item.type.requires_approval" class="small text-success">
              Auto-approved
            </div>
          </template>

          <template #cell(status)="data">
            <b-badge :variant="getStatusVariant(data.item.status)">
              {{ data.item.status }}
            </b-badge>
            <div v-if="data.item.approved_by && data.item.approver" class="small text-muted">
              By: {{ data.item.approver.name }}
            </div>
          </template>

          <template #cell(reason)="data">
            <div class="text-truncate" style="max-width: 200px;" :title="data.item.reason">
              {{ data.item.reason }}
            </div>
            <b-button 
              v-if="data.item.reason && data.item.reason.length > 50"
              size="sm" 
              variant="link" 
              @click="showReasonModal(data.item)"
            >
              View Full
            </b-button>
          </template>

          <template #cell(actions)="data">
            <b-button-group size="sm">
              <b-button 
                v-if="data.item.status === 'pending'"
                variant="success" 
                @click="approveRequest(data.item)"
              >
                <feather-icon icon="CheckIcon" />
              </b-button>
              
              <b-button 
                v-if="data.item.status === 'pending'"
                variant="danger" 
                @click="showRejectModal(data.item)"
              >
                <feather-icon icon="XIcon" />
              </b-button>

              <b-button 
                v-if="data.item.status === 'approved'"
                variant="warning" 
                @click="showRevokeModal(data.item)"
              >
                <feather-icon icon="RotateCcwIcon" />
              </b-button>

              <b-button 
                variant="info" 
                @click="showDetailsModal(data.item)"
              >
                <feather-icon icon="EyeIcon" />
              </b-button>
            </b-button-group>
          </template>
        </BaseTable>
      </b-card-body>
    </b-card>

    <!-- Reason Modal -->
    <b-modal v-model="modals.reason" :title="`Reason - ${selectedRequest && selectedRequest.user ? selectedRequest.user.name : ''}`" ok-only>
      <p>{{ selectedRequest && selectedRequest.reason }}</p>
      <div v-if="selectedRequest && selectedRequest.emergency_contact" class="mt-3">
        <strong>Emergency Contact:</strong> {{ selectedRequest.emergency_contact }}
      </div>
    </b-modal>

    <!-- Details Modal -->
    <b-modal v-model="modals.details" :title="`Request Details - ${selectedRequest && selectedRequest.user ? selectedRequest.user.name : ''}`" size="lg" ok-only>
      <b-row>
        <b-col md="6">
          <b-card no-body class="mb-3">
            <b-card-header class="bg-light">
              <h6 class="mb-0">Request Information</h6>
            </b-card-header>
            <b-card-body>
              <b-list-group flush>
                <b-list-group-item>
                  <strong>Employee:</strong> {{ selectedRequest && selectedRequest.user ? selectedRequest.user.name : '' }}
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Email:</strong> {{ selectedRequest && selectedRequest.user ? selectedRequest.user.email : '' }}
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Leave Type:</strong> 
                  <b-badge :variant="getLeaveTypeVariant(selectedRequest && selectedRequest.type ? selectedRequest.type.name : '')" class="ml-2">
                    {{ selectedRequest && selectedRequest.type ? selectedRequest.type.name : '' }}
                  </b-badge>
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Period:</strong> {{ formatDate(selectedRequest && selectedRequest.from_date) }} to {{ formatDate(selectedRequest && selectedRequest.to_date) }}
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Duration:</strong> {{ selectedRequest && selectedRequest.total_days }} day(s)
                  <span v-if="selectedRequest && selectedRequest.is_half_day">(Half Day - {{ selectedRequest.half_day_type }})</span>
                </b-list-group-item>
              </b-list-group>
            </b-card-body>
          </b-card>
        </b-col>
        
        <b-col md="6">
          <b-card no-body class="mb-3">
            <b-card-header class="bg-light">
              <h6 class="mb-0">Status & Approval</h6>
            </b-card-header>
            <b-card-body>
              <b-list-group flush>
                <b-list-group-item>
                  <strong>Status:</strong> 
                  <b-badge :variant="getStatusVariant(selectedRequest && selectedRequest.status)" class="ml-2">
                    {{ selectedRequest && selectedRequest.status }}
                  </b-badge>
                </b-list-group-item>
                <b-list-group-item v-if="selectedRequest && selectedRequest.approved_by">
                  <strong>Approved By:</strong> {{ selectedRequest.approver ? selectedRequest.approver.name : '' }}
                </b-list-group-item>
                <b-list-group-item v-if="selectedRequest && selectedRequest.approved_at">
                  <strong>Approved At:</strong> {{ formatDateTime(selectedRequest.approved_at) }}
                </b-list-group-item>
                <b-list-group-item v-if="selectedRequest && selectedRequest.approval_notes">
                  <strong>Notes:</strong> {{ selectedRequest.approval_notes }}
                </b-list-group-item>
                <b-list-group-item>
                  <strong>Submitted:</strong> {{ formatDateTime(selectedRequest && selectedRequest.created_at) }}
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
          <p>{{ selectedRequest && selectedRequest.reason }}</p>
          
          <div v-if="selectedRequest && selectedRequest.emergency_contact">
            <strong>Emergency Contact:</strong>
            <p>{{ selectedRequest.emergency_contact }}</p>
          </div>
        </b-card-body>
      </b-card>
    </b-modal>

    <!-- Reject Modal -->
    <b-modal v-model="modals.reject" title="Reject Leave Request" @ok="rejectRequest" @hidden="resetRejectForm">
      <b-form-group label="Rejection Reason">
        <b-form-textarea
          v-model="rejectForm.reason"
          rows="3"
          placeholder="Please provide a reason for rejecting this leave request..."
          required
        />
      </b-form-group>
    </b-modal>

    <!-- Revoke Modal -->
    <b-modal v-model="modals.revoke" title="Revoke Approval" @ok="revokeRequest">
      <p>Are you sure you want to revoke approval for <strong>{{ selectedRequest && selectedRequest.user ? selectedRequest.user.name : '' }}'s</strong> leave request?</p>
      <b-alert variant="warning" show>
        This will return the leave days to the employee's allocation.
      </b-alert>
    </b-modal>
  </div>
</template>

<script>
import api from '@/libs/axios'
import BaseTable from '@/views/components/my-components/table.vue'
import loading from '@/views/components/my-components/loading.vue'

export default {
  name: 'LeaveApprovalUsingBaseTable',
  components: { 
    BaseTable, 
    loading 
  },
  data() {
    return {
      currentPage: 1,
      perPage: 10,
      totalRows: 0,
      loading: false,
      leaveRequests: [],
      leaveTypes: [],
      selectedRequest: null,
      filters: {
        status: 'pending',
        leave_type: '',
        date: ''
      },
      rejectForm: {
        reason: ''
      },
      modals: {
        reason: false,
        details: false,
        reject: false,
        revoke: false
      },
      fields: [
        { key: 'employee', label: 'Employee', sortable: true },
        { key: 'dates', label: 'Dates', sortable: true },
        { key: 'type', label: 'Leave Type', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'reason', label: 'Reason' },
        { key: 'actions', label: 'Actions' }
      ]
    }
  },
  methods: {
    onPageChange(page) {
      this.load(page, this.perPage)
    },
    
    onPerPageChange(perPage) {
      this.currentPage = 1
      this.load(this.currentPage, perPage)
    },

    // Reset to first page when filters change
    handleFilterChange() {
      this.currentPage = 1
      this.load(1, this.perPage)
    },
    
    async load(page = 1, perPage = 10) {
      try {
        this.loading = true
        const params = {
          page: page,
          perPage: perPage,
          ...this.filters
        }

        console.log('Loading leave requests with params:', params)

        const response = await api.get('/admin/day-off-requests', { params })
        this.leaveRequests = response.data.data
        this.totalRows = response.data.total
        this.currentPage = response.data.current_page || page
        this.perPage = response.data.per_page || perPage
        
      } catch (error) {
        console.error('Error loading leave requests:', error)
        this.$bvToast.toast('Error loading leave requests', {
          variant: 'danger',
          solid: true
        })
      } finally {
        this.loading = false
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

    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },

    formatDateTime(datetime) {
      if (!datetime) return ''
      return new Date(datetime).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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
      if (!typeName) return 'secondary'
      const variants = {
        'Annual Leave': 'primary',
        'Sick Leave': 'info',
        'Personal Leave': 'success',
        'Emergency Leave': 'danger'
      }
      return variants[typeName] || 'secondary'
    },

    showReasonModal(request) {
      this.selectedRequest = request
      this.modals.reason = true
    },

    showDetailsModal(request) {
      this.selectedRequest = request
      this.modals.details = true
    },

    showRejectModal(request) {
      this.selectedRequest = request
      this.rejectForm.reason = ''
      this.modals.reject = true
    },

    showRevokeModal(request) {
      this.selectedRequest = request
      this.modals.revoke = true
    },

    async approveRequest(request) {
      try {
        this.loading = true
        await api.patch(`/admin/day-off-requests/${request.id}/approve`)
        
        this.$bvToast.toast(`Leave request approved for ${request.user.name}`, {
          variant: 'success',
          solid: true
        })
        
        this.load(this.currentPage, this.perPage)
      } catch (error) {
        const message = error.response?.data?.message || 'Error approving request'
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        })
      }
      this.loading = false
    },

    async rejectRequest() {
      if (!this.rejectForm.reason.trim()) {
        this.$bvToast.toast('Please provide a rejection reason', {
          variant: 'warning',
          solid: true
        })
        return
      }

      try {
        this.loading = true

        await api.patch(`/admin/day-off-requests/${this.selectedRequest.id}/reject`, {
          reason: this.rejectForm.reason
        })
        
        this.$bvToast.toast(`Leave request rejected for ${this.selectedRequest.user.name}`, {
          variant: 'success',
          solid: true
        })
        
        this.modals.reject = false
        this.load(this.currentPage, this.perPage)
      } catch (error) {
        const message = error.response?.data?.message || 'Error rejecting request'
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        })
      }
      this.loading = false

    },

    async revokeRequest() {
      try {
        await api.patch(`/day-off-requests/${this.selectedRequest.id}/revoke`)
        
        this.$bvToast.toast(`Approval revoked for ${this.selectedRequest.user.name}`, {
          variant: 'success',
          solid: true
        })
        
        this.modals.revoke = false
        this.load(this.currentPage, this.perPage)
      } catch (error) {
        const message = error.response?.data?.message || 'Error revoking approval'
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        })
      }
    },

    resetRejectForm() {
      this.rejectForm.reason = ''
    }
  },
  created() { 
    this.load()
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