const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const { validationResult } = require('express-validator');
const { syncEnrollmentProgress } = require('../utils/courseProgress');

const getAssignments = async (req, res) => {
  const { courseId } = req.query;
  const filter = courseId ? { course: courseId } : {};

  if (req.user.role === 'trainer') {
    filter.trainer = req.user._id;
  }

  if (req.user.role === 'student') {
    const enrollments = await Enrollment.find({ student: req.user._id, status: { $ne: 'dropped' } });
    const enrolledCourseIds = enrollments.map((e) => e.course);
    filter.course = courseId
      ? { $in: enrolledCourseIds.filter((id) => id.toString() === courseId) }
      : { $in: enrolledCourseIds };
  }

  const assignments = await Assignment.find(filter)
    .populate('course', 'title')
    .populate('trainer', 'name')
    .sort({ dueDate: 1 });

  res.json(assignments);
};

const getAssignmentById = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('course', 'title')
    .populate('trainer', 'name email');

  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  res.json(assignment);
};

const createAssignment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const assignment = await Assignment.create({
    ...req.body,
    trainer: req.user._id,
  });

  const populated = await Assignment.findById(assignment._id)
    .populate('course', 'title')
    .populate('trainer', 'name');

  res.status(201).json(populated);
};

const updateAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  if (assignment.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  Object.assign(assignment, req.body);
  const updated = await assignment.save();

  const populated = await Assignment.findById(updated._id)
    .populate('course', 'title')
    .populate('trainer', 'name');

  res.json(populated);
};

const deleteAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  if (assignment.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();
  res.json({ message: 'Assignment removed' });
};

const submitAssignment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: assignment.course,
  });

  if (!enrolled) {
    return res.status(403).json({ message: 'You must be enrolled in the course to submit' });
  }

  const isLate = new Date() > new Date(assignment.dueDate);

  let submission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  });

  if (submission) {
    submission.content = req.body.content;
    submission.fileUrl = req.body.fileUrl || submission.fileUrl;
    submission.status = isLate ? 'late' : 'submitted';
    submission.submittedAt = new Date();
    submission.score = undefined;
    submission.feedback = '';
    submission.evaluatedAt = undefined;
  } else {
    submission = await Submission.create({
      assignment: assignment._id,
      student: req.user._id,
      content: req.body.content,
      fileUrl: req.body.fileUrl || '',
      status: isLate ? 'late' : 'submitted',
    });
  }

  const populated = await Submission.findById(submission._id)
    .populate('assignment', 'title dueDate maxScore')
    .populate('student', 'name email');

  res.status(201).json(populated);
};

const getSubmissions = async (req, res) => {
  const { assignmentId } = req.query;
  const filter = assignmentId ? { assignment: assignmentId } : {};

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  }

  if (req.user.role === 'trainer') {
    const trainerAssignments = await Assignment.find({ trainer: req.user._id }).distinct('_id');
    filter.assignment = assignmentId
      ? { $in: trainerAssignments.filter((id) => id.toString() === assignmentId) }
      : { $in: trainerAssignments };
  }

  const submissions = await Submission.find(filter)
    .populate('assignment', 'title dueDate maxScore course')
    .populate('student', 'name email')
    .sort({ submittedAt: -1 });

  res.json(submissions);
};

const evaluateSubmission = async (req, res) => {
  const { score, feedback } = req.body;
  const submission = await Submission.findById(req.params.id).populate('assignment');

  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  if (submission.assignment.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  if (score > submission.assignment.maxScore) {
    return res.status(400).json({ message: `Score cannot exceed ${submission.assignment.maxScore}` });
  }

  submission.score = score;
  submission.feedback = feedback || '';
  submission.status = 'evaluated';
  submission.evaluatedAt = new Date();

  await submission.save();

  await syncEnrollmentProgress(submission.student, submission.assignment.course);

  const populated = await Submission.findById(submission._id)
    .populate('assignment', 'title maxScore course')
    .populate('student', 'name email');

  res.json(populated);
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  evaluateSubmission,
};
