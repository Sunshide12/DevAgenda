/**
 * Commit Service
 * Handles commit-related database operations
 */

const supabase = require('../config/database');
const { format, startOfDay, endOfDay, parseISO } = require('date-fns');

class CommitService {
    /**
     * Get commits for a project
     */
    async getProjectCommits(projectId, userId, startDate = null, endDate = null) {
        try {
            // Verify project belongs to user
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('id', projectId)
                .eq('user_id', userId)
                .single();

            if (!project) {
                throw new Error('Project not found or access denied');
            }

            let query = supabase
                .from('commits')
                .select('*')
                .eq('project_id', projectId)
                .order('commit_date', { ascending: false });

            if (startDate) {
                query = query.gte('commit_date', startDate);
            }
            if (endDate) {
                query = query.lte('commit_date', endDate);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching commits:', error);
            throw error;
        }
    }

    /**
     * Get commits grouped by day
     */
    async getCommitsByDay(projectId, userId, startDate = null, endDate = null) {
        try {
            const commits = await this.getProjectCommits(projectId, userId, startDate, endDate);
            
            const grouped = {};
            commits.forEach(commit => {
                const commitDate = parseISO(commit.commit_date);
                const dayKey = format(commitDate, 'yyyy-MM-dd');
                
                if (!grouped[dayKey]) {
                    grouped[dayKey] = {
                        date: dayKey,
                        displayDate: format(commitDate, 'EEEE, MMMM d, yyyy'),
                        commits: [],
                        totalAdditions: 0,
                        totalDeletions: 0,
                        totalFiles: 0
                    };
                }
                
                grouped[dayKey].commits.push(commit);
                grouped[dayKey].totalAdditions += commit.additions || 0;
                grouped[dayKey].totalDeletions += commit.deletions || 0;
                grouped[dayKey].totalFiles += commit.files_changed || 0;
            });

            return Object.values(grouped).sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
        } catch (error) {
            console.error('Error grouping commits by day:', error);
            throw error;
        }
    }

    /**
     * Get commits for today
     */
    async getTodayCommits(userId) {
        try {
            const today = new Date();
            const start = startOfDay(today).toISOString();
            const end = endOfDay(today).toISOString();

            const { data: projects } = await supabase
                .from('projects')
                .select('id')
                .eq('user_id', userId)
                .eq('status', 'EN_CURSO');

            if (!projects || projects.length === 0) {
                return [];
            }

            const projectIds = projects.map(p => p.id);

            const { data: commits, error } = await supabase
                .from('commits')
                .select(`
                    *,
                    projects:project_id (
                        id,
                        name,
                        github_repo
                    )
                `)
                .in('project_id', projectIds)
                .gte('commit_date', start)
                .lte('commit_date', end)
                .order('commit_date', { ascending: false });

            if (error) throw error;
            return commits || [];
        } catch (error) {
            console.error('Error fetching today commits:', error);
            throw error;
        }
    }

    /**
     * Get commit statistics for a project
     */
    async getProjectStats(projectId, userId) {
        try {
            const commits = await this.getProjectCommits(projectId, userId);
            
            return {
                totalCommits: commits.length,
                totalAdditions: commits.reduce((sum, c) => sum + (c.additions || 0), 0),
                totalDeletions: commits.reduce((sum, c) => sum + (c.deletions || 0), 0),
                totalFiles: commits.reduce((sum, c) => sum + (c.files_changed || 0), 0),
                firstCommit: commits.length > 0 ? commits[commits.length - 1].commit_date : null,
                lastCommit: commits.length > 0 ? commits[0].commit_date : null
            };
        } catch (error) {
            console.error('Error calculating project stats:', error);
            throw error;
        }
    }
}

module.exports = new CommitService();

