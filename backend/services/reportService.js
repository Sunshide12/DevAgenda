/**
 * Report Service
 * Handles report generation and storage
 */

const supabase = require('../config/database');
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subWeeks, subMonths } = require('date-fns');

class ReportService {
    /**
     * Generate weekly report
     */
    async generateWeeklyReport(userId, projectId = null, weekStart = null) {
        try {
            const start = weekStart ? new Date(weekStart) : new Date();
            const weekStartDate = startOfWeek(start, { weekStartsOn: 1 }); // Monday
            const weekEndDate = endOfWeek(start, { weekStartsOn: 1 });

            return await this.generateReport(userId, projectId, 'SEMANAL', weekStartDate, weekEndDate);
        } catch (error) {
            console.error('Error generating weekly report:', error);
            throw error;
        }
    }

    /**
     * Generate monthly report
     */
    async generateMonthlyReport(userId, projectId = null, monthStart = null) {
        try {
            const start = monthStart ? new Date(monthStart) : new Date();
            const monthStartDate = startOfMonth(start);
            const monthEndDate = endOfMonth(start);

            return await this.generateReport(userId, projectId, 'MENSUAL', monthStartDate, monthEndDate);
        } catch (error) {
            console.error('Error generating monthly report:', error);
            throw error;
        }
    }

    /**
     * Generate report (base method)
     */
    async generateReport(userId, projectId, reportType, startDate, endDate) {
        try {
            // Get projects
            let projectQuery = supabase
                .from('projects')
                .select('id, name, status')
                .eq('user_id', userId);

            if (projectId) {
                projectQuery = projectQuery.eq('id', projectId);
            }

            const { data: projects } = await projectQuery;

            if (!projects || projects.length === 0) {
                return this.createEmptyReport(userId, projectId, reportType, startDate, endDate);
            }

            const projectIds = projects.map(p => p.id);

            // Get commits in date range
            const { data: commits } = await supabase
                .from('commits')
                .select('*')
                .in('project_id', projectIds)
                .gte('commit_date', startDate.toISOString())
                .lte('commit_date', endDate.toISOString())
                .order('commit_date', { ascending: false });

            // Calculate statistics
            const stats = {
                totalCommits: commits?.length || 0,
                totalAdditions: commits?.reduce((sum, c) => sum + (c.additions || 0), 0) || 0,
                totalDeletions: commits?.reduce((sum, c) => sum + (c.deletions || 0), 0) || 0,
                projectsCount: projects.length,
                projects: projects.map(project => {
                    const projectCommits = commits?.filter(c => c.project_id === project.id) || [];
                    return {
                        id: project.id,
                        name: project.name,
                        status: project.status,
                        commits: projectCommits.length,
                        additions: projectCommits.reduce((sum, c) => sum + (c.additions || 0), 0),
                        deletions: projectCommits.reduce((sum, c) => sum + (c.deletions || 0), 0),
                        commitsList: projectCommits.map(c => ({
                            sha: c.sha.substring(0, 7),
                            message: c.message,
                            date: c.commit_date,
                            additions: c.additions,
                            deletions: c.deletions
                        }))
                    };
                })
            };

            // Create report content
            const reportContent = {
                period: {
                    start: format(startDate, 'yyyy-MM-dd'),
                    end: format(endDate, 'yyyy-MM-dd'),
                    startFormatted: format(startDate, 'MMMM d, yyyy'),
                    endFormatted: format(endDate, 'MMMM d, yyyy')
                },
                statistics: stats,
                generatedAt: new Date().toISOString()
            };

            // Save report to database
            const { data: report, error } = await supabase
                .from('reports')
                .insert([{
                    user_id: userId,
                    project_id: projectId,
                    report_type: reportType,
                    start_date: format(startDate, 'yyyy-MM-dd'),
                    end_date: format(endDate, 'yyyy-MM-dd'),
                    total_commits: stats.totalCommits,
                    total_additions: stats.totalAdditions,
                    total_deletions: stats.totalDeletions,
                    projects_count: stats.projectsCount,
                    content: reportContent
                }])
                .select()
                .single();

            if (error) throw error;

            return {
                ...report,
                content: reportContent
            };
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    /**
     * Create empty report
     */
    createEmptyReport(userId, projectId, reportType, startDate, endDate) {
        return {
            user_id: userId,
            project_id: projectId,
            report_type: reportType,
            start_date: format(startDate, 'yyyy-MM-dd'),
            end_date: format(endDate, 'yyyy-MM-dd'),
            total_commits: 0,
            total_additions: 0,
            total_deletions: 0,
            projects_count: 0,
            content: {
                period: {
                    start: format(startDate, 'yyyy-MM-dd'),
                    end: format(endDate, 'yyyy-MM-dd'),
                    startFormatted: format(startDate, 'MMMM d, yyyy'),
                    endFormatted: format(endDate, 'MMMM d, yyyy')
                },
                statistics: {
                    totalCommits: 0,
                    totalAdditions: 0,
                    totalDeletions: 0,
                    projectsCount: 0,
                    projects: []
                },
                generatedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Get saved reports
     */
    async getReports(userId, reportType = null, projectId = null) {
        try {
            let query = supabase
                .from('reports')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (reportType) {
                query = query.eq('report_type', reportType);
            }
            if (projectId) {
                query = query.eq('project_id', projectId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching reports:', error);
            throw error;
        }
    }

    /**
     * Get report by ID
     */
    async getReportById(reportId, userId) {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', reportId)
                .eq('user_id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching report:', error);
            throw error;
        }
    }
}

module.exports = new ReportService();

