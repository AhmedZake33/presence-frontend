<template>
  <div>
    <loading :visible="loading" text="Loading dashboard..." />
    
    <!-- Employee Header -->
    <b-card class="mb-4">
      <b-row class="align-items-center">
        <b-col md="8">
          <h4 class="mb-1">{{ employee.name }}</h4>
          <div class="text-muted">{{ employee.email }}</div>
          <!-- <div class="text-muted small">Employee ID: {{ employee.employee_id || 'N/A' }}</div> -->
        </b-col>
        <b-col md="4" class="text-right">
          <b-badge variant="primary" class="p-2">
            <feather-icon icon="CalendarIcon" class="mr-1" />
            Current Year: {{ currentYear }}
          </b-badge>
        </b-col>
      </b-row>
    </b-card>

    <!-- Statistics Cards -->
    <b-row class="mb-4">
      <b-col lg="3" md="6" class="mb-3">
        <b-card class="text-center stat-card">
          <div class="stat-icon-container">
            <feather-icon icon="ClockIcon" size="24" class="text-primary" />
          </div>
          <h3 class="stat-value">{{ statistics.total_allocated || 0 }}</h3>
          <p class="stat-label">Total Allocated Days</p>
        </b-card>
      </b-col>

      <b-col lg="3" md="6" class="mb-3">
        <b-card class="text-center stat-card">
          <div class="stat-icon-container">
            <feather-icon icon="CheckCircleIcon" size="24" class="text-success" />
          </div>
          <h3 class="stat-value">{{ statistics.used_days || 0 }}</h3>
          <p class="stat-label">Days Used</p>
        </b-card>
      </b-col>

      <b-col lg="3" md="6" class="mb-3">
        <b-card class="text-center stat-card">
          <div class="stat-icon-container">
            <feather-icon icon="TrendingUpIcon" size="24" class="text-info" />
          </div>
          <h3 class="stat-value">{{ statistics.remaining_days || 0 }}</h3>
          <p class="stat-label">Days Remaining</p>
        </b-card>
      </b-col>

      <b-col lg="3" md="6" class="mb-3">
        <b-card class="text-center stat-card">
          <div class="stat-icon-container">
            <feather-icon icon="AlertCircleIcon" size="24" :class="utilizationClass" />
          </div>
          <h3 class="stat-value">{{ statistics.utilization_rate || 0 }}%</h3>
          <p class="stat-label">Utilization Rate</p>
        </b-card>
      </b-col>
    </b-row>

    <!-- Leave Type Breakdown -->
    <b-row class="mb-4">

       <b-col lg="12" class="mb-4">
        <b-card>
          <b-card-header>
            <h5 class="mb-0">Request Status Distribution</h5>
          </b-card-header>
          <b-card-body class="text-center">
            <div v-if="requestStats.total_requests > 0">
              <b-row class="mb-3">
                <b-col>
                  <vue-apex-chart
                    type="donut"
                    height="300"
                    :options="chartOptions"
                    :series="statusSeries"
                  />
                </b-col>
              </b-row>
              <b-row>
                <b-col v-for="stat in requestStats.breakdown" :key="stat.status" class="mb-2">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                      <div 
                        class="status-indicator mr-2" 
                        :style="{ backgroundColor: getStatusColor(stat.status) }"
                      ></div>
                      <span class="text-capitalize">{{ stat.status }}</span>
                    </div>
                    <strong>{{ stat.count }} ({{ stat.percentage }}%)</strong>
                  </div>
                </b-col>
              </b-row>
            </div>
            <div v-else class="text-muted">
              <feather-icon icon="InboxIcon" size="48" class="mb-2" />
              <p>No leave requests yet</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
      
      <b-col lg="12" class="mb-4">
        <b-card>
          <b-card-header>
            <h5 class="mb-0">Leave Balance by Type</h5>
          </b-card-header>
          <b-card-body>
            <b-table 
              :items="leaveBalances" 
              :fields="balanceFields"
              striped
              hover
              show-empty
              empty-text="No leave allocations found"
            >
              <template #cell(type)="data">
                <b-badge :variant="getLeaveTypeVariant(data.value)">
                  {{ data.value }}
                </b-badge>
              </template>

              <template #cell(allocated)="data">
                <strong>{{ data.value }}</strong>
              </template>

              <template #cell(used)="data">
                <span :class="data.value > 0 ? 'text-warning' : 'text-muted'">
                  {{ data.value }}
                </span>
              </template>

              <template #cell(remaining)="data">
                <span :class="data.value > 0 ? 'text-success' : 'text-danger'">
                  <strong>{{ data.value }}</strong>
                </span>
              </template>

              <template #cell(utilization)="data">
                <b-progress 
                  :value="data.value" 
                  :max="100" 
                  height="20px"
                  :variant="getProgressVariant(data.value)"
                  show-progress
                />
              </template>
            </b-table>
          </b-card-body>
        </b-card>
      </b-col>

     
    </b-row>

    <!-- Recent Activity & Upcoming Leaves -->
    <b-row>
      <b-col lg="6" class="mb-4">
        <b-card>
          <b-card-header>
            <h5 class="mb-0">Recent Leave Requests</h5>
          </b-card-header>
          <b-card-body>
            <div v-if="recentRequests.length > 0">
              <b-list-group flush>
                <b-list-group-item 
                  v-for="request in recentRequests" 
                  :key="request.id"
                  class="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div class="d-flex align-items-center mb-1">
                      <b-badge :variant="getStatusVariant(request.status)" class="mr-2">
                        {{ request.status }}
                      </b-badge>
                      <small class="text-muted">
                        {{ formatDate(request.from_date) }} - {{ formatDate(request.to_date) }}
                      </small>
                    </div>
                    <div class="small">
                      <strong>{{ request.type.name }}</strong> • 
                      {{ request.total_days }} day(s)
                      <span v-if="request.is_half_day">(Half Day)</span>
                    </div>
                  </div>
                  <b-button 
                    size="sm" 
                    variant="outline-info"
                    @click="showRequestDetails(request)"
                  >
                    <feather-icon icon="EyeIcon" size="14" />
                  </b-button>
                </b-list-group-item>
              </b-list-group>
              <div class="text-center mt-3">
                <b-button variant="outline-primary" size="sm" @click="$router.push('/create-day-off')">
                  View All Requests
                </b-button>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <feather-icon icon="FileTextIcon" size="48" class="mb-2" />
              <p>No recent leave requests</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>

      <b-col lg="6" class="mb-4">
        <b-card>
          <b-card-header>
            <h5 class="mb-0">Upcoming Approved Leaves</h5>
          </b-card-header>
          <b-card-body>
            <div v-if="upcomingLeaves.length > 0">
              <b-list-group flush>
                <b-list-group-item 
                  v-for="leave in upcomingLeaves" 
                  :key="leave.id"
                  class="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div class="mb-1">
                      <strong>{{ leave.type.name }}</strong>
                    </div>
                    <div class="small text-muted">
                      {{ formatDate(leave.from_date) }} - {{ formatDate(leave.to_date) }}
                    </div>
                    <div class="small">
                      {{ leave.total_days }} day(s)
                      <span v-if="leave.is_half_day">• Half Day ({{ leave.half_day_type }})</span>
                    </div>
                  </div>
                  <b-badge variant="primary">
                    In {{ getDaysUntilLeave(leave.from_date) }} days
                  </b-badge>
                </b-list-group-item>
              </b-list-group>
            </div>
            <div v-else class="text-center text-muted">
              <feather-icon icon="CalendarIcon" size="48" class="mb-2" />
              <p>No upcoming leaves</p>
            </div>
          </b-card-body>
        </b-card>
      </b-col>
    </b-row>

    <!-- Request Details Modal -->
    <b-modal 
      v-model="showDetailsModal" 
      :title="`Request Details - ${selectedRequest ? selectedRequest.type.name : ''}`"
      size="lg"
      ok-only
      ok-title="Close"
    >
      <div v-if="selectedRequest">
        <!-- Same details modal content as before -->
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
                    <b-badge :variant="getLeaveTypeVariant(selectedRequest.type.name)" class="ml-2">
                      {{ selectedRequest.type.name }}
                    </b-badge>
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Period:</strong> {{ formatDate(selectedRequest.from_date) }} to {{ formatDate(selectedRequest.to_date) }}
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Duration:</strong> {{ selectedRequest.total_days }} day(s)
                    <span v-if="selectedRequest.is_half_day">(Half Day - {{ selectedRequest.half_day_type }})</span>
                  </b-list-group-item>
                  <b-list-group-item>
                    <strong>Status:</strong> 
                    <b-badge :variant="getStatusVariant(selectedRequest.status)" class="ml-2">
                      {{ selectedRequest.status }}
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
                    <strong>Submitted:</strong> {{ formatDateTime(selectedRequest.created_at) }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedRequest.approved_by">
                    <strong>Approved By:</strong> {{ selectedRequest.approver ? selectedRequest.approver.name : 'N/A' }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedRequest.approved_at">
                    <strong>Approved At:</strong> {{ formatDateTime(selectedRequest.approved_at) }}
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedRequest.approval_notes">
                    <strong>Notes:</strong> {{ selectedRequest.approval_notes }}
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
            <p>{{ selectedRequest.reason }}</p>
            
            <div v-if="selectedRequest.emergency_contact">
              <strong>Emergency Contact:</strong>
              <p>{{ selectedRequest.emergency_contact }}</p>
            </div>
          </b-card-body>
        </b-card>
      </div>
    </b-modal>
  </div>
</template>

<script>
import api from "@/libs/axios";
import loading from "@/views/components/my-components/loading.vue";
import VueApexCharts from 'vue-apexcharts';

export default {
  name: 'EmployeeDayOffDashboard',
  components: {
    loading,
    VueApexChart: VueApexCharts
  },
  data() {
    return {
      employeeId: this.auth().id,
      employee: {},
      loading: false,
      statistics: {},
      leaveBalances: [],
      requestStats: {},
      recentRequests: [],
      upcomingLeaves: [],
      selectedRequest: null,
      showDetailsModal: false,
      currentYear: new Date().getFullYear(),
      
      balanceFields: [
        { key: 'type', label: 'Leave Type', sortable: true },
        { key: 'allocated', label: 'Allocated', sortable: true },
        { key: 'used', label: 'Used', sortable: true },
        { key: 'remaining', label: 'Remaining', sortable: true },
        { key: 'utilization', label: 'Utilization %', sortable: true }
      ],
      
      chartOptions: {
        chart: {
          type: 'donut',
        },
        labels: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        colors: ['#FFA500', '#28A745', '#DC3545', '#6C757D'],
        legend: {
          show: false
        },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total',
                  color: '#6C757D'
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false
        }
      }
    };
  },
  computed: {
    statusSeries() {
      if (!this.requestStats.breakdown) return [0, 0, 0, 0];
      return this.requestStats.breakdown.map(stat => stat.count);
    },
    
    utilizationClass() {
      const rate = this.statistics.utilization_rate || 0;
      if (rate >= 80) return 'text-danger';
      if (rate >= 60) return 'text-warning';
      return 'text-info';
    }
  },
  mounted() {
    this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      this.loading = true;
      try {
        const [dashboardResponse, recentResponse, upcomingResponse] = await Promise.all([
          api.get(`/employees/${this.employeeId}/day-off-dashboard`),
          api.get(`/employees/${this.employeeId}/recent-day-off-requests`),
          api.get(`/employees/${this.employeeId}/upcoming-leaves`)
        ]);
        
        const dashboardData = dashboardResponse.data.data;
        this.employee = dashboardData.employee;
        this.statistics = dashboardData.statistics;
        this.leaveBalances = dashboardData.leave_balances;
        this.requestStats = dashboardData.request_stats;
        this.recentRequests = recentResponse.data.data;
        this.upcomingLeaves = upcomingResponse.data.data;
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        this.$bvToast.toast('Error loading dashboard data', {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.loading = false;
      }
    },

    getLeaveTypeVariant(typeName) {
      const variants = {
        'Annual Leave': 'primary',
        'Sick Leave': 'info',
        'Personal Leave': 'success',
        'Emergency Leave': 'danger',
        'Vacation': 'primary',
        'Medical': 'info'
      };
      return variants[typeName] || 'secondary';
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

    getStatusColor(status) {
      const colors = {
        pending: '#FFA500',
        approved: '#28A745',
        rejected: '#DC3545',
        cancelled: '#6C757D'
      };
      return colors[status] || '#6C757D';
    },

    getProgressVariant(percentage) {
      if (percentage >= 80) return 'danger';
      if (percentage >= 60) return 'warning';
      return 'success';
    },

    getDaysUntilLeave(fromDate) {
      const today = new Date();
      const leaveDate = new Date(fromDate);
      const diffTime = leaveDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
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

    showRequestDetails(request) {
      this.selectedRequest = request;
      this.showDetailsModal = true;
    }
  }
};
</script>

<style scoped>
.stat-card {
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #2C3E50;
}

.stat-label {
  color: #6C757D;
  margin-bottom: 0;
  font-weight: 500;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.progress {
  margin-top: 5px;
}
</style>