<template>
  <div>
    <loading
      :visible="loading"
      text="Loading..."
    />
    <b-card>
      <b-card-header>
        <b-row class="align-items-center">
          <b-col>
            <h4 class="mb-0">
              Day Off Settings
            </h4>
            <p class="text-muted mb-0">
              Configure leave types and policies
            </p>
          </b-col>
          <b-col cols="auto">
            <b-button
              variant="primary"
              @click="showTypeModal = true"
            >
              <feather-icon
                icon="PlusIcon"
                class="mr-1"
              />
              Add Leave Type
            </b-button>
          </b-col>
        </b-row>
      </b-card-header>

      <b-card-body>
        <!-- Leave Types Section -->
        <BaseTable
          title="Leave Types"
          :items="leaveTypes"
          :fields="typeFields"
          :striped="true"
          :hover="true"
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

          <template #cell(allow_during_blackout)="data">
            <b-badge :variant="data.value ? 'warning' : 'secondary'">
              {{ data.value ? 'Allowed' : 'Not Allowed' }}
            </b-badge>
          </template>

          <template #cell(actions)="data">
            <b-button-group size="sm">
              <b-button
                v-b-tooltip.hover
                variant="outline-primary"
                title="Edit"
                @click="editType(data.item)"
              >
                <feather-icon icon="EditIcon" />
              </b-button>
              <b-button
                v-b-tooltip.hover
                :variant="data.item.is_active ? 'outline-warning' : 'outline-success'"
                :title="data.item.is_active ? 'Deactivate' : 'Activate'"
                @click="toggleTypeStatus(data.item)"
              >
                <feather-icon :icon="data.item.is_active ? 'XIcon' : 'CheckIcon'" />
              </b-button>
              <b-button
                v-b-tooltip.hover
                variant="outline-danger"
                title="Delete"
                @click="confirmDelete(data.item)"
              >
                <feather-icon icon="TrashIcon" />
              </b-button>
            </b-button-group>
          </template>
        </BaseTable>

        <!-- Global Settings Section -->
        <b-card
          class="mb-4"
          no-body
        >
          <b-card-header class="bg-light">
            <h5 class="mb-0">
              Global Settings
            </h5>
          </b-card-header>
          <b-card-body>
            <b-form @submit.prevent="saveGlobalSettings">
              <b-row>
                <b-col md="12">
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

              <b-button
                type="submit"
                variant="primary"
                :disabled="saving"
              >
                <b-spinner
                  v-if="saving"
                  small
                  class="mr-1"
                />
                Save Global Settings
              </b-button>
            </b-form>
          </b-card-body>
        </b-card>

        <!-- Official Holidays Section -->
        <BaseTable
          title="Official Holidays"
          :items="officialHolidays"
          :fields="holidayFields"
          :striped="true"
          :hover="true"
        >
          <template #cell(date)="data">
            {{ formatDate(data.value) }}
          </template>

          <template #cell(is_active)="data">
            <b-badge :variant="data.value ? 'success' : 'secondary'">
              {{ data.value ? 'Active' : 'Inactive' }}
            </b-badge>
          </template>

          <template #cell(actions)="data">
            <b-button-group size="sm">
              <b-button
                v-b-tooltip.hover
                variant="outline-warning"
                :title="data.item.is_active ? 'Deactivate' : 'Activate'"
                @click="toggleHolidayStatus(data.item)"
              >
                <feather-icon :icon="data.item.is_active ? 'XIcon' : 'CheckIcon'" />
              </b-button>
              <b-button
                v-b-tooltip.hover
                variant="outline-danger"
                title="Delete"
                @click="confirmDeleteHoliday(data.item)"
              >
                <feather-icon icon="TrashIcon" />
              </b-button>
            </b-button-group>
          </template>
        </BaseTable>

        <b-form
          class="mt-3"
          @submit.prevent="addOfficialHoliday"
        >
          <b-row>
            <b-col md="4">
              <b-form-group label="Holiday Name">
                <b-form-input
                  v-model="newHoliday.name"
                  placeholder="e.g., New Year's Day"
                  required
                />
              </b-form-group>
            </b-col>
            <b-col md="3">
              <b-form-group label="Date">
                <b-form-datepicker
                  v-model="newHoliday.date"
                  required
                />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="Description">
                <b-form-input
                  v-model="newHoliday.description"
                  placeholder="Optional description"
                />
              </b-form-group>
            </b-col>
            <b-col
              md="1"
              class="d-flex align-items-end"
            >
              <b-button
                type="submit"
                variant="success"
                class="mb-3"
              >
                <feather-icon icon="PlusIcon" />
              </b-button>
            </b-col>
          </b-row>
        </b-form>
      </b-card-body>
    </b-card>

    <!-- Blackout Periods Section -->
    <BaseTable
      title="Blackout Periods"
      :items="blackoutPeriods"
      :fields="blackoutFields"
      :striped="true"
      :hover="true"
    >
      <template #cell(from_date)="data">
        {{ formatDate(data.value) }}
      </template>

      <template #cell(to_date)="data">
        {{ formatDate(data.value) }}
      </template>

      <template #cell(is_active)="data">
        <b-badge :variant="data.value ? 'success' : 'secondary'">
          {{ data.value ? 'Active' : 'Inactive' }}
        </b-badge>
      </template>

      <template #cell(actions)="data">
        <b-button-group size="sm">
          <b-button
            v-b-tooltip.hover
            variant="outline-warning"
            :title="data.item.is_active ? 'Deactivate' : 'Activate'"
            @click="toggleBlackoutStatus(data.item)"
          >
            <feather-icon :icon="data.item.is_active ? 'XIcon' : 'CheckIcon'" />
          </b-button>
          <b-button
            v-b-tooltip.hover
            variant="outline-danger"
            title="Delete"
            @click="confirmDeleteBlackout(data.item)"
          >
            <feather-icon icon="TrashIcon" />
          </b-button>
        </b-button-group>
      </template>
    </BaseTable>

    <b-form
      class="mt-3"
      @submit.prevent="addBlackoutPeriod"
    >
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
        <b-col
          md="1"
          class="d-flex align-items-end"
        >
          <b-button
            type="submit"
            variant="success"
            class="mb-3"
          >
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
            <b-form-group
              label="Type Name"
              label-for="type_name"
            >
              <b-form-input
                id="type_name"
                v-model="typeForm.name"
                required
                placeholder="e.g., Annual Leave, Sick Leave"
              />
            </b-form-group>
          </b-col>
          
          
        </b-row>

        <b-row>
          <b-col md="3">
            <b-form-checkbox
              v-model="typeForm.is_active"
              value="true"
              unchecked-value="false"
            >
              Active
            </b-form-checkbox>
          </b-col>
          <b-col md="3">
            <b-form-checkbox
              v-model="typeForm.requires_approval"
              value="true"
              unchecked-value="false"
            >
              Requires Approval
            </b-form-checkbox>
          </b-col>
          <b-col md="3">
            <b-form-checkbox
              v-model="typeForm.paid"
              value="true"
              unchecked-value="false"
            >
              Paid Leave
            </b-form-checkbox>
          </b-col>
          <b-col md="3">
            <b-form-checkbox
              v-model="typeForm.allow_during_blackout"
              value="true"
              unchecked-value="false"
            >
              Allow During Blackout
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
            <b-form-group
              v-if="typeForm.carry_over === 'true'"
              label="Maximum Carry Over Days"
            >
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
import api from '@/libs/axios'
import loading from '@/views/components/my-components/loading.vue'
import BaseTable from '@/views/components/my-components/table.vue'

export default {
  name: 'DayOffSettings',
  components: { loading, BaseTable },
  data() {
    return {
      loading: false,
      saving: false,
      showTypeModal: false,
      editingType: null,
      leaveTypes: [],
      globalSettings: {
        max_consecutive_days: 30,
        allow_overallocation: false,
        auto_approve_for_manager: true,
      },
      blackoutPeriods: [],
      newBlackout: {
        from_date: '',
        to_date: '',
        reason: '',
      },
      typeForm: {
        name: '',
        is_active: 'true',
        requires_approval: 'true',
        paid: 'true',
        allow_during_blackout: 'false',
        max_days_per_year: null,
        carry_over: 'false',
        max_carry_over_days: null,
        min_notice_days: 0,
      },
      typeFields: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'is_active', label: 'Status', sortable: true },
        { key: 'paid', label: 'Type', sortable: true },
        { key: 'requires_approval', label: 'Approval', sortable: true },
        { key: 'allow_during_blackout', label: 'Blackout Allowed', sortable: true },
        { key: 'max_days_per_year', label: 'Max Days/Year', sortable: true },
        { key: 'actions', label: 'Actions' },
      ],
      blackoutFields: [
        { key: 'from_date', label: 'From Date', sortable: true },
        { key: 'to_date', label: 'To Date', sortable: true },
        { key: 'reason', label: 'Reason', sortable: true },
        { key: 'is_active', label: 'Status', sortable: true },
        { key: 'actions', label: 'Actions' },
      ],
      officialHolidays: [],
      newHoliday: {
        name: '',
        date: '',
        description: '',
        is_active: true,
      },
      holidayFields: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'description', label: 'Description' },
        { key: 'is_active', label: 'Status' },
        { key: 'actions', label: 'Actions' },
      ],
    }
  },
  mounted() {
    this.loadSettings()
  },
  methods: {
    async loadSettings() {
      this.loading = true
      try {
        const response = await api.get('/day-off/settings')
        const settings = response.data

        this.leaveTypes = settings.types || []
        this.globalSettings = settings.global_rules || this.globalSettings
        this.blackoutPeriods = settings.blackout_periods || []
        this.officialHolidays = settings.official_holidays || []
      } catch (error) {
        console.error('Error loading day off settings:', error)
        this.$bvToast.toast('Error loading settings', {
          variant: 'danger',
          solid: true,
        })
      } finally {
        this.loading = false
      }
    },

    async saveGlobalSettings() {
      this.saving = true
      try {
        await api.put('/day-off/settings/global', this.globalSettings)
        this.$bvToast.toast('Global settings saved successfully', {
          variant: 'success',
          solid: true,
        })
      } catch (error) {
        this.$bvToast.toast('Error saving global settings', {
          variant: 'danger',
          solid: true,
        })
      } finally {
        this.saving = false
      }
    },

    editType(type) {
      this.editingType = type
      this.typeForm = { ...type }
      // Convert boolean values to string for checkboxes
      Object.keys(this.typeForm).forEach(key => {
        if (typeof this.typeForm[key] === 'boolean') {
          this.typeForm[key] = this.typeForm[key].toString()
        }
      })
      this.showTypeModal = true
    },

    async saveType() {
      try {
        const payload = { ...this.typeForm };
        // Convert string values back to boolean where needed
        ['is_active', 'requires_approval', 'paid', 'carry_over', 'allow_during_blackout'].forEach(key => {
          if (payload[key] !== undefined) {
            payload[key] = payload[key] === 'true'
          }
        })

        if (this.editingType) {
          await api.put(`/day-off/types/${this.editingType.id}`, payload)
          this.$bvToast.toast('Leave type updated successfully', {
            variant: 'success',
            solid: true,
          })
        } else {
          await api.post('/day-off/types', payload)
          this.$bvToast.toast('Leave type created successfully', {
            variant: 'success',
            solid: true,
          })
        }

        this.showTypeModal = false
        this.loadSettings()
      } catch (error) {
        this.$bvToast.toast('Error saving leave type', {
          variant: 'danger',
          solid: true,
        })
      }
    },

    async toggleTypeStatus(type) {
      try {
        await api.patch(`/day-off/types/${type.id}`, {
          is_active: !type.is_active,
        })

        this.$bvToast.toast(`Leave type ${!type.is_active ? 'activated' : 'deactivated'}`, {
          variant: 'success',
          solid: true,
        })

        this.loadSettings()
      } catch (error) {
        this.$bvToast.toast('Error updating leave type status', {
          variant: 'danger',
          solid: true,
        })
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
        centered: true,
      }).then(async confirmed => {
        if (confirmed) {
          try {
            await api.delete(`/day-off/types/${type.id}`)
            this.$bvToast.toast('Leave type deleted successfully', {
              variant: 'success',
              solid: true,
            })
            this.loadSettings()
          } catch (error) {
            this.$bvToast.toast('Error deleting leave type', {
              variant: 'danger',
              solid: true,
            })
          }
        }
      })
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },

    async loadBlackoutPeriods() {
      try {
        const response = await api.get('/blackout-periods')
        this.blackoutPeriods = response.data.data
      } catch (error) {
        console.error('Error loading blackout periods:', error)
        this.$bvToast.toast('Error loading blackout periods', {
          variant: 'danger',
          solid: true,
        })
      }
    },

    async addBlackoutPeriod() {
      if (!this.newBlackout.name || !this.newBlackout.from_date
          || !this.newBlackout.to_date || !this.newBlackout.reason) {
        this.$bvToast.toast('Please fill all fields', {
          variant: 'warning',
          solid: true,
        })
        return
      }

      if (this.newBlackout.from_date > this.newBlackout.to_date) {
        this.$bvToast.toast('From date cannot be after to date', {
          variant: 'warning',
          solid: true,
        })
        return
      }

      try {
        await api.post('/blackout-periods', this.newBlackout)

        this.$bvToast.toast('Blackout period added successfully', {
          variant: 'success',
          solid: true,
        })

        this.resetBlackoutForm()
        this.loadBlackoutPeriods()
      } catch (error) {
        this.$bvToast.toast('Error adding blackout period', {
          variant: 'danger',
          solid: true,
        })
      }
    },

    async toggleBlackoutStatus(blackout) {
      try {
        await api.patch(`/blackout-periods/${blackout.id}/toggle-status`)

        this.$bvToast.toast(`Blackout period ${!blackout.is_active ? 'activated' : 'deactivated'}`, {
          variant: 'success',
          solid: true,
        })

        this.loadBlackoutPeriods()
      } catch (error) {
        this.$bvToast.toast('Error updating blackout period', {
          variant: 'danger',
          solid: true,
        })
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
          centered: true,
        },
      ).then(async confirmed => {
        if (confirmed) {
          try {
            await api.delete(`/blackout-periods/${blackout.id}`)

            this.$bvToast.toast('Blackout period deleted successfully', {
              variant: 'success',
              solid: true,
            })

            this.loadBlackoutPeriods()
          } catch (error) {
            this.$bvToast.toast('Error deleting blackout period', {
              variant: 'danger',
              solid: true,
            })
          }
        }
      })
    },

    resetBlackoutForm() {
      this.newBlackout = {
        name: '',
        from_date: '',
        to_date: '',
        reason: '',
        is_active: true,
      }
    },

    async loadOfficialHolidays() {
      try {
        const response = await api.get('/official-holidays')
        this.officialHolidays = response.data.data
      } catch (error) {
        console.error('Error loading official holidays:', error)
        this.$bvToast.toast('Error loading official holidays', {
          variant: 'danger',
          solid: true,
        })
      }
    },

    async addOfficialHoliday() {
      if (!this.newHoliday.name || !this.newHoliday.date) {
        this.$bvToast.toast('Please fill all required fields', {
          variant: 'warning',
          solid: true,
        })
        return
      }

      try {
        await api.post('/official-holidays', this.newHoliday)
        this.$bvToast.toast('Official holiday added successfully', {
          variant: 'success',
          solid: true,
        })
        this.resetHolidayForm()
        this.loadOfficialHolidays()
      } catch (error) {
        this.$bvToast.toast('Error adding official holiday', {
          variant: 'danger',
          solid: true,
        })
      }
    },

    async toggleHolidayStatus(holiday) {
      try {
        await api.patch(`/official-holidays/${holiday.id}/toggle-status`)
        this.$bvToast.toast(`Holiday ${!holiday.is_active ? 'activated' : 'deactivated'}`, {
          variant: 'success',
          solid: true,
        })
        this.loadOfficialHolidays()
      } catch (error) {
        this.$bvToast.toast('Error updating holiday status', {
          variant: 'danger',
          solid: true,
        })
      }
    },

    confirmDeleteHoliday(holiday) {
      this.$bvModal.msgBoxConfirm(
        `Are you sure you want to delete "${holiday.name}"?`,
        {
          title: 'Confirm Delete',
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'danger',
          okTitle: 'Delete',
          cancelTitle: 'Cancel',
          footerClass: 'p-2',
          hideHeaderClose: false,
          centered: true,
        },
      ).then(async confirmed => {
        if (confirmed) {
          try {
            await api.delete(`/official-holidays/${holiday.id}`)
            this.$bvToast.toast('Official holiday deleted successfully', {
              variant: 'success',
              solid: true,
            })
            this.loadOfficialHolidays()
          } catch (error) {
            this.$bvToast.toast('Error deleting official holiday', {
              variant: 'danger',
              solid: true,
            })
          }
        }
      })
    },

    resetHolidayForm() {
      this.newHoliday = {
        name: '',
        date: '',
        description: '',
        is_active: true,
      }
    },

    resetTypeModal() {
      this.editingType = null
      this.typeForm = {
        name: '',
        is_active: 'true',
        requires_approval: 'true',
        paid: 'true',
        allow_during_blackout: 'false',
        max_days_per_year: null,
        carry_over: 'false',
        max_carry_over_days: null,
        min_notice_days: 0,
      }
    },
  },
}
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
