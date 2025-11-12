// src/store/modules/settings.js
import api from '@/libs/axios' // your axios instance

export default {
  namespaced: true,
  state: {
    all: {}, // key => value
    loading: false,
    error: null,
  },
  getters: {
    get: state => key => state.all[key] || null,
  },
  mutations: {
    SET_ALL(state, payload) { state.all = payload },
    SET_ITEM(state, { key, value }) { state.all = { ...state.all, [key]: value } },
    SET_LOADING(state, val) { state.loading = val },
    SET_ERROR(state, err) { state.error = err },
  },
  actions: {
    async fetchAll({ commit }) {
      commit('SET_LOADING', true)
      try {
        const res = await api.get('/settings')
        commit('SET_ALL', res.data.data || {})
      } catch (e) {
        commit('SET_ERROR', e)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async fetch({ commit }, key) {
      commit('SET_LOADING', true)
      try {
        const res = await api.get(`/settings/${key}`)
        commit('SET_ITEM', { key, value: res.data.data })
      } catch (e) {
        commit('SET_ERROR', e)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    async update({ commit }, { key, payload }) {
      commit('SET_LOADING', true)
      try {
        const res = await api.put(`/settings/${key}`, payload)
        commit('SET_ITEM', { key, value: res.data.data })
        return res.data.data
      } catch (e) {
        commit('SET_ERROR', e)
        throw e
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
}
