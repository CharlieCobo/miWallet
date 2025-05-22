import { Outlet } from 'react-router';
import Header from './header';

export default () => {
  return (
    <>
      <Header />
      <main className="px-4 pt-6">
        <Outlet />
      </main>
    </>
  );
};
