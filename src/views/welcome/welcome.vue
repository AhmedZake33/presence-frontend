<template>
  <div class="d-flex justify-content-center align-items-center h-100">
    <b-card
      class="text-center shadow-sm p-4"
      style="max-width: 400px; width: 100%;"
    >
      <b-avatar
        size="4rem"
        variant="light-primary"
        class="mb-2"
        icon="user"
      />
      <h3 class="mb-2">Welcome, {{ userName }}</h3>

      <p class="text-muted mb-1">
        Role: <strong>{{ userRole }}</strong>
      </p>

      <b-badge variant="success" v-if="isAdmin">Admin Access</b-badge>
      <b-badge variant="info" v-else-if="isManager">Manager Access</b-badge>
      <b-badge variant="secondary" v-else>Student Access</b-badge>
    </b-card>
  </div>
</template>

<script>
export default {
  computed: {
    user() {
      return this.$store.state.auth.user || JSON.parse(localStorage.getItem('user')) || {}
    },
    userName() {
      return this.user.name || 'User'
    },
    userRole() {
      return this.user?.type?.name || 'Guest'
    },
    isAdmin() {
      return this.userRole === 'admin'
    },
    isManager() {
      return this.userRole === 'manager'
    },
    isStudent() {
      return this.userRole === 'student'
    },
  },
}
</script>

<style scoped>
.shadow-sm {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
</style>
