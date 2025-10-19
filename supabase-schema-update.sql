-- Add missing tables only (skip existing ones)

-- Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  metadata JSONB,
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session_id ON payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);

-- Update purchases table structure (add missing columns if needed)
DO $$
BEGIN
  -- Add session_id column to purchases if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='purchases' AND column_name='session_id') THEN
    ALTER TABLE purchases ADD COLUMN session_id VARCHAR(255);
  END IF;

  -- Add currency column to purchases if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='purchases' AND column_name='currency') THEN
    ALTER TABLE purchases ADD COLUMN currency VARCHAR(10) DEFAULT 'usd';
  END IF;

  -- Remove old columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='purchases' AND column_name='project_title') THEN
    ALTER TABLE purchases DROP COLUMN project_title;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='purchases' AND column_name='stripe_payment_intent_id') THEN
    ALTER TABLE purchases DROP COLUMN stripe_payment_intent_id;
  END IF;
END $$;

-- Create trigger for payment_transactions updated_at (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_transactions_updated_at') THEN
    CREATE TRIGGER update_payment_transactions_updated_at
      BEFORE UPDATE ON payment_transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Disable RLS on all tables (since we're using custom JWT auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own requests" ON custom_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON custom_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON custom_requests;
