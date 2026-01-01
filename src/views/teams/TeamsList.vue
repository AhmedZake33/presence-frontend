<template>
  <b-card>
      <loader :visible="loading" text="Processing..." />
    <b-card-header>
      <h4 class="mb-0">Teams Management</h4>
      <p class="text-muted mb-0">Manage organizational teams and members</p>
    </b-card-header>
    
    <b-card-body>
      <!-- Search and Filters -->
      <b-row class="mb-3">
        <b-col md="4">
          <b-form-group label="Search Teams">
            <b-input-group>
              <b-form-input
                v-model="searchQuery"
                placeholder="Search by name or code..."
                @input="onSearch"
              />
              <b-input-group-append>
                <b-button variant="outline-secondary" disabled>
                  <feather-icon icon="SearchIcon" />
                </b-button>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>
        </b-col>
        
        <b-col md="4">
          <b-form-group label="Filter by Status">
            <b-form-select v-model="filter" @change="handleFilterChange">
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </b-form-select>
          </b-form-group>
        </b-col>
        
        <b-col md="4" class="d-flex align-items-center">
          <b-button
            variant="primary"
            @click="showCreateModal"
            class="w-100"
          >
            <feather-icon icon="PlusIcon" class="mr-1" />
            Create New Team
          </b-button>
        </b-col>
      </b-row>

      <!-- Teams Table -->
      <BaseTable
        :items="teams"
        :fields="fields"
        :paginated="true"
        :per-page="pagination.per_page"
        :total-rows="pagination.total"
        :current-page="pagination.current_page"
        :loading="loading"
        @page-changed="onPageChange"
        @per-page-changed="onPerPageChange"
      >
        <!-- Team Name Column -->
        <template #cell(name)="data">
          <div>
            <strong>{{ data.item.name }}</strong>
            <br>
            <small class="text-muted">{{ data.item.description || 'No description' }}</small>
          </div>
        </template>

        <!-- Team Code Column -->
        <template #cell(code)="data">
          <b-badge variant="light-primary" class="text-primary">
            {{ data.item.code }}
          </b-badge>
        </template>

        <!-- Team Lead Column -->
        <!-- <template #cell(team_lead)="data">
          <div v-if="data.item.team_lead">
            <div class="d-flex align-items-center">
              <b-avatar
                size="sm"
                :text="getInitials(data.item.team_lead.name)"
                variant="primary"
                class="mr-2"
              />
              <div>
                <strong>{{ data.item.team_lead.name }}</strong>
                <br>
                <small class="text-muted">{{ data.item.team_lead.email }}</small>
              </div>
            </div>
          </div>
          <span v-else class="text-muted">Not assigned</span>
        </template> -->

        <!-- Manager Column -->
        <template #cell(manager)="data">
          <div v-if="data.item.manager">
            <div class="d-flex align-items-center">
              <b-avatar
                size="sm"
                :text="getInitials(data.item.manager.name)"
                variant="info"
                class="mr-2"
              />
              <div>
                <strong>{{ data.item.manager.name }}</strong>
                <br>
                <small class="text-muted">{{ data.item.manager.email }}</small>
              </div>
            </div>
          </div>
          <span v-else class="text-muted">Not assigned</span>
        </template>

        <!-- Members Column -->
        <template #cell(members)="data">
          <div>
            <b-badge variant="light-success" class="mr-1">
              <feather-icon icon="UsersIcon" size="14" class="mr-1" />
              {{ data.item.active_members_count || 0 }} members
            </b-badge>
            <b-button
              v-if="data.item.active_members_count > 0"
              size="sm"
              variant="link"
              @click="viewMembers(data.item)"
            >
              View
            </b-button>
          </div>
        </template>

        <!-- Status Column -->
        <template #cell(status)="data">
          <b-badge :variant="data.item.is_active ? 'success' : 'secondary'">
            {{ data.item.is_active ? 'Active' : 'Inactive' }}
          </b-badge>
        </template>

        <!-- Actions Column -->
        <template #cell(actions)="data">
          <b-button-group size="sm">
            <b-button
              variant="info"
              @click="editTeam(data.item)"
            >
              <feather-icon icon="EditIcon" />
            </b-button>
            
            <b-button
              variant="warning"
              @click="manageMembers(data.item)"
              :title="null"
            >
              <feather-icon icon="UserPlusIcon" />
            </b-button>

           

           
          </b-button-group>
        </template>
      </BaseTable>
    </b-card-body>

    <!-- Create/Edit Team Modal -->
    <b-modal
      v-model="showModal"
      :title="isEditing ? 'Edit Team' : 'Create New Team'"
      size="lg"
      hide-footer
      @hidden="closeModal"
    >
      <b-form @submit.prevent="saveTeam">
        <b-row>
          <b-col md="6">
            <b-form-group label="Team Name" label-for="team-name">
              <b-form-input
                id="team-name"
                v-model="form.name"
                placeholder="Enter team name"
                required
              />
            </b-form-group>
          </b-col>
          
          <b-col md="6">
            <b-form-group label="Team Code" label-for="team-code">
              <b-form-input
                id="team-code"
                v-model="form.code"
                placeholder="Enter unique team code"
                required
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-form-group label="Description" label-for="team-description">
          <b-form-textarea
            id="team-description"
            v-model="form.description"
            placeholder="Enter team description"
            rows="3"
          />
        </b-form-group>

        <b-row>
          <b-col md="12">
            <b-form-group label="Manager" label-for="team-manager">
              <b-form-select
                id="team-manager"
                v-model="form.manager_id"
                :options="userOptions.filter(user => user.type !== 'employee')"
              >
                <template #first>
                  <b-form-select-option :value="null">
                    Select Manager
                  </b-form-select-option>
                </template>
              </b-form-select>
            </b-form-group>
          </b-col>
        </b-row>

        <b-form-group>
          <b-form-checkbox v-model="form.is_active">
            Team is active
          </b-form-checkbox>
        </b-form-group>

        <div class="d-flex justify-content-end mt-3">
          <b-button variant="secondary" @click="closeModal" class="mr-2">
            Cancel
          </b-button>
          <b-button
            type="submit"
            variant="primary"
            :disabled="saving"
          >
            <b-spinner v-if="saving" small class="mr-1" />
            {{ isEditing ? 'Update' : 'Create' }}
          </b-button>
        </div>
      </b-form>
    </b-modal>

    <!-- Team Members Modal -->
    <b-modal
      v-model="showMembersModal"
      :title="selectedTeam ? 'Manage Team Members: ' + selectedTeam.name : 'Manage Team Members'"
      size="xl"
      hide-footer
      @hidden="closeMembersModal"
    >
      <TeamMembersModal
        v-if="selectedTeam"
        :team="selectedTeam"
        @close="closeMembersModal"
        @updated="handleMembersUpdated"
      />
    </b-modal>
  </b-card>
</template>

<script>
import api from "@/libs/axios";
import BaseTable from '@/views/components/my-components/table.vue'
import TeamMembersModal from "./TeamMembersModal.vue";
import loader from "@/views/components/my-components/loading.vue";

export default {
  name: 'TeamsList',
  components: {
    BaseTable,
    TeamMembersModal,
    loader
  },
  data() {
    return {
      teams: [],
      loading: false,
      searchQuery: '',
      filter: 'all',
      showModal: false,
      showMembersModal: false,
      editingTeam: null,
      selectedTeam: null,
      isEditing: false,
      saving: false,
      users: [],
      form: {
        name: '',
        code: '',
        description: '',
        manager_id: null,
        is_active: true
      },
      per_page: 10,
      currentPage: 1,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0
      },
      fields: [
        { key: 'name', label: 'Team Name', sortable: true },
        { key: 'code', label: 'Code', sortable: true },
        // { key: 'team_lead', label: 'Team Lead' },
        { key: 'manager', label: 'Manager' },
        { key: 'members', label: 'Members' },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Actions', thStyle: { width: '180px' } }
      ],
      searchTimer: null
    };
  },
  computed: {
    userOptions() {
      return this.users.map(user => ({
        value: user.id,
        text: `${user.name} (${user.email})`,
        type: user.type
      }));
    }
  },
  created() {
    this.loadTeams();
    this.loadUsers();
  },
  methods: {
    async loadTeams() {
      this.loading = true;
      try {
        const params = {
          page: this.pagination.current_page,
          per_page: this.pagination.per_page,
          search: this.searchQuery,
          is_active: this.filter === 'all' ? undefined : this.filter === 'active'
        };

        const response = await api.get('/teams', { params });
        
        if (response.data && response.data.data) {
          this.teams = Array.isArray(response.data.data) 
            ? response.data.data 
            : (response.data.data.data || []);
          
          if (response.data.data.current_page) {
            this.pagination = {
              current_page: response.data.data.current_page,
              last_page: response.data.data.last_page,
              per_page: response.data.data.per_page,
              total: response.data.data.total
            };
          }
        } else {
          this.teams = response.data || [];
        }
      } catch (error) {
        console.error('Error loading teams:', error);
        this.$toast.error('Failed to load teams');
      } finally {
        this.loading = false;
      }
    },

    async loadUsers() {
      try {
        const response = await api.post('/users/active');
        if (response.data.success) {
          this.users = response.data.data;
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    },

    handleFilterChange() {
      this.pagination.current_page = 1;
      this.loadTeams();
    },

    onSearch() {
      this.pagination.current_page = 1;
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.loadTeams();
      }, 500);
    },

    onPageChange(page) {
      this.pagination.current_page = page;
      this.loadTeams();
    },

    onPerPageChange(perPage) {
      this.pagination.per_page = perPage;
      this.pagination.current_page = 1;
      this.loadTeams();
    },

    showCreateModal() {
      this.editingTeam = null;
      this.isEditing = false;
      this.form = {
        name: '',
        code: '',
        description: '',
        manager_id: null,
        is_active: true
      };
      this.showModal = true;
    },

    editTeam(team) {
      this.editingTeam = team;
      this.isEditing = true;
      this.form = {
        name: team.name,
        code: team.code,
        description: team.description || '',
        manager_id: team.manager_id,
        is_active: team.is_active
      };
      this.showModal = true;
    },

    viewTeamDetails(team) {
      this.$router.push(`/teams/${team.id}`);
    },

    viewMembers(team) {
      this.selectedTeam = team;
      this.showMembersModal = true;
    },

    manageMembers(team) {
      this.selectedTeam = team;
      this.showMembersModal = true;
    },

    async saveTeam() {
      this.saving = true;
      try {
        if (this.isEditing) {
          await api.put(`/teams/${this.editingTeam.id}`, this.form);
          this.$toast.success('Team updated successfully');
        } else {
          await api.post('/teams', this.form);
          this.$toast.success('Team created successfully');
        }
        this.closeModal();
        this.loadTeams();
      } catch (error) {
        console.error('Error saving team:', error);
        
        // Option 1: Check if error has response property
        if (error.response) {
          // Laravel validation error format
          const errorData = error.response.data;
          
          if (errorData.errors && errorData.errors.code) {
            // Access the first code error message
            const errorMessage = errorData.errors.code[0];
            this.$toast.error(`Failed to save team: ${errorMessage}`);
          } else if (errorData.message) {
            // General error message
            this.$toast.error(`Failed to save team: ${errorData.message}`);
          } else {
            this.$toast.error('Failed to save team');
          }
        }
        }  finally {
        this.saving = false;
      }
    },

    closeModal() {
      this.showModal = false;
      this.editingTeam = null;
      this.isEditing = false;
    },

    closeMembersModal() {
      this.showMembersModal = false;
      this.selectedTeam = null;
    },

    handleMembersUpdated() {
      this.loadTeams();
      this.closeMembersModal();
    },

    async deactivateTeam(team) {
      this.$bvModal.msgBoxConfirm(
        `Are you sure you want to deactivate the team "${team.name}"?`,
        {
          title: 'Confirm Deactivation',
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'danger',
          okTitle: 'Deactivate',
          cancelTitle: 'Cancel',
          footerClass: 'p-2',
          hideHeaderClose: false,
          centered: true
        }
      ).then(async confirmed => {
        if (confirmed) {
          try {
            await api.put(`/teams/${team.id}`, { is_active: false });
            this.$toast.success('Team deactivated successfully');
            this.loadTeams();
          } catch (error) {
            console.error('Error deactivating team:', error);
            this.$toast.error('Failed to deactivate team');
          }
        }
      });
    },

    async activateTeam(team) {
      this.$bvModal.msgBoxConfirm(
        `Are you sure you want to activate the team "${team.name}"?`,
        {
          title: 'Confirm Activation',
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'success',
          okTitle: 'Activate',
          cancelTitle: 'Cancel',
          footerClass: 'p-2',
          hideHeaderClose: false,
          centered: true
        }
      ).then(async confirmed => {
        if (confirmed) {
          try {
            await api.put(`/teams/${team.id}`, { is_active: true });
            this.$toast.success('Team activated successfully');
            this.loadTeams();
          } catch (error) {
            console.error('Error activating team:', error);
            this.$toast.error('Failed to activate team');
          }
        }
      });
    },

    getInitials(name) {
      if (!name) return 'NA';
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
  }
};
</script>