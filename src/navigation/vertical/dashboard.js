import { title } from "echarts/lib/theme/dark";

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
      {
        title: 'settings',
        icon: 'SettingsIcon',
        route: 'settings',
        meta: { role: ['admin'] },
      },
      {
        title: 'Create Day Off',
        icon: 'CalendarIcon',
        route: 'create-day-off',
        meta: { role: ['employee'] },
      },
      {
        title: 'Day Off',
        icon: 'CalendarIcon',
        route: 'day-off-request',
        meta: { role: ['admin'] },
      },
      
]

