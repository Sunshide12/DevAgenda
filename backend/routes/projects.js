/**
 * Project Routes
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

router.get('/', projectController.getProjects.bind(projectController));
router.get('/by-status', projectController.getProjectsByStatus.bind(projectController));
router.get('/:id', projectController.getProject.bind(projectController));
router.post('/', projectController.createProject.bind(projectController));
router.put('/:id', projectController.updateProject.bind(projectController));
router.delete('/:id', projectController.deleteProject.bind(projectController));
router.post('/:id/sync', projectController.syncProject.bind(projectController));
router.get('/:id/commits', projectController.getProjectCommits.bind(projectController));
router.get('/:id/stats', projectController.getProjectStats.bind(projectController));

module.exports = router;

