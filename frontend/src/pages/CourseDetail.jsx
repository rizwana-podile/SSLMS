import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isOwner = user?.role === 'trainer' && course?.trainer?._id === user?._id;

  const fetchData = useCallback(async () => {
    try {
      const courseRes = await api.get(`/courses/${id}`);
      const courseData = courseRes.data;
      setCourse(courseData);
      if (courseData.enrollment) {
        setProgress(courseData.enrollment.progress);
      }

      const owner = user?.role === 'trainer' && courseData.trainer?._id === user?._id;
      if (owner || user?.role === 'admin') {
        const enrollRes = await api.get(`/courses/${id}/enrollments`);
        setEnrollments(enrollRes.data);
      }
    } catch {
      setError('Course not found');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleEnroll = async () => {
    setError('');
    setMessage('');
    try {
      await api.post(`/courses/${id}/enroll`);
      setMessage('Successfully enrolled! Course content is now unlocked.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleDrop = async () => {
    if (!window.confirm('Drop this course? Your progress will be saved but content will be locked.')) return;
    try {
      await api.post(`/courses/${id}/drop`);
      setMessage('Dropped from course.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop course');
    }
  };

  const handleUpdateProgress = async () => {
    try {
      await api.put(`/courses/${id}/progress`, { progress: Number(progress) });
      setMessage('Progress updated!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const openEdit = () => {
    setEditForm({
      title: course.title,
      description: course.description,
      duration: course.duration,
      category: course.category || '',
      content: course.content || '',
      isPublished: course.isPublished,
    });
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/courses/${id}`, editForm);
      setShowEdit(false);
      setMessage('Course updated successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!course) return <div className="alert alert-error">Course not found</div>;

  const enrollment = course.enrollment;

  return (
    <div>
      <Link to="/courses" style={{ fontSize: '0.875rem' }}>&larr; Back to Courses</Link>
      <div className="page-header" style={{ marginTop: '1rem' }}>
        <div>
          <h1>{course.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {course.category && <span className="badge badge-secondary">{course.category}</span>}{' '}
            <span className="badge badge-primary">{course.duration}</span>
            {isOwner && (
              <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                {course.isPublished ? 'Published' : 'Draft'}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isOwner && (
            <button className="btn btn-outline" onClick={openEdit}>Edit Course</button>
          )}
          {user?.role === 'student' && !course.isEnrolled && (
            <button className="btn btn-primary" onClick={handleEnroll}>Enroll Now</button>
          )}
          {user?.role === 'student' && course.isEnrolled && (
            <button className="btn btn-outline" onClick={handleDrop}>Drop Course</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>About This Course</h3>
          <p>{course.description}</p>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Trainer: <strong>{course.trainer?.name}</strong> ({course.trainer?.email})
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {course.enrolledCount} students enrolled
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Course Content</h3>
          {course.contentLocked ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>Content is locked. Enroll in this course to access learning materials.</p>
              {user?.role === 'student' && !course.isEnrolled && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }} onClick={handleEnroll}>
                  Enroll to Unlock
                </button>
              )}
            </div>
          ) : course.content ? (
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.7 }}>{course.content}</div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No content uploaded yet.</p>
          )}
        </div>
      </div>

      {user?.role === 'student' && course.isEnrolled && enrollment && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Your Learning Progress</h3>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Progress: {enrollment.progress}%</span>
              <span className={`badge ${enrollment.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {enrollment.status}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${enrollment.progress}%` }} />
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Progress updates automatically when assignments are graded. You can also update manually.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
              <label>Manual Progress (%)</label>
              <input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleUpdateProgress}>Update</button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/assignments" className="btn btn-outline btn-sm">View Assignments</Link>
          </div>
        </div>
      )}

      {(isOwner || user?.role === 'admin') && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Enrolled Students ({enrollments.length})</h3>
          {enrollments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No students enrolled yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Enrolled On</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e._id}>
                      <td><strong>{e.student?.name}</strong></td>
                      <td>{e.student?.email}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar" style={{ width: 80, flex: 'none' }}>
                            <div className="progress-bar-fill" style={{ width: `${e.progress}%` }} />
                          </div>
                          {e.progress}%
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${e.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Course">
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label>Title</label>
            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input value={editForm.duration} onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Course Content / Materials</label>
            <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={6} placeholder="Add syllabus, modules, links, notes..." />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={editForm.isPublished} onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })} />
              {' '}Published (visible to students)
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowEdit(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CourseDetail;
