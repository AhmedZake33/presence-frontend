<template>
  <div v-if="visible" class="d-flex align-items-center mr-2">
    <feather-icon icon="ClockIcon" size="18" class="mr-50 text-primary" />
    <h4 class="mb-0 text-primary font-weight-bolder">{{ duration }}</h4>
  </div>
</template>

<script>
export default {
  data() {
    return {
      duration: "00:00:00",
      interval: null,
    };
  },
  computed: {
    visible() {
      return this.$store.getters["attendance/isCheckedIn"];
    },
    startTime() {
      return this.$store.getters["attendance/startTime"];
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) this.startTimer();
        else this.stopTimer();
      },
    },
  },
  beforeDestroy() {
    this.stopTimer();
  },
  methods: {
    startTimer() {
      this.stopTimer();
      if (!this.startTime) return;

      this.updateDuration();
      this.interval = setInterval(this.updateDuration, 1000);
    },
    stopTimer() {
      if (this.interval) clearInterval(this.interval);
      this.interval = null;
    },
    updateDuration() {
      const now = new Date().getTime();
      let diff = now - this.startTime;
      if (diff < 0) diff = 0;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (num) => num.toString().padStart(2, "0");
      this.duration = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    },
  },
};
</script>
