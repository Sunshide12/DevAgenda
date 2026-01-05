/**
 * Database Configuration
 * Connects to Supabase PostgreSQL database
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_KEY in your .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

