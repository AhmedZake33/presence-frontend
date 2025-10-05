<template>
  <div
    class="vertical-layout h-100"
    :class="[layoutClasses]"
    :data-col="isNavMenuHidden ? '1-column' : null"
  >
    <!-- Navbar -->
    <b-navbar
      :toggleable="false"
      :variant="navbarBackgroundColor"
      class="header-navbar navbar navbar-shadow align-items-center"
      :class="[navbarTypeClass]"
    >
      <slot
        name="navbar"
        :toggleVerticalMenuActive="toggleVerticalMenuActive"
        :navbarBackgroundColor="navbarBackgroundColor"
        :navbarTypeClass="[...navbarTypeClass, 'header-navbar navbar navbar-shadow align-items-center']"
      >
        <app-navbar-vertical-layout
          :toggle-vertical-menu-active="toggleVerticalMenuActive"
        />
      </slot>
    </b-navbar>
    <!--/ Navbar -->

    <!-- Vertical Nav Menu -->
    <vertical-nav-menu
      v-if="isLoggedIn && !isNavMenuHidden"
      :is-vertical-menu-active="isVerticalMenuActive"
      :toggle-vertical-menu-active="toggleVerticalMenuActive"
      :items="filteredNavItems"
    >
      <template #header="slotProps">
        <slot name="vertical-menu-header" v-bind="slotProps" />
      </template>
    </vertical-nav-menu>
    <!-- /Vertical Nav Menu -->

    <!-- Vertical Nav Menu Overlay -->
    <div
      class="sidenav-overlay"
      :class="overlayClasses"
      @click="isVerticalMenuActive = false"
    />
    <!-- /Vertical Nav Menu Overlay -->

    <!-- Content -->
    <transition :name="routerTransition" mode="out-in">
      <component
        :is="layoutContentRenderer"
        :key="
          layoutContentRenderer === 'layout-content-renderer-left'
            ? $route.meta.navActiveLink || $route.name
            : null
        "
      >
        <template v-for="(index, name) in $scopedSlots" v-slot:[name]="data">
          <slot :name="name" v-bind="data" />
        </template>
      </component>
    </transition>
    <!--/ Content -->

    <!-- Footer -->
    <footer class="footer footer-light" :class="[footerTypeClass]">
      <slot name="footer">
        <app-footer />
      </slot>
    </footer>
    <!-- /Footer -->

    <slot name="customizer" />
  </div>
</template>

<script>
import { onUnmounted } from '@vue/composition-api'
import AppNavbarVerticalLayout from '@core/layouts/components/app-navbar/AppNavbarVerticalLayout.vue'
import AppFooter from '@core/layouts/components/AppFooter.vue'
import useAppConfig from '@core/app-config/useAppConfig'
import { BNavbar } from 'bootstrap-vue'
import LayoutContentRendererDefault from '@core/layouts/components/layout-content-renderer/LayoutContentRendererDefault.vue'
import LayoutContentRendererLeft from '@core/layouts/components/layout-content-renderer/LayoutContentRendererLeft.vue'
import LayoutContentRendererLeftDetached from '@core/layouts/components/layout-content-renderer/LayoutContentRendererLeftDetached.vue'
import VerticalNavMenu from './components/vertical-nav-menu/VerticalNavMenu.vue'
import useVerticalLayout from './useVerticalLayout'
import mixinVerticalLayout from './mixinVerticalLayout'


export default {

  components: {
    AppNavbarVerticalLayout,
    AppFooter,
    VerticalNavMenu,
    BNavbar,
    LayoutContentRendererLeftDetached,
    LayoutContentRendererLeft,
    LayoutContentRendererDefault,
  },
  mixins: [mixinVerticalLayout],
  computed: {
    layoutContentRenderer() {
      const rendererType = this.$route.meta.contentRenderer
      if (rendererType === 'sidebar-left') return 'layout-content-renderer-left'
      if (rendererType === 'sidebar-left-detached')
        return 'layout-content-renderer-left-detached'
      return 'layout-content-renderer-default'
    },
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn']
    },
  filteredNavItems() {
    const role = this.$store.getters['auth/userRole']
    console.log('Current role:', role)

    function filterByRole(items) {
      return items
        .map(item => {
          // Recursively filter children
          let children = []
          if (item.children && item.children.length > 0) {
            children = filterByRole(item.children)
          }

          // Check role restriction
          const allowed =
            !item.meta?.role ||
            item.meta.role.map(r => r.toLowerCase()).includes(role.toLowerCase())

          // Keep this item only if:
          //  - user is allowed
          //  - OR it has allowed children
          if (allowed) {
            return { ...item, children: children.filter(Boolean) }
          }
          if (children.length > 0) {
            return { ...item, children: children.filter(Boolean) }
          }
          return null
        })
        .filter(Boolean)
    }

    const filtered = filterByRole(require('@/navigation/vertical').default)
    console.log('Filtered nav items:', filtered)
    return filtered
  },

  },
  setup() {
    const {
      routerTransition,
      navbarBackgroundColor,
      navbarType,
      footerType,
      isNavMenuHidden,
    } = useAppConfig()

    const {
      isVerticalMenuActive,
      toggleVerticalMenuActive,
      isVerticalMenuCollapsed,
      layoutClasses,
      overlayClasses,
      resizeHandler,
      navbarTypeClass,
      footerTypeClass,
    } = useVerticalLayout(navbarType, footerType)

    resizeHandler()
    window.addEventListener('resize', resizeHandler)
    onUnmounted(() => {
      window.removeEventListener('resize', resizeHandler)
    })

    return {
      isVerticalMenuActive,
      toggleVerticalMenuActive,
      isVerticalMenuCollapsed,
      overlayClasses,
      layoutClasses,
      navbarTypeClass,
      footerTypeClass,

      // App Config
      routerTransition,
      navbarBackgroundColor,
      isNavMenuHidden,
    }
  },
}
</script>

<style lang="scss">
@import "~@core/scss/base/themes/bordered-layout.scss";
</style>
