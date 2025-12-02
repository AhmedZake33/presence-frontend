import Vue from 'vue'
import { ToastPlugin, ModalPlugin } from 'bootstrap-vue'
import VueCompositionAPI from '@vue/composition-api'

// CSS
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// BootstrapVue
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

import i18n from '@/libs/i18n'
import router from './router'
import store from './store'
import App from './App.vue'

// Global components
import './global-components'

// 3rd party plugins
import '@axios'
import '@/libs/acl'
import '@/libs/portal-vue'
import '@/libs/clipboard'
import '@/libs/toastification'
import '@/libs/sweet-alerts'
import '@/libs/vue-select'
import '@/libs/tour'

// Mock DB
import '@/@fake-db/db'

// ⬇️ GLOBAL MIXIN
import mixinGlobal from './mixins/mixins'
Vue.mixin(mixinGlobal)

// BSV plugins
Vue.use(ToastPlugin)
Vue.use(ModalPlugin)

// Composition API (Vue 2)
Vue.use(VueCompositionAPI)

// Fonts & styles
require('@core/assets/fonts/feather/iconfont.css')
require('@core/scss/core.scss')
require('@/assets/scss/style.scss')

Vue.config.productionTip = false

new Vue({
  router,
  store,
  i18n,
  render: h => h(App),
}).$mount('#app')
