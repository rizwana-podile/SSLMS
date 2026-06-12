const express = require('express');
const { body } = require('express-validator');
const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  evaluateSubmission,
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/', getAssignments);
router.get('/submissions', getSubmissions);
router.get('/:id', getAssignmentById);
router.post(
  '/',
  authorize('trainer'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('course').notEmpty().withMessage('Course is required'),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
  ],
  createAssignment
);
router.put('/:id', authorize('trainer'), updateAssignment);
router.delete('/:id', authorize('trainer'), deleteAssignment);
router.post(
  '/:id/submit',
  authorize('student'),
  [body('content').trim().notEmpty().withMessage('Submission content is required')],
  submitAssignment
);
router.put(
  '/submissions/:id/evaluate',
  authorize('trainer'),
  evaluateSubmission
);

module.exports = router;
