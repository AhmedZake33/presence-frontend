<template>
  <div>
    <loading :visible="loading" text="Processing..." />
    <div v-if="!checkoutRecord && currentDuration" class="mt-2">
      <h2 class="text-primary mb-0">{{ currentDuration }}</h2>
    </div>
    <b-card class="mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-0">Check In</h5>
          <small class="text-muted" v-if="!canData || !canData.allow_any_time">
            <span v-if="scheduledCheckIn">Scheduled: <strong>{{ scheduledCheckIn || '-' }}</strong></span>
            <span v-if="canClockMessage"> — {{ canClockMessage }}</span>
          </small>
        </div>
        <div>
          <b-button
            v-if="!canCheckIn || loading"
            size="lg"
            variant="success"
            disabled="true"
            >
            Check In
          </b-button>
          <b-button
            v-else
            size="lg"
            variant="success"
            :disabled="!canCheckIn || loading"
            @click="startChallenge('in')"
          >
            Check In
          </b-button>
        </div>
      </div>

      <div class="mt-3" v-if="checkinRecord">
        <b-badge variant="primary">Checked in</b-badge>
        <small class="ml-2">at <strong>{{ checkinRecord.time }}</strong></small>
        <small class="ml-2 text-muted">({{ checkinRecord.status || 'status unknown' }})</small>
      </div>
    </b-card>

    <b-card>
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h5 class="mb-0">Check Out</h5>
          <small class="text-muted" v-if="!canData || !canData.allow_any_time">
            <span v-if="scheduledCheckOut">Scheduled: <strong>{{ scheduledCheckOut || '-' }}</strong></span>
          </small>
        </div>
        <div>
          <b-button
            v-if="!canCheckOut || loading"
            size="lg"
            variant="danger"
            disabled="true"
            >
            Check Out
          </b-button>
          <b-button
            v-else
            size="lg"
            variant="danger"
            :disabled="!canCheckOut || loading"
            @click="startChallenge('out')"
          >
            Check Out
          </b-button>
        </div>
      </div>

      <div class="mt-3" v-if="checkoutRecord">
        <b-badge variant="dark">Checked out</b-badge>
        <small class="ml-2">at <strong>{{ checkoutRecord.time }}</strong></small>
        <small class="ml-2 text-muted">({{ checkoutRecord.status || 'status unknown' }})</small>
      </div>
    </b-card>

    <!-- Challenge Modal -->
    <b-modal
      v-model="challengeModal"
      title="Security Verification"
      no-close-on-backdrop
      no-close-on-esc
      centered
      @hidden="resetChallenge"
    >
      <div v-if="challengeQuestion" class="text-center">
        <p class="mb-2">Please solve the following to continue:</p>
        <h3 class="text-primary mb-3">{{ challengeQuestion }}</h3>
        <b-form-input
          v-model="challengeAnswer"
          type="number"
          placeholder="Your answer"
          class="text-center"
          :state="challengeError ? false : null"
          @keyup.enter="submitChallenge"
          autofocus
        />
        <b-form-invalid-feedback :state="challengeError ? false : null">
          {{ challengeError }}
        </b-form-invalid-feedback>
      </div>
      <div v-else class="text-center">
        <b-spinner small /> Loading question...
      </div>
      <template #modal-footer>
        <b-button variant="secondary" @click="challengeModal = false">Cancel</b-button>
        <b-button
          variant="primary"
          :disabled="challengeAnswer === '' || challengeAnswer === null || challengeSubmitting"
          @click="submitChallenge"
        >
          <b-spinner small v-if="challengeSubmitting" /> Submit
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script>
import api from "@/libs/axios";
import loading from "@/views/components/my-components/loading.vue";

export default {
  components: { loading },
  data() {
    return {
      loading: false,
      canData: null, // response from /attendance/can-clock
      todayRecords: [], // response from /attendance/today
      errorMessage: null,
      // Challenge state
      challengeModal: false,
      challengeQuestion: null,
      challengeToken: null,
      challengeAnswer: null,
      challengeError: null,
      challengeType: null, // 'in' or 'out'
      challengeSubmitting: false,
    };
  },
  computed: {
    // computed helpers for easier template usage
    canCheckIn() {
      return !!(this.canData && this.canData.canCheckIn);
    },
    canCheckOut() {
      return !!(this.canData && this.canData.canCheckOut);
    },
    scheduledCheckIn() {
      return this.canData?.scheduledCheckIn ?? (this.canData?.data?.scheduledCheckIn ?? null);
    },
    scheduledCheckOut() {
      return this.canData?.scheduledCheckOut ?? (this.canData?.data?.scheduledCheckOut ?? null);
    },
    canClockMessage() {
      return this.canData?.message || null;
    },
    // today's checkin/checkout records (pick by type)
    checkinRecord() {
      return this.todayRecords.find(r => r.type === 'in') || null;
    },
    checkoutRecord() {
      return this.todayRecords.find(r => r.type === 'out') || null;
    }
  },
  async mounted() {
    await this.reloadAll();
  },
  methods: {
    async reloadAll() {
      // load can-clock and today records in parallel
      this.loading = true;
      try {
        await Promise.all([this.getCanClock(), this.getToday()]);
        // Sync global timer
        await this.$store.dispatch('attendance/fetchAttendanceStatus');
      } finally {
        this.loading = false;
      }
    },

    async getCanClock() {
      try {
        const res = await api.get("/attendance/can-clock");
        // prefer res.data.data if your API nests under data; handle both shapes
        this.canData = res.data?.data ?? res.data ?? null;
      } catch (err) {
        // 403 (non-working day) or other errors
        if (err.response) {
          // copy server message into canData for UI use
          this.canData = {
            canCheckIn: false,
            canCheckOut: false,
            hasCheckedIn: false,
            hasCheckedOut: false,
            message: err.response.data?.message || err.response.data || 'Unavailable',
          };
        } else {
          this.canData = null;
        }
      }
    },

    async getToday() {
      try {
        const res = await api.get("/attendance/today");
        // res.data.data may be array of attendance objects
        const rows = res.data?.data ?? res.data ?? [];
        // normalize items so they have 'type' and 'time' fields
        this.todayRecords = rows.map(r => {
          // r.time may already exist, fallback to formatting timestamp
          const time = r.time || (r.timestamp ? (new Date(r.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : null);
          return {
            ...r,
            time,
            status: r.status ?? (r.meta?.status ?? null),
          };
        });
      } catch (err) {
        this.todayRecords = [];
      }
    },

    async startChallenge(type) {
      this.challengeType = type;
      this.challengeAnswer = null;
      this.challengeError = null;
      this.challengeQuestion = null;
      this.challengeToken = null;
      this.challengeModal = true;

      try {
        const res = await api.get("/attendance/challenge");
        const data = res.data?.data ?? res.data;
        this.challengeToken = data.token;
        this.challengeQuestion = data.question;
      } catch (err) {
        this.challengeModal = false;
        this.$bvToast.toast("Failed to load security question. Please try again.", {
          title: "Error",
          variant: "danger",
          solid: true,
        });
      }
    },

    resetChallenge() {
      this.challengeQuestion = null;
      this.challengeToken = null;
      this.challengeAnswer = null;
      this.challengeError = null;
      this.challengeType = null;
      this.challengeSubmitting = false;
    },

    async submitChallenge() {
      if (this.challengeAnswer === null || this.challengeAnswer === '') return;
      this.challengeSubmitting = true;
      this.challengeError = null;

      try {
        this.loading = true;
        await this.clock(this.challengeType, this.challengeToken, parseInt(this.challengeAnswer));
        this.challengeModal = false;
      } catch (err) {
        this.loading = false;
        // If challenge failed, fetch a new one
        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.error ??
          "Incorrect answer. Please try again.";
        this.challengeError = msg;
        // Reload a new challenge question
        try {
          const res = await api.get("/attendance/challenge");
          const data = res.data?.data ?? res.data;
          this.challengeToken = data.token;
          this.challengeQuestion = data.question;
          this.challengeAnswer = null;
        } catch (_) {
          this.challengeModal = false;
        }
      } finally {
        this.challengeSubmitting = false;
      }
    },

    async clock(type, challengeToken, challengeAnswer) {
      // type = 'in' or 'out'
      this.errorMessage = null;

      const res = await api.post("/attendance/clock", {
        type,
        challenge_token: challengeToken,
        challenge_answer: challengeAnswer,
      });
      // API returns data under res.data.data per updated controller
      const payload = res.data?.data ?? res.data ?? null;

      // show toast
      this.$bvToast.toast(`Checked ${type} successfully`, {
        title: "Success",
        variant: "success",
        solid: true,
      });

      // refresh both can-clock and today's records
      await this.getCanClock();
      await this.getToday();
      
      // Sync global timer
      await this.$store.dispatch('attendance/fetchAttendanceStatus');
      this.loading = false;
    },
  },
};
</script>

<style scoped>
/* small spacing */
.mb-3 { margin-bottom: 1rem; }
</style>
