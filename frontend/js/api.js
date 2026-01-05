/**
 * API Service
 * Handles all API calls to the backend
 */

const API = {
    userId: CONFIG.getUserId(),
    
    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-User-Id': this.userId || CONFIG.getUserId(),
            ...options.headers
        };
        
        const config = {
            ...options,
            headers
        };
        
        try {
            const response = await fetch(url, config);
            
            // Handle non-JSON responses
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || `HTTP ${response.status}`);
            }
            
            if (!response.ok) {
                const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
                throw new Error(errorMsg);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Re-throw with more context
            if (error.message) {
                throw error;
            } else {
                throw new Error(`Network error: ${error.message || 'Unknown error'}`);
            }
        }
    },
    
    /**
     * Projects API
     */
    projects: {
        async getAll(status = null) {
            const endpoint = status ? `/projects?status=${status}` : '/projects';
            return API.request(endpoint);
        },
        
        async getByStatus() {
            return API.request('/projects/by-status');
        },
        
        async get(id) {
            return API.request(`/projects/${id}`);
        },
        
        async create(projectData) {
            return API.request('/projects', {
                method: 'POST',
                body: JSON.stringify(projectData)
            });
        },
        
        async update(id, updates) {
            return API.request(`/projects/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
        },
        
        async delete(id) {
            return API.request(`/projects/${id}`, {
                method: 'DELETE'
            });
        },
        
        async sync(id) {
            return API.request(`/projects/${id}/sync`, {
                method: 'POST'
            });
        },
        
        async getCommits(id, startDate = null, endDate = null, groupBy = null) {
            let endpoint = `/projects/${id}/commits?`;
            if (startDate) endpoint += `startDate=${startDate}&`;
            if (endDate) endpoint += `endDate=${endDate}&`;
            if (groupBy) endpoint += `groupBy=${groupBy}&`;
            return API.request(endpoint);
        },
        
        async getStats(id) {
            return API.request(`/projects/${id}/stats`);
        }
    },
    
    /**
     * Auth API
     */
    auth: {
        async init(userId) {
            return API.request('/auth/init', {
                method: 'POST',
                body: JSON.stringify({ userId })
            });
        }
    },
    
    /**
     * GitHub API
     */
    github: {
        async connect(token, username) {
            return API.request('/github/connect', {
                method: 'POST',
                body: JSON.stringify({ token, username })
            });
        },
        
        async getRepositories() {
            return API.request('/github/repositories');
        },
        
        async getUserInfo() {
            return API.request('/github/user');
        }
    },
    
    /**
     * Reports API
     */
    reports: {
        async generateWeekly(projectId = null, weekStart = null) {
            let endpoint = '/reports/weekly?';
            if (projectId) endpoint += `projectId=${projectId}&`;
            if (weekStart) endpoint += `weekStart=${weekStart}&`;
            return API.request(endpoint);
        },
        
        async generateMonthly(projectId = null, monthStart = null) {
            let endpoint = '/reports/monthly?';
            if (projectId) endpoint += `projectId=${projectId}&`;
            if (monthStart) endpoint += `monthStart=${monthStart}&`;
            return API.request(endpoint);
        },
        
        async getAll(type = null, projectId = null) {
            let endpoint = '/reports?';
            if (type) endpoint += `type=${type}&`;
            if (projectId) endpoint += `projectId=${projectId}&`;
            return API.request(endpoint);
        },
        
        async get(id) {
            return API.request(`/reports/${id}`);
        }
    },
    
    /**
     * Reflections API
     */
    reflections: {
        async get(date = null) {
            const endpoint = date ? `/reflections?date=${date}` : '/reflections';
            return API.request(endpoint);
        },
        
        async update(date, content, feeling) {
            return API.request('/reflections', {
                method: 'PUT',
                body: JSON.stringify({ date, content, feeling })
            });
        }
    }
};

