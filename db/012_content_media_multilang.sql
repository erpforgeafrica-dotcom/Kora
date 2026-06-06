-- =====================================================================================
-- Migration 012: Content Generation, Media, Multi-Currency, Multi-Language, Locations
-- =====================================================================================
-- AI content generation, media uploads, social media, blogs, landing pages
-- Multi-currency support, multi-language translations, global locations
-- =====================================================================================

-- =====================================================================================
-- AI CONTENT GENERATION
-- =====================================================================================

-- ai_content_generations (Track all AI-generated content)
CREATE TABLE ai_content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  content_type VARCHAR(100) NOT NULL CHECK (content_type IN (
    'social_post', 'blog_article', 'product_description', 'service_description',
    'email_campaign', 'sms_message', 'flyer', 'banner', 'video_script',
    'landing_page', 'ad_copy', 'meta_description', 'hashtags'
  )),
  
  -- Input prompt
  user_prompt TEXT NOT NULL,
  prompt_language VARCHAR(10) DEFAULT 'en',
  
  -- Generated content
  generated_content TEXT NOT NULL,
  generated_language VARCHAR(10),
  
  -- Media generation
  generated_image_url TEXT,
  generated_video_url TEXT,
  
  -- AI model used
  model_used VARCHAR(100),
  tokens_used INTEGER,
  
  -- Quality and feedback
  quality_score DECIMAL(5,2),
  user_edited BOOLEAN DEFAULT FALSE,
  user_approved BOOLEAN DEFAULT FALSE,
  
  -- Usage
  used_in_record_type VARCHAR(100), -- e.g., 'social_post', 'product', 'blog'
  used_in_record_id UUID,
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_content_generations_tenant ON ai_content_generations(tenant_id);
CREATE INDEX idx_ai_content_generations_type ON ai_content_generations(content_type);
CREATE INDEX idx_ai_content_generations_created ON ai_content_generations(created_at);

ALTER TABLE ai_content_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_ai_content_generations_isolation ON ai_content_generations
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- MEDIA LIBRARY & UPLOADS
-- =====================================================================================

-- media_library (Universal media storage)
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN (
    'image', 'video', 'audio', 'document', 'pdf', 'spreadsheet', 'presentation'
  )),
  
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  
  -- Thumbnail for preview
  thumbnail_url TEXT,
  
  -- Media metadata
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER, -- for video/audio
  
  -- Organization
  folder TEXT DEFAULT '/',
  tags TEXT[],
  
  -- AI-generated or user-uploaded
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_generation_id UUID REFERENCES ai_content_generations(id) ON DELETE SET NULL,
  
  -- Usage tracking
  used_in JSONB DEFAULT '[]', -- Array of {type, id} objects
  
  uploaded_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_library_tenant ON media_library(tenant_id);
CREATE INDEX idx_media_library_type ON media_library(file_type);
CREATE INDEX idx_media_library_created ON media_library(created_at);
CREATE INDEX idx_media_library_tags ON media_library USING gin(tags);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_media_library_isolation ON media_library
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- SOCIAL MEDIA MANAGEMENT
-- =====================================================================================

-- social_media_accounts (Connected platforms)
CREATE TABLE social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'facebook', 'instagram', 'twitter', 'linkedin', 'tiktok',
    'youtube', 'pinterest', 'snapchat', 'threads', 'whatsapp_business'
  )),
  
  account_handle TEXT NOT NULL,
  account_url TEXT,
  
  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Account stats
  followers_count INTEGER DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  
  is_connected BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, platform, account_handle)
);

CREATE INDEX idx_social_media_accounts_tenant ON social_media_accounts(tenant_id);
CREATE INDEX idx_social_media_accounts_entity ON social_media_accounts(entity_id);
CREATE INDEX idx_social_media_accounts_platform ON social_media_accounts(platform);

ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_social_media_accounts_isolation ON social_media_accounts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- social_media_posts (Scheduled and published posts)
CREATE TABLE social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  post_type VARCHAR(50) CHECK (post_type IN (
    'text', 'image', 'video', 'carousel', 'story', 'reel', 'short'
  )),
  
  content TEXT NOT NULL,
  
  -- Media attachments
  media_ids UUID[],
  
  -- Targeting
  target_accounts UUID[], -- social_media_accounts.id
  
  -- Scheduling
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'published', 'failed', 'deleted'
  )),
  
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- AI-generated
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_generation_id UUID REFERENCES ai_content_generations(id) ON DELETE SET NULL,
  
  -- Engagement (synced from platforms)
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Platform-specific post IDs
  platform_post_ids JSONB DEFAULT '{}', -- {facebook: '123', instagram: '456'}
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_social_media_posts_tenant ON social_media_posts(tenant_id);
CREATE INDEX idx_social_media_posts_status ON social_media_posts(status);
CREATE INDEX idx_social_media_posts_scheduled ON social_media_posts(scheduled_for);

ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_social_media_posts_isolation ON social_media_posts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BLOG & CONTENT MANAGEMENT
-- =====================================================================================

-- blog_posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  title JSONB NOT NULL, -- Multi-language
  slug TEXT NOT NULL,
  
  content JSONB NOT NULL, -- Multi-language rich text
  excerpt JSONB,
  
  -- SEO
  meta_title JSONB,
  meta_description JSONB,
  meta_keywords TEXT[],
  
  -- Media
  featured_image_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
  gallery_image_ids UUID[],
  
  -- Organization
  category TEXT,
  tags TEXT[],
  
  -- Publishing
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'published', 'archived'
  )),
  
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  -- AI-generated
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_generation_id UUID REFERENCES ai_content_generations(id) ON DELETE SET NULL,
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  author_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_blog_posts_tenant ON blog_posts(tenant_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING gin(tags);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_blog_posts_isolation ON blog_posts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- LANDING PAGE CMS
-- =====================================================================================

-- landing_pages (Dynamic page builder)
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  page_name TEXT NOT NULL,
  page_slug TEXT NOT NULL,
  
  -- Page structure (JSON-based page builder)
  page_sections JSONB NOT NULL DEFAULT '[]', -- Array of section configs
  
  -- SEO
  seo_title JSONB,
  seo_description JSONB,
  seo_keywords TEXT[],
  og_image_id UUID REFERENCES media_library(id) ON DELETE SET NULL,
  
  -- Styling
  theme_config JSONB DEFAULT '{}',
  custom_css TEXT,
  custom_js TEXT,
  
  -- Publishing
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'published', 'archived'
  )),
  
  published_at TIMESTAMPTZ,
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, page_slug)
);

CREATE INDEX idx_landing_pages_tenant ON landing_pages(tenant_id);
CREATE INDEX idx_landing_pages_status ON landing_pages(status);

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_landing_pages_isolation ON landing_pages
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- MULTI-LANGUAGE TRANSLATIONS
-- =====================================================================================

-- languages (Supported languages)
CREATE TABLE languages (
  code VARCHAR(10) PRIMARY KEY, -- ISO 639-1 (e.g., 'en', 'fr', 'ar')
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  direction VARCHAR(3) DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO languages (code, name, native_name, direction) VALUES
  ('en', 'English', 'English', 'ltr'),
  ('fr', 'French', 'Français', 'ltr'),
  ('es', 'Spanish', 'Español', 'ltr'),
  ('ar', 'Arabic', 'العربية', 'rtl'),
  ('pt', 'Portuguese', 'Português', 'ltr'),
  ('zh', 'Chinese', '中文', 'ltr'),
  ('hi', 'Hindi', 'हिन्दी', 'ltr'),
  ('sw', 'Swahili', 'Kiswahili', 'ltr'),
  ('ha', 'Hausa', 'Hausa', 'ltr'),
  ('yo', 'Yoruba', 'Yorùbá', 'ltr'),
  ('ig', 'Igbo', 'Igbo', 'ltr'),
  ('am', 'Amharic', 'አማርኛ', 'ltr'),
  ('de', 'German', 'Deutsch', 'ltr'),
  ('it', 'Italian', 'Italiano', 'ltr'),
  ('ru', 'Russian', 'Русский', 'ltr'),
  ('ja', 'Japanese', '日本語', 'ltr'),
  ('ko', 'Korean', '한국어', 'ltr')
ON CONFLICT (code) DO NOTHING;

-- =====================================================================================
-- MULTI-CURRENCY & EXCHANGE RATES
-- =====================================================================================

-- currencies_extended (Additional currency support beyond global_currencies)
CREATE TABLE currencies_extended (
  code VARCHAR(3) PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 2,
  country_code VARCHAR(2), -- ISO 3166-1 alpha-2
  is_crypto BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO currencies_extended (code, name, symbol, country_code, is_crypto) VALUES
  ('BTC', 'Bitcoin', '₿', NULL, TRUE),
  ('ETH', 'Ethereum', 'Ξ', NULL, TRUE),
  ('USDT', 'Tether', '₮', NULL, TRUE),
  ('XOF', 'West African CFA Franc', 'CFA', 'BF', FALSE),
  ('XAF', 'Central African CFA Franc', 'FCFA', 'CM', FALSE),
  ('EGP', 'Egyptian Pound', 'E£', 'EG', FALSE),
  ('TZS', 'Tanzanian Shilling', 'TSh', 'TZ', FALSE),
  ('UGX', 'Ugandan Shilling', 'USh', 'UG', FALSE),
  ('MAD', 'Moroccan Dirham', 'د.م.', 'MA', FALSE),
  ('TND', 'Tunisian Dinar', 'د.ت', 'TN', FALSE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================================
-- COUNTRIES & LOCATIONS
-- =====================================================================================

-- countries (Global country database)
CREATE TABLE countries (
  code VARCHAR(2) PRIMARY KEY, -- ISO 3166-1 alpha-2
  name TEXT NOT NULL,
  native_name TEXT,
  phone_code VARCHAR(10) NOT NULL,
  currency_code VARCHAR(3),
  flag_emoji TEXT,
  flag_url TEXT,
  continent VARCHAR(50),
  region VARCHAR(100),
  capital TEXT,
  languages TEXT[],
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO countries (code, name, phone_code, currency_code, flag_emoji, continent, region) VALUES
  ('NG', 'Nigeria', '+234', 'NGN', '🇳🇬', 'Africa', 'West Africa'),
  ('GH', 'Ghana', '+233', 'GHS', '🇬🇭', 'Africa', 'West Africa'),
  ('KE', 'Kenya', '+254', 'KES', '🇰🇪', 'Africa', 'East Africa'),
  ('ZA', 'South Africa', '+27', 'ZAR', '🇿🇦', 'Africa', 'Southern Africa'),
  ('EG', 'Egypt', '+20', 'EGP', '🇪🇬', 'Africa', 'North Africa'),
  ('US', 'United States', '+1', 'USD', '🇺🇸', 'North America', 'Northern America'),
  ('GB', 'United Kingdom', '+44', 'GBP', '🇬🇧', 'Europe', 'Northern Europe'),
  ('AE', 'United Arab Emirates', '+971', 'AED', '🇦🇪', 'Asia', 'Western Asia'),
  ('IN', 'India', '+91', 'INR', '🇮🇳', 'Asia', 'Southern Asia'),
  ('CN', 'China', '+86', 'CNY', '🇨🇳', 'Asia', 'Eastern Asia'),
  ('FR', 'France', '+33', 'EUR', '🇫🇷', 'Europe', 'Western Europe'),
  ('DE', 'Germany', '+49', 'EUR', '🇩🇪', 'Europe', 'Western Europe'),
  ('BR', 'Brazil', '+55', 'BRL', '🇧🇷', 'South America', 'South America'),
  ('CA', 'Canada', '+1', 'CAD', '🇨🇦', 'North America', 'Northern America'),
  ('AU', 'Australia', '+61', 'AUD', '🇦🇺', 'Oceania', 'Australia and New Zealand')
ON CONFLICT (code) DO NOTHING;

-- phone_verification_codes (For signup verification)
CREATE TABLE phone_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  phone_number TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
  phone_code VARCHAR(10) NOT NULL,
  
  verification_code VARCHAR(10) NOT NULL,
  
  -- Usage
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  attempts_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  expires_at TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_phone_verification_phone ON phone_verification_codes(phone_number);
CREATE INDEX idx_phone_verification_expires ON phone_verification_codes(expires_at);

-- =====================================================================================
-- ACCOUNT CLEANUP & FRAUD PREVENTION
-- =====================================================================================

-- unverified_accounts_cleanup (Auto-delete after X weeks)
CREATE TABLE unverified_accounts_cleanup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  entity_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_created_at TIMESTAMPTZ NOT NULL,
  verification_required_by TIMESTAMPTZ NOT NULL,
  
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,
  
  status VARCHAR(50) DEFAULT 'pending_verification' CHECK (status IN (
    'pending_verification', 'reminded', 'scheduled_for_deletion', 'deleted'
  )),
  
  scheduled_deletion_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_unverified_accounts_status ON unverified_accounts_cleanup(status);
CREATE INDEX idx_unverified_accounts_scheduled ON unverified_accounts_cleanup(scheduled_deletion_date);

ALTER TABLE unverified_accounts_cleanup ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_unverified_accounts_isolation ON unverified_accounts_cleanup
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 012
-- =====================================================================================
