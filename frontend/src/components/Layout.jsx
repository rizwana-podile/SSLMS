import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div>
      <Navbar />
      <main className="container" style={{ padding: '2rem 1.5rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
