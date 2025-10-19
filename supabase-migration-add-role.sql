-- ===================================
-- MIGRATION: Add role column to users table
-- This is safe to run on existing database
-- ===================================

-- Add role column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'buyer';
        RAISE NOTICE 'Added role column to users table';
    ELSE
        RAISE NOTICE 'Role column already exists in users table';
    END IF;
END $$;

-- Create index on role column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have default role if needed
UPDATE users SET role = 'buyer' WHERE role IS NULL;

-- Add rejection_reason column to projects if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE projects ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column to projects table';
    ELSE
        RAISE NOTICE 'Rejection_reason column already exists in projects table';
    END IF;
END $$;

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';
