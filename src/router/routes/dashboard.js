export default [
  {
    path: '/employee-dashboard',
    name: 'employee-dashboard',
    component: () => import('@/views/dashboard/employees/dashboard.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      roles: ['employee'],
      breadcrumb: [
       
        { text: 'Employee Dashboard', active: true }
      ]
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
      breadcrumb: [
        { text: 'Dashboard' , active: true }
      ],
    },

  },
  {
    path: '/attendance',
    name: 'attendance',
    component: () => import('@/views/dashboard/attendance/attendance.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      breadcrumb: [
       
        { text: 'Attendance', active: true }
      ],
    },
  },
  {
    path: '/employees',
    name: 'attendance-employees',
    component: () => import('@/views/dashboard/attendance/employees.vue'),
    meta: {
      layout: 'content', // Vuexy’s main layout (with sidebar)
      requiresAuth: true,
      roles: ['admin','manager'],
      breadcrumb: [
       
        { text: 'Employees', active: true }
      ],
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
          to: '/welcome',
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
