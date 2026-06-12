const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { validationResult } = require('express-validator');

const getCourses = async (req, res) => {
  const filter = req.user.role === 'trainer'
    ? { trainer: req.user._id }
    : { isPublished: true };

  const courses = await Course.find(filter)
    .populate('trainer', 'name email')
    .sort({ createdAt: -1 });

  res.json(courses);
};

const getCourseById = async (req, res) => {
  const course = await Course.findById(req.params.id).populate('trainer', 'name email');
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const courseData = course.toObject();
  const isOwner = req.user.role === 'trainer' && course.trainer._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  let enrollment = null;
  if (req.user.role === 'student') {
    enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
      status: { $ne: 'dropped' },
    });
  }

  const canViewContent = isOwner || isAdmin || !!enrollment;
  if (!canViewContent) {
    courseData.content = null;
    courseData.contentLocked = true;
  } else {
    courseData.contentLocked = false;
  }

  courseData.isEnrolled = !!enrollment;
  if (enrollment) {
    courseData.enrollment = enrollment;
  }

  res.json(courseData);
};

const createCourse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const course = await Course.create({
    ...req.body,
    trainer: req.user._id,
  });

  const populated = await Course.findById(course._id).populate('trainer', 'name email');
  res.status(201).json(populated);
};

const updateCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (req.user.role === 'trainer' && course.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to update this course' });
  }

  const { title, description, duration, category, content, isPublished } = req.body;
  if (title) course.title = title;
  if (description) course.description = description;
  if (duration) course.duration = duration;
  if (category !== undefined) course.category = category;
  if (content !== undefined) course.content = content;
  if (isPublished !== undefined) course.isPublished = isPublished;

  const updated = await course.save();
  const populated = await Course.findById(updated._id).populate('trainer', 'name email');
  res.json(populated);
};

const deleteCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (req.user.role === 'trainer' && course.trainer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this course' });
  }

  await Enrollment.deleteMany({ course: course._id });
  await course.deleteOne();
  res.json({ message: 'Course removed' });
};

const enrollCourse = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || !course.isPublished) {
    return res.status(404).json({ message: 'Course not found' });
  }

  let enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });

  if (enrollment && enrollment.status !== 'dropped') {
    return res.status(400).json({ message: 'Already enrolled in this course' });
  }

  if (enrollment && enrollment.status === 'dropped') {
    enrollment.status = 'active';
    enrollment.progress = 0;
    enrollment.completedAt = undefined;
    await enrollment.save();
  } else {
    enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
    });
    course.enrolledCount += 1;
    await course.save();
  }

  const populated = await Enrollment.findById(enrollment._id)
    .populate('course', 'title description duration category')
    .populate('student', 'name email');

  res.status(201).json(populated);
};

const dropCourse = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.id,
    status: { $ne: 'dropped' },
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'Enrollment not found' });
  }

  enrollment.status = 'dropped';
  await enrollment.save();

  const course = await Course.findById(req.params.id);
  if (course && course.enrolledCount > 0) {
    course.enrolledCount -= 1;
    await course.save();
  }

  res.json({ message: 'Dropped from course successfully' });
};

const getMyEnrollments = async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.user._id,
    status: { $ne: 'dropped' },
  })
    .populate('course', 'title description duration category trainer')
    .populate({
      path: 'course',
      populate: { path: 'trainer', select: 'name' },
    })
    .sort({ createdAt: -1 });

  res.json(enrollments);
};

const getCourseEnrollments = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const isOwner = req.user.role === 'trainer' && course.trainer.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view enrollments' });
  }

  const enrollments = await Enrollment.find({
    course: course._id,
    status: { $ne: 'dropped' },
  })
    .populate('student', 'name email phone')
    .sort({ createdAt: -1 });

  res.json(enrollments);
};

const updateProgress = async (req, res) => {
  const { progress } = req.body;
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.id,
    status: { $ne: 'dropped' },
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'Enrollment not found' });
  }

  enrollment.progress = Math.min(100, Math.max(0, progress));
  if (enrollment.progress === 100) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
  } else if (enrollment.status === 'completed') {
    enrollment.status = 'active';
    enrollment.completedAt = undefined;
  }

  await enrollment.save();
  res.json(enrollment);
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  dropCourse,
  getMyEnrollments,
  getCourseEnrollments,
  updateProgress,
};
