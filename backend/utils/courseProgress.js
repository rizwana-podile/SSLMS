const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');

const syncEnrollmentProgress = async (studentId, courseId) => {
  const totalAssignments = await Assignment.countDocuments({ course: courseId });
  if (totalAssignments === 0) return null;

  const assignmentIds = await Assignment.find({ course: courseId }).distinct('_id');
  const evaluatedCount = await Submission.countDocuments({
    student: studentId,
    assignment: { $in: assignmentIds },
    status: 'evaluated',
  });

  const progress = Math.round((evaluatedCount / totalAssignments) * 100);

  const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
  if (!enrollment || enrollment.status === 'dropped') return null;

  enrollment.progress = progress;
  if (progress === 100) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();
  } else if (enrollment.status === 'completed') {
    enrollment.status = 'active';
    enrollment.completedAt = undefined;
  }

  await enrollment.save();
  return enrollment;
};

module.exports = { syncEnrollmentProgress };
