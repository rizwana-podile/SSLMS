import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emptyForm = { title: '', description: '', duration: '', category: '', content: '', isPublished: true };
  const [form, setForm] = useState(emptyForm);

  const fetchCourses = async () => {
    try {
      const [coursesRes, enrollRes] = await Promise.all([
        api.get('/courses'),
        user?.role === 'student' ? api.get('/courses/my-enrollments') : Promise.resolve({ data: [] }),
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollRes.data);
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const isEnrolled = (courseId) =>
    enrollments.some((e) => (e.course?._id === courseId || e.course === courseId) && e.status !== 'dropped');

  const getEnrollment = (courseId) =>
    enrollments.find((e) => e.course?._id === courseId || e.course === courseId);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse}`, form);
        setSuccess('Course updated successfully!');
      } else {
        await api.post('/courses', form);
        setSuccess('Course created successfully!');
      }
      setShowModal(false);
      setEditingCourse(null);
      setForm(emptyForm);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    }
  };

  const openEdit = (course) => {
    setEditingCourse(course._id);
    setForm({
      title: course.title,
      description: course.description,
      duration: course.duration,
      category: course.category || '',
      content: course.content || '',
      isPublished: course.isPublished !== false,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingCourse(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEnroll = async (courseId) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setSuccess('Enrolled! View course content and assignments.');
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await api.delete(`/courses/${id}`);
      setSuccess('Course deleted.');
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const displayedCourses =
    user?.role === 'student' && tab === 'my'
      ? courses.filter((c) => isEnrolled(c._id))
      : courses;

  if (loading) return <div>Loading courses...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Courses</h1>
        {(user?.role === 'admin' || user?.role === 'trainer') && (
          <button className="btn btn-primary" onClick={openCreate}>+ Create Course</button>
        )}
      </div>

      {user?.role === 'student' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button className={`btn btn-sm ${tab === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('all')}>
            All Courses
          </button>
          <button className={`btn btn-sm ${tab === 'my' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('my')}>
            My Enrollments ({enrollments.length})
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {displayedCourses.length === 0 ? (
        <div className="empty-state card">
          {tab === 'my' ? 'You have not enrolled in any courses yet.' : 'No courses available yet.'}
        </div>
      ) : (
        <div className="grid grid-2">
          {displayedCourses.map((course) => {
            const enrollment = getEnrollment(course._id);
            const owned = user?.role === 'trainer' && course.trainer?._id === user._id;

            return (
              <div key={course._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem' }}>{course.title}</h3>
                    {course.category && <span className="badge badge-secondary">{course.category}</span>}
                    {owned && (
                      <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`} style={{ marginLeft: '0.5rem' }}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </div>
                  <span className="badge badge-primary">{course.duration}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', margin: '1rem 0', fontSize: '0.875rem' }}>
                  {course.description.substring(0, 120)}{course.description.length > 120 ? '...' : ''}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Trainer: {course.trainer?.name} &middot; {course.enrolledCount} enrolled
                </p>
                {enrollment && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                      <span>Your progress</span>
                      <span>{enrollment.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link to={`/courses/${course._id}`} className="btn btn-outline btn-sm">View Details</Link>
                  {user?.role === 'student' && !isEnrolled(course._id) && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleEnroll(course._id)}>Enroll</button>
                  )}
                  {user?.role === 'student' && isEnrolled(course._id) && (
                    <span className="badge badge-success">Enrolled</span>
                  )}
                  {owned && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(course)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course._id)}>Delete</button>
                    </>
                  )}
                  {user?.role === 'admin' && !owned && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course._id)}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCourse ? 'Edit Course' : 'Create Course'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Duration</label>
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required placeholder="e.g. 8 weeks" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Web Development" />
          </div>
          <div className="form-group">
            <label>Course Content / Materials</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} placeholder="Syllabus, modules, links, study notes..." />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              {' '}Published (visible to students)
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingCourse ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Courses;
