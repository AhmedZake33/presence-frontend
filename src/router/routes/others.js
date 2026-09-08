export default [
  {
    path: '/access-control',
    name: 'access-control',
    component: () => import('@/views/extensions/acl/AccessControl.vue'),
    meta: {
      resource: 'ACL',
      action: 'read',
      breadcrumb: [
        { text: 'Extensions' },
        { text: 'Access Control', active: true }
      ]
    },
  },
]
