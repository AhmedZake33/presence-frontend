<template>
  <div>
    <loading :visible="loading" text="Loading..." />
    <b-card>
      <b-card-header>
        <b-row class="align-items-center">
          <b-col>
            <h4 class="mb-0">My Profile</h4>
            <p class="text-muted mb-0">Manage your account information</p>
          </b-col>
        </b-row>
      </b-card-header>

      <b-card-body>
        <loading :visible="loadingTeamData" text="Loading ..." />
        <b-row>
          <!-- Profile Picture and Basic Info -->
          <b-col md="4" class="text-center">
            <b-avatar
              :text="getInitials(user.name)"
              size="120px"
              variant="primary"
              class="mb-3"
            />
            <h5>{{ user.name }}</h5>
            <p class="text-muted">{{ user.email }}</p>
            <b-badge :variant="getUserTypeVariant(user.user_type)" v-if="user.user_type">
              {{ formatUserType(user.user_type) }}
            </b-badge>
            
            <!-- Display other read-only information -->
            <div class="mt-3 text-left">
              <!-- Team Information with loading -->
              <div v-if="loadingTeamData" class="text-center">
                <b-spinner small variant="primary" />
                <small class="text-muted ml-2">Loading team info...</small>
              </div>
              <div v-else>
                <p class="mb-1">
                  <strong>Team:</strong> 
                  {{ user.primaryTeam ? user.primaryTeam.name : 'Not set' }}
                </p>
                <p class="mb-1">
                  <strong>Role:</strong> 
                  <span v-if="user.primaryTeam && user.primaryTeam.pivot">
                    {{ formatName(user.primaryTeam.pivot.role) }}
                  </span>
                  <span v-else>Not set</span>
                </p>
              </div>
            </div>
          </b-col>

          <!-- Profile Details -->
          <b-col md="8">
            <!-- Update Name Form -->
            <b-card class="mb-4">
              <b-card-title>Update Profile Information</b-card-title>
              <b-form @submit.prevent="updateProfile">
                <b-row>
                  <b-col md="12">
                    <b-form-group label="Full Name" label-for="name">
                      <b-form-input
                        id="name"
                        v-model="profileForm.name"
                        required
                        placeholder="Enter your full name"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-button type="submit" variant="primary" :disabled="saving">
                  <b-spinner small v-if="saving" class="mr-1" />
                  Update Profile
                </b-button>
              </b-form>
            </b-card>

            <!-- Change Password Form -->
            <b-card>
              <b-card-title>Change Password</b-card-title>
              <b-form @submit.prevent="updatePassword">
                <b-row>
                  <b-col md="12">
                    <b-form-group label="Current Password" label-for="current_password">
                      <b-form-input
                        id="current_password"
                        v-model="passwordForm.current_password"
                        type="password"
                        required
                        placeholder="Enter current password"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-row>
                  <b-col md="6">
                    <b-form-group label="New Password" label-for="password">
                      <b-form-input
                        id="password"
                        v-model="passwordForm.password"
                        type="password"
                        required
                        placeholder="Enter new password"
                      />
                      <small class="text-muted">
                        Password must be at least 8 characters with letters, numbers, and symbols
                      </small>
                    </b-form-group>
                  </b-col>
                  <b-col md="6">
                    <b-form-group label="Confirm Password" label-for="password_confirmation">
                      <b-form-input
                        id="password_confirmation"
                        v-model="passwordForm.password_confirmation"
                        type="password"
                        required
                        placeholder="Confirm new password"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>

                <b-button type="submit" variant="warning" :disabled="changingPassword">
                  <b-spinner small v-if="changingPassword" class="mr-1" />
                  Change Password
                </b-button>
              </b-form>
            </b-card>
          </b-col>
        </b-row>
      </b-card-body>
    </b-card>
  </div>
</template>

<script>
import api from "@/libs/axios";
import loading from "@/views/components/my-components/loading.vue";

export default {
  name: 'UserProfile',
  components: { loading },
  data() {
    return {
      loading: false,
      loadingTeamData: false,
      saving: false,
      changingPassword: false,
      user: {},
      profileForm: {
        name: ''
      },
      passwordForm: {
        current_password: '',
        password: '',
        password_confirmation: ''
      }
    }
  },
  mounted() {
    this.loadProfile();
  },
  methods: {
    formatName(name) {
      if (!name) return '';
      name = name.replace(/_/g, ' ')
      return name.charAt(0).toUpperCase() + name.slice(1);
    },
    
    async loadProfile() {
      this.loading = true;
      this.loadingTeamData = true;
      try {
        const response = await api.get('/profile');
        this.user = response.data.user;
        this.profileForm.name = this.user.name;
      } catch (error) {
        console.error('Error loading profile:', error);
        this.$bvToast.toast('Error loading profile', {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.loading = false;
        // Simulate a delay for team data loading (remove in production)
        setTimeout(() => {
          this.loadingTeamData = false;
        }, 500);
      }
    },

    async updateProfile() {
      this.saving = true;
      try {
        await api.put('/profile', this.profileForm);
        this.user.name = this.profileForm.name;
        this.$bvToast.toast('Profile updated successfully', {
          variant: 'success',
          solid: true
        });
      } catch (error) {
        let message = 'Error updating profile';
        if (error.response && error.response.data.errors) {
          message = Object.values(error.response.data.errors).flat().join(', ');
        }
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.saving = false;
      }
    },

    async updatePassword() {
      this.changingPassword = true;
      try {
        await api.put('/profile/password', this.passwordForm);
        
        this.$bvToast.toast('Password updated successfully', {
          variant: 'success',
          solid: true
        });
        
        // Clear password form
        this.passwordForm = {
          current_password: '',
          password: '',
          password_confirmation: ''
        };
      } catch (error) {
        let message = 'Error updating password';
        if (error.response && error.response.data.errors) {
          message = Object.values(error.response.data.errors).flat().join(', ');
        } else if (error.response && error.response.data.message) {
          message = error.response.data.message;
        }
        this.$bvToast.toast(message, {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.changingPassword = false;
      }
    },

    getInitials(name) {
      if (!name) return '';
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    },

    getUserTypeVariant(userType) {
      const variants = {
        admin: 'danger',
        manager: 'warning',
        employee: 'primary'
      };
      return variants[userType] || 'secondary';
    },

    formatUserType(userType) {
      return userType.charAt(0).toUpperCase() + userType.slice(1);
    }
  }
}
</script>

<style scoped>
.text-left {
  text-align: left !important;
}
</style>