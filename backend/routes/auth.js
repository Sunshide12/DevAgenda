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
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{
                    id: userId,
                    github_username: null
                }])
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create user'
                });
            }

            user = newUser;
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

