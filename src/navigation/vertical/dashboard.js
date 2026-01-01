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
    route: 'employee-dashboard',
    meta: { role: ['employee'] },
  },
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
    meta: { role: ['admin', 'manager'] },
  },
  // {
  //   title: 'Attendance',
  //   icon: 'CalendarIcon',
  //   route: 'attendance', 
  //   meta: { role: ['employee'] },
  // },
  // {
  //   title: 'Create Day Off',
  //   icon: 'CalendarIcon',
  //   route: 'create-day-off',
  //   meta: { role: ['employee'] },
  // },
  {
    title: 'Day Off Requests',
    icon: 'CalendarIcon',
    route: 'day-off-requests',
    meta: { role: ['admin', 'manager'] },
  },
  {
    title: 'Teams',
    icon: 'UsersIcon',
    route: 'teams',
    meta: { role: ['admin'] },
  },
  {
    title: 'Settings',
    icon: 'SettingsIcon',
    route: 'settings',
    meta: { role: ['admin'] },
  },


]

