-- Add missing columns to custom_requests table

-- Add assigned_seller_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'custom_requests' AND column_name = 'assigned_seller_id'
    ) THEN
        ALTER TABLE custom_requests ADD COLUMN assigned_seller_id UUID REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added assigned_seller_id column to custom_requests table';
    ELSE
        RAISE NOTICE 'assigned_seller_id column already exists';
    END IF;
END $$;

-- Add admin_notes column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'custom_requests' AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE custom_requests ADD COLUMN admin_notes TEXT;
        RAISE NOTICE 'Added admin_notes column to custom_requests table';
    ELSE
        RAISE NOTICE 'admin_notes column already exists';
    END IF;
END $$;

-- Add progress column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'custom_requests' AND column_name = 'progress'
    ) THEN
        ALTER TABLE custom_requests ADD COLUMN progress INTEGER DEFAULT 0;
        RAISE NOTICE 'Added progress column to custom_requests table';
    ELSE
        RAISE NOTICE 'progress column already exists';
    END IF;
END $$;

-- Verify the changes
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'custom_requests'
ORDER BY ordinal_position;
