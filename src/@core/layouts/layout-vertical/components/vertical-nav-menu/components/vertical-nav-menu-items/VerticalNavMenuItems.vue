<template>
  <ul>
    <component
      v-for="item in filteredItems"
      :is="resolveNavItemComponent(item)"
      :key="item.header || item.title"
      :item="item"
    />
  </ul>
</template>

<script>
import { resolveVerticalNavMenuItemComponent as resolveNavItemComponent } from '@core/layouts/utils'
import { provide, ref, computed } from '@vue/composition-api'
import VerticalNavMenuHeader from '../vertical-nav-menu-header'
import VerticalNavMenuLink from '../vertical-nav-menu-link/VerticalNavMenuLink.vue'
import VerticalNavMenuGroup from '../vertical-nav-menu-group/VerticalNavMenuGroup.vue'

export default {
  components: {
    VerticalNavMenuHeader,
    VerticalNavMenuLink,
    VerticalNavMenuGroup,
  },
  props: {
    items: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    provide('openGroups', ref([]))

    // 🔑 Clean items before rendering
    const filteredItems = computed(() =>
      props.items.map(item => {
        // If it has children but they are empty after filtering, remove children
        if (item.children && item.children.length === 0) {
          const { children, ...rest } = item
          return rest
        }
        return item
      })
    )

    return {
      resolveNavItemComponent,
      filteredItems,
    }
  },
}
</script>
