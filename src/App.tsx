import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { APP_ROUTES } from './commons/ui/routes';

const router = createBrowserRouter([...APP_ROUTES], {
  basename: '/miWallet',
});

function App() {
  return (
    <HeroUIProvider>
      <RouterProvider router={router} />
      <ToastProvider />
    </HeroUIProvider>
  );
}

export default App;
