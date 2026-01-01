<template>
  <div>
    <loading :visible="loadingStats" text="Processing..." />

    <!-- Header with Toggle and Add User Button -->
    <b-card class="mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <h4 class="mb-0">Employees Dashboard</h4>
        <div>
          <b-button 
            @click="showModal = true" 
            variant="success" 
            size="sm"
            class="mr-2"
          >
            <feather-icon icon="PlusIcon" size="14" class="mr-1" />
            Add User
          </b-button>
          <b-button 
            @click="showDetailedView = !showDetailedView" 
            variant="primary" 
            size="sm"
          >
            <feather-icon 
              :icon="showDetailedView ? 'BarChart2Icon' : 'ListIcon'" 
              size="14" 
              class="mr-1" 
            />
            {{ showDetailedView ? 'View Statistics' : 'View Details' }}
          </b-button>
        </div>
      </div>
    </b-card>

    <!-- Add User Modal -->
    <b-modal
      v-model="showModal"
      title="Add New User"
      @hidden="resetForm"
      hide-footer
      centered
    >
      <b-form @submit.prevent="submitForm" ref="userForm">
        <b-form-group 
          label="Name" 
          label-for="name"
          :state="formState.name"
          :invalid-feedback="formErrors.name || 'Name is required'"
        >
          <b-form-input
            id="name"
            v-model="form.name"
            placeholder="Enter full name"
            :state="formState.name"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group 
          label="Email" 
          label-for="email"
          :state="formState.email"
          :invalid-feedback="formErrors.email || 'Valid email is required'"
        >
          <b-form-input
            id="email"
            type="email"
            v-model="form.email"
            placeholder="Enter email address"
            :state="formState.email"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group 
          label="Type" 
          label-for="type"
          :state="formState.type"
          :invalid-feedback="formErrors.type || 'Please select user type'"
        >
          <b-form-select
            id="type"
            v-model="form.type"
            :state="formState.type"
            required
          >
            <option :value="null" disabled>Select user type</option>
            <option value="1">Admin</option>
            <option value="2">Employee</option>
            <option value="3">Manager</option>
          </b-form-select>
        </b-form-group>
        
        <b-form-group 
          v-if="form.type && form.type != '1'"
          label="Team" 
          label-for="team"
          :state="formState.team_id"
          :invalid-feedback="formErrors.team_id || 'Please select a team'"
        >
          <b-form-select
            id="team"
            v-model="form.team_id"
            :state="formState.team_id"
            :options="teamOptions"
            @change="form.team_role = null" 
          >
            <template #first>
              <b-form-select-option :value="null">Select Team (Optional)</b-form-select-option>
            </template>
          </b-form-select>
        </b-form-group>

        <b-form-group 
          v-if="form.type == '2' && form.team_id"
          label="Team Role" 
          label-for="team-role"
          :state="formState.team_role"
          :invalid-feedback="formErrors.team_role || 'Please select a role'"
        >
          <b-form-select
            id="team-role"
            v-model="form.team_role"
            :state="formState.team_role"
            :options="filteredTeamRoleOptions"
          >
            <template #first>
              <b-form-select-option :value="null">Select Role</b-form-select-option>
            </template>
          </b-form-select>
        </b-form-group>

        <b-form-group 
          label="Password" 
          label-for="password"
          :state="formState.password"
          :invalid-feedback="formErrors.password || 'Password is required'"
        >
          <b-form-input
            id="password"
            type="password"
            v-model="form.password"
            placeholder="Enter password"
            :state="formState.password"
            required
          ></b-form-input>
        </b-form-group>

        <div class="d-flex justify-content-end mt-4">
          <b-button variant="secondary" @click="showModal = false" class="mr-2">
            Cancel
          </b-button>
          <b-button type="submit" variant="primary" :disabled="submitting">
            <span v-if="submitting">
              <b-spinner small></b-spinner> Adding...
            </span>
            <span v-else>Add User</span>
          </b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Statistics View -->
    <div v-if="!showDetailedView">
      <!-- Simple Filter -->
      <b-card class="mb-3">
        <b-form @submit.prevent="loadStatistics" class="row">
          <div class="col-md-8">
            <b-form-group label="Date Range">
              <div class="d-flex">
                <b-form-datepicker
                  v-model="statsFilters.start_date"
                  placeholder="From"
                  size="sm"
                  class="mr-2"
                />
                <b-form-datepicker
                  v-model="statsFilters.end_date"
                  placeholder="To"
                  size="sm"
                />
              </div>
            </b-form-group>
          </div>
          <div class="col-md-4 d-flex align-items-center">
            <b-button type="submit" variant="primary">
              Load
            </b-button>
          </div>
        </b-form>
      </b-card>

      <!-- Stats Cards -->
      <div class="row mb-3">
        <div class="col-md-4 mb-2">
          <b-card class="text-center">
            <div class="h5 mb-1">{{ summaryStats.total_users || 0 }}</div>
            <span style="font-weight: bold">Total Users</span>
          </b-card>
        </div>
        <div class="col-md-4 mb-2">
          <b-card class="text-center">
            <div class="h5 mb-1">{{ summaryStats.avg_attendance_rate || 0 }}%</div>
            <span style="font-weight: bold">Avg. Attendance</span>
          </b-card>
        </div>
        <div class="col-md-4 mb-2">
          <b-card class="text-center">
            <div class="h5 mb-1">{{ summaryStats.avg_working_hours_per_user || '0.0' }}</div>
            <span style="font-weight: bold">Avg. Hours/User</span>
          </b-card>
        </div>
      </div>

      <!-- Stats Table with BaseTable -->
      <base-table
        title="User Statistics"
        :items="statistics"
        :fields="statisticsFields"
        :busy="loadingStats"
        :add="false"
        :pagination="true"
        :per-page="statsPerPage"
        :current-page="statsCurrentPage"
        :total-rows="statsTotalRows"
        @page-changed="handleStatsPageChange"
        @per-page-changed="handleStatsPerPageChange"
      >
        <template #cell(name)="data">
          <router-link 
            :to="`/employees/${data.item.id}`" 
            class="text-decoration-none text-primary"
          >
            <strong>{{ data.value }}</strong>
          </router-link>
          <br>
          <small class="text-muted">{{ data.item.email }}</small>
        </template>

        <template #cell(attendance_rate)="data">
          <b-badge :variant="getRateVariant(data.value)">
            {{ data.value }}%
          </b-badge>
        </template>

        <template #cell(present_days)="data">
          {{ data.value }}
        </template>

        <template #cell(late_days)="data">
          {{ data.value }}
        </template>

        <template #cell(absent_days)="data">
          {{ data.value }}
        </template>

        <template #cell(avg_working_hours)="data">
          {{ data.value }}
        </template>
      </base-table>
    </div>

    <!-- Detailed View -->
    <div v-else>
      <!-- Simple Filter -->
      <b-card class="mb-3">
        <b-form @submit.prevent="getAllUser" class="row">
          <div class="col-md-8">
            <b-form-group label="Select Date">
              <b-form-datepicker
                v-model="filters.date"
                placeholder="Pick a date"
                size="sm"
              />
            </b-form-group>
          </div>
          <div class="col-md-4 d-flex align-items-center">
            <b-button type="submit" variant="primary"  class="mr-2">
              Search
            </b-button>
            <b-button @click="resetFilters" variant="outline-secondary" >
              Clear
            </b-button>
          </div>
        </b-form>
      </b-card>

      <!-- Daily Records -->
      <div v-if="filters.date">
        <base-table
          :title="'Attendance for ' + formatDate(filters.date)"
          :items="users"
          :fields="dailyFields"
          :add="false"
          :pagination="true"
          :per-page="dailyPerPage"
          :current-page="dailyCurrentPage"
          :total-rows="dailyTotalRows"
          @page-changed="handleDailyPageChange"
          @per-page-changed="handleDailyPerPageChange"
        >
          <template #cell(name)="data">
            <router-link 
              :to="`/employees/${data.item.id}`" 
              class="text-decoration-none text-primary"
            >
              <strong>{{ data.value }}</strong>
            </router-link>
          </template>

          <template #cell(check_in)="data">
            <div v-if="data.item.check_in">
              {{ data.item.check_in.time }}
              <b-badge :variant="getStatusVariant(data.item.check_in.status)" size="sm" class="ml-1">
                {{ data.item.check_in.status }}
              </b-badge>
            </div>
            <div v-else class="text-muted">-</div>
          </template>

          <template #cell(check_out)="data">
            <div v-if="data.item.check_out">
              {{ data.item.check_out.time }}
              <b-badge :variant="getStatusVariant(data.item.check_out.status)" size="sm" class="ml-1">
                {{ data.item.check_out.status }}
              </b-badge>
            </div>
            <div v-else class="text-muted">-</div>
          </template>
        </base-table>
      </div>

      <!-- All Records -->
      <div v-else>
        <!-- Users List -->
        <b-card>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">All Attendance Records</h5>
            <div class="d-flex align-items-center">
              <span class="mr-2 text-muted">Show users:</span>
              <b-form-select 
                v-model="usersPerPage" 
                :options="pageOptions" 
                size="sm" 
                class="mr-2"
                style="width: 80px;"
                @change="handleUsersPerPageChange"
              ></b-form-select>
            </div>
          </div>
          
          <!-- Paginated Users List -->
          <div v-for="user in users" :key="user.id" class="mb-4">
            <b-card class="mb-2">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 class="mb-0">
                    <router-link 
                      :to="`/employees/${user.id}`" 
                      class="text-decoration-none text-primary"
                    >
                      {{ user.name }}
                    </router-link>
                  </h6>
                  <small class="text-muted">{{ user.email }}</small>
                </div>
                <b-badge variant="info">
                  {{ user.total_attendances || 0 }} records
                </b-badge>
              </div>
              
              <div v-if="user.attendances && user.attendances.length > 0">
                <!-- User's Attendance Records with BaseTable -->
                <base-table
                  :title="user.name + ' - Attendance Records'"
                  :items="user.attendances"
                  :fields="recordFields"
                  :add="false"
                  :pagination="true"
                  :per-page="recordsPerPage"
                  :current-page="userPages[user.id] || 1"
                  :total-rows="user.attendances.length"
                  @page-changed="setUserPage(user.id, $event)"
                  @per-page-changed="recordsPerPage = $event"
                  small
                >
                  <template #cell(date)="data">
                    {{ formatDate(data.value) }}
                  </template>
                  <template #cell(type)="data">
                    <b-badge :variant="data.value === 'in' ? 'success' : 'danger'">
                      {{ data.value }}
                    </b-badge>
                  </template>
                  <template #cell(status)="data">
                    <b-badge :variant="getStatusVariant(data.value)" size="sm">
                      {{ data.value }}
                    </b-badge>
                  </template>
                </base-table>
              </div>
              <div v-else class="text-muted text-center py-3">
                No attendance records found for this user
              </div>
            </b-card>
          </div>
          
          <!-- Users Pagination -->
          <div class="d-flex justify-content-center mt-4">
            <b-pagination
              v-model="usersCurrentPage"
              :total-rows="usersTotalRows"
              :per-page="usersPerPage"
              size="sm"
              pills
              @input="handleUsersPageChange"
            ></b-pagination>
          </div>
          
          <div v-if="usersTotalRows === 0" class="text-center text-muted py-5">
            <feather-icon icon="UsersIcon" size="48" class="mb-3" />
            <h5>No users found</h5>
            <p>Try adjusting your filters or add new users</p>
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import BaseTable from '@/views/components/my-components/table.vue'
import api from "@/libs/axios";
import loading from "@/views/components/my-components/loading.vue";
import dayjs from 'dayjs';

export default {
  name: 'AttendanceDashboard',
  components: { 
    BaseTable,
    loading
  },
  data() {
    return {
      // Add User Modal
      showModal: false,
      submitting: false,
      form: {
        name: '',
        email: '',
        type: null,
        team_id: null,
        team_role: null,
        password: ''
      },
      formState: {
        name: null,
        email: null,
        type: null,
        team_id: null,
        team_role: null,
        password: null
      },
      formErrors: {
        name: null,
        email: null,
        type: null,
        team_id: null,
        team_role: null,
        password: null
      },
      
      teams: [],
      teamRoleOptions: [
        { value: 'manager', text: 'Manager' },
        { value: 'team_lead', text: 'Team Lead' },
        { value: 'senior', text: 'Senior' },
        { value: 'junior', text: 'Junior' },
        { value: 'fresh', text: 'Fresh'}
      ],
      
      // View Toggle
      showDetailedView: true,
      
      // Statistics
      loadingStats: false,
      statistics: [],
      summaryStats: {
        total_users: 0,
        avg_attendance_rate: 0,
        total_late_arrivals: 0,
        avg_working_hours: 0
      },
      
      // Statistics Pagination
      statsCurrentPage: 1,
      statsPerPage: 10,
      statsTotalRows: 0,
      
      // Daily Records Pagination
      dailyCurrentPage: 1,
      dailyPerPage: 10,
      dailyTotalRows: 0,
      
      // Users List Pagination
      usersCurrentPage: 1,
      usersPerPage: 10,
      usersTotalRows: 0,
      
      // Attendance Records Pagination
      recordsPerPage: 10,
      userPages: {}, // Store current page for each user's records
      
      // Page Options
      pageOptions: [5, 10, 25, 50, 100],
      
      // Filters
      statsFilters: {
        start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
        end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
        page: 1,
        per_page: 10
      },
      
      // Table Fields
      statisticsFields: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'attendance_rate', label: 'Rate %', sortable: true },
        { key: 'present_days', label: 'Present', sortable: true },
        // { key: 'late_days', label: 'Late', sortable: true },
        { key: 'absent_days', label: 'Absent', sortable: true },
        { key: 'avg_working_hours', label: 'Avg Hours', sortable: true }
      ],
      dailyFields: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'check_in', label: 'Check In' },
        { key: 'check_out', label: 'Check Out' },
        { key: 'working_hours', label: 'Total Hours', sortable: true }
      ],
      recordFields: [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'time', label: 'Time', sortable: true },
        { key: 'type', label: 'Type', sortable: true },
        { key: 'status', label: 'Status', sortable: true }
      ],
      
      // Data
      users: [],
      loading: false,
      summary: null,
      filters: {
        date: new Date().toISOString().split('T')[0],
        page: 1,
        per_page: 10
      },
    }
  },
  computed: {
    teamOptions() {
      return this.teams.map(team => ({
        value: team.id,
        text: team.name
      }));
    },
    filteredTeamRoleOptions() {
      // If user is employee (type 2), hide 'manager' role
      if (this.form.type == '2') {
        return this.teamRoleOptions.filter(role => role.value !== 'manager');
      }
      return this.teamRoleOptions;
    }
  },
  mounted(){
    this.loadStatistics();
    this.getAllUser();
    this.loadTeams();
  },
  methods: {
    // Add User Methods
    validateForm() {
      let isValid = true;
      
      
      // Validate name
      this.formErrors.name = null;
      if (!this.form.name || this.form.name.length < 2) {
        this.formState.name = false;
        this.formErrors.name = "Name must be at least 2 characters";
        isValid = false;
      } else {
        this.formState.name = true;
      }
      
      // Validate email
      this.formErrors.email = null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email || !emailRegex.test(this.form.email)) {
        this.formState.email = false;
        this.formErrors.email = "Please enter a valid email address";
        isValid = false;
      } else {
        this.formState.email = true;
      }
      
      // Validate type
      this.formErrors.type = null;
      if (!this.form.type) {
         this.formState.type = false;
         this.formErrors.type = "Please select a user type";
         isValid = false;
      } else {
         this.formState.type = true;
      }

      // Validate Team (Optional - just reset state)
      // If you want it required, add logic here. For now it's optional.
      this.formState.team_id = null;
      this.formErrors.team_id = null;
      
      // Validate Team Role if Team is selected and User Type is Employee
      if (this.form.type == '2' && this.form.team_id) {
        if (!this.form.team_role) {
          this.formState.team_role = false;
          this.formErrors.team_role = "Role is required for employees when assigning a team";
          isValid = false;
        } else {
          this.formState.team_role = true;
          this.formErrors.team_role = null;
        }
      } else {
        this.formState.team_role = null;
        this.formErrors.team_role = null;
      }

      // Validate password
      this.formErrors.password = null;
      if (!this.form.password || this.form.password.length < 6) {
        this.formState.password = false;
        this.formErrors.password = "Password must be at least 6 characters";
        isValid = false;
      } else {
        this.formState.password = true;
      }
      
      return isValid;
    },
    
    submitForm() {
      if (!this.validateForm()) {
        this.$bvToast.toast('Please fix the form errors', {
          title: "Validation Error",
          variant: "warning",
          solid: true,
        });
        return;
      }
      
      this.submitting = true;
      
      // Build form data
      const formData = {
        ...this.form,
        type: parseInt(this.form.type)
      };

      // Admin (type 1) should not have team info
      if (formData.type === 1) {
        formData.team_id = null;
        formData.team_role = null;
      }
      
      // Manager (type 3) automatically gets 'manager' role
      if (formData.type === 3) {
        formData.team_role = 'manager';
      }
      
      api.post("/users", formData)
        .then((response) => {
          this.$bvToast.toast('User added successfully', {
            title: "Success",
            variant: "success",
            solid: true,
          });
          this.showModal = false;
          this.resetForm();
          // Refresh data
          this.loadStatistics();
          if (this.showDetailedView) {
            this.getAllUser();
          }
        })

        .catch((error) => {
          let errorMsg = 'Error adding user';
          if (error.response?.data?.errors) {
            // Handle Laravel validation errors
            const errors = error.response.data.errors;
            errorMsg = "Please check the form for errors";
            
            // Map errors to form fields
            Object.keys(errors).forEach(key => {
                if (this.formState.hasOwnProperty(key)) {
                    this.formState[key] = false;
                    this.formErrors[key] = errors[key][0];
                }
            });
          } else if (error.response?.data?.message) {
            errorMsg = error.response.data.message;
          } else if (error.response?.data?.error) {
            errorMsg = error.response.data.error;
          }
          
          this.$bvToast.toast(errorMsg, {
            title: "Error",
            variant: "danger",
            solid: true,
          });
        })
        .finally(() => {
          this.submitting = false;
        });
    },
    
    resetForm() {
      this.form = {
        name: '',
        email: '',
        type: null,
        team_id: null,
        team_role: null,
        password: ''
      };
      this.formState = {
        name: null,
        email: null,
        type: null,
        team_id: null,
        team_role: null,
        password: null
      };
      this.formErrors = {
        name: null,
        email: null,
        type: null,
        team_id: null,
        team_role: null,
        password: null
      };
    },
    
    loadTeams() {
      api.get("/teams")
        .then((response) => {
           if (response.data && response.data.data) {
             // Handle paginated or plain response
             this.teams = Array.isArray(response.data.data) 
               ? response.data.data 
               : (response.data.data.data || []);
           } else {
             this.teams = response.data || [];
           }
        })
        .catch((error) => {
          console.error("Error loading teams:", error);
        });
    },
    
    // Statistics Methods with Server-side Pagination
    loadStatistics() {
      this.loadingStats = true;
      
      // Update pagination params
      this.statsFilters.page = this.statsCurrentPage;
      this.statsFilters.per_page = this.statsPerPage;
      
      console.log('Loading statistics with params:', this.statsFilters);
      
      api.get("/attendance/statistics", { params: this.statsFilters })
        .then((response) => {
          console.log('Statistics response:', response.data);
          if (response.data?.data) {
            this.statistics = response.data.data.statistics || [];
            
            // Update total rows from server response
            if (response.data.data.total_count !== undefined) {
              this.statsTotalRows = response.data.data.total_count;
            } else if (response.data.data.summary?.total_users) {
              this.statsTotalRows = response.data.data.summary.total_users;
            } else {
              this.statsTotalRows = this.statistics.length;
            }
            
            if (response.data.data.summary) {
              this.summaryStats = response.data.data.summary;
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
          this.loadingStats = false;
        });
    },
    
    handleStatsPageChange(page) {
      console.log('Stats page changed to:', page);
      this.statsCurrentPage = page;
      this.loadStatistics(); // Reload data for new page
    },
    
    handleStatsPerPageChange(perPage) {
      console.log('Stats per page changed to:', perPage);
      this.statsPerPage = perPage;
      this.statsCurrentPage = 1; // Reset to first page
      this.loadStatistics(); // Reload data with new per page
    },
    
    getRateVariant(rate) {
      if (rate >= 90) return 'success';
      if (rate >= 70) return 'warning';
      return 'danger';
    },
    
    // Detailed View Methods with Server-side Pagination
    resetFilters() {
      this.filters.date = null;
      this.filters.page = 1;
      this.dailyCurrentPage = 1;
      this.usersCurrentPage = 1;
      this.getAllUser();
    },
    
    getAllUser(page = 1, perPage = 10){
      this.load = true;
      this.loadingStats = true;

      // Determine which pagination to use based on view
      if (this.filters.date) {
        // Daily view - use daily pagination
        this.filters.page = this.dailyCurrentPage;
        this.filters.per_page = this.dailyPerPage;
      } else {
        // All records view - use users pagination
        this.filters.page = this.usersCurrentPage;
        this.filters.per_page = this.usersPerPage;
      }
      
      const params = { ...this.filters };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      console.log('Getting users with params:', params);
      
      api.get("/attendance/daily", { params })
        .then((response) => {
          console.log('Users response:', response.data);
          if (response.data?.data) {
            this.users = response.data.data.records || [];
            this.summary = response.data.data.summary || null;
            
            // Update total rows from server response
            if (this.filters.date) {
              // For daily view
              if (response.data.data.summary?.total_users !== undefined) {
                this.dailyTotalRows = response.data.data.summary.total_users;
              } else if (response.data.data.summary?.checked_in !== undefined) {
                this.dailyTotalRows = response.data.data.summary.checked_in;
              } else {
                this.dailyTotalRows = this.users.length;
              }
              this.usersTotalRows = 0; // Reset users total for daily view
            } else {
              // For all records view
              if (response.data.data.summary?.total_users !== undefined) {
                this.usersTotalRows = response.data.data.summary.total_users;
              } else if (response.data.data.summary?.users_with_attendance !== undefined) {
                this.usersTotalRows = response.data.data.summary.users_with_attendance;
              } else {
                this.usersTotalRows = this.users.length;
              }
              this.dailyTotalRows = 0; // Reset daily total for all records view
            }
            
            // Initialize user pages for attendance records (for all records view)
            if (!this.filters.date) {
              this.userPages = {};
              this.users.forEach(user => {
                if (user.id) {
                  this.userPages[user.id] = 1;
                }
              });
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching attendance:", error);
          this.$bvToast.toast('Failed to load attendance data', {
            title: "Error",
            variant: "danger",
            solid: true,
          });
        })
        .finally(() => {
          this.load = false;
          this.loadingStats = false;
        });
    },
    
    handleDailyPageChange(page) {
      console.log('Daily page changed to:', page);
      this.dailyCurrentPage = page;
      this.getAllUser(); // Reload data for new page
    },
    
    handleDailyPerPageChange(perPage) {
      console.log('Daily per page changed to:', perPage);
      this.dailyPerPage = perPage;
      this.dailyCurrentPage = 1; // Reset to first page
      this.getAllUser(); // Reload data with new per page
    },
    
    // Users List Pagination for All Records View
    handleUsersPageChange(page) {
      console.log('Users page changed to:', page);
      this.usersCurrentPage = page;
      if (!this.filters.date) {
        this.getAllUser(); // Reload users for new page
      }
    },
    
    handleUsersPerPageChange(perPage) {
      console.log('Users per page changed to:', perPage);
      this.usersPerPage = perPage;
      this.usersCurrentPage = 1; // Reset to first page
      if (!this.filters.date) {
        this.getAllUser(); // Reload users with new per page
      }
    },
    
    // Set individual user page for attendance records
    setUserPage(userId, page) {
      console.log(`Setting page for user ${userId} to ${page}`);
      this.$set(this.userPages, userId, page);
      // Note: User attendance records pagination is client-side
      // since we already have all records for that user
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      return dayjs(dateString).format('DD/MM/YYYY');
    },
    
    getStatusVariant(status) {
      if (!status) return 'secondary';
      switch(status.toLowerCase()) {
        case 'on_time': return 'success';
        case 'late': return 'warning';
        case 'early': return 'info';
        case 'absent': return 'danger';
        default: return 'secondary';
      }
    }
  },
  watch: {
    'filters.date': function(newDate) {
      console.log('Date filter changed:', newDate);
      // Reset pagination when date changes
      this.dailyCurrentPage = 1;
      this.usersCurrentPage = 1;
      this.getAllUser();
    },
    // Watch for changes in stats filters and reload
    statsFilters: {
      handler() {
        // We'll handle reload in the specific filter submit methods
      },
      deep: true
    },
    'statsFilters.start_date' : function(newDate) {
      this.loadStatistics();
    },
    'statsFilters.end_date' : function(newDate) {
      this.loadStatistics();
    },
  }
}
</script>

<style scoped>
/* Simple styling */
.card {
  border: 1px solid #e0e0e0;
}

.table-sm td, .table-sm th {
  padding: 0.5rem;
}

.badge {
  font-size: 0.8em;
  padding: 0.25em 0.5em;
}

/* Button spacing */
.mr-2 {
  margin-right: 0.5rem;
}

/* Link styling */
.text-decoration-none {
  text-decoration: none !important;
}

.text-primary:hover {
  text-decoration: underline;
}

/* Pagination styling */
.page-item.active .page-link {
  background-color: #007bff;
  border-color: #007bff;
}

.page-link {
  color: #007bff;
}

/* Form validation */
.is-invalid {
  border-color: #dc3545;
}

.is-valid {
  border-color: #28a745;
}

/* Responsive */
@media (max-width: 768px) {
  .h5 {
    font-size: 1.1rem;
  }
  
  .card {
    margin-bottom: 0.5rem;
  }
  
  .d-flex.justify-content-between {
    flex-direction: column;
  }
  
  .d-flex.justify-content-between > div {
    margin-bottom: 10px;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>