import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/courses', label: 'Courses' },
    { to: '/assignments', label: 'Assignments' },
    { to: '/jobs', label: 'Jobs' },
  ];

  if (user?.role === 'admin') {
    links.push({ to: '/users', label: 'Users' });
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          SSLMS
        </Link>
        <div className="navbar-links">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={location.pathname.startsWith(link.to) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="navbar-user">
          <span className="user-info">
            {user?.name}
            <span className={`badge badge-primary`}>{user?.role}</span>
          </span>
          <button onClick={handleLogout} className="btn btn-outline btn-sm">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
