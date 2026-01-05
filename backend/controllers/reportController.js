/**
 * Report Controller
 * Handles report generation and retrieval
 */

const reportService = require('../services/reportService');

class ReportController {
    /**
     * Generate weekly report
     */
    async generateWeeklyReport(req, res) {
        try {
            const { userId } = req.user;
            const { projectId, weekStart } = req.query;

            const report = await reportService.generateWeeklyReport(
                userId, 
                projectId || null, 
                weekStart || null
            );

            res.json({ success: true, data: report });
        } catch (error) {
            console.error('Error in generateWeeklyReport:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Generate monthly report
     */
    async generateMonthlyReport(req, res) {
        try {
            const { userId } = req.user;
            const { projectId, monthStart } = req.query;

            const report = await reportService.generateMonthlyReport(
                userId, 
                projectId || null, 
                monthStart || null
            );

            res.json({ success: true, data: report });
        } catch (error) {
            console.error('Error in generateMonthlyReport:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get all reports
     */
    async getReports(req, res) {
        try {
            const { userId } = req.user;
            const { type, projectId } = req.query;

            const reports = await reportService.getReports(
                userId, 
                type || null, 
                projectId || null
            );

            res.json({ success: true, data: reports });
        } catch (error) {
            console.error('Error in getReports:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get report by ID
     */
    async getReport(req, res) {
        try {
            const { userId } = req.user;
            const { id } = req.params;

            const report = await reportService.getReportById(id, userId);
            if (!report) {
                return res.status(404).json({ success: false, error: 'Report not found' });
            }

            res.json({ success: true, data: report });
        } catch (error) {
            console.error('Error in getReport:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ReportController();

