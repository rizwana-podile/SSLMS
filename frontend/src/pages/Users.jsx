import { useState, useEffect } from 'react';
import api from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchUsers = async () => {
    try {
      const params = filter ? { role: filter } : {};
      const res = await api.get('/users', { params });
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await api.put(`/users/${userId}`, { role });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Role update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>User Management</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="trainer">Trainer</option>
          <option value="student">Student</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    style={{ padding: '0.25rem', fontSize: '0.8125rem' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="trainer">Trainer</option>
                    <option value="student">Student</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={`btn btn-sm ${user.isActive ? 'btn-outline' : 'btn-primary'}`}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
