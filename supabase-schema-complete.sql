-- ===================================
-- COMPLETE SUPABASE SCHEMA FOR ACADEMIC PROJECT MARKETPLACE
-- ===================================

-- Drop existing tables if needed (CAUTION: This will delete all data)
-- Uncomment these lines if you want to start fresh
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS downloads CASCADE;
-- DROP TABLE IF EXISTS purchases CASCADE;
-- DROP TABLE IF EXISTS payment_transactions CASCADE;
-- DROP TABLE IF EXISTS custom_requests CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ===================================
-- USERS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'buyer', -- 'buyer', 'seller', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ===================================
-- PROJECTS TABLE (Main product catalog)
-- ===================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly version of title
  category VARCHAR(100) NOT NULL, -- 'web', 'mobile', 'ai', 'iot', 'data', 'game'
  description TEXT NOT NULL,
  detailed_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_purchases INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  technologies TEXT[] DEFAULT '{}',

  -- File information
  thumbnail_url TEXT,
  demo_video_url TEXT,
  source_code_url TEXT, -- Link to storage (Supabase Storage or R2)
  documentation_url TEXT,
  additional_files JSONB DEFAULT '[]', -- Array of {name, url, size, type}

  -- Metadata
  features TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Status and moderation
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'archived'
  featured BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_projects_seller_id ON projects(seller_id);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING gin(to_tsvector('english', title || ' ' || description));

-- ===================================
-- PURCHASES TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- Stripe session ID
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  downloads_remaining INTEGER DEFAULT 3, -- Allow 3 downloads per purchase
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_project_id ON purchases(project_id);
CREATE INDEX IF NOT EXISTS idx_purchases_session_id ON purchases(session_id);

-- ===================================
-- DOWNLOADS TABLE (Track download activity)
-- ===================================
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT, -- in bytes
  ip_address VARCHAR(45),
  user_agent TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_purchase_id ON downloads(purchase_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_project_id ON downloads(project_id);

-- ===================================
-- PAYMENT TRANSACTIONS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  metadata JSONB,
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_session_id ON payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);

-- ===================================
-- CUSTOM REQUESTS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] DEFAULT '{}',
  budget VARCHAR(50) NOT NULL,
  deadline DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_review', 'assigned', 'in_progress', 'completed', 'cancelled'
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_requests_user_id ON custom_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_requests_assigned_seller_id ON custom_requests(assigned_seller_id);
CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status);

-- ===================================
-- REVIEWS TABLE
-- ===================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id) -- One review per user per project
);

CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- ===================================
-- DOWNLOAD TOKENS TABLE (Secure download links)
-- ===================================
CREATE TABLE IF NOT EXISTS download_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) UNIQUE NOT NULL,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  downloads_used INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expires_at ON download_tokens(expires_at);

-- ===================================
-- TRIGGERS FOR updated_at
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_requests_updated_at
  BEFORE UPDATE ON custom_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- TRIGGER: Update project rating when review is added/updated
-- ===================================
CREATE OR REPLACE FUNCTION update_project_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE project_id = NEW.project_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE project_id = NEW.project_id)
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_rating_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_project_rating();

-- ===================================
-- TRIGGER: Update project purchase count
-- ===================================
CREATE OR REPLACE FUNCTION update_project_purchases()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET total_purchases = (SELECT COUNT(*) FROM purchases WHERE project_id = NEW.project_id)
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_purchases_on_purchase
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_project_purchases();

-- ===================================
-- FUNCTION: Clean expired download tokens
-- ===================================
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM download_tokens WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- ===================================
-- SAMPLE DATA (Optional - for testing)
-- ===================================

-- Insert admin user (password: admin123)
INSERT INTO users (id, email, name, password_hash, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@projecthub.com',
  'Admin User',
  '$2a$10$Xj3K9Z1qR8kP.k9vP0L8q.8KjQ8N9Z1X3K9Z1qR8kP.k9vP0L8q.',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- Note: You can add sample projects here after you have real seller accounts

-- ===================================
-- SECURITY NOTES
-- ===================================
-- Row Level Security (RLS) is currently DISABLED because you're using custom JWT auth
-- If you switch to Supabase Auth, you should enable RLS and add policies:
--
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- ... etc
--
-- Then create policies like:
-- CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
