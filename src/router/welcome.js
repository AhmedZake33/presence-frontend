export default [
    {
      path: '/welcome',
      name: 'welcome',
      component: () => import('@/views/welcome/welcome.vue'),
      meta: {
        layout: 'content', // Vuexy’s main layout (with sidebar)
        requiresAuth: true,
      },
  
    }
  ]
  