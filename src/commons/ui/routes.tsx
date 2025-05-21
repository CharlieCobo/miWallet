import { type RouteObject } from 'react-router';
import GeneralLayout from '../../commons/ui/layout/general';

import { DASHBOAR_ROUTES } from '../../dashboard/ui/routes';

export const APP_ROUTES: RouteObject[] = [
  {
    path: '/',
    element: <GeneralLayout />,
    children: [...DASHBOAR_ROUTES],
  },
];
