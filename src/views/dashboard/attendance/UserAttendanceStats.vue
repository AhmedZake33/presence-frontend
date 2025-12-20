<template>
  <div class="attendance-stats-dashboard">
    <!-- Statistics Filters -->
    <b-card class="mb-4">
      <b-form @submit.prevent="loadStatistics" class="row">
        <div class="col-md-3">
          <b-form-group label="Period" label-for="period-filter">
            <b-form-select
              id="period-filter"
              v-model="statsFilters.period"
              :options="periodOptions"
              size="sm"
            ></b-form-select>
          </b-form-group>
        </div>
        
        <div class="col-md-3">
          <b-form-group label="Start Date" label-for="start-date">
            <b-form-datepicker
              id="start-date"
              v-model="statsFilters.start_date"
              :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              placeholder="Start date"
              size="sm"
            />
          </b-form-group>
        </div>
        
        <div class="col-md-3">
          <b-form-group label="End Date" label-for="end-date">
            <b-form-datepicker
              id="end-date"
              v-model="statsFilters.end_date"
              :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              placeholder="End date"
              size="sm"
            />
          </b-form-group>
        </div>
        
        <div class="col-md-3 d-flex align-items-end">
          <b-button type="submit" variant="primary" size="sm" class="mr-2">
            <feather-icon icon="FilterIcon" size="14" class="mr-1" /> Apply
          </b-button>
          <b-button @click="resetStatsFilters" variant="outline-secondary" size="sm">
            <feather-icon icon="RotateCcwIcon" size="14" class="mr-1" /> Reset
          </b-button>
        </div>
      </b-form>
    </b-card>

    <!-- Summary Statistics Cards -->
    <div class="row mb-4">
      <div class="col-md-3 mb-3">
        <b-card class="text-center h-100" bg-variant="primary" text-variant="white">
          <div class="display-4 font-weight-bold">{{ totalUsers }}</div>
          <div>Total Users</div>
          <small>Active employees in system</small>
        </b-card>
      </div>
      
      <div class="col-md-3 mb-3">
        <b-card class="text-center h-100" bg-variant="success" text-variant="white">
          <div class="display-4 font-weight-bold">{{ avgAttendanceRate }}%</div>
          <div>Avg. Attendance Rate</div>
          <small>Based on working days</small>
        </b-card>
      </div>
      
      <div class="col-md-3 mb-3">
        <b-card class="text-center h-100" bg-variant="warning" text-variant="dark">
          <div class="display-4 font-weight-bold">{{ totalLateArrivals }}</div>
          <div>Late Arrivals</div>
          <small>This period</small>
        </b-card>
      </div>
      
      <div class="col-md-3 mb-3">
        <b-card class="text-center h-100" bg-variant="info" text-variant="white">
          <div class="display-4 font-weight-bold">{{ avgWorkingHours }}</div>
          <div>Avg. Working Hours</div>
          <small>Hours per day</small>
        </b-card>
      </div>
    </div>

    <!-- Detailed Statistics Table -->
    <b-card title="User Attendance Statistics">
      <b-table
        :items="statistics"
        :fields="statisticsFields"
        :busy="loading"
        striped
        hover
        responsive
        class="mt-2"
      >
        <template #table-busy>
          <div class="text-center text-primary my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Loading...</strong>
          </div>
        </template>

        <!-- User Name with Link -->
        <template #cell(name)="data">
          <router-link :to="`/employees/${data.item.id}`" class="text-decoration-none font-weight-bold">
            {{ data.value }}
          </router-link>
          <br>
          <small class="text-muted">{{ data.item.email }}</small>
        </template>

        <!-- Attendance Rate -->
        <template #cell(attendance_rate)="data">
          <div class="d-flex align-items-center">
            <div class="progress flex-grow-1" style="height: 10px;">
              <div 
                class="progress-bar" 
                :class="{
                  'bg-success': data.value >= 90,
                  'bg-warning': data.value >= 70 && data.value < 90,
                  'bg-danger': data.value < 70
                }"
                :style="{ width: `${data.value}%` }"
              ></div>
            </div>
            <span class="ml-2 font-weight-bold">{{ data.value }}%</span>
          </div>
        </template>

        <!-- Total Days -->
        <template #cell(total_days)="data">
          <b-badge variant="info" class="p-2">
            {{ data.value }}
          </b-badge>
        </template>

        <!-- Present Days -->
        <template #cell(present_days)="data">
          <b-badge variant="success" class="p-2">
            {{ data.value }}
          </b-badge>
        </template>

        <!-- Late Days -->
        <template #cell(late_days)="data">
          <b-badge variant="warning" class="p-2">
            {{ data.value }}
          </b-badge>
        </template>

        <!-- Absent Days -->
        <template #cell(absent_days)="data">
          <b-badge variant="danger" class="p-2">
            {{ data.value }}
          </b-badge>
        </template>

        <!-- Avg. Working Hours -->
        <template #cell(avg_working_hours)="data">
          <div class="font-weight-bold text-primary">
            {{ data.value }}
          </div>
        </template>

        <!-- Actions -->
        <template #cell(actions)="data">
          <b-button-group size="sm">
            <b-button 
              variant="outline-primary" 
              @click="viewUserDetails(data.item.id)"
              title="View Details"
            >
              <feather-icon icon="EyeIcon" size="12" />
            </b-button>
            <b-button 
              variant="outline-info" 
              @click="viewUserReport(data.item.id)"
              title="View Report"
            >
              <feather-icon icon="FileTextIcon" size="12" />
            </b-button>
          </b-button-group>
        </template>
      </b-table>

      <!-- Pagination -->
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div>
          Showing {{ statistics.length }} of {{ totalStatisticsCount }} users
        </div>
        <b-pagination
          v-model="currentPage"
          :total-rows="totalStatisticsCount"
          :per-page="perPage"
          size="sm"
        ></b-pagination>
      </div>
    </b-card>

    <!-- Statistics Export Modal -->
    <b-modal
      v-model="exportStatsModal"
      title="Export Statistics"
      @ok="exportStatistics"
      ok-title="Export"
      cancel-title="Cancel"
    >
      <b-form-group label="Export Format">
        <b-form-radio-group
          v-model="exportStatsFormat"
          :options="exportStatsOptions"
          stacked
        ></b-form-radio-group>
      </b-form-group>
      
      <b-form-group label="Include Details">
        <b-form-checkbox v-model="includeDetails">
          Include detailed attendance breakdown
        </b-form-checkbox>
      </b-form-group>
      
      <div class="mt-3">
        <small class="text-muted">
          Exporting statistics for period: 
          <strong>{{ getPeriodLabel() }}</strong>
        </small>
      </div>
    </b-modal>
  </div>
</template>

<script>
import api from "@/libs/axios";
import dayjs from 'dayjs';

export default {
  name: 'UserAttendanceStats',
  data() {
    return {
      loading: false,
      statistics: [],
      totalStatisticsCount: 0,
      currentPage: 1,
      perPage: 10,
      
      // Statistics fields
      statisticsFields: [
        { key: 'name', label: 'User', sortable: true },
        { key: 'attendance_rate', label: 'Attendance Rate', sortable: true },
        { key: 'total_days', label: 'Total Days', sortable: true },
        { key: 'present_days', label: 'Present', sortable: true },
        { key: 'late_days', label: 'Late', sortable: true },
        { key: 'absent_days', label: 'Absent', sortable: true },
        { key: 'avg_working_hours', label: 'Avg. Hours', sortable: true },
        { key: 'actions', label: 'Actions' }
      ],
      
      // Filters
      statsFilters: {
        period: 'month', // 'day', 'week', 'month', 'quarter', 'year', 'custom'
        start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
        end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
      },
      
      periodOptions: [
        { value: 'day', text: 'Today' },
        { value: 'week', text: 'This Week' },
        { value: 'month', text: 'This Month' },
        { value: 'quarter', text: 'This Quarter' },
        { value: 'year', text: 'This Year' },
        { value: 'custom', text: 'Custom Range' }
      ],
      
      // Export
      exportStatsModal: false,
      exportStatsFormat: 'csv',
      exportStatsOptions: [
        { text: 'CSV (.csv)', value: 'csv' },
        { text: 'PDF (.pdf)', value: 'pdf' },
        { text: 'Excel (.xlsx)', value: 'excel' }
      ],
      includeDetails: false,
      
      // Summary stats
      totalUsers: 0,
      avgAttendanceRate: 0,
      totalLateArrivals: 0,
      avgWorkingHours: 0
    };
  },
  watch: {
    'statsFilters.period': function(newPeriod) {
      this.updateDateRange(newPeriod);
    },
    currentPage: function() {
      this.loadStatistics();
    }
  },
  mounted() {
    this.loadStatistics();
  },
  methods: {
    updateDateRange(period) {
      const today = dayjs();
      
      switch(period) {
        case 'day':
          this.statsFilters.start_date = today.format('YYYY-MM-DD');
          this.statsFilters.end_date = today.format('YYYY-MM-DD');
          break;
        case 'week':
          this.statsFilters.start_date = today.startOf('week').format('YYYY-MM-DD');
          this.statsFilters.end_date = today.endOf('week').format('YYYY-MM-DD');
          break;
        case 'month':
          this.statsFilters.start_date = today.startOf('month').format('YYYY-MM-DD');
          this.statsFilters.end_date = today.endOf('month').format('YYYY-MM-DD');
          break;
        case 'quarter':
          this.statsFilters.start_date = today.startOf('quarter').format('YYYY-MM-DD');
          this.statsFilters.end_date = today.endOf('quarter').format('YYYY-MM-DD');
          break;
        case 'year':
          this.statsFilters.start_date = today.startOf('year').format('YYYY-MM-DD');
          this.statsFilters.end_date = today.endOf('year').format('YYYY-MM-DD');
          break;
        // For custom, dates remain as they are
      }
    },
    
    loadStatistics() {
      this.loading = true;
      
      const params = {
        ...this.statsFilters,
        page: this.currentPage,
        per_page: this.perPage
      };
      
      api.get("/attendance/statistics", { params })
        .then((response) => {
          if (response.data && response.data.data) {
            this.statistics = response.data.data.statistics || [];
            this.totalStatisticsCount = response.data.data.total_count || 0;
            
            // Update summary stats
            if (response.data.data.summary) {
              this.totalUsers = response.data.data.summary.total_users || 0;
              this.avgAttendanceRate = response.data.data.summary.avg_attendance_rate || 0;
              this.totalLateArrivals = response.data.data.summary.total_late_arrivals || 0;
              this.avgWorkingHours = response.data.data.summary.avg_working_hours || 0;
            }
          }
        })
        .catch((error) => {
          console.error("Error loading statistics:", error);
          this.$bvToast.toast('Failed to load statistics', {
            title: "Error",
            variant: "danger",
            solid: true,
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },
    
    resetStatsFilters() {
      this.statsFilters = {
        period: 'month',
        start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
        end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
      };
      this.currentPage = 1;
      this.loadStatistics();
    },
    
    viewUserDetails(userId) {
      this.$router.push({
        name: 'UserAttendanceDetail',
        params: { id: userId },
        query: {
          start_date: this.statsFilters.start_date,
          end_date: this.statsFilters.end_date
        }
      });
    },
    
    viewUserReport(userId) {
      this.$router.push({
        name: 'UserReport',
        params: { id: userId },
        query: {
          start_date: this.statsFilters.start_date,
          end_date: this.statsFilters.end_date,
          format: 'pdf'
        }
      });
    },
    
    getPeriodLabel() {
      const period = this.periodOptions.find(p => p.value === this.statsFilters.period);
      if (this.statsFilters.period === 'custom') {
        return `${this.formatDate(this.statsFilters.start_date)} to ${this.formatDate(this.statsFilters.end_date)}`;
      }
      return period ? period.text : 'Custom Period';
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      return dayjs(dateString).format('DD MMM YYYY');
    },
    
    exportStatistics() {
      this.exportStatsModal = false;
      this.loading = true;
      
      const params = {
        ...this.statsFilters,
        export: true,
        format: this.exportStatsFormat,
        include_details: this.includeDetails
      };
      
      api.get("/attendance/statistics/export", { 
        params,
        responseType: 'blob' 
      })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          
          const contentDisposition = response.headers['content-disposition'];
          let filename = `attendance_statistics_${this.statsFilters.start_date}_to_${this.statsFilters.end_date}.${this.exportStatsFormat}`;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
          
          this.$bvToast.toast('Statistics exported successfully', {
            title: "Success",
            variant: "success",
            solid: true,
          });
        })
        .catch((error) => {
          console.error("Export error:", error);
          this.$bvToast.toast('Failed to export statistics', {
            title: "Error",
            variant: "danger",
            solid: true,
          });
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style scoped>
.attendance-stats-dashboard {
  padding: 20px;
}

.progress {
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  transition: width 0.6s ease;
}

.badge {
  min-width: 40px;
  font-size: 0.9em;
}

.display-4 {
  font-size: 2.5rem;
  font-weight: bold;
}

.text-center .display-4 {
  margin-bottom: 10px;
}

.card.bg-primary,
.card.bg-success,
.card.bg-warning,
.card.bg-info {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.card.bg-primary:hover,
.card.bg-success:hover,
.card.bg-warning:hover,
.card.bg-info:hover {
  transform: translateY(-5px);
}
</style>