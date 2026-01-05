/**
 * GitHub Service
 * Handles all GitHub API interactions
 */

const axios = require('axios');

class GitHubService {
    constructor(token) {
        this.token = token;
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'DevAgenda-App'
        };
    }

    /**
     * Get user repositories
     */
    async getUserRepositories() {
        try {
            const response = await axios.get(`${this.baseURL}/user/repos`, {
                headers: this.headers,
                params: {
                    per_page: 100,
                    sort: 'updated',
                    direction: 'desc'
                }
            });
            return response.data.map(repo => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                owner: repo.owner.login,
                description: repo.description,
                private: repo.private,
                url: repo.html_url,
                updated_at: repo.updated_at
            }));
        } catch (error) {
            console.error('Error fetching repositories:', error.message);
            throw new Error('Failed to fetch repositories from GitHub');
        }
    }

    /**
     * Get commits from a repository
     */
    async getRepositoryCommits(owner, repo, since = null, until = null) {
        try {
            const params = {
                per_page: 100
            };
            
            if (since) {
                params.since = since;
            }
            if (until) {
                params.until = until;
            }

            const response = await axios.get(
                `${this.baseURL}/repos/${owner}/${repo}/commits`,
                {
                    headers: this.headers,
                    params
                }
            );

            return response.data.map(commit => ({
                sha: commit.sha,
                message: commit.commit.message,
                author_name: commit.commit.author.name,
                author_email: commit.commit.author.email,
                date: commit.commit.author.date,
                url: commit.html_url,
                stats: null // Will be fetched separately if needed
            }));
        } catch (error) {
            console.error(`Error fetching commits for ${owner}/${repo}:`, error.message);
            throw new Error(`Failed to fetch commits from ${owner}/${repo}`);
        }
    }

    /**
     * Get commit statistics
     */
    async getCommitStats(owner, repo, sha) {
        try {
            const response = await axios.get(
                `${this.baseURL}/repos/${owner}/${repo}/commits/${sha}`,
                { headers: this.headers }
            );
            
            return {
                additions: response.data.stats?.additions || 0,
                deletions: response.data.stats?.deletions || 0,
                files_changed: response.data.files?.length || 0
            };
        } catch (error) {
            console.error(`Error fetching stats for commit ${sha}:`, error.message);
            return {
                additions: 0,
                deletions: 0,
                files_changed: 0
            };
        }
    }

    /**
     * Get user information
     */
    async getUserInfo() {
        try {
            const response = await axios.get(`${this.baseURL}/user`, {
                headers: this.headers
            });
            return {
                id: response.data.id,
                login: response.data.login,
                name: response.data.name,
                email: response.data.email,
                avatar_url: response.data.avatar_url,
                bio: response.data.bio
            };
        } catch (error) {
            console.error('Error fetching user info:', error.message);
            throw new Error('Failed to fetch user information from GitHub');
        }
    }

    /**
     * Sync commits for a project
     */
    async syncProjectCommits(owner, repo, projectId, supabase) {
        try {
            // Get commits from last 90 days
            const since = new Date();
            since.setDate(since.getDate() - 90);
            const sinceISO = since.toISOString();

            const commits = await this.getRepositoryCommits(owner, repo, sinceISO);

            // Process commits in batches
            const commitData = [];
            for (const commit of commits) {
                const stats = await this.getCommitStats(owner, repo, commit.sha);
                
                commitData.push({
                    project_id: projectId,
                    sha: commit.sha,
                    message: commit.message,
                    author_name: commit.author_name,
                    author_email: commit.author_email,
                    commit_date: commit.date,
                    url: commit.url,
                    additions: stats.additions,
                    deletions: stats.deletions,
                    files_changed: stats.files_changed
                });
            }

            // Insert or update commits
            if (commitData.length > 0) {
                const { error } = await supabase
                    .from('commits')
                    .upsert(commitData, {
                        onConflict: 'project_id,sha',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error('Error syncing commits:', error);
                    throw error;
                }
            }

            return commitData.length;
        } catch (error) {
            console.error('Error syncing project commits:', error);
            throw error;
        }
    }
}

module.exports = GitHubService;

