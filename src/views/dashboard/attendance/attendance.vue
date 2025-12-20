<template>
  <div>
    <loading :visible="loading" text="Processing..." />

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
            size="lg"
            variant="success"
            :disabled="!canCheckIn || loading"
            @click="clock('in')"
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
            size="lg"
            variant="danger"
            :disabled="!canCheckOut || loading"
            @click="clock('out')"
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

    async clock(type) {
      // type = 'in' or 'out'
      this.loading = true;
      this.errorMessage = null;

      try {
        const res = await api.post("/attendance/clock", { type });
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

        // Optionally open modal or show details of created record
        // e.g. payload.status and payload.meta are available if controller provides them
      } catch (err) {
        // show server message if present
        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.error ??
          err?.response?.data ??
          "Failed to process request";
        this.$bvToast.toast(msg, {
          title: "Error",
          variant: "danger",
          solid: true,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
/* small spacing */
.mb-3 { margin-bottom: 1rem; }
</style>
