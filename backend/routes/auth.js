/**
 * Authentication Routes
 * Handles user initialization and authentication
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/database');

/**
 * Initialize or get user
 * Creates user if doesn't exist, returns existing user if exists
 */
router.post('/init', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        // Check if user exists
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        // Create user if doesn't exist
        if (error || !user) {
            // Check if error is because user doesn't exist (not a database error)
            const isNotFoundError = error && error.code === 'PGRST116';
            
            if (isNotFoundError || !user) {
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{
                        id: userId
                        // github_username is optional, can be null
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating user:', createError);
                    // Return more detailed error for debugging
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to create user',
                        details: createError.message
                    });
                }

                user = newUser;
            } else {
                // Some other database error
                console.error('Error fetching user:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Database error',
                    details: error.message
                });
            }
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                github_username: user.github_username,
                github_connected: !!user.github_token
            }
        });
    } catch (error) {
        console.error('Error in /auth/init:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

