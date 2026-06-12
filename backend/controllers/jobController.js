const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { validationResult } = require('express-validator');

const getJobs = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { isActive: true };
  const jobs = await Job.find(filter)
    .populate('postedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(jobs);
};

const getJobById = async (req, res) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  res.json(job);
};

const createJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const job = await Job.create({
    ...req.body,
    postedBy: req.user._id,
  });

  const populated = await Job.findById(job._id).populate('postedBy', 'name');
  res.status(201).json(populated);
};

const updateJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  Object.assign(job, req.body);
  const updated = await job.save();
  const populated = await Job.findById(updated._id).populate('postedBy', 'name');
  res.json(populated);
};

const deleteJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }

  await JobApplication.deleteMany({ job: job._id });
  await job.deleteOne();
  res.json({ message: 'Job removed' });
};

const applyForJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const job = await Job.findById(req.params.id);
  if (!job || !job.isActive) {
    return res.status(404).json({ message: 'Job not found or no longer active' });
  }

  if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
    return res.status(400).json({ message: 'Application deadline has passed' });
  }

  const existing = await JobApplication.findOne({
    job: job._id,
    student: req.user._id,
  });

  if (existing) {
    return res.status(400).json({ message: 'Already applied for this job' });
  }

  const application = await JobApplication.create({
    job: job._id,
    student: req.user._id,
    resume: req.body.resume || '',
    coverLetter: req.body.coverLetter || '',
  });

  const populated = await JobApplication.findById(application._id)
    .populate('job', 'title company')
    .populate('student', 'name email');

  res.status(201).json(populated);
};

const getApplications = async (req, res) => {
  const { jobId } = req.query;
  const filter = jobId ? { job: jobId } : {};

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  }

  const applications = await JobApplication.find(filter)
    .populate('job', 'title company location jobType')
    .populate('student', 'name email phone')
    .sort({ appliedAt: -1 });

  res.json(applications);
};

const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const application = await JobApplication.findById(req.params.id);

  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }

  application.status = status;
  await application.save();

  const populated = await JobApplication.findById(application._id)
    .populate('job', 'title company')
    .populate('student', 'name email');

  res.json(populated);
};

const getDashboardStats = async (req, res) => {
  const User = require('../models/User');
  const Course = require('../models/Course');
  const Enrollment = require('../models/Enrollment');

  if (req.user.role === 'admin') {
    const [users, courses, jobs, applications] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Job.countDocuments({ isActive: true }),
      JobApplication.countDocuments(),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    return res.json({ users, courses, jobs, applications, usersByRole });
  }

  if (req.user.role === 'trainer') {
    const Assignment = require('../models/Assignment');
    const Submission = require('../models/Submission');

    const trainerAssignments = await Assignment.find({ trainer: req.user._id }).distinct('_id');
    const [courses, assignments, pendingSubmissions, enrolledStudents, myCourses] = await Promise.all([
      Course.countDocuments({ trainer: req.user._id }),
      Assignment.countDocuments({ trainer: req.user._id }),
      Submission.countDocuments({
        assignment: { $in: trainerAssignments },
        status: { $in: ['submitted', 'late'] },
      }),
      Enrollment.countDocuments({
        course: { $in: await Course.find({ trainer: req.user._id }).distinct('_id') },
        status: { $ne: 'dropped' },
      }),
      Course.find({ trainer: req.user._id }).select('title enrolledCount isPublished'),
    ]);

    return res.json({
      courses,
      assignments,
      pendingSubmissions,
      enrolledStudents,
      myCourses,
    });
  }

  const Submission = require('../models/Submission');
  const [enrollments, submissions, jobApplications] = await Promise.all([
    Enrollment.find({ student: req.user._id, status: { $ne: 'dropped' } }).populate('course', 'title'),
    Submission.find({ student: req.user._id })
      .populate('assignment', 'title maxScore course')
      .sort({ submittedAt: -1 }),
    JobApplication.find({ student: req.user._id }).populate('job', 'title company'),
  ]);

  const avgProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0;

  const evaluatedSubmissions = submissions.filter((s) => s.status === 'evaluated');
  const avgScore =
    evaluatedSubmissions.length > 0
      ? Math.round(
          evaluatedSubmissions.reduce((sum, s) => sum + (s.score / s.assignment.maxScore) * 100, 0) /
            evaluatedSubmissions.length
        )
      : 0;

  res.json({
    enrollments,
    submissions,
    submissionCount: submissions.length,
    evaluatedCount: evaluatedSubmissions.length,
    avgScore,
    jobApplications,
    avgProgress,
    completedCourses: enrollments.filter((e) => e.status === 'completed').length,
    pendingAssignments: submissions.filter((s) => s.status !== 'evaluated').length,
  });
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getApplications,
  updateApplicationStatus,
  getDashboardStats,
};
