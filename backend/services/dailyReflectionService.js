/**
 * Daily Reflection Service
 * Handles daily reflections and introspection
 */

const supabase = require('../config/database');
const { format, startOfDay, endOfDay } = require('date-fns');
const commitService = require('./commitService');

class DailyReflectionService {
    /**
     * Get or create daily reflection
     */
    async getDailyReflection(userId, date = null) {
        try {
            const reflectionDate = date ? new Date(date) : new Date();
            const dateStr = format(reflectionDate, 'yyyy-MM-dd');

            // Get existing reflection
            const { data: existing } = await supabase
                .from('daily_reflections')
                .select('*')
                .eq('user_id', userId)
                .eq('reflection_date', dateStr)
                .single();

            if (existing) {
                return existing;
            }

            // Get today's commits for stats
            const todayCommits = await commitService.getTodayCommits(userId);
            const projectsWorked = new Set(todayCommits.map(c => c.project_id)).size;

            // Create new reflection
            const { data: newReflection, error } = await supabase
                .from('daily_reflections')
                .insert([{
                    user_id: userId,
                    reflection_date: dateStr,
                    commits_count: todayCommits.length,
                    projects_worked: projectsWorked
                }])
                .select()
                .single();

            if (error) throw error;
            return newReflection;
        } catch (error) {
            console.error('Error getting daily reflection:', error);
            throw error;
        }
    }

    /**
     * Update daily reflection
     */
    async updateDailyReflection(userId, date, updates) {
        try {
            const dateStr = format(new Date(date), 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('daily_reflections')
                .update(updates)
                .eq('user_id', userId)
                .eq('reflection_date', dateStr)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating daily reflection:', error);
            throw error;
        }
    }

    /**
     * Get reflection with commits data
     */
    async getReflectionWithCommits(userId, date = null) {
        try {
            const reflection = await this.getDailyReflection(userId, date);
            const commits = await commitService.getTodayCommits(userId);

            // Group commits by project
            const commitsByProject = {};
            commits.forEach(commit => {
                const projectId = commit.project_id;
                if (!commitsByProject[projectId]) {
                    commitsByProject[projectId] = {
                        project: commit.projects,
                        commits: []
                    };
                }
                commitsByProject[projectId].commits.push(commit);
            });

            return {
                reflection,
                commits,
                commitsByProject: Object.values(commitsByProject),
                totalCommits: commits.length,
                totalProjects: Object.keys(commitsByProject).length
            };
        } catch (error) {
            console.error('Error getting reflection with commits:', error);
            throw error;
        }
    }
}

module.exports = new DailyReflectionService();

