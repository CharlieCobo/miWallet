import { Outlet } from 'react-router';

export default () => {
  return (
    <>
      <header>Header Component</header>
      <main>
        <Outlet />
      </main>
    </>
  );
};
