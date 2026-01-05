/**
 * Reflection Routes
 */

const express = require('express');
const router = express.Router();
const reflectionController = require('../controllers/reflectionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', reflectionController.getDailyReflection.bind(reflectionController));
router.put('/', reflectionController.updateDailyReflection.bind(reflectionController));

module.exports = router;

