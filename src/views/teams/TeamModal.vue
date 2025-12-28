<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ isEditing ? 'Edit Team' : 'Create New Team' }}</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <form @submit.prevent="submitForm" class="modal-form">
        <div class="form-group">
          <label for="name">Team Name *</label>
          <input
            type="text"
            id="name"
            v-model="form.name"
            required
            placeholder="Enter team name"
            :class="{ 'error': errors.name }"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>
        
        <div class="form-group">
          <label for="code">Team Code *</label>
          <input
            type="text"
            id="code"
            v-model="form.code"
            required
            placeholder="Enter unique team code"
            :class="{ 'error': errors.code }"
          />
          <span v-if="errors.code" class="error-message">{{ errors.code }}</span>
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="Enter team description"
          ></textarea>
        </div>
        
        <div class="row">
          <div class="col">
            <div class="form-group">
              <label for="team_lead_id">Team Lead</label>
              <select
                id="team_lead_id"
                v-model="form.team_lead_id"
                :class="{ 'error': errors.team_lead_id }"
              >
                <option value="">Select Team Lead</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
              <span v-if="errors.team_lead_id" class="error-message">{{ errors.team_lead_id }}</span>
            </div>
          </div>
          
          <div class="col">
            <div class="form-group">
              <label for="manager_id">Manager</label>
              <select
                id="manager_id"
                v-model="form.manager_id"
                :class="{ 'error': errors.manager_id }"
              >
                <option value="">Select Manager</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
              <span v-if="errors.manager_id" class="error-message">{{ errors.manager_id }}</span>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_active" />
            <span>Team is active</span>
          </label>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i> Saving...
            </span>
            <span v-else>{{ isEditing ? 'Update' : 'Create' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TeamModal',
  props: {
    team: Object,
    isEditing: Boolean
  },
  data() {
    return {
      form: {
        name: '',
        code: '',
        description: '',
        team_lead_id: null,
        manager_id: null,
        is_active: true
      },
      users: [],
      loading: false,
      errors: {}
    };
  },
  created() {
    if (this.team) {
      this.form = { ...this.team };
    }
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        const response = await axios.get('/api/users', {
          params: { is_active: true, per_page: 100 }
        });
        this.users = response.data.data || response.data;
      } catch (error) {
        console.error('Error loading users:', error);
      }
    },
    
    async submitForm() {
      this.errors = {};
      this.loading = true;
      
      try {
        if (this.isEditing) {
          await axios.put(`/api/teams/${this.team.id}`, this.form);
          this.$toast.success('Team updated successfully');
        } else {
          await axios.post('/api/teams', this.form);
          this.$toast.success('Team created successfully');
        }
        
        this.$emit('saved');
      } catch (error) {
        if (error.response?.status === 422) {
          this.errors = error.response.data.errors || {};
        }
        const message = this.isEditing ? 'Failed to update team' : 'Failed to create team';
        this.$toast.error(message);
      } finally {
        this.loading = false;
      }
    },
    
    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  line-height: 1;
}

.modal-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #2c3e50;
}

input, select, textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

input.error, select.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.row {
  display: flex;
  gap: 15px;
}

.col {
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>