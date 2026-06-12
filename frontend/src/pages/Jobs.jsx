import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showApply, setShowApply] = useState(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    location: '',
    salary: '',
    jobType: 'full-time',
    applicationDeadline: '',
  });
  const [applyForm, setApplyForm] = useState({ resume: '', coverLetter: '' });

  const fetchData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        api.get('/jobs'),
        api.get('/jobs/applications/list'),
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasApplied = (jobId) =>
    applications.some((a) => a.job?._id === jobId || a.job === jobId);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jobs', createForm);
      setShowCreate(false);
      setCreateForm({
        title: '', company: '', description: '', requirements: '',
        location: '', salary: '', jobType: 'full-time', applicationDeadline: '',
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post(`/jobs/${showApply}/apply`, applyForm);
      setShowApply(null);
      setApplyForm({ resume: '', coverLetter: '' });
      setSuccess('Job application submitted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Application failed. Only students can apply for jobs.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job posting?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await api.put(`/jobs/applications/${appId}/status`, { status });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Job Portal</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Post Job
          </button>
        )}
      </div>

      {user?.role !== 'student' && user?.role !== 'admin' && (
        <div className="alert" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          Log in as a Student to apply for jobs.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {jobs.length === 0 ? (
        <div className="empty-state card">No job postings available.</div>
      ) : (
        <div className="grid grid-2">
          {jobs.map((job) => (
            <div key={job._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{job.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{job.company}</p>
                </div>
                <span className="badge badge-primary">{job.jobType}</span>
              </div>
              <p style={{ margin: '1rem 0', fontSize: '0.875rem' }}>
                {job.description.substring(0, 150)}...
              </p>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {job.location && <span>{job.location} &middot; </span>}
                {job.salary && <span>{job.salary} &middot; </span>}
                Posted: {new Date(job.createdAt).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {user?.role === 'student' && !hasApplied(job._id) && job.isActive && (
                  <button className="btn btn-primary btn-sm" onClick={() => setShowApply(job._id)}>
                    Apply Now
                  </button>
                )}
                {user?.role === 'student' && hasApplied(job._id) && (
                  <span className="badge badge-success">Applied</span>
                )}
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job._id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(user?.role === 'admin' || user?.role === 'student') && applications.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            {user?.role === 'admin' ? 'All Applications' : 'My Applications'}
          </h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {user?.role === 'admin' && <th>Student</th>}
                  <th>Job</th>
                  <th>Company</th>
                  <th>Applied</th>
                  <th>Status</th>
                  {user?.role === 'admin' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id}>
                    {user?.role === 'admin' && <td>{app.student?.name}</td>}
                    <td>{app.job?.title}</td>
                    <td>{app.job?.company}</td>
                    <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${app.status === 'hired' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}`}>
                        {app.status}
                      </span>
                    </td>
                    {user?.role === 'admin' && (
                      <td>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusUpdate(app._id, e.target.value)}
                          style={{ padding: '0.25rem', fontSize: '0.8125rem' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Post New Job">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Job Title</label>
            <input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input value={createForm.company} onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Requirements</label>
            <textarea value={createForm.requirements} onChange={(e) => setCreateForm({ ...createForm, requirements: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={createForm.location} onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Salary</label>
            <input value={createForm.salary} onChange={(e) => setCreateForm({ ...createForm, salary: e.target.value })} placeholder="e.g. 5-8 LPA" />
          </div>
          <div className="form-group">
            <label>Job Type</label>
            <select value={createForm.jobType} onChange={(e) => setCreateForm({ ...createForm, jobType: e.target.value })}>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div className="form-group">
            <label>Application Deadline</label>
            <input type="date" value={createForm.applicationDeadline} onChange={(e) => setCreateForm({ ...createForm, applicationDeadline: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Post Job</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showApply} onClose={() => setShowApply(null)} title="Apply for Job">
        <form onSubmit={handleApply}>
          <div className="form-group">
            <label>Resume URL</label>
            <input value={applyForm.resume} onChange={(e) => setApplyForm({ ...applyForm, resume: e.target.value })} placeholder="Link to your resume" />
          </div>
          <div className="form-group">
            <label>Cover Letter</label>
            <textarea value={applyForm.coverLetter} onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })} rows={5} placeholder="Why are you a good fit?" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowApply(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Application</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Jobs;
