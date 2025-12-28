export default [
    {
    path: '/create-day-off',
    name: 'create-day-off',
    component: () => import('@/views/dashboard/dayOff/CreateDayOff.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      roles: ['employee'],
    }
  },
  {
    path: '/day-off-requests',
    name: 'day-off-requests',
    component: () => import('@/views/dashboard/dayOff/approval.vue'),
    meta: {
      layout: 'content',
      requiresAuth: true,
      roles: ['admin','manager'],
    }
  },
]