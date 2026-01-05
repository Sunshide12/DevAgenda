/**
 * Reflection Controller
 * Handles daily reflection requests
 */

const reflectionService = require('../services/dailyReflectionService');

class ReflectionController {
    /**
     * Get daily reflection
     */
    async getDailyReflection(req, res) {
        try {
            const { userId } = req.user;
            const { date } = req.query;

            const reflection = await reflectionService.getReflectionWithCommits(
                userId, 
                date || null
            );

            res.json({ success: true, data: reflection });
        } catch (error) {
            console.error('Error in getDailyReflection:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update daily reflection
     */
    async updateDailyReflection(req, res) {
        try {
            const { userId } = req.user;
            const { date, content, feeling } = req.body;

            if (!date) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Date is required' 
                });
            }

            const updates = {};
            if (content !== undefined) updates.content = content;
            if (feeling !== undefined) updates.feeling = feeling;

            const reflection = await reflectionService.updateDailyReflection(
                userId, 
                date, 
                updates
            );

            res.json({ success: true, data: reflection });
        } catch (error) {
            console.error('Error in updateDailyReflection:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ReflectionController();

