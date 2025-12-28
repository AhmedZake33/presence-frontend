<template>
  <div>
    <loading :visible="loading" text="Processing..." />
    <b-card>
      <b-row>
        <b-col>
          <div class="d-flex align-items-center">
            <b-avatar
              :text="getInitials(employee.name)"
              size="lg"
              variant="primary"
              class="mr-3"
            />
            <div>
              <h4 class="mb-1">
                {{ employee.name }}
                <!-- User Type Badge -->
                <b-badge 
                  :variant="getUserTypeVariant(employee.user_type)"
                  class="ml-2"
                  v-if="employee.user_type"
                >
                  {{ formatUserType(employee.user_type) }}
                </b-badge>
                
                <!-- Team Lead/Manager Badge if applicable -->
                <b-badge 
                  variant="info"
                  class="ml-1"
                  v-if="employee.is_team_lead"
                >
                  Team Lead
                </b-badge>
                
              </h4>
              <div class="text-muted">
                {{ employee.email }}
              </div>
              <div class="text-muted small mt-1" v-if="employee.position">
                <feather-icon icon="BriefcaseIcon" size="14" class="mr-1" />
                {{ employee.position }}
              </div>
              <div class="text-muted small" v-if="employee.department">
                <feather-icon icon="BuildingIcon" size="14" class="mr-1" />
                {{ employee.department }}
              </div>
            </div>
          </div>
        </b-col>
        <b-col cols="auto">
          <!-- Assign to Team Button -->
          <b-button 
            variant="primary" 
            @click="showAssignTeamModalFn"
            class="mr-2"
          >
            <feather-icon icon="UsersIcon" class="mr-1" />
            {{ teams.length > 0 ? 'Manage Teams' : 'Assign to Team' }}
          </b-button>

          <!-- Only show Add Day Off button for employees, not for viewing own profile -->
          <!--<b-button 
            variant="primary" 
            @click="showAddDayOffModal"
            v-if="!isViewingOwnProfile && employee.user_type !== 'manager'"
          >
            <feather-icon icon="PlusIcon" class="mr-1" />
            Add Day Off
          </b-button>
          -->

          <!-- Edit Profile Button -->
          <b-button 
            variant="outline-secondary" 
            @click="editProfile"
            class="ml-2"
            v-if="canEditProfile"
          >
            <feather-icon icon="EditIcon" class="mr-1" />
            Edit Profile
          </b-button>
        </b-col>
      </b-row>
      
      <!-- User Info Row -->
      <b-row class="mt-3">
        <b-col md="3">
          <div class="small text-muted">User Type</div>
          <div class="font-weight-bold">
            {{ formatUserType(employee.user_type) || 'Not specified' }}
          </div>
        </b-col>
        <b-col md="3">
          <div class="small text-muted">Joined</div>
          <div class="font-weight-bold">{{ formatDate(employee.created_at) }}</div>
        </b-col>
        <b-col md="3">
          <div class="small text-muted">Total Teams</div>
          <div class="font-weight-bold">{{ teams.length }}</div>
        </b-col>
        <b-col md="3">
          <div class="small text-muted">Status</div>
          <div>
            <b-badge :variant="employee.is_active ? 'success' : 'danger'">
              {{ employee.is_active ? 'Active' : 'Inactive' }}
            </b-badge>
          </div>
        </b-col>
      </b-row>
    </b-card>

    <!-- Teams Section (if user is in teams) -->
    <b-card class="mt-4" v-if="teams && teams.length > 0">
      <b-card-header>
        <h5 class="mb-0">Team Membership</h5>
        <div class="small text-muted">
          Member of {{ teams.length }} team(s)
        </div>
      </b-card-header>
      <b-card-body>
        <b-row>
          <b-col md="4" v-for="team in teams" :key="team.id" class="mb-3">
            <b-card no-body class="team-card h-100">
              <b-card-body>
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1">{{ team.name }}</h6>
                    <small class="text-muted d-block">{{ team.code }}</small>
                    <small class="text-muted" v-if="team.description">
                      {{ team.description }}
                    </small>
                  </div>
                  <b-badge :variant="getRoleVariant(team.pivot.role)">
                    {{ formatRole(team.pivot.role) }}
                  </b-badge>
                </div>
                <div class="mt-3">
                  <small class="text-muted d-block">
                    <feather-icon icon="CalendarIcon" size="12" class="mr-1" />
                    Joined: {{ formatDate(team.pivot.joined_date) }}
                  </small>
                  <small class="text-muted d-block mt-1">
                    <feather-icon icon="UserIcon" size="12" class="mr-1" />
                    {{ team.members_count || 0 }} members
                  </small>
                </div>
              </b-card-body>
              <b-card-footer class="py-2" v-if="canAssignToTeam">
                <b-button 
                  variant="outline-danger" 
                  size="sm" 
                  block
                  @click="removeFromTeam(team)"
                >
                  <feather-icon icon="TrashIcon" size="12" class="mr-1" />
                  Remove from Team
                </b-button>
              </b-card-footer>
            </b-card>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>

    <!-- Day Off Section -->
    <b-card class="mt-4">
      <b-card-header>
        <h5 class="mb-0">Day Off Requests</h5>
        <div class="small text-muted">
          Total: {{ dayOffTotalRows }} requests
          <span v-if="employee.user_type === 'manager'" class="ml-3 text-info">
            <feather-icon icon="InfoIcon" size="12" class="mr-1" />
            Manager - Can approve/reject requests
          </span>
        </div>
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
          <!-- Employee Column (only show for managers viewing others) -->
          <template #cell(employee)="data" v-if="employee.user_type === 'manager' && !isViewingOwnProfile">
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
          </template>

          <template #cell(actions)="data">
            <b-button-group size="sm">
              <!-- Approve Button - only for managers/pending requests -->
              <b-button 
                v-if="data.item.status === 'pending' && (employee.user_type === 'manager' || isAdmin)"
                variant="success" 
                @click="approveDayOff(data.item)"
                v-b-tooltip.hover title="Approve"
              >
                <feather-icon icon="CheckIcon" />
              </b-button>
              
              <!-- Reject Button - only for managers/pending requests -->
              <b-button 
                v-if="data.item.status === 'pending' && (employee.user_type === 'manager' || isAdmin)"
                variant="danger" 
                @click="showRejectDayOffModal(data.item)"
                v-b-tooltip.hover title="Reject"
              >
                <feather-icon icon="XIcon" />
              </b-button>

              <!-- View Details Button -->
              <b-button 
                variant="info" 
                @click="showDayOffDetails(data.item)"
                v-b-tooltip.hover title="View Details"
              >
                <feather-icon icon="EyeIcon" />
              </b-button>

              <!-- Delete Button - only for own pending requests -->
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
        <div class="small text-muted">
          Showing {{ attendanceTotalRows }} attendance records
        </div>
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
            <b-badge 
              v-if="data.item.check_in_status === 'late'"
              variant="warning"
              class="ml-1"
            >
              Late
            </b-badge>
          </template>

          <template #cell(check_out)="data">
            {{ data.item.check_out || '—' }}
            <b-badge 
              v-if="data.item.check_out_status === 'early'"
              variant="info"
              class="ml-1"
            >
              Early
            </b-badge>
          </template>

          <template #cell(hours)="data">
            {{ data.item.hours !== null ? data.item.hours : '—' }}
          </template>
        </BaseTable>
      </b-card-body>
    </b-card>

    <!-- Assign to Team Modal -->
    <b-modal 
      v-model="showAssignTeamModal" 
      :title="`Assign ${employee.name} to Teams`" 
      @ok="assignToTeams"
      @hidden="resetTeamForm"
      size="lg"
      :ok-disabled="teamForm.selectedTeams.length === 0 || teamForm.loading"
    >
      <b-form>
        <!-- Loading Indicator -->
        <div v-if="teamForm.loadingTeams" class="text-center p-4">
          <b-spinner small class="mr-2"></b-spinner>
          Loading available teams...
        </div>

        <!-- Team Selection -->
        <b-form-group 
          label="Select Teams:" 
          label-for="team-select"
          v-if="!teamForm.loadingTeams"
        >
          <b-form-select
            id="team-select"
            v-model="teamForm.selectedTeams"
            :options="availableTeams"
            multiple
            :select-size="Math.min(availableTeams.length, 8)"
            value-field="id"
            text-field="name"
            class="team-select-container"
          >
            <template #first>
              <option :value="null" disabled>Select teams...</option>
            </template>
          </b-form-select>
          <small class="text-muted d-block mt-1">
            Hold Ctrl (or Cmd on Mac) to select multiple teams
          </small>
          <small class="text-muted d-block mt-1" v-if="availableTeams.length === 0">
            No teams available. Please create teams first.
          </small>
        </b-form-group>

        <!-- Role Selection for Each Selected Team -->
        <div v-if="teamForm.selectedTeams.length > 0 && !teamForm.loadingTeams" class="mt-4">
          <h6>Team Roles:</h6>
          <div class="team-role-selection">
            <b-card 
              v-for="teamId in teamForm.selectedTeams" 
              :key="teamId" 
              class="mb-2 team-card-assign"
            >
              <b-card-body class="py-3">
                <b-row class="align-items-center">
                  <b-col md="6">
                    <div>
                      <strong>{{ getTeamName(teamId) }}</strong>
                      <br>
                      <small class="text-muted">{{ getTeamCode(teamId) }}</small>
                    </div>
                  </b-col>
                  <b-col md="6">
                    <b-form-group label="Role:" label-cols="4" class="mb-0">
                      <b-form-select
                        v-model="teamForm.teamRoles[teamId]"
                        :options="teamRoleOptions"
                        size="sm"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>
              </b-card-body>
            </b-card>
          </div>
        </div>

        <!-- Current Team Memberships -->
        <div v-if="teams.length > 0 && !teamForm.loadingTeams" class="mt-4">
          <h6>Current Team Memberships:</h6>
          <b-list-group class="mt-2">
            <b-list-group-item 
              v-for="team in teams" 
              :key="team.id"
              class="d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>{{ team.name }}</strong>
                <br>
                <small class="text-muted">Role: {{ formatRole(team.pivot.role) }}</small>
                <small class="text-muted d-block">Joined: {{ formatDate(team.pivot.joined_date) }}</small>
              </div>
              <div>
                <b-badge :variant="getRoleVariant(team.pivot.role)" class="mr-2">
                  {{ formatRole(team.pivot.role) }}
                </b-badge>
                <b-button
                  variant="outline-danger"
                  size="sm"
                  @click="removeFromTeam(team)"
                  v-b-tooltip.hover title="Remove from team"
                >
                  <feather-icon icon="TrashIcon" size="14" />
                </b-button>
              </div>
            </b-list-group-item>
          </b-list-group>
          <small class="text-muted d-block mt-2">
            Note: Selecting teams above will replace all current team memberships
          </small>
        </div>
      </b-form>
      
      <template #modal-footer="{ ok, cancel }">
        <b-button variant="secondary" @click="cancel" :disabled="teamForm.loading">
          Cancel
        </b-button>
        <b-button 
          variant="primary" 
          @click="ok"
          :disabled="teamForm.selectedTeams.length === 0 || teamForm.loading"
        >
          <b-spinner small v-if="teamForm.loading" class="mr-2"></b-spinner>
          {{ teams.length > 0 ? 'Update Teams' : 'Assign to Teams' }}
        </b-button>
      </template>
    </b-modal>

    <!-- Add Day Off Modal -->
    <b-modal v-model="showAddModal" title="Add Day Off" @ok="addDayOff" @hidden="resetDayOffForm">
      <b-form>
        <b-form-group label="Leave Type:" label-for="leave-type">
          <b-form-select
            id="leave-type"
            v-model="dayOffForm.day_off_type_id"
            :options="leaveTypeOptions"
            required
          />
        </b-form-group>

        <b-row>
          <b-col md="6">
            <b-form-group label="From Date:" label-for="from-date">
              <b-form-input
                id="from-date"
                v-model="dayOffForm.from_date"
                type="date"
                :min="minDate"
                required
                @change="onDateChange"
              />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="To Date:" label-for="to-date">
              <b-form-input
                id="to-date"
                v-model="dayOffForm.to_date"
                type="date"
                :min="dayOffForm.from_date || minDate"
                required
                @change="onDateChange"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <!-- Duration Display -->
        <div class="alert alert-info" v-if="calculatedDays > 0">
          <strong>Duration:</strong> {{ calculatedDays }} day(s)
          <span v-if="selectedLeaveTypeName"> for {{ selectedLeaveTypeName }}</span>
        </div>

        <!-- Duration Options (only show for single day) -->
        <b-form-group v-if="showDurationOptions">
          <b-form-checkbox
            v-model="dayOffForm.is_half_day"
            @change="onHalfDayChange"
          >
            Half Day
          </b-form-checkbox>

          <b-form-group
            v-if="dayOffForm.is_half_day"
            label="Half Day Type:"
            label-for="half-day-type"
            class="ml-4 mt-2"
          >
            <b-form-radio-group
              id="half-day-type"
              v-model="dayOffForm.half_day_type"
              :options="halfDayOptions"
              required
            />
          </b-form-group>
        </b-form-group>

        <b-form-group label="Reason:" label-for="reason">
          <b-form-textarea
            id="reason"
            v-model="dayOffForm.reason"
            rows="3"
            placeholder="Enter reason for leave..."
            required
          />
        </b-form-group>

        <b-form-group label="Emergency Contact:" label-for="emergency-contact">
          <b-form-input
            id="emergency-contact"
            v-model="dayOffForm.emergency_contact"
            placeholder="Emergency contact number"
          />
        </b-form-group>
      </b-form>
    </b-modal>

    <!-- Reject Day Off Modal -->
    <b-modal v-model="showRejectModal" title="Reject Day Off Request" @ok="rejectDayOff">
      <b-form>
        <b-form-group label="Rejection Reason:" label-for="reject-reason">
          <b-form-textarea
            id="reject-reason"
            v-model="rejectForm.reason"
            rows="4"
            placeholder="Please provide a reason for rejection..."
            required
          />
        </b-form-group>
      </b-form>
    </b-modal>

    <!-- Day Off Details Modal -->
    <b-modal v-model="showDetailsModal" :title="`Day Off Details - ${selectedDayOff ? selectedDayOff.type.name : ''}`" size="lg" ok-only>
      <div v-if="selectedDayOff">
        <b-row>
          <b-col md="6">
            <b-card no-body class="mb-3">
              <b-card-header class="py-2">
                <h6 class="mb-0">Request Information</h6>
              </b-card-header>
              <b-card-body>
                <b-list-group flush>
                  <b-list-group-item class="d-flex justify-content-between">
                    <span class="font-weight-bold">Dates:</span>
                    <span>{{ formatDate(selectedDayOff.from_date) }} to {{ formatDate(selectedDayOff.to_date) }}</span>
                  </b-list-group-item>
                  <b-list-group-item class="d-flex justify-content-between">
                    <span class="font-weight-bold">Duration:</span>
                    <span>
                      {{ selectedDayOff.total_days }} day(s)
                      <span v-if="selectedDayOff.is_half_day">(Half Day - {{ selectedDayOff.half_day_type }})</span>
                    </span>
                  </b-list-group-item>
                  <b-list-group-item class="d-flex justify-content-between">
                    <span class="font-weight-bold">Status:</span>
                    <span>
                      <b-badge :variant="getStatusVariant(selectedDayOff.status)">
                        {{ selectedDayOff.status }}
                      </b-badge>
                    </span>
                  </b-list-group-item>
                  <b-list-group-item class="d-flex justify-content-between">
                    <span class="font-weight-bold">Requested On:</span>
                    <span>{{ formatDateTime(selectedDayOff.created_at) }}</span>
                  </b-list-group-item>
                </b-list-group>
              </b-card-body>
            </b-card>
          </b-col>
          <b-col md="6">
            <b-card no-body class="mb-3">
              <b-card-header class="py-2">
                <h6 class="mb-0">Employee Information</h6>
              </b-card-header>
              <b-card-body>
                <b-list-group flush>
                  <b-list-group-item class="d-flex justify-content-between">
                    <span class="font-weight-bold">Employee:</span>
                    <span>{{ selectedDayOff.user.name }}</span>
                  </b-list-group-item>
                  <b-list-group-item class="d-flex justify-content-between">
                    <span class="font-weight-bold">Email:</span>
                    <span>{{ selectedDayOff.user.email }}</span>
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedDayOff.approver" class="d-flex justify-content-between">
                    <span class="font-weight-bold">Approved/Rejected By:</span>
                    <span>{{ selectedDayOff.approver.name }}</span>
                  </b-list-group-item>
                  <b-list-group-item v-if="selectedDayOff.approved_at || selectedDayOff.rejected_at" class="d-flex justify-content-between">
                    <span class="font-weight-bold">{{ selectedDayOff.status === 'approved' ? 'Approved' : 'Rejected' }} On:</span>
                    <span>{{ formatDateTime(selectedDayOff.approved_at || selectedDayOff.rejected_at) }}</span>
                  </b-list-group-item>
                </b-list-group>
              </b-card-body>
            </b-card>
          </b-col>
        </b-row>
        
        <b-card no-body class="mb-3">
          <b-card-header class="py-2">
            <h6 class="mb-0">Reason</h6>
          </b-card-header>
          <b-card-body>
            <p class="mb-0">{{ selectedDayOff.reason }}</p>
          </b-card-body>
        </b-card>

        <b-card no-body v-if="selectedDayOff.emergency_contact">
          <b-card-header class="py-2">
            <h6 class="mb-0">Emergency Contact</h6>
          </b-card-header>
          <b-card-body>
            <p class="mb-0">{{ selectedDayOff.emergency_contact }}</p>
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
      employee: {
        name: '',
        email: '',
        user_type: '',
        position: '',
        department: '',
        employee_id: '',
        is_active: true,
        created_at: '',
        is_team_lead: false,
        is_manager: false
      },
      
      teams: [],
      attendanceGrouped: [],
      flatRecords: [],
      attendanceCurrentPage: 1,
      attendancePerPage: 10,
      attendanceTotalRows: 0,
      dayOffRequests: [],
      dayOffCurrentPage: 1,
      dayOffPerPage: 10,
      dayOffTotalRows: 0,
      leaveTypes: [],
      showAssignTeamModal: false,
      availableTeams: [],
      teamForm: {
        selectedTeams: [],
        teamRoles: {},
        loadingTeams: false,
        loading: false
      },
      showAddModal: false,
      showRejectModal: false,
      showDetailsModal: false,
      dayOffForm: {
        day_off_type_id: null,
        from_date: '',
        to_date: '',
        is_half_day: false,
        half_day_type: null,
        reason: '',
        emergency_contact: ''
      },
      rejectForm: { reason: '' },
      selectedDayOff: null,
      loading: false,
      minDate: new Date().toISOString().split('T')[0],
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
      teamRoleOptions: [
        // { value: null, text: 'Select Role', disabled: true },
        { value: 'manager', text: 'Manager' },
        { value: 'team_lead', text: 'Team Lead' },
        { value: 'senior', text: 'Senior' },
        { value: 'junior', text: 'Junior' },
        { value: 'fresh', text: 'Fresh'}
      ],
      halfDayOptions: [
        { value: 'first_half', text: 'First Half' },
        { value: 'second_half', text: 'Second Half' }
      ]
    }
  },
  computed: {
    isViewingOwnProfile() {
      return this.employeeId == this.auth().id;
    },
    
    canEditProfile() {
      return this.isViewingOwnProfile || this.isAdmin();
    },
    
    canAssignToTeam() {
      const user = this.auth();
      const isManager = user.user_type === 'manager' || user.is_manager;
      return user.role === 'admin' || 
             user.role === 'hr' || 
             (isManager && !this.isViewingOwnProfile);
    },
    
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
    
    calculatedDays() {
      if (!this.dayOffForm.from_date || !this.dayOffForm.to_date) return 0;
      
      if (this.dayOffForm.is_half_day === true) return 0.5;
      
      const start = new Date(this.dayOffForm.from_date);
      const end = new Date(this.dayOffForm.to_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return diffDays;
    },
    
    showDurationOptions() {
      if (!this.dayOffForm.from_date || !this.dayOffForm.to_date) return true;
      
      const start = new Date(this.dayOffForm.from_date);
      const end = new Date(this.dayOffForm.to_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return diffDays === 1;
    }
  },
  methods: {
    // IMPORTANT: Make sure all methods referenced in template are defined here
    
    // 1. Auth methods
    auth() {
      return this.$store.state.user || { id: null, role: null, user_type: null };
    },
    
    isAdmin() {
      const user = this.auth();
      return user.role === 'admin' || user.is_admin === true;
    },
    
    // 2. Helper methods
    getUserTypeVariant(userType) {
      const variants = {
        employee: 'secondary',
        manager: 'primary',
        admin: 'danger',
        supervisor: 'info'
      };
      return variants[userType] || 'secondary';
    },
    
    formatUserType(userType) {
      const types = {
        employee: 'Employee',
        manager: 'Manager',
        admin: 'Administrator',
        supervisor: 'Supervisor'
      };
      return types[userType] || userType;
    },
    
    formatRole(role) {
      const roles = {
        member: 'Member',
        deputy_lead: 'Deputy Lead',
        team_lead: 'Team Lead'
      };
      return roles[role] || role;
    },
    
    getRoleVariant(role) {
      const variants = {
        member: 'secondary',
        deputy_lead: 'info',
        team_lead: 'primary'
      };
      return variants[role] || 'secondary';
    },
    
    getInitials(name) {
      if (!name) return 'NA';
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },
    
    formatDate(date) {
      if (!date) return '—';
      return moment ? moment(date).format('YYYY-MM-DD') : date;
    },
    
    formatDateTime(datetime) {
      if (!datetime) return '—';
      return moment ? moment(datetime).format('YYYY-MM-DD HH:mm') : datetime;
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
    
    // 3. Load data methods
    async loadUserDetails() {
      try {
        const response = await api.get(`/users/${this.employeeId}`);
        if (response.data.success) {
          this.employee = {
            ...this.employee,
            ...response.data.data,
            user_type: response.data.data.user_type || 'employee'
          };
          this.loadUserTeams();
        }
      } catch (error) {
        console.error('Error loading user details:', error);
        this.$bvToast.toast('Error loading user details', {
          variant: 'danger',
          solid: true
        });
      }
    },
    
    async loadUserTeams() {
      try {
        const response = await api.get(`/users/${this.employeeId}/teams`);
        if (response.data.success) {
          this.teams = response.data.data || [];
          this.employee.is_team_lead = this.teams.some(team => team.pivot.role === 'team_lead');
          this.employee.is_manager = this.employee.user_type === 'manager' || 
                                    this.employee.is_team_lead ||
                                    this.teams.some(team => team.manager_id === this.employeeId);
        }
      } catch (error) {
        console.error('Error loading user teams:', error);
      }
    },
    
    async loadAttendance(page = 1, perPage = 10) {
      try {
        this.loading = true;
        const payload = {
          employeeId: this.employeeId,
          perPage: perPage,
          page: page
        };
        const res = await api.post(`/employees/${this.employeeId}/attendance`, payload);
        this.attendanceGrouped = res.data.data || res.data;
        this.attendanceTotalRows = res.data.total || res.data.length;
        this.attendanceCurrentPage = page;
        this.attendancePerPage = perPage;
        
        if (!this.employee.name && res.data.employee) {
          this.employee = res.data.employee;
        }
        
        this.flattenAttendance();
      } catch (e) {
        console.error('Error loading attendance:', e);
      } finally {
        this.loading = false;
      }
    },
    
    flattenAttendance() {
      var flat = [];
      
      if (this.attendanceGrouped.length === 0) {
        return;
      }

      this.attendanceGrouped.forEach(day => {
        const date = day.date;
        const check_in = day.check_in ? day.check_in : null;
        const check_out = day.check_out ? day.check_out : null;
        const hours = day.total_hours ? day.total_hours : null;

        flat.push({
          date,
          check_in,
          check_out,
          hours,
        });
      });
      
      flat.sort((a, b) => (a.date === b.date ? (a.check_in > b.check_in ? 1 : -1) : (a.date < b.date ? 1 : -1)));
      this.flatRecords = flat;
    },
    
    async loadDayOffRequests(page = 1, perPage = 10) {
      try {
        const params = {
          page: page,
          perPage: perPage,
          user_id: this.employeeId
        };
        const response = await api.get('/admin/day-off-requests', { params });
        this.dayOffRequests = response.data.data;
        this.dayOffTotalRows = response.data.total;
        this.dayOffCurrentPage = response.data.current_page || page;
        this.dayOffPerPage = response.data.per_page || perPage;
      } catch (error) {
        console.error('Error loading day off requests:', error);
        this.$bvToast.toast('Error loading day off requests', {
          variant: 'danger',
          solid: true
        });
      }
    },
    
    async loadLeaveTypes() {
      try {
        const response = await api.get('/day-off-types/active');
        this.leaveTypes = response.data.data;
      } catch (error) {
        console.error('Error loading leave types:', error);
      }
    },
    
    // 4. Team assignment methods
    async showAssignTeamModalFn() {
      this.showAssignTeamModal = true;
      await this.loadAvailableTeams();
      this.preloadSelectedTeams();
    },
    
    async loadAvailableTeams() {
      try {
        this.teamForm.loadingTeams = true;
        const response = await api.get('/teams');
        if (response.data.success) {
          this.availableTeams = response.data.data.data || [];
        }
      } catch (error) {
        console.error('Error loading available teams:', error);
        this.$bvToast.toast('Error loading teams', {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.teamForm.loadingTeams = false;
      }
    },
    
    preloadSelectedTeams() {
      this.teamForm.selectedTeams = this.teams.map(team => team.id);
      this.teams.forEach(team => {
        this.$set(this.teamForm.teamRoles, team.id, team.pivot.role);
      });
    },
    
    getTeamName(teamId) {
      const team = this.availableTeams.find(t => t.id === teamId);
      return team ? team.name : `Team ${teamId}`;
    },
    
    getTeamCode(teamId) {
      const team = this.availableTeams.find(t => t.id === teamId);
      return team ? team.code : '';
    },
    
    async assignToTeams() {
      try {
        this.teamForm.loading = true;
        
        const payload = {
          user_id: this.employeeId,
          teams: this.teamForm.selectedTeams.map(teamId => ({
            team_id: teamId,
            role: this.teamForm.teamRoles[teamId] || 'member'
          }))
        };
        
        const response = await api.post(`/users/${this.employeeId}/assign-teams`, payload);
        
        if (response.data.success) {
          this.$bvToast.toast('Teams assigned successfully', {
            variant: 'success',
            solid: true
          });
          
          await this.loadUserTeams();
          this.showAssignTeamModal = false;
          this.resetTeamForm();
        }
      } catch (error) {
        console.error('Error assigning teams:', error);
        const message = error.response?.data?.message || 'Error assigning to teams';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.teamForm.loading = false;
      }
    },
    
    async removeFromTeam(team) {
      if (!confirm(`Are you sure you want to remove ${this.employee.name} from ${team.name}?`)) {
        return;
      }
      
      try {
        this.loading = true;
        
        const response = await api.delete(`/users/${this.employeeId}/teams/${team.id}`);
        
        if (response.data.success) {
          this.$bvToast.toast(`Removed from ${team.name} successfully`, {
            variant: 'success',
            solid: true
          });
          
          await this.loadUserTeams();
          
          if (this.showAssignTeamModal) {
            const index = this.teamForm.selectedTeams.indexOf(team.id);
            if (index > -1) {
              this.teamForm.selectedTeams.splice(index, 1);
            }
          }
        }
      } catch (error) {
        console.error('Error removing from team:', error);
        const message = error.response?.data?.message || 'Error removing from team';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.loading = false;
      }
    },
    
    resetTeamForm() {
      this.teamForm = {
        selectedTeams: [],
        teamRoles: {},
        loadingTeams: false,
        loading: false
      };
    },
    
    // 5. Day off methods
    editProfile() {
      this.$router.push(`/users/${this.employeeId}/edit`);
    },
    
    onDateChange() {
      if (!this.showDurationOptions && this.dayOffForm.is_half_day) {
        this.dayOffForm.is_half_day = false;
        this.dayOffForm.half_day_type = null;
      }
    },
    
    onHalfDayChange(isHalfDay) {
      if (!isHalfDay) {
        this.dayOffForm.half_day_type = null;
      }
    },
    
    onAttendancePageChange(page) {
      this.attendanceCurrentPage = page;
      this.loadAttendance(page, this.attendancePerPage);
    },
    
    onAttendancePerPageChange(perPage) {
      this.attendanceCurrentPage = 1;
      this.attendancePerPage = perPage;
      this.loadAttendance(1, perPage);
    },
    
    onDayOffPageChange(page) {
      this.dayOffCurrentPage = page;
      this.loadDayOffRequests(page, this.dayOffPerPage);
    },
    
    onDayOffPerPageChange(perPage) {
      this.dayOffCurrentPage = 1;
      this.dayOffPerPage = perPage;
      this.loadDayOffRequests(1, perPage);
    },
    
    showAddDayOffModal() {
      this.showAddModal = true;
    },
    
    showRejectDayOffModal(dayOff) {
      this.selectedDayOff = dayOff;
      this.rejectForm.reason = '';
      this.showRejectModal = true;
    },
    
    showDayOffDetails(dayOff) {
      this.selectedDayOff = dayOff;
      this.showDetailsModal = true;
    },
    
    async addDayOff() {
      try {
        const payload = {
          ...this.dayOffForm,
          user_id: this.employeeId
        };
        await api.post('/admin/day-off-requests', payload);
        
        this.$bvToast.toast('Day off added successfully', {
          variant: 'success',
          solid: true
        });
        
        this.showAddModal = false;
        this.resetDayOffForm();
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage);
      } catch (error) {
        const message = error.response?.data?.message || 'Error adding day off';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      }
    },
    
    async approveDayOff(dayOff) {
      try {
        await api.patch(`/admin/day-off-requests/${dayOff.id}/approve`);
        
        this.$bvToast.toast('Day off approved successfully', {
          variant: 'success',
          solid: true
        });
        
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage);
      } catch (error) {
        const message = error.response?.data?.message || 'Error approving day off';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      }
    },
    
    async rejectDayOff() {
      if (!this.rejectForm.reason.trim()) {
        this.$bvToast.toast('Please provide a rejection reason', {
          variant: 'warning',
          solid: true
        });
        return;
      }

      try {
        await api.patch(`/admin/day-off-requests/${this.selectedDayOff.id}/reject`, {
          reason: this.rejectForm.reason
        });
        
        this.$bvToast.toast('Day off rejected successfully', {
          variant: 'success',
          solid: true
        });
        
        this.showRejectModal = false;
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage);
      } catch (error) {
        const message = error.response?.data?.message || 'Error rejecting day off';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      }
    },
    
    async deleteDayOff(dayOff) {
      if (!confirm('Are you sure you want to delete this day off request?')) {
        return;
      }

      try {
        await api.delete(`/admin/day-off-requests/${dayOff.id}`);
        
        this.$bvToast.toast('Day off request deleted successfully', {
          variant: 'success',
          solid: true
        });
        
        this.loadDayOffRequests(this.dayOffCurrentPage, this.dayOffPerPage);
      } catch (error) {
        const message = error.response?.data?.message || 'Error deleting day off';
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      }
    },
    
    resetDayOffForm() {
      this.dayOffForm = {
        day_off_type_id: null,
        from_date: '',
        to_date: '',
        is_half_day: false,
        half_day_type: null,
        reason: '',
        emergency_contact: ''
      };
    }
  },
  created() {
    this.loadUserDetails();
    this.loadAttendance();
    this.loadDayOffRequests();
    this.loadLeaveTypes();
  }
};
</script>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar-container {
  border: 2px solid #dee2e6;
  border-radius: 50%;
  padding: 2px;
}

.team-card {
  transition: all 0.3s ease;
  height: 100%;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.team-card-assign {
  border-left: 4px solid #007bff;
}

.team-select-container {
  min-height: 150px;
}

.team-role-selection {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
}

.team-role-selection::-webkit-scrollbar {
  width: 6px;
}

.team-role-selection::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.team-role-selection::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.team-role-selection::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@media (max-width: 768px) {
  .team-card-assign .row > div {
    margin-bottom: 10px;
  }
  
  .team-select-container {
    min-height: 120px;
  }
  
  .team-role-selection {
    max-height: 200px;
  }
}
</style>
