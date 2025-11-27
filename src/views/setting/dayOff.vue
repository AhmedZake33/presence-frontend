<template>
  <div>
    <loading :visible="loading" text="Loading..." />
    
    <b-card>
      <b-card-header>
        <b-row class="align-items-center">
          <b-col>
            <h4 class="mb-0">Day Off Settings</h4>
            <p class="text-muted mb-0">Configure leave types and policies</p>
          </b-col>
          <b-col cols="auto">
            <b-button variant="primary" @click="showTypeModal = true">
              <feather-icon icon="PlusIcon" class="mr-1" />
              Add Leave Type
            </b-button>
          </b-col>
        </b-row>
      </b-card-header>

      <b-card-body>
        <!-- Leave Types Section -->
        <b-card class="mb-4" no-body>
          <b-card-header class="bg-light">
            <h5 class="mb-0">Leave Types</h5>
          </b-card-header>
          <b-card-body>
            <b-table 
              :items="leaveTypes" 
              :fields="typeFields" 
              striped 
              hover
              show-empty
              empty-text="No leave types configured"
            >
              <template #cell(is_active)="data">
                <b-badge :variant="data.value ? 'success' : 'secondary'">
                  {{ data.value ? 'Active' : 'Inactive' }}
                </b-badge>
              </template>

              <template #cell(paid)="data">
                <b-badge :variant="data.value ? 'info' : 'warning'">
                  {{ data.value ? 'Paid' : 'Unpaid' }}
                </b-badge>
              </template>

              <template #cell(requires_approval)="data">
                <b-badge :variant="data.value ? 'primary' : 'success'">
                  {{ data.value ? 'Approval Required' : 'Auto-approved' }}
                </b-badge>
              </template>

              <template #cell(actions)="data">
                <b-button-group size="sm">
                  <b-button 
                    variant="outline-primary" 
                    @click="editType(data.item)"
                    v-b-tooltip.hover title="Edit"
                  >
                    <feather-icon icon="EditIcon" />
                  </b-button>
                  <b-button 
                    :variant="data.item.is_active ? 'outline-warning' : 'outline-success'" 
                    @click="toggleTypeStatus(data.item)"
                    v-b-tooltip.hover :title="data.item.is_active ? 'Deactivate' : 'Activate'"
                  >
                    <feather-icon :icon="data.item.is_active ? 'XIcon' : 'CheckIcon'" />
                  </b-button>
                  <b-button 
                    variant="outline-danger" 
                    @click="confirmDelete(data.item)"
                    v-b-tooltip.hover title="Delete"
                  >
                    <feather-icon icon="TrashIcon" />
                  </b-button>
                </b-button-group>
              </template>
            </b-table>
          </b-card-body>
        </b-card>

        <!-- Global Settings Section -->
        <b-card class="mb-4" no-body>
          <b-card-header class="bg-light">
            <h5 class="mb-0">Global Settings</h5>
          </b-card-header>
          <b-card-body>
            <b-form @submit.prevent="saveGlobalSettings">
              <b-row>
                <b-col md="6">
                  <b-form-group label="Work Week Days" label-for="workweek_days">
                    <b-form-checkbox-group
                      id="workweek_days"
                      v-model="globalSettings.workweek_days"
                      :options="weekDays"
                      stacked
                    />
                  </b-form-group>
                </b-col>
                
                <b-col md="6">
                  <b-form-group 
                    label="Maximum Consecutive Days" 
                    label-for="max_consecutive_days"
                    description="Maximum number of consecutive days allowed for a single leave request"
                  >
                    <b-form-input
                      id="max_consecutive_days"
                      v-model="globalSettings.max_consecutive_days"
                      type="number"
                      min="1"
                      max="365"
                    />
                  </b-form-group>

                  <b-form-group>
                    <b-form-checkbox
                      v-model="globalSettings.allow_overallocation"
                      value="true"
                      unchecked-value="false"
                    >
                      Allow overallocation (employees can request more days than allocated)
                    </b-form-checkbox>
                  </b-form-group>

                  <b-form-group>
                    <b-form-checkbox
                      v-model="globalSettings.auto_approve_for_manager"
                      value="true"
                      unchecked-value="false"
                    >
                      Auto-approve leave requests for managers
                    </b-form-checkbox>
                  </b-form-group>
                </b-col>
              </b-row>

              <b-button type="submit" variant="primary" :disabled="saving">
                <b-spinner small v-if="saving" class="mr-1" />
                Save Global Settings
              </b-button>
            </b-form>
          </b-card-body>
        </b-card>

        <!-- Blackout Periods Section -->
        <b-card no-body>
      <b-card-header class="bg-light">
        <h5 class="mb-0">Blackout Periods</h5>
      </b-card-header>
      <b-card-body>
        <b-table 
          :items="blackoutPeriods" 
          :fields="blackoutFields"
          striped
          hover
          show-empty
          empty-text="No blackout periods configured"
        >
          <template #cell(from_date)="data">
            {{ formatDate(data.value) }}
          </template>
          
          <template #cell(to_date)="data">
            {{ formatDate(data.value) }}
          </template>
          
          <template #cell(status)="data">
            <b-badge :variant="data.value ? 'success' : 'secondary'">
              {{ data.value ? 'Active' : 'Inactive' }}
            </b-badge>
          </template>

          <template #cell(actions)="data">
            <b-button-group size="sm">
              <b-button 
                variant="outline-warning"
                @click="toggleBlackoutStatus(data.item)"
                v-b-tooltip.hover :title="data.item.is_active ? 'Deactivate' : 'Activate'"
              >
                <feather-icon :icon="data.item.is_active ? 'XIcon' : 'CheckIcon'" />
              </b-button>
              <b-button 
                variant="outline-danger"
                @click="confirmDeleteBlackout(data.item)"
                v-b-tooltip.hover title="Delete"
              >
                <feather-icon icon="TrashIcon" />
              </b-button>
            </b-button-group>
          </template>
        </b-table>

        <b-form @submit.prevent="addBlackoutPeriod" class="mt-3">
          <b-row>
            <b-col md="3">
              <b-form-group label="Name">
                <b-form-input
                  v-model="newBlackout.name"
                  placeholder="e.g., Year-end Closing"
                  required
                />
              </b-form-group>
            </b-col>
            <b-col md="3">
              <b-form-group label="From Date">
                <b-form-datepicker
                  v-model="newBlackout.from_date"
                  required
                />
              </b-form-group>
            </b-col>
            <b-col md="3">
              <b-form-group label="To Date">
                <b-form-datepicker
                  v-model="newBlackout.to_date"
                  required
                />
              </b-form-group>
            </b-col>
            <b-col md="2">
              <b-form-group label="Reason">
                <b-form-input
                  v-model="newBlackout.reason"
                  placeholder="e.g., Annual financial closing"
                  required
                />
              </b-form-group>
            </b-col>
            <b-col md="1" class="d-flex align-items-end">
              <b-button type="submit" variant="success" class="mb-3">
                <feather-icon icon="PlusIcon" />
              </b-button>
            </b-col>
          </b-row>
        </b-form>
      </b-card-body>
    </b-card>
      </b-card-body>
    </b-card>

    <!-- Leave Type Modal -->
    <b-modal
      v-model="showTypeModal"
      :title="editingType ? 'Edit Leave Type' : 'Add Leave Type'"
      size="lg"
      @hidden="resetTypeModal"
      @ok="saveType"
    >
      <b-form @submit.prevent="saveType">
        <b-row>
          <b-col md="6">
            <b-form-group label="Type Name" label-for="type_name">
              <b-form-input
                id="type_name"
                v-model="typeForm.name"
                required
                placeholder="e.g., Annual Leave, Sick Leave"
              />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Code" label-for="type_code">
              <b-form-input
                id="type_code"
                v-model="typeForm.code"
                required
                placeholder="e.g., ANNUAL, SICK"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="4">
            <b-form-checkbox
              v-model="typeForm.is_active"
              value="true"
              unchecked-value="false"
            >
              Active
            </b-form-checkbox>
          </b-col>
          <b-col md="4">
            <b-form-checkbox
              v-model="typeForm.requires_approval"
              value="true"
              unchecked-value="false"
            >
              Requires Approval
            </b-form-checkbox>
          </b-col>
          <b-col md="4">
            <b-form-checkbox
              v-model="typeForm.paid"
              value="true"
              unchecked-value="false"
            >
              Paid Leave
            </b-form-checkbox>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="6">
            <b-form-group label="Maximum Days Per Year">
              <b-form-input
                v-model="typeForm.max_days_per_year"
                type="number"
                min="0"
                placeholder="Leave empty for unlimited"
              />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Minimum Notice (Days)">
              <b-form-input
                v-model="typeForm.min_notice_days"
                type="number"
                min="0"
              />
            </b-form-group>
          </b-col>
        </b-row>

        <b-row>
          <b-col md="6">
            <b-form-checkbox
              v-model="typeForm.carry_over"
              value="true"
              unchecked-value="false"
            >
              Allow Carry Over
            </b-form-checkbox>
          </b-col>
          <b-col md="6">
            <b-form-group label="Maximum Carry Over Days" v-if="typeForm.carry_over === 'true'">
              <b-form-input
                v-model="typeForm.max_carry_over_days"
                type="number"
                min="1"
              />
            </b-form-group>
          </b-col>
        </b-row>
      </b-form>
    </b-modal>
  </div>
</template>

<script>
import api from "@/libs/axios";
import loading from "@/views/components/my-components/loading.vue";

export default {
  name: 'DayOffSettings',
  components: { loading },
  data() {
    return {
      loading: false,
      saving: false,
      showTypeModal: false,
      editingType: null,
      leaveTypes: [],
      globalSettings: {
        workweek_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        max_consecutive_days: 30,
        allow_overallocation: false,
        auto_approve_for_manager: true
      },
      blackoutPeriods: [],
      newBlackout: {
        from_date: '',
        to_date: '',
        reason: ''
      },
      typeForm: {
        name: '',
        code: '',
        is_active: 'true',
        requires_approval: 'true',
        paid: 'true',
        max_days_per_year: null,
        carry_over: 'false',
        max_carry_over_days: null,
        min_notice_days: 0
      },
      typeFields: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'code', label: 'Code', sortable: true },
        { key: 'is_active', label: 'Status', sortable: true },
        { key: 'paid', label: 'Type', sortable: true },
        { key: 'requires_approval', label: 'Approval', sortable: true },
        { key: 'max_days_per_year', label: 'Max Days/Year', sortable: true },
        { key: 'actions', label: 'Actions' }
      ],
      blackoutFields: [
        { key: 'from_date', label: 'From Date', sortable: true },
        { key: 'to_date', label: 'To Date', sortable: true },
        { key: 'reason', label: 'Reason', sortable: true },
        { key: 'actions', label: 'Actions' }
      ],
      weekDays: [
        { text: 'Monday', value: 'mon' },
        { text: 'Tuesday', value: 'tue' },
        { text: 'Wednesday', value: 'wed' },
        { text: 'Thursday', value: 'thu' },
        { text: 'Friday', value: 'fri' },
        { text: 'Saturday', value: 'sat' },
        { text: 'Sunday', value: 'sun' }
      ]
    }
  },
  mounted() {
    this.loadSettings();
  },
  methods: {
    async loadSettings() {
      this.loading = true;
      try {
        // Load from your settings endpoint or direct from day_off_types table
        const response = await api.get('/day-off/settings');
        const settings = response.data;
        
        this.leaveTypes = settings.types || [];
        this.globalSettings = settings.global_rules || this.globalSettings;
        this.blackoutPeriods = settings.blackout_periods || [];
        
      } catch (error) {
        console.error('Error loading day off settings:', error);
        this.$bvToast.toast('Error loading settings', {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.loading = false;
      }
    },

    async saveGlobalSettings() {
      this.saving = true;
      try {
        await api.put('/day-off/settings/global', this.globalSettings);
        this.$bvToast.toast('Global settings saved successfully', {
          variant: 'success',
          solid: true
        });
      } catch (error) {
        this.$bvToast.toast('Error saving global settings', {
          variant: 'danger',
          solid: true
        });
      } finally {
        this.saving = false;
      }
    },

    editType(type) {
      this.editingType = type;
      this.typeForm = { ...type };
      // Convert boolean values to string for checkboxes
      Object.keys(this.typeForm).forEach(key => {
        if (typeof this.typeForm[key] === 'boolean') {
          this.typeForm[key] = this.typeForm[key].toString();
        }
      });
      this.showTypeModal = true;
    },

    async saveType() {
      try {
        const payload = { ...this.typeForm };
        // Convert string values back to boolean where needed
        ['is_active', 'requires_approval', 'paid', 'carry_over'].forEach(key => {
          if (payload[key] !== undefined) {
            payload[key] = payload[key] === 'true';
          }
        });

        if (this.editingType) {
          await api.put(`/day-off/types/${this.editingType.id}`, payload);
          this.$bvToast.toast('Leave type updated successfully', {
            variant: 'success',
            solid: true
          });
        } else {
          await api.post('/day-off/types', payload);
          this.$bvToast.toast('Leave type created successfully', {
            variant: 'success',
            solid: true
          });
        }

        this.showTypeModal = false;
        this.loadSettings();
      } catch (error) {
        this.$bvToast.toast('Error saving leave type', {
          variant: 'danger',
          solid: true
        });
      }
    },

    async toggleTypeStatus(type) {
      try {
        await api.patch(`/day-off/types/${type.id}`, {
          is_active: !type.is_active
        });
        
        this.$bvToast.toast(`Leave type ${!type.is_active ? 'activated' : 'deactivated'}`, {
          variant: 'success',
          solid: true
        });
        
        this.loadSettings();
      } catch (error) {
        this.$bvToast.toast('Error updating leave type status', {
          variant: 'danger',
          solid: true
        });
      }
    },

    confirmDelete(type) {
      this.$bvModal.msgBoxConfirm(`Are you sure you want to delete "${type.name}"? This action cannot be undone.`, {
        title: 'Confirm Delete',
        size: 'sm',
        buttonSize: 'sm',
        okVariant: 'danger',
        okTitle: 'Delete',
        cancelTitle: 'Cancel',
        footerClass: 'p-2',
        hideHeaderClose: false,
        centered: true
      }).then(async confirmed => {
        if (confirmed) {
          try {
            await api.delete(`/day-off/types/${type.id}`);
            this.$bvToast.toast('Leave type deleted successfully', {
              variant: 'success',
              solid: true
            });
            this.loadSettings();
          } catch (error) {
            this.$bvToast.toast('Error deleting leave type', {
              variant: 'danger',
              solid: true
            });
          }
        }
      });
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    async loadBlackoutPeriods() {
      try {
        const response = await api.get('/blackout-periods');
        this.blackoutPeriods = response.data.data;
        console.log("black")
        console.log(this.blackoutPeriods)
      } catch (error) {
        console.error('Error loading blackout periods:', error);
        this.$bvToast.toast('Error loading blackout periods', {
          variant: 'danger',
          solid: true
        });
      }
    },

    async addBlackoutPeriod() {
      // Validation
      if (!this.newBlackout.name || !this.newBlackout.from_date || 
          !this.newBlackout.to_date || !this.newBlackout.reason) {
        this.$bvToast.toast('Please fill all fields', {
          variant: 'warning',
          solid: true
        });
        return;
      }

      // Date validation
      if (this.newBlackout.from_date > this.newBlackout.to_date) {
        this.$bvToast.toast('From date cannot be after to date', {
          variant: 'warning',
          solid: true
        });
        return;
      }

      try {
        await api.post('/blackout-periods', this.newBlackout);
        
        this.$bvToast.toast('Blackout period added successfully', {
          variant: 'success',
          solid: true
        });
        
        // Reset form and reload data
        this.resetBlackoutForm();
        this.loadBlackoutPeriods();
      } catch (error) {
        this.$bvToast.toast('Error adding blackout period', {
          variant: 'danger',
          solid: true
        });
      }
    },

    async toggleBlackoutStatus(blackout) {
      try {
        await api.patch(`/blackout-periods/${blackout.id}/toggle-status`);
        
        this.$bvToast.toast(`Blackout period ${!blackout.is_active ? 'activated' : 'deactivated'}`, {
          variant: 'success',
          solid: true
        });
        
        this.loadBlackoutPeriods();
      } catch (error) {
        this.$bvToast.toast('Error updating blackout period', {
          variant: 'danger',
          solid: true
        });
      }
    },

    confirmDeleteBlackout(blackout) {
      this.$bvModal.msgBoxConfirm(
        `Are you sure you want to delete "${blackout.name}"? This will prevent leave requests during this period.`,
        {
          title: 'Confirm Delete',
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'danger',
          okTitle: 'Delete',
          cancelTitle: 'Cancel',
          footerClass: 'p-2',
          hideHeaderClose: false,
          centered: true
        }
      ).then(async confirmed => {
        if (confirmed) {
          try {
            await api.delete(`/blackout-periods/${blackout.id}`);
            
            this.$bvToast.toast('Blackout period deleted successfully', {
              variant: 'success',
              solid: true
            });
            
            this.loadBlackoutPeriods();
          } catch (error) {
            this.$bvToast.toast('Error deleting blackout period', {
              variant: 'danger',
              solid: true
            });
          }
        }
      });
    },

    resetBlackoutForm() {
      this.newBlackout = {
        name: '',
        from_date: '',
        to_date: '',
        reason: '',
        is_active: true
      };
    },

    resetTypeModal() {
      this.editingType = null;
      this.typeForm = {
        name: '',
        code: '',
        is_active: 'true',
        requires_approval: 'true',
        paid: 'true',
        max_days_per_year: null,
        carry_over: 'false',
        max_carry_over_days: null,
        min_notice_days: 0
      };
    }
  }
}
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>