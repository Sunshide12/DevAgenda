/**
 * Project Controller
 * Handles HTTP requests for projects
 */

const projectService = require('../services/projectService');
const githubService = require('../services/githubService');
const commitService = require('../services/commitService');
const supabase = require('../config/database');

class ProjectController {
    /**
     * Get all projects for user
     */
    async getProjects(req, res) {
        try {
            const { userId } = req.user;
            const { status } = req.query;

            const projects = await projectService.getUserProjects(userId, status);
            res.json({ success: true, data: projects });
        } catch (error) {
            console.error('Error in getProjects:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get projects grouped by status
     */
    async getProjectsByStatus(req, res) {
        try {
            const { userId } = req.user;
            const projects = await projectService.getProjectsByStatus(userId);
            res.json({ success: true, data: projects });
        } catch (error) {
            console.error('Error in getProjectsByStatus:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get single project
     */
    async getProject(req, res) {
        try {
            const { userId } = req.user;
            const { id } = req.params;

            const project = await projectService.getProjectById(id, userId);
            if (!project) {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }

            res.json({ success: true, data: project });
        } catch (error) {
            console.error('Error in getProject:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Create new project
     */
    async createProject(req, res) {
        try {
            const { userId } = req.user;
            const projectData = {
                ...req.body,
                user_id: userId
            };

            const project = await projectService.createProject(projectData);
            res.status(201).json({ success: true, data: project });
        } catch (error) {
            console.error('Error in createProject:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update project
     */
    async updateProject(req, res) {
        try {
            const { userId } = req.user;
            const { id } = req.params;

            const project = await projectService.updateProject(id, userId, req.body);
            res.json({ success: true, data: project });
        } catch (error) {
            console.error('Error in updateProject:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete project
     */
    async deleteProject(req, res) {
        try {
            const { userId } = req.user;
            const { id } = req.params;

            await projectService.deleteProject(id, userId);
            res.json({ success: true, message: 'Project deleted successfully' });
        } catch (error) {
            console.error('Error in deleteProject:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Sync project with GitHub
     */
    async syncProject(req, res) {
        try {
            const { userId, githubToken } = req.user;
            const { id } = req.params;

            if (!githubToken) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'GitHub token not configured' 
                });
            }

            const project = await projectService.getProjectById(id, userId);
            if (!project) {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }

            if (!project.github_repo || !project.github_owner) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Project does not have GitHub repository configured' 
                });
            }

            const GitHubService = require('../services/githubService');
            const github = new GitHubService(githubToken);
            const commitsCount = await github.syncProjectCommits(
                project.github_owner,
                project.github_repo,
                project.id,
                supabase
            );

            res.json({ 
                success: true, 
                message: `Synced ${commitsCount} commits`,
                commitsCount 
            });
        } catch (error) {
            console.error('Error in syncProject:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get project commits
     */
    async getProjectCommits(req, res) {
        try {
            const { userId } = req.user;
            const { id } = req.params;
            const { startDate, endDate, groupBy } = req.query;

            if (groupBy === 'day') {
                const commits = await commitService.getCommitsByDay(
                    id, 
                    userId, 
                    startDate, 
                    endDate
                );
                return res.json({ success: true, data: commits });
            }

            const commits = await commitService.getProjectCommits(
                id, 
                userId, 
                startDate, 
                endDate
            );
            res.json({ success: true, data: commits });
        } catch (error) {
            console.error('Error in getProjectCommits:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get project statistics
     */
    async getProjectStats(req, res) {
        try {
            const { userId } = req.user;
            const { id } = req.params;

            const stats = await commitService.getProjectStats(id, userId);
            res.json({ success: true, data: stats });
        } catch (error) {
            console.error('Error in getProjectStats:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new ProjectController();

