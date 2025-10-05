export default [
  {
    path: '/dashboard',
    name: 'attendance-dashboard',
    component: () => import('@/views/dashboard/attendance/dashboard.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
    },

  },
  {
    path: '/attendance',
    name: 'attendance',
    component: () => import('@/views/dashboard/attendance/attendance.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
    },
  },
  {
    path: '/emplyees',
    name: 'attendance-employees',
    component: () => import('@/views/dashboard/attendance/employees.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
    },
  }
]
