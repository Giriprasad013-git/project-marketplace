-- ===================================
-- SAFE MIGRATION SCRIPT
-- Run this in Supabase SQL Editor
-- ===================================

-- Step 1: Drop the problematic index if it exists
DROP INDEX IF EXISTS idx_users_role;

-- Step 2: Add role column to users table
DO $$
BEGIN
    -- Check if role column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'role'
    ) THEN
        -- Add the column
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'buyer';
        RAISE NOTICE '✅ Added role column to users table';
    ELSE
        RAISE NOTICE 'ℹ️ Role column already exists';
    END IF;
END $$;

-- Step 3: Update existing users to have default role
UPDATE users SET role = 'buyer' WHERE role IS NULL;

-- Step 4: Now create the index safely
CREATE INDEX idx_users_role ON users(role);

-- Step 5: Add rejection_reason column to projects table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'projects'
        AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE projects ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE '✅ Added rejection_reason column to projects table';
    ELSE
        RAISE NOTICE 'ℹ️ Rejection_reason column already exists';
    END IF;
END $$;

-- Step 6: Verify the changes
SELECT
    '✅ Migration Complete!' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyers,
    COUNT(CASE WHEN role = 'seller' THEN 1 END) as sellers,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM users;

-- Step 7: Show the users table structure
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
