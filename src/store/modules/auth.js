// src/store/modules/auth.js
export default {
  namespaced: true,
  state: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
  },
  getters: {
    isLoggedIn: state => !!state.token,
    userRole: state => state.user?.type?.name || 'admin',
  },
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    LOGOUT(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
  actions: {
    // Fake login example (replace with real API call)
    login({ commit }, { username, password }) {
      // Normally you call an API here
      const fakeToken = '123456'
      const fakeUser = { id: 1, name: username, role: 'user' } // change role if needed

      commit('SET_TOKEN', fakeToken)
      commit('SET_USER', fakeUser)
    },
    logout({ commit }) {
      commit('LOGOUT')
    },
  },
}
