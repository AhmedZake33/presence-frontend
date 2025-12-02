export default [
  {
    path: '/employee-dashboard',
    name: 'employee-dashboard',
    component: () => import('@/views/dashboard/employees/dashboard.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      roles: ['employee'],
    },
  },
  {
    path: '/dashboard',
    name: 'attendance-dashboard',
    component: () => import('@/views/dashboard/attendance/dashboard.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      roles: ['admin'],
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
    path: '/employees',
    name: 'attendance-employees',
    component: () => import('@/views/dashboard/attendance/employees.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      roles: ['admin'],
    },
  },
  {
    path: '/employees/:employeeId',
    name: 'employees-detail',
    component: () => import('@/views/dashboard/employees/show.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      roles: ['admin'],
      breadcrumb: [
        {
          text: 'Dashboard',
          to: '/dashboard',
        },
        {
          text: 'Employees',
          to: '/employees',
        },
        {
          text: 'Detail',
          active: true,
        },
      ],
    }
  },
  
]
