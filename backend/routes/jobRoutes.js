const express = require('express');
const { body } = require('express-validator');
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getApplications,
  updateApplicationStatus,
  getDashboardStats,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = express.Router();

router.use(protect);

router.get('/dashboard/stats', getDashboardStats);
router.get('/', getJobs);
router.get('/applications/list', getApplications);
router.get('/:id', getJobById);
router.post(
  '/',
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('company').trim().notEmpty().withMessage('Company is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  createJob
);
router.put('/:id', authorize('admin'), updateJob);
router.delete('/:id', authorize('admin'), deleteJob);
router.post('/:id/apply', authorize('student'), applyForJob);
router.put('/applications/:id/status', authorize('admin'), updateApplicationStatus);

module.exports = router;
