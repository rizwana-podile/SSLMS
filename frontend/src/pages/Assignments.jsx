import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showSubmit, setShowSubmit] = useState(null);
  const [showEvaluate, setShowEvaluate] = useState(null);
  const [showFeedback, setShowFeedback] = useState(null);
  const emptyForm = { title: '', description: '', course: '', dueDate: '', maxScore: 100 };
  const [form, setForm] = useState(emptyForm);
  const [submitForm, setSubmitForm] = useState({ content: '', fileUrl: '' });
  const [evalForm, setEvalForm] = useState({ score: '', feedback: '' });

  const fetchData = async () => {
    try {
      const [assignRes, subRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/assignments/submissions'),
      ]);
      setAssignments(assignRes.data);
      setSubmissions(subRes.data);

      if (user?.role === 'trainer') {
        const courseRes = await api.get('/courses');
        setCourses(courseRes.data);
      }
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getSubmission = (assignmentId) =>
    submissions.find((s) => s.assignment?._id === assignmentId || s.assignment === assignmentId);

  const getEvaluatingSubmission = () =>
    submissions.find((s) => s._id === showEvaluate);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (assignment) => {
    setEditingId(assignment._id);
    setForm({
      title: assignment.title,
      description: assignment.description,
      course: assignment.course?._id || assignment.course,
      dueDate: assignment.dueDate?.slice(0, 16),
      maxScore: assignment.maxScore,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/assignments/${editingId}`, form);
        setSuccess('Assignment updated!');
      } else {
        await api.post('/assignments', form);
        setSuccess('Assignment created!');
      }
      setShowForm(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const existing = getSubmission(showSubmit);
    if (existing?.status === 'evaluated' && !window.confirm('Resubmitting will clear your current grade. Continue?')) {
      return;
    }
    try {
      await api.post(`/assignments/${showSubmit}/submit`, submitForm);
      setShowSubmit(null);
      setSubmitForm({ content: '', fileUrl: '' });
      setSuccess('Assignment submitted successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Enroll in the course first.');
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/assignments/submissions/${showEvaluate}/evaluate`, {
        score: Number(evalForm.score),
        feedback: evalForm.feedback,
      });
      setShowEvaluate(null);
      setEvalForm({ score: '', feedback: '' });
      setSuccess('Evaluation saved! Student progress updated automatically.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Evaluation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setSuccess('Assignment deleted.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const openEvaluate = (submission) => {
    setShowEvaluate(submission._id);
    setEvalForm({ score: submission.score ?? '', feedback: submission.feedback || '' });
  };

  if (loading) return <div>Loading assignments...</div>;

  const evaluatingSub = getEvaluatingSubmission();

  return (
    <div>
      <div className="page-header">
        <h1>Assignments</h1>
        {user?.role === 'trainer' && (
          <button className="btn btn-primary" onClick={openCreate}>+ Create Assignment</button>
        )}
      </div>

      {user?.role === 'student' && (
        <div className="alert" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          Assignments appear for courses you are enrolled in. Submit work before the due date to get graded.
        </div>
      )}

      {user?.role === 'trainer' && submissions.filter((s) => s.status !== 'evaluated').length > 0 && (
        <div className="alert alert-warning">
          {submissions.filter((s) => s.status !== 'evaluated').length} submission(s) pending evaluation.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {assignments.length === 0 ? (
        <div className="empty-state card">
          {user?.role === 'student'
            ? 'No assignments yet. Enroll in a course from the Courses page.'
            : 'No assignments yet. Create one for your courses.'}
        </div>
      ) : (
        <div className="table-wrapper card">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Due Date</th>
                <th>Max Score</th>
                {user?.role === 'student' && <th>Your Result</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const submission = getSubmission(assignment._id);
                const isOverdue = new Date() > new Date(assignment.dueDate);

                return (
                  <tr key={assignment._id}>
                    <td>
                      <strong>{assignment.title}</strong>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {assignment.description.substring(0, 80)}{assignment.description.length > 80 ? '...' : ''}
                      </div>
                    </td>
                    <td>{assignment.course?.title}</td>
                    <td>
                      {new Date(assignment.dueDate).toLocaleString()}
                      {isOverdue && !submission && (
                        <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>Overdue</span>
                      )}
                    </td>
                    <td>{assignment.maxScore}</td>
                    {user?.role === 'student' && (
                      <td>
                        {submission ? (
                          <div>
                            <span className={`badge ${submission.status === 'evaluated' ? 'badge-success' : 'badge-warning'}`}>
                              {submission.status}
                            </span>
                            {submission.score !== undefined && (
                              <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                                Score: <strong>{submission.score}/{assignment.maxScore}</strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="badge badge-secondary">Not submitted</span>
                        )}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {user?.role === 'student' && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setShowSubmit(assignment._id);
                                setSubmitForm(
                                  submission
                                    ? { content: submission.content, fileUrl: submission.fileUrl || '' }
                                    : { content: '', fileUrl: '' }
                                );
                              }}
                            >
                              {submission ? 'Resubmit' : 'Submit'}
                            </button>
                            {submission && (
                              <button className="btn btn-outline btn-sm" onClick={() => setShowFeedback(submission)}>
                                View
                              </button>
                            )}
                          </>
                        )}
                        {user?.role === 'trainer' && (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(assignment)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(assignment._id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {user?.role === 'trainer' && submissions.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Student Submissions</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Submitted</th>
                  <th>Answer Preview</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td>{sub.student?.name}</td>
                    <td>{sub.assignment?.title}</td>
                    <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                    <td style={{ maxWidth: 200, fontSize: '0.8125rem' }}>
                      {sub.content.substring(0, 60)}{sub.content.length > 60 ? '...' : ''}
                    </td>
                    <td>{sub.score !== undefined ? `${sub.score}/${sub.assignment?.maxScore}` : '-'}</td>
                    <td>
                      <span className={`badge badge-${sub.status === 'evaluated' ? 'success' : 'warning'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => openEvaluate(sub)}>
                        {sub.status === 'evaluated' ? 'Re-evaluate' : 'Evaluate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Assignment' : 'Create Assignment'}>
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
            <label>Course</label>
            <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required disabled={!!editingId}>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Max Score</label>
            <input type="number" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showSubmit} onClose={() => setShowSubmit(null)} title="Submit Assignment">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Answer / Submission</label>
            <textarea value={submitForm.content} onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })} required rows={6} />
          </div>
          <div className="form-group">
            <label>File URL (optional)</label>
            <input value={submitForm.fileUrl} onChange={(e) => setSubmitForm({ ...submitForm, fileUrl: e.target.value })} placeholder="Link to your file (Google Drive, GitHub, etc.)" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowSubmit(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showEvaluate} onClose={() => setShowEvaluate(null)} title="Evaluate Submission">
        {evaluatingSub && (
          <div className="card" style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <strong>{evaluatingSub.student?.name}</strong> &middot; {evaluatingSub.assignment?.title}
            </p>
            <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{evaluatingSub.content}</p>
            {evaluatingSub.fileUrl && (
              <p style={{ marginTop: '0.5rem' }}>
                <a href={evaluatingSub.fileUrl} target="_blank" rel="noreferrer">View attached file</a>
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleEvaluate}>
          <div className="form-group">
            <label>Score (max {evaluatingSub?.assignment?.maxScore || 100})</label>
            <input type="number" min="0" max={evaluatingSub?.assignment?.maxScore || 100} value={evalForm.score} onChange={(e) => setEvalForm({ ...evalForm, score: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Feedback for Student</label>
            <textarea value={evalForm.feedback} onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })} rows={4} placeholder="Comments, suggestions, areas to improve..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowEvaluate(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Evaluation</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showFeedback} onClose={() => setShowFeedback(null)} title="Your Submission">
        {showFeedback && (
          <>
            <div className="form-group">
              <label>Status</label>
              <span className={`badge badge-${showFeedback.status === 'evaluated' ? 'success' : 'warning'}`}>
                {showFeedback.status}
              </span>
            </div>
            <div className="form-group">
              <label>Your Answer</label>
              <div style={{ whiteSpace: 'pre-wrap', padding: '0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                {showFeedback.content}
              </div>
            </div>
            {showFeedback.fileUrl && (
              <div className="form-group">
                <label>Attached File</label>
                <a href={showFeedback.fileUrl} target="_blank" rel="noreferrer">{showFeedback.fileUrl}</a>
              </div>
            )}
            {showFeedback.score !== undefined && (
              <div className="form-group">
                <label>Score</label>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {showFeedback.score} / {showFeedback.assignment?.maxScore}
                </p>
              </div>
            )}
            {showFeedback.feedback && (
              <div className="form-group">
                <label>Trainer Feedback</label>
                <div style={{ whiteSpace: 'pre-wrap', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                  {showFeedback.feedback}
                </div>
              </div>
            )}
            {!showFeedback.feedback && showFeedback.status !== 'evaluated' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Awaiting trainer evaluation.</p>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowFeedback(null)}>Close</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Assignments;
