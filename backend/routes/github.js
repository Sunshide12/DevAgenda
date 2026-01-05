/**
 * GitHub Routes
 */

const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { authenticate, createOrGetUser } = require('../middleware/auth');

router.post('/connect', authenticate, githubController.connectGitHub.bind(githubController));
router.get('/repositories', authenticate, githubController.getRepositories.bind(githubController));
router.get('/user', authenticate, githubController.getUserInfo.bind(githubController));

module.exports = router;

