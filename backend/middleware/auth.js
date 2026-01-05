/**
 * Authentication Middleware
 * Simple authentication for demo purposes
 * In production, implement proper JWT or OAuth
 */

const supabase = require('../config/database');

/**
 * Mock authentication middleware
 * For production, implement proper JWT/OAuth
 */
async function authenticate(req, res, next) {
    try {
        // For demo: get user from query param or header
        // In production, use JWT token from Authorization header
        const userId = req.headers['x-user-id'] || req.query.userId;

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                error: 'Authentication required' 
            });
        }

        // Get user from database or create if doesn't exist
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        // If user doesn't exist, create it
        if (error || !user) {
            // Check if error is because user doesn't exist (PGRST116 = not found)
            const isNotFoundError = error && (error.code === 'PGRST116' || error.message?.includes('No rows'));
            
            if (isNotFoundError || !user) {
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{
                        id: userId
                        // github_username is optional
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating user in middleware:', createError);
                    // If still error, return unauthorized
                    return res.status(401).json({ 
                        success: false, 
                        error: 'Invalid user',
                        details: createError.message
                    });
                }
                user = newUser;
            } else {
                // Some other database error
                console.error('Database error in auth middleware:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Authentication failed',
                    details: error.message
                });
            }
        }

        // Attach user to request
        req.user = {
            userId: user.id,
            githubToken: user.github_token,
            githubUsername: user.github_username
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
}

/**
 * Create or get user (for initial setup)
 */
async function createOrGetUser(req, res, next) {
    try {
        const { githubUsername } = req.body;

        if (!githubUsername) {
            return res.status(400).json({ 
                success: false, 
                error: 'GitHub username is required' 
            });
        }

        // Check if user exists
        let { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('github_username', githubUsername)
            .single();

        // Create user if doesn't exist
        if (!user) {
            const { data: newUser, error } = await supabase
                .from('users')
                .insert([{
                    github_username: githubUsername
                }])
                .select()
                .single();

            if (error) throw error;
            user = newUser;
        }

        req.user = {
            userId: user.id,
            githubToken: user.github_token,
            githubUsername: user.github_username
        };

        next();
    } catch (error) {
        console.error('Error in createOrGetUser:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    authenticate,
    createOrGetUser
};

