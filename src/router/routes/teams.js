export default [
    {
        path: '/teams',
        name: 'teams',
        component: () => import('@/views/teams/TeamsList.vue'),
        meta: {
            layout: 'content', // Vuexy’s main layout (with sidebar)
            requiresAuth: true,
            roles: ['admin'],
                breadcrumb: [
                   
                    { text: 'Teams', active: true }
                ],
        },
    },
]