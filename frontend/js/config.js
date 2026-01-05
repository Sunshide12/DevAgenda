/**
 * Configuration
 * API endpoints and app settings
 */

const CONFIG = {
    // Use relative URL for production (Vercel) or absolute for local dev
    API_BASE_URL: (() => {
        // Check if we're in development (localhost)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000/api';
        }
        return window.location.origin + '/api';
    })(),
    
    // Get user ID from localStorage or generate new one
    getUserId: () => {
        let userId = localStorage.getItem('devagenda_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('devagenda_user_id', userId);
        }
        return userId;
    },
    
    // Set user ID
    setUserId: (userId) => {
        localStorage.setItem('devagenda_user_id', userId);
    },
    
    // Get GitHub token
    getGitHubToken: () => {
        return localStorage.getItem('devagenda_github_token');
    },
    
    // Set GitHub token
    setGitHubToken: (token) => {
        localStorage.setItem('devagenda_github_token', token);
    }
};

