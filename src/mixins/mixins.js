export default {
  methods: {
    auth() {
      return this.$store.state.auth.user;
    },
    sum(a, b) {
      return a + b;
    }
  }
}
