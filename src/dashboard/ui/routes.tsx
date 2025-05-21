import { type RouteObject } from 'react-router';

import DashboardView from './views';

export const DASHBOAR_ROUTES: RouteObject[] = [
  {
    path: '/',
    Component: DashboardView,
  },
];
