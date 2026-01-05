/**
 * GitHub Controller
 * Handles GitHub API related requests
 */

const GitHubService = require('../services/githubService');
const supabase = require('../config/database');

class GitHubController {
    /**
     * Get user repositories
     */
    async getRepositories(req, res) {
        try {
            const { githubToken } = req.user;

            if (!githubToken) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'GitHub token not configured' 
                });
            }

            const github = new GitHubService(githubToken);
            const repositories = await github.getUserRepositories();

            res.json({ success: true, data: repositories });
        } catch (error) {
            console.error('Error in getRepositories:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Connect GitHub account
     */
    async connectGitHub(req, res) {
        try {
            const { userId } = req.user;
            const { token, username } = req.body;

            if (!token) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'GitHub token is required' 
                });
            }

            // Verify token by getting user info
            const github = new GitHubService(token);
            const userInfo = await github.getUserInfo();

            // Update user with GitHub info
            const { data, error } = await supabase
                .from('users')
                .update({
                    github_token: token,
                    github_username: userInfo.login,
                    name: userInfo.name || username,
                    email: userInfo.email,
                    avatar_url: userInfo.avatar_url
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            res.json({ 
                success: true, 
                message: 'GitHub account connected successfully',
                data: {
                    github_username: userInfo.login,
                    avatar_url: userInfo.avatar_url
                }
            });
        } catch (error) {
            console.error('Error in connectGitHub:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get GitHub user info
     */
    async getUserInfo(req, res) {
        try {
            const { githubToken } = req.user;

            if (!githubToken) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'GitHub token not configured' 
                });
            }

            const github = new GitHubService(githubToken);
            const userInfo = await github.getUserInfo();

            res.json({ success: true, data: userInfo });
        } catch (error) {
            console.error('Error in getUserInfo:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

module.exports = new GitHubController();

