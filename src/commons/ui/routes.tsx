import { Navigate, type RouteObject } from 'react-router';
import { DASHBOAR_ROUTES } from '../../dashboard/ui/routes';

export const APP_ROUTES: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/dashboard" />,
  },
  ...DASHBOAR_ROUTES,
];
