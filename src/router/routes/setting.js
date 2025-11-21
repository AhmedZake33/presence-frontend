export default [
    {
        path: '/settings',
        name: 'settings',
        component: () => import('@/views/setting/Setting.vue'),
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
                text: 'Settings',
                active: true,
              },
            ],
        },
    },
//     {
//   path: '/settings',
//   name: 'settings-list',
//   component: () => import('@/views/setting/SettingsList.vue'),
//   meta: { requiresAuth: true, layout: 'vertical', resource: 'Settings', action: 'read', role: ['admin'] }
// },
// {
//   path: '/settings/:key/edit',
//   name: 'settings-edit',
//   component: () => import('@/views/setting/SettingsEdit.vue'),
//   props: true,
//   meta: { requiresAuth: true, layout: 'vertical', role: ['admin'] }
// }
]