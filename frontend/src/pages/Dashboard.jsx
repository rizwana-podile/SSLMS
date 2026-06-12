import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome, {user?.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {user?.role === 'admin' && 'System overview and management'}
            {user?.role === 'trainer' && 'Manage courses, review submissions, and track student progress'}
            {user?.role === 'student' && 'Track learning progress, assignments, and job applications'}
          </p>
        </div>
      </div>

      {user?.role === 'admin' && stats && (
        <>
          <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card">
              <div className="stat-value">{stats.users}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.courses}</div>
              <div className="stat-label">Courses</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.jobs}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.applications}</div>
              <div className="stat-label">Applications</div>
            </div>
          </div>
        </>
      )}

      {user?.role === 'trainer' && stats && (
        <>
          <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card">
              <div className="stat-value">{stats.courses}</div>
              <div className="stat-label">My Courses</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.assignments}</div>
              <div className="stat-label">Assignments</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value" style={{ color: stats.pendingSubmissions > 0 ? 'var(--warning)' : 'var(--primary)' }}>
                {stats.pendingSubmissions}
              </div>
              <div className="stat-label">Pending Reviews</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.enrolledStudents}</div>
              <div className="stat-label">Enrolled Students</div>
            </div>
          </div>

          {stats.myCourses?.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>My Courses</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Students</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.myCourses.map((c) => (
                      <tr key={c._id}>
                        <td><strong>{c.title}</strong></td>
                        <td>{c.enrolledCount}</td>
                        <td>
                          <span className={`badge ${c.isPublished ? 'badge-success' : 'badge-warning'}`}>
                            {c.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          <Link to={`/courses/${c._id}`} className="btn btn-outline btn-sm">Manage</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats.pendingSubmissions > 0 && (
            <div className="alert alert-warning">
              You have <strong>{stats.pendingSubmissions}</strong> submission(s) waiting for evaluation.{' '}
              <Link to="/assignments">Review now</Link>
            </div>
          )}
        </>
      )}

      {user?.role === 'student' && stats && (
        <>
          <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card">
              <div className="stat-value">{stats.enrollments?.length || 0}</div>
              <div className="stat-label">Enrolled Courses</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.avgProgress}%</div>
              <div className="stat-label">Avg Progress</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.evaluatedCount || 0}</div>
              <div className="stat-label">Graded Assignments</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.avgScore ? `${stats.avgScore}%` : '-'}</div>
              <div className="stat-label">Avg Score</div>
            </div>
          </div>

          {stats.enrollments?.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Course Progress</h3>
              {stats.enrollments.map((enrollment) => (
                <div key={enrollment._id} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <Link to={`/courses/${enrollment.course?._id}`}>{enrollment.course?.title}</Link>
                    <span style={{ fontWeight: 600 }}>{enrollment.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${enrollment.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {stats.submissions?.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Recent Assignment Results</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.submissions.slice(0, 5).map((sub) => (
                      <tr key={sub._id}>
                        <td>{sub.assignment?.title}</td>
                        <td>
                          <span className={`badge badge-${sub.status === 'evaluated' ? 'success' : 'warning'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          {sub.score !== undefined
                            ? `${sub.score}/${sub.assignment?.maxScore}`
                            : '-'}
                        </td>
                        <td style={{ fontSize: '0.8125rem', maxWidth: 200 }}>
                          {sub.feedback ? sub.feedback.substring(0, 50) + (sub.feedback.length > 50 ? '...' : '') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link to="/assignments" style={{ fontSize: '0.875rem', marginTop: '1rem', display: 'inline-block' }}>
                View all assignments
              </Link>
            </div>
          )}

          {stats.jobApplications?.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Job Applications</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Company</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.jobApplications.map((app) => (
                      <tr key={app._id}>
                        <td>{app.job?.title}</td>
                        <td>{app.job?.company}</td>
                        <td>
                          <span className={`badge badge-${app.status === 'hired' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-3" style={{ marginTop: '2rem' }}>
        <Link to="/courses" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>Courses</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {user?.role === 'student' ? 'Browse, enroll, and access course content' : 'Create and manage course content'}
          </p>
        </Link>
        <Link to="/assignments" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>Assignments</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {user?.role === 'student' ? 'Submit work and view grades' : 'Create assignments and evaluate students'}
          </p>
        </Link>
        <Link to="/jobs" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3>Job Portal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {user?.role === 'admin' ? 'Post and manage job listings' : 'Explore and apply for opportunities'}
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
