<template>
  <div>
    <loading :visible="load" text="Processing..." />
  <b-card title="check In">
    <b-button :disabled="userData && !userData.canCheckIn"  variant="success" @click="clock('in')">Check In</b-button>
    <div v-if="lastRecord && lastRecord.type == 'in'">
      <!-- Last: {{ lastRecord.type }} at {{ lastRecord.timestamp }} -->
    </div>
  </b-card>

  <b-card title="check Out" class="mt-2">
    <b-button :disabled="userData && !userData.canCheckOut" variant="danger" @click="clock('out')">Check Out</b-button>
    <div v-if="lastRecord && lastRecord.type == 'out'">
      <!-- Last: {{ lastRecord.type }} at {{ lastRecord.timestamp }} -->
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
    return { lastRecord: null, userData: null, load: false };
  },
  mounted() {
      this.getUserData();
  },
  methods: {
    getUserData(){
      this.load = true
      api.get("/attendance/can-clock").then((response) => {
        this.userData = response.data;
        this.load = false
      }).catch((error) => {
        this.userData = null;
        this.load = false
      });
    },
    async clock(type) {
      this.load = true
      const res = await api.post("/attendance/clock", { type }).then((response) => {
        this.getUserData();
        let responseToast = "Checked " + type + " successfully";
        this.$bvToast.toast(responseToast, {
          title: "success",
          variant: "success",
          solid: true,
        });
        return response;
      }).catch((error) => {
        console.log(error.response.data.error);
        this.$bvToast.toast(error.response.data.error, {
          title: "Error",
          variant: "danger",
          solid: true,
        });
      });
      this.lastRecord = res.data;
      this.load = false
    },
  },
};
</script>
