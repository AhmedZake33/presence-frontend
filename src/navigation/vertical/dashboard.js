export default [
  // {
  //   title: 'Attendance',
  //   icon: 'MenuIcon',
  //   children: [
  //     {
  //       title: 'Dashboard',
  //       icon: 'HomeIcon',
  //       route: 'attendance-dashboard',
  //       meta: { role: ['admin'] },
  //     },
  //     {
  //       title: 'Attendance',
  //       icon: 'CalendarIcon',
  //       route: 'attendance', 
  //     },
  //   ],
  // },
      {
        title: 'Dashboard',
        icon: 'HomeIcon',
        route: 'attendance-dashboard',
        meta: { role: ['admin'] },
      },
      {
        title: 'Employees',
        icon: 'UserIcon',
        route: 'attendance-employees',
        meta: { role: ['admin'] },
      },
      {
        title: 'Attendance',
        icon: 'CalendarIcon',
        route: 'attendance', 
      },
      
]

