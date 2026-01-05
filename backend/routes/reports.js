/**
 * Report Routes
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/weekly', reportController.generateWeeklyReport.bind(reportController));
router.get('/monthly', reportController.generateMonthlyReport.bind(reportController));
router.get('/', reportController.getReports.bind(reportController));
router.get('/:id', reportController.getReport.bind(reportController));

module.exports = router;

