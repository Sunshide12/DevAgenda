-- Migration script to fix users table
-- Run this in Supabase SQL Editor if you already have the table created

-- First, drop the existing table constraints if they exist
ALTER TABLE IF EXISTS users 
    DROP CONSTRAINT IF EXISTS users_github_username_key;

-- Modify the table to allow NULL github_username and change ID to VARCHAR
-- Note: This will require dropping and recreating the table if you have data
-- If you have existing data, backup first!

-- Option 1: If table is empty or you can drop it
DROP TABLE IF EXISTS users CASCADE;

-- Recreate with correct schema
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    github_username VARCHAR(255) UNIQUE,
    github_token TEXT,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Update projects table to use VARCHAR for user_id
-- First check if projects table exists and has data
-- If you have data in projects, you'll need to migrate it

-- Drop foreign key constraint temporarily
ALTER TABLE IF EXISTS projects 
    DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Change user_id column type (if table exists)
-- Note: This will fail if there's data that can't be converted
-- If you have existing UUIDs in projects.user_id, you'll need to convert them
DO $$
BEGIN
    -- Check if column exists and is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'user_id' 
        AND data_type = 'uuid'
    ) THEN
        -- Convert UUID to VARCHAR
        ALTER TABLE projects ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;
    END IF;
END $$;

-- Recreate foreign key constraint
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Recreate triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Option 2: If you have data and need to preserve it
-- Uncomment this section and comment Option 1 above
/*
-- Step 1: Make github_username nullable
ALTER TABLE users ALTER COLUMN github_username DROP NOT NULL;

-- Step 2: Change ID column type (this is complex, requires migration)
-- Create new table
CREATE TABLE users_new (
    id VARCHAR(255) PRIMARY KEY,
    github_username VARCHAR(255) UNIQUE,
    github_token TEXT,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Copy data (convert UUID to string)
INSERT INTO users_new (id, github_username, github_token, email, name, avatar_url, created_at, updated_at)
SELECT id::text, github_username, github_token, email, name, avatar_url, created_at, updated_at
FROM users;

-- Drop old table
DROP TABLE users CASCADE;

-- Rename new table
ALTER TABLE users_new RENAME TO users;

-- Recreate foreign key constraints
ALTER TABLE projects ADD CONSTRAINT projects_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
*/

