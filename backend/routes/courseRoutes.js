const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/courseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/', getCourses);
router.get('/my-enrollments', authorize('student'), getMyEnrollments);
router.get('/:id/enrollments', authorize('admin', 'trainer'), getCourseEnrollments);
router.get('/:id', getCourseById);
router.post(
  '/',
  authorize('admin', 'trainer'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('duration').trim().notEmpty().withMessage('Duration is required'),
  ],
  createCourse
);
router.put('/:id', authorize('admin', 'trainer'), updateCourse);
router.delete('/:id', authorize('admin', 'trainer'), deleteCourse);
router.post('/:id/enroll', authorize('student'), enrollCourse);
router.post('/:id/drop', authorize('student'), dropCourse);
router.put('/:id/progress', authorize('student'), updateProgress);

module.exports = router;
