<template>
  <div>
    <!-- Add Member Section -->
    <b-card class="mb-3">
      <b-card-title>
        <h5 class="mb-0">Add New Member</h5>
      </b-card-title>
      <b-card-body>
        <b-form @submit.prevent="addMember">
          <b-row>
            <b-col md="5">
              <b-form-group label="Select User">
                <b-form-select
                  v-model="newMember.user_id"
                  :options="availableUserOptions.filter(user => user.type !== 'manager')"
                  required
                >
                  <template #first>
                    <b-form-select-option :value="null">
                      Select a user
                    </b-form-select-option>
                  </template>
                </b-form-select>
              </b-form-group>
            </b-col>
            
            <b-col md="3">
              <b-form-group label="Role">
                <b-form-select
                  v-model="newMember.role"
                  :options="roleOptions.filter(role => role.value !== 'manager')"
                  required
                />
              </b-form-group>
            </b-col>
            
            <b-col md="3">
              <b-form-group label="Joined Date">
                <b-form-datepicker
                  v-model="newMember.joined_date"
                  required
                />
              </b-form-group>
            </b-col>
            
            <b-col md="1" class="d-flex align-items-center">
              <b-button
                type="submit"
                variant="primary"
                :disabled="!canAddMember"
                class="w-100"
              >
                <feather-icon icon="PlusIcon" />
              </b-button>
            </b-col>
          </b-row>
        </b-form>
      </b-card-body>
    </b-card>

    <!-- Team manager -->
    <b-card v-if="managers.length > 0">
      <b-card-title>
        <h5 class="mb-0 text-primary">Team Managers ({{ managers.length }})</h5>
      </b-card-title>
      <b-card-body>
        <BaseTable
          :items="managers"
          :fields="memberFields"
          :paginated="false"
        >
          <!-- Member Name -->
          <template #cell(name)="data">
            <div class="d-flex align-items-center">
              <b-avatar
                size="sm"
                :text="getInitials(data.item.name)"
                variant="light-primary"
                class="mr-2"
              />
              <div>
                <strong>{{ data.item.name }}</strong>
                <br>
                <small class="text-muted">{{ data.item.email }}</small>
              </div>
            </div>
          </template>

          <!-- Role -->
          <template #cell(role)="data">
             <b-badge variant="light-primary">
               {{ data.item.pivot.role.toUpperCase() }}
             </b-badge>
          </template>

          <!-- Joined Date -->
          <template #cell(joined_date)="data">
            {{ formatDate(data.item.pivot.joined_date) }}
          </template>

          <!-- Actions -->
          <template #cell(actions)="data">
            <b-button
              size="sm"
              variant="flat-danger"
              @click="removeMember(data.item)"
            >
              <feather-icon icon="Trash2Icon" />
            </b-button>
          </template>
        </BaseTable>
      </b-card-body>
    </b-card>

    <!-- Team Members -->
    <b-card>
      <b-card-title>
        <h5 class="mb-0">Team Members ({{ otherMembers.length }})</h5>
      </b-card-title>
      <b-card-body>
        <BaseTable
          :items="otherMembers"
          :fields="memberFields"
          :paginated="false"
        >
          <!-- Member Name -->
          <template #cell(name)="data">
            <div class="d-flex align-items-center">
              <b-avatar
                size="sm"
                :text="getInitials(data.item.name)"
                variant="primary"
                class="mr-2"
              />
              <div>
                <strong>{{ data.item.name }}</strong>
                <br>
                <small class="text-muted">{{ data.item.email }}</small>
              </div>
            </div>
          </template>

          <!-- Position -->
          <template #cell(position)="data">
            <span>{{ data.item.position || 'Not specified' }}</span>
          </template>

          <!-- Role -->
          <template #cell(role)="data">
            <b-form-select
              v-model="data.item.pivot.role"
              :options="filteredRoleOptions"
              size="sm"
              @change="updateMemberRole(data.item)"
            />
          </template>

          <!-- Joined Date -->
          <template #cell(joined_date)="data">
            {{ formatDate(data.item.pivot.joined_date) }}
          </template>

          <!-- Actions -->
          <template #cell(actions)="data">
            <b-button
              size="sm"
              variant="danger"
              @click="removeMember(data.item)"
              v-b-tooltip.hover title="Remove from team"
            >
              <feather-icon icon="Trash2Icon" />
            </b-button>
          </template>
        </BaseTable>
      </b-card-body>
    </b-card>
  </div>
</template>

<script>
import api from "@/libs/axios";
import BaseTable from '@/views/components/my-components/table.vue'

export default {
  name: 'TeamMembersModal',
  components: {
    BaseTable
  },
  props: {
    team: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      members: [],
      availableUsers: [],
      newMember: {
        user_id: null,
        role: 'fresh',
        joined_date: new Date().toISOString().split('T')[0]
      },
      memberFields: [
        { key: 'name', label: 'Member', sortable: true },
        { key: 'position', label: 'Position', sortable: true },
        { key: 'role', label: 'Role' },
        { key: 'joined_date', label: 'Joined Date', sortable: true },
        { key: 'actions', label: 'Actions', thStyle: { width: '80px' } }
      ],
      roleOptions: [
        { value: 'manager', text: 'Manager' },
        { value: 'team_lead', text: 'Team Lead' },
        { value: 'senior', text: 'Senior' },
        { value: 'junior', text: 'Junior' },
        { value: 'fresh', text: 'Fresh'}
      ]
    };
  },
  computed: {
    canAddMember() {
      return this.newMember.user_id && this.newMember.role && this.newMember.joined_date;
    },
    availableUserOptions() {
      return this.availableUsers.map(user => ({
        value: user.id,
        text: `${user.name} (${user.email})`,
        type: user.type
      }));
    },
    managers() {
      return this.members.filter(m => m.pivot.role === 'manager');
    },
    otherMembers() {
      return this.members.filter(m => m.pivot.role !== 'manager');
    },
    filteredRoleOptions() {
      // Hide 'manager' role from the members role dropdown
      return this.roleOptions.filter(role => role.value !== 'manager');
    }
  },
  created() {
    this.loadTeamMembers();
    this.loadAvailableUsers();
  },
  methods: {
    async loadTeamMembers() {
      try {
        const response = await api.get(`/teams/${this.team.id}`);
        this.members = response.data.data.members || [];
      } catch (error) {
        console.error('Error loading team members:', error);
        this.$toast.error('Failed to load team members');
      }
    },
    
    async loadAvailableUsers() {
      try {
        const response = await api.post('/users/active', {
          params: { exclude_team: this.team.id }
        });
        if (response.data.success) {
          this.availableUsers = response.data.data;
        }
      } catch (error) {
        console.error('Error loading available users:', error);
      }
    },
    
    async addMember() {
      try {
        await api.post(`/teams/${this.team.id}/members`, this.newMember);
        this.$toast.success('Member added successfully');
        
        await this.loadTeamMembers();
        await this.loadAvailableUsers();
        
        this.newMember = {
          user_id: null,
          role: 'member',
          joined_date: new Date().toISOString().split('T')[0]
        };
      } catch (error) {
        console.error('Error adding member:', error);
        this.$toast.error('Failed to add member');
      }
    },
    
    async updateMemberRole(member) {
      try {
        await api.put(`/teams/${this.team.id}/members/${member.id}`, {
          role: member.pivot.role
        });
        this.$toast.success('Member role updated');
      } catch (error) {
        console.error('Error updating role:', error);
        this.$toast.error('Failed to update role');
      }
    },
    
    async removeMember(member) {
      this.$bvModal.msgBoxConfirm(
        `Are you sure you want to remove ${member.name} from the team?`,
        {
          title: 'Confirm Removal',
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'danger',
          okTitle: 'Remove',
          cancelTitle: 'Cancel',
          footerClass: 'p-2',
          hideHeaderClose: false,
          centered: true
        }
      ).then(async confirmed => {
        if (confirmed) {
          try {
            await api.delete(`/teams/${this.team.id}/members/${member.id}`);
            this.$toast.success('Member removed successfully');
            
            await this.loadTeamMembers();
            await this.loadAvailableUsers();
          } catch (error) {
            console.error('Error removing member:', error);
            this.$toast.error('Failed to remove member');
          }
        }
      });
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString();
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