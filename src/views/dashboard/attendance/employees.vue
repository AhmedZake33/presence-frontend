<template>
  <div>
    <loading :visible="load" text="Processing..." />

    <!-- <b-button
      variant="primary"
      class="mb-1 mb-sm-0 mr-0 mr-sm-1"
      @click="showModal = true"
    >
      Add New User
    </b-button> -->

    <b-modal
      v-model="showModal"
      title="Add New User"
      @hidden="resetForm"
      hide-footer
    >
    <b-form @submit.prevent="submitForm">
      <b-form-group label="Name" label-for="name">
        <b-form-input
          id="name"
          v-model="form.name"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group label="Email" label-for="email">
        <b-form-input
          id="email"
          type="email"
          v-model="form.email"
          required
        ></b-form-input>
      </b-form-group>

      <b-form-group label="Type" label-for="type">
        <b-form-select
          id="type"
          v-model="form.type"
          required
        >
            <option :value="null" disabled>
                {{ $t("Please select an type") }}
            </option>
          <option
            v-for="type in types"
            :id="`slot-option-${type.id}`"
            :key="type.id"
            :value="type.id"
          >
            {{ type["value"] }}
          </option>
    </b-form-select>
      </b-form-group>

      <b-form-group label="Password" label-for="Password">
        <b-form-input
          id="password"
          v-model="form.password"
          required
        ></b-form-input>
      </b-form-group>

      <b-button type="submit" variant="primary">Submit</b-button>
    </b-form>
      
    </b-modal>
    <base-table
      title="Users List"
      :items="users"
      :fields="fields"
      :add="true"
      @add="showModal = true"
    >
      
    </base-table>
  </div>
</template>

<script>
import BaseTable from '@/views/components/my-components/table.vue'
import api from "@/libs/axios";
import loading from "@/views/components/my-components/loading.vue";

export default {
  components: { BaseTable, loading },
  data() {
    return {
      fields: [
        { key: 'name', label: 'Name' },
        {key: 'check_in', label: 'Check In'},
        {key: 'browser_in', label: 'browser'},
        {key: 'check_out', label: 'Check Out'},
        {key: 'browser_out', label: 'browser'},
      ],
      users: [],
      load: false,
      showModal: false,
      form: {},
      types: [
        { id: 1, value: 'admin', text: 'Admin' },
        { id: 2, value: 'employee', text: 'Employee' },
      ],
        
    }
  },
  mounted(){
    this.getAllUser();
  },
  methods: {
    resetForm() {
      this.form = {};
    },
    submitForm() {
        api.post("/users", this.form).then((response) => {
            this.$bvToast.toast('User added successfully', {
              title: "Success",
              variant: "success",
              solid: true,
            });
            this.showModal = false;
            this.getAllUser();
          }).catch((error) => {
            this.$bvToast.toast(error.response.data.error || 'Error adding user', {
              title: "Error",
              variant: "danger",
              solid: true,
            });
          });
      console.log(this.form);
    },
    getAllUser(){
        this.load = true
        api.get("/attendance/daily").then((response) => {
            this.users = response.data;
            this.load = false
          }).catch((error) => {
            this.users = [];
            this.load = false
          });
        // Fetch users from API and update this.users
          
    },
    editUser(user) {
      alert('Edit ' + user.name)
    },
    deleteUser(user) {
      alert('Delete ' + user.name)
    },
  },
}
</script>
