import Vue from 'vue'
import Vuex from 'vuex'
import auth from './modules/auth'


// Modules
import ecommerceStoreModule from '@/views/apps/e-commerce/eCommerceStoreModule'
import app from './app'
import appConfig from './app-config'
import verticalMenu from './vertical-menu'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
  },
  mutations: {
    setUser(state, user) {
      state.user = user
    },
  },
  getters: {
    user: state => state.user,
  },
  modules: {
    app,
    appConfig,
    verticalMenu,
    'app-ecommerce': ecommerceStoreModule,
    auth,
  },
  strict: process.env.DEV,
})
