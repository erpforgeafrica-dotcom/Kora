-- =====================================================================================
-- Migration 014: Comprehensive Settings System
-- =====================================================================================
-- Global settings, user preferences, admin controls, theme customization
-- Dynamic CMS, chatbots, omnichannel communications
-- =====================================================================================

-- =====================================================================================
-- GLOBAL SETTINGS & THEMES
-- =====================================================================================

-- global_theme_settings (Platform-wide theme configuration)
CREATE TABLE global_theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  theme_name VARCHAR(100) NOT NULL UNIQUE,
  theme_category VARCHAR(50) CHECK (theme_category IN (
    'light', 'dark', 'high_contrast', 'colorful', 'minimalist', 'custom'
  )),
  
  -- Color palette (must include very white background with dark text for light themes)
  primary_color VARCHAR(7) NOT NULL, -- hex color
  secondary_color VARCHAR(7) NOT NULL,
  accent_color VARCHAR(7) NOT NULL,
  background_color VARCHAR(7) NOT NULL,
  text_color VARCHAR(7) NOT NULL,
  border_color VARCHAR(7) NOT NULL,
  
  -- Glow effect for theme indicator
  glow_color VARCHAR(7) NOT NULL,
  glow_intensity INTEGER DEFAULT 50 CHECK (glow_intensity BETWEEN 0 AND 100),
  
  -- Additional colors
  success_color VARCHAR(7) DEFAULT '#10b981',
  warning_color VARCHAR(7) DEFAULT '#f59e0b',
  error_color VARCHAR(7) DEFAULT '#ef4444',
  info_color VARCHAR(7) DEFAULT '#3b82f6',
  
  -- Typography
  font_family TEXT DEFAULT 'Inter, system-ui, sans-serif',
  font_size_base INTEGER DEFAULT 16, -- pixels
  
  -- Spacing and borders
  border_radius INTEGER DEFAULT 12, -- pixels
  spacing_unit INTEGER DEFAULT 4, -- pixels
  
  -- Accessibility
  meets_wcag_aa BOOLEAN DEFAULT TRUE,
  meets_wcag_aaa BOOLEAN DEFAULT FALSE,
  
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default themes
INSERT INTO global_theme_settings (
  theme_name, theme_category, primary_color, secondary_color, accent_color,
  background_color, text_color, border_color, glow_color
) VALUES
  ('Emerald Dark', 'dark', '#10b981', '#0ea5e9', '#8b5cf6', '#030610', '#ffffff', '#334155', '#10b981'),
  ('Pure White', 'light', '#059669', '#0284c7', '#7c3aed', '#ffffff', '#0f172a', '#e2e8f0', '#059669'),
  ('High Contrast', 'high_contrast', '#000000', '#ffffff', '#fbbf24', '#ffffff', '#000000', '#000000', '#fbbf24'),
  ('Ocean Blue', 'dark', '#0ea5e9', '#06b6d4', '#3b82f6', '#0c1629', '#ffffff', '#1e3a8a', '#0ea5e9'),
  ('Sunset Orange', 'colorful', '#f97316', '#fb923c', '#fbbf24', '#1c1917', '#ffffff', '#78350f', '#f97316')
ON CONFLICT (theme_name) DO NOTHING;

CREATE INDEX idx_global_theme_settings_category ON global_theme_settings(theme_category);

-- =====================================================================================
-- USER SETTINGS & PREFERENCES
-- =====================================================================================

-- user_settings (Per-user preferences)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL UNIQUE REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  -- Theme
  selected_theme_id UUID REFERENCES global_theme_settings(id) ON DELETE SET NULL,
  custom_theme JSONB, -- Override with custom colors
  
  -- Display preferences
  language VARCHAR(10) DEFAULT 'en' REFERENCES languages(code),
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(50) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(50) DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  
  notification_preferences JSONB DEFAULT '{
    "bookings": true,
    "payments": true,
    "messages": true,
    "marketing": false,
    "security_alerts": true,
    "system_updates": true
  }',
  
  -- Dashboard layout
  dashboard_layout VARCHAR(50) DEFAULT 'default' CHECK (dashboard_layout IN (
    'default', 'compact', 'detailed', 'minimal', 'custom'
  )),
  
  pinned_modules TEXT[], -- User's favorite modules
  hidden_modules TEXT[], -- Modules user doesn't want to see
  
  -- Accessibility
  high_contrast_mode BOOLEAN DEFAULT FALSE,
  font_size_multiplier DECIMAL(3,2) DEFAULT 1.0 CHECK (font_size_multiplier BETWEEN 0.8 AND 2.0),
  reduce_animations BOOLEAN DEFAULT FALSE,
  screen_reader_mode BOOLEAN DEFAULT FALSE,
  
  -- Privacy
  show_online_status BOOLEAN DEFAULT TRUE,
  allow_analytics BOOLEAN DEFAULT TRUE,
  
  -- Misc preferences
  preferences JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_settings_entity ON user_settings(entity_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_user_settings_own ON user_settings
  FOR ALL TO authenticated USING (entity_id IN (
    SELECT id FROM entity_graph WHERE auth_user_id = auth.uid()
  ));

-- =====================================================================================
-- TENANT/BUSINESS SETTINGS
-- =====================================================================================

-- tenant_settings (Business-level settings)
CREATE TABLE tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Branding
  business_name JSONB NOT NULL, -- Multi-language
  business_logo_url TEXT,
  business_banner_url TEXT,
  brand_colors JSONB DEFAULT '{}', -- {primary, secondary, accent}
  
  -- Theme (can override global theme for their subdomain)
  custom_theme_enabled BOOLEAN DEFAULT FALSE,
  custom_theme_id UUID REFERENCES global_theme_settings(id),
  white_label_mode BOOLEAN DEFAULT FALSE, -- Enterprise only
  
  -- Business hours
  business_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "17:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "17:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "17:00", "closed": false},
    "thursday": {"open": "09:00", "close": "17:00", "closed": false},
    "friday": {"open": "09:00", "close": "17:00", "closed": false},
    "saturday": {"open": "10:00", "close": "15:00", "closed": false},
    "sunday": {"open": "10:00", "close": "15:00", "closed": true}
  }',
  
  -- Contact
  primary_email TEXT,
  primary_phone TEXT,
  support_email TEXT,
  support_phone TEXT,
  
  -- Social media
  social_links JSONB DEFAULT '{}',
  
  -- Booking settings
  booking_enabled BOOLEAN DEFAULT TRUE,
  booking_requires_approval BOOLEAN DEFAULT FALSE,
  booking_buffer_minutes INTEGER DEFAULT 15,
  booking_advance_days INTEGER DEFAULT 30,
  cancellation_policy JSONB DEFAULT '{}',
  
  -- Payment settings
  payment_methods_enabled TEXT[] DEFAULT ARRAY['cash', 'card', 'mobile_money'],
  auto_invoice BOOLEAN DEFAULT TRUE,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- AI Assistant settings
  ai_assistant_enabled BOOLEAN DEFAULT TRUE,
  ai_auto_respond BOOLEAN DEFAULT FALSE,
  ai_response_style VARCHAR(50) DEFAULT 'professional' CHECK (ai_response_style IN (
    'professional', 'friendly', 'casual', 'formal'
  )),
  ai_learning_enabled BOOLEAN DEFAULT TRUE,
  
  -- Chatbot settings
  chatbot_enabled BOOLEAN DEFAULT TRUE,
  chatbot_greeting_message JSONB,
  chatbot_offline_message JSONB,
  chatbot_response_time_seconds INTEGER DEFAULT 2,
  
  -- Security
  require_2fa BOOLEAN DEFAULT FALSE,
  password_policy JSONB DEFAULT '{
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special_chars": false
  }',
  
  session_timeout_minutes INTEGER DEFAULT 120,
  
  -- Compliance
  gdpr_enabled BOOLEAN DEFAULT FALSE,
  hipaa_enabled BOOLEAN DEFAULT FALSE,
  pci_enabled BOOLEAN DEFAULT FALSE,
  ndpr_enabled BOOLEAN DEFAULT FALSE,
  
  -- Feature flags
  features JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenant_settings_tenant ON tenant_settings(tenant_id);

ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_tenant_settings_isolation ON tenant_settings
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- ADMIN SETTINGS (System-wide controls)
-- =====================================================================================

-- admin_settings (Platform admin controls)
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  setting_category VARCHAR(100) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  
  -- Type information for UI rendering
  value_type VARCHAR(50) CHECK (value_type IN (
    'string', 'number', 'boolean', 'array', 'object', 'color', 'url'
  )),
  
  -- Metadata
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Access control
  requires_admin BOOLEAN DEFAULT TRUE,
  requires_owner BOOLEAN DEFAULT FALSE,
  
  is_system_setting BOOLEAN DEFAULT FALSE, -- Cannot be changed by users
  is_visible BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, setting_category, setting_key)
);

CREATE INDEX idx_admin_settings_tenant ON admin_settings(tenant_id);
CREATE INDEX idx_admin_settings_category ON admin_settings(setting_category);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_admin_settings_isolation ON admin_settings
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- DYNAMIC CMS SYSTEM
-- =====================================================================================

-- cms_components (Reusable UI components)
CREATE TABLE cms_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  component_name TEXT NOT NULL,
  component_type VARCHAR(100) NOT NULL CHECK (component_type IN (
    'hero', 'features', 'testimonials', 'gallery', 'pricing', 'faq',
    'contact_form', 'newsletter', 'team', 'stats', 'cta', 'blog_list',
    'service_list', 'product_grid', 'booking_widget', 'map', 'custom'
  )),
  
  -- Component configuration
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Content (multi-language)
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Styling
  style_preset VARCHAR(50) DEFAULT 'default',
  custom_css TEXT,
  
  -- Media
  media_ids UUID[],
  
  -- Usage tracking
  used_in_pages UUID[], -- landing_pages.id
  
  is_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cms_components_tenant ON cms_components(tenant_id);
CREATE INDEX idx_cms_components_type ON cms_components(component_type);

ALTER TABLE cms_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_cms_components_isolation ON cms_components
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- cms_templates (Pre-built page templates)
CREATE TABLE cms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_name TEXT NOT NULL UNIQUE,
  template_category VARCHAR(100),
  
  -- Template structure
  components UUID[], -- Array of cms_components.id
  layout_config JSONB NOT NULL,
  
  -- Preview
  preview_image_url TEXT,
  
  -- Industry/use case
  suitable_for_industries TEXT[],
  
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cms_templates_category ON cms_templates(template_category);

-- =====================================================================================
-- CHATBOT SYSTEM
-- =====================================================================================

-- chatbots (Per-business chatbot configuration)
CREATE TABLE chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  chatbot_name TEXT NOT NULL,
  
  -- AI Configuration
  ai_model VARCHAR(100) DEFAULT 'gemini-2.0-flash',
  system_prompt TEXT NOT NULL,
  
  -- Personality
  personality_traits JSONB DEFAULT '{
    "friendliness": 8,
    "professionalism": 9,
    "humor": 3,
    "empathy": 8
  }',
  
  response_style VARCHAR(50) DEFAULT 'professional',
  
  -- Knowledge base
  knowledge_base JSONB DEFAULT '{}',
  faq_data JSONB DEFAULT '[]',
  
  -- Capabilities
  can_book_appointments BOOLEAN DEFAULT TRUE,
  can_answer_pricing BOOLEAN DEFAULT TRUE,
  can_collect_leads BOOLEAN DEFAULT TRUE,
  can_schedule_callbacks BOOLEAN DEFAULT TRUE,
  can_transfer_to_human BOOLEAN DEFAULT TRUE,
  
  -- Behavior
  greeting_message JSONB NOT NULL,
  offline_message JSONB NOT NULL,
  fallback_message JSONB NOT NULL,
  
  max_response_time_seconds INTEGER DEFAULT 3,
  escalate_after_messages INTEGER DEFAULT 5, -- Transfer to human after X messages
  
  -- Notifications
  notify_owner_on_new_chat BOOLEAN DEFAULT TRUE,
  notify_owner_on_lead BOOLEAN DEFAULT TRUE,
  owner_notification_methods TEXT[] DEFAULT ARRAY['in_app', 'email'],
  
  -- Analytics
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_response_time_seconds DECIMAL(10,2),
  customer_satisfaction_score DECIMAL(3,2),
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbots_tenant ON chatbots(tenant_id);

ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_chatbots_isolation ON chatbots
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- chatbot_conversations (Conversation history)
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
  
  visitor_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  
  -- Conversation metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
    'active', 'waiting_for_owner', 'transferred_to_human', 'completed', 'abandoned'
  )),
  
  -- Transfer to human
  transferred_to_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  transferred_at TIMESTAMPTZ,
  owner_responded BOOLEAN DEFAULT FALSE,
  owner_responded_at TIMESTAMPTZ,
  
  -- Lead capture
  lead_captured BOOLEAN DEFAULT FALSE,
  lead_quality_score DECIMAL(5,2),
  
  -- Satisfaction
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,
  
  -- Analytics
  message_count INTEGER DEFAULT 0,
  avg_response_time_seconds DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbot_conversations_tenant ON chatbot_conversations(tenant_id);
CREATE INDEX idx_chatbot_conversations_chatbot ON chatbot_conversations(chatbot_id);
CREATE INDEX idx_chatbot_conversations_status ON chatbot_conversations(status);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_chatbot_conversations_isolation ON chatbot_conversations
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- chatbot_messages (Individual messages)
CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('visitor', 'chatbot', 'human')),
  sender_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  message_text TEXT NOT NULL,
  
  -- AI metadata
  ai_confidence DECIMAL(5,2),
  intent_detected VARCHAR(100),
  entities_extracted JSONB,
  
  -- Attachments
  media_urls TEXT[],
  
  -- Actions taken
  action_taken VARCHAR(100), -- e.g., 'booked_appointment', 'collected_email'
  action_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_created ON chatbot_messages(created_at);

-- =====================================================================================
-- OMNICHANNEL COMMUNICATIONS
-- =====================================================================================

-- communication_channels (Unified inbox)
CREATE TABLE communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN (
    'email', 'sms', 'whatsapp', 'facebook_messenger', 'instagram_dm',
    'twitter_dm', 'in_app_chat', 'phone_call', 'video_call'
  )),
  
  channel_name TEXT NOT NULL,
  
  -- Connection details
  connection_config JSONB NOT NULL,
  
  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  is_connected BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  
  last_synced_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_communication_channels_tenant ON communication_channels(tenant_id);
CREATE INDEX idx_communication_channels_type ON communication_channels(channel_type);

ALTER TABLE communication_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_communication_channels_isolation ON communication_channels
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- messages_unified (All messages from all channels)
CREATE TABLE messages_unified (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  channel_id UUID NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
  
  -- Participants
  from_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  to_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  from_identifier TEXT NOT NULL, -- email, phone, handle, etc.
  to_identifier TEXT NOT NULL,
  
  -- Message content
  subject TEXT,
  body TEXT NOT NULL,
  
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'video', 'audio', 'document', 'location'
  )),
  
  -- Media
  media_urls TEXT[],
  
  -- Status
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN (
    'draft', 'queued', 'sent', 'delivered', 'read', 'failed'
  )),
  
  -- Metadata
  external_message_id TEXT, -- ID from external platform
  thread_id TEXT, -- For grouping related messages
  
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_unified_tenant ON messages_unified(tenant_id);
CREATE INDEX idx_messages_unified_channel ON messages_unified(channel_id);
CREATE INDEX idx_messages_unified_from ON messages_unified(from_entity_id);
CREATE INDEX idx_messages_unified_to ON messages_unified(to_entity_id);
CREATE INDEX idx_messages_unified_thread ON messages_unified(thread_id);
CREATE INDEX idx_messages_unified_created ON messages_unified(created_at);

ALTER TABLE messages_unified ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_messages_unified_isolation ON messages_unified
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- AI LANDING PAGE ZONE (Global company site AI monitoring)
-- =====================================================================================

-- landing_page_analytics (AI-powered analytics)
CREATE TABLE landing_page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  
  -- Visitor tracking
  visitor_session_id UUID NOT NULL,
  visitor_entity_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  -- Visit details
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50), -- mobile, tablet, desktop
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Location
  country_code VARCHAR(2),
  city TEXT,
  geolocation JSONB,
  
  -- Behavior
  time_on_page_seconds INTEGER,
  scroll_depth_percent INTEGER,
  interactions JSONB DEFAULT '[]', -- clicks, hovers, form fills
  
  -- Conversion tracking
  converted BOOLEAN DEFAULT FALSE,
  conversion_type VARCHAR(100), -- lead, booking, purchase, signup
  conversion_value DECIMAL(15,2),
  
  -- AI insights
  visitor_intent VARCHAR(100), -- browsing, researching, ready_to_buy
  interest_level DECIMAL(5,2), -- 0-100%
  predicted_conversion_probability DECIMAL(5,2),
  
  -- Lead scoring
  lead_score DECIMAL(5,2),
  lead_quality VARCHAR(50), -- cold, warm, hot
  
  -- Referral
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landing_page_analytics_tenant ON landing_page_analytics(tenant_id);
CREATE INDEX idx_landing_page_analytics_page ON landing_page_analytics(landing_page_id);
CREATE INDEX idx_landing_page_analytics_visitor ON landing_page_analytics(visitor_session_id);
CREATE INDEX idx_landing_page_analytics_converted ON landing_page_analytics(converted);

ALTER TABLE landing_page_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_landing_page_analytics_isolation ON landing_page_analytics
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- ai_seo_optimization (88% effective SEO)
CREATE TABLE ai_seo_optimization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  target_type VARCHAR(100) NOT NULL CHECK (target_type IN (
    'landing_page', 'blog_post', 'product', 'service'
  )),
  
  target_id UUID NOT NULL,
  
  -- SEO analysis
  current_score DECIMAL(5,2) CHECK (current_score BETWEEN 0 AND 100),
  
  -- Recommendations
  recommendations JSONB NOT NULL, -- Array of {issue, suggestion, priority}
  
  -- Keywords
  target_keywords TEXT[],
  keyword_density JSONB, -- {keyword: density%}
  keyword_ranking JSONB, -- {keyword: rank}
  
  -- Content analysis
  content_quality_score DECIMAL(5,2),
  readability_score DECIMAL(5,2),
  word_count INTEGER,
  
  -- Technical SEO
  meta_title_optimized BOOLEAN DEFAULT FALSE,
  meta_description_optimized BOOLEAN DEFAULT FALSE,
  headings_optimized BOOLEAN DEFAULT FALSE,
  images_optimized BOOLEAN DEFAULT FALSE,
  mobile_friendly BOOLEAN DEFAULT TRUE,
  page_speed_score DECIMAL(5,2),
  
  -- Competitive analysis
  competitor_analysis JSONB,
  
  -- Trend copying
  trending_topics TEXT[],
  trend_alignment_score DECIMAL(5,2),
  
  -- AI learning
  learning_data JSONB DEFAULT '{}',
  
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_seo_optimization_tenant ON ai_seo_optimization(tenant_id);
CREATE INDEX idx_ai_seo_optimization_target ON ai_seo_optimization(target_type, target_id);

ALTER TABLE ai_seo_optimization ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_ai_seo_optimization_isolation ON ai_seo_optimization
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- AI TREND MONITORING
-- =====================================================================================

-- ai_trend_monitoring (Learning from in and out of system)
CREATE TABLE ai_trend_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  trend_category VARCHAR(100) NOT NULL CHECK (trend_category IN (
    'industry', 'content', 'marketing', 'design', 'technology', 'customer_behavior'
  )),
  
  trend_name TEXT NOT NULL,
  trend_description TEXT,
  
  -- Data sources
  source_type VARCHAR(100), -- internal_data, google_trends, social_media, news
  source_data JSONB,
  
  -- Trend metrics
  trend_score DECIMAL(5,2) CHECK (trend_score BETWEEN 0 AND 100),
  growth_rate DECIMAL(10,2), -- percentage
  momentum VARCHAR(50) CHECK (momentum IN ('rising', 'peak', 'declining')),
  
  -- Applicability
  relevant_industries TEXT[],
  relevant_regions TEXT[],
  
  -- AI recommendations
  action_recommendations JSONB, -- How users can leverage this trend
  
  -- Engagement
  users_following INTEGER DEFAULT 0,
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- When trend is expected to decline
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_trend_monitoring_category ON ai_trend_monitoring(trend_category);
CREATE INDEX idx_ai_trend_monitoring_score ON ai_trend_monitoring(trend_score);

-- =====================================================================================
-- SYSTEM-WIDE NOTIFICATION TEMPLATES
-- =====================================================================================

-- notification_templates (Customizable notification messages)
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = global template
  
  template_name TEXT NOT NULL,
  template_type VARCHAR(100) NOT NULL, -- booking_confirmed, payment_received, etc.
  
  -- Multi-channel templates
  email_subject JSONB, -- Multi-language
  email_body JSONB,
  sms_body JSONB,
  push_body JSONB,
  in_app_body JSONB,
  
  -- Variables available in template
  available_variables TEXT[],
  
  is_system_template BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX idx_notification_templates_type ON notification_templates(template_type);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_notification_templates_isolation ON notification_templates
  FOR ALL TO authenticated USING (tenant_id IS NULL OR tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- FUNCTION: Apply theme to entity
-- =====================================================================================
CREATE OR REPLACE FUNCTION apply_theme_to_user(
  p_entity_id UUID,
  p_theme_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_settings (entity_id, selected_theme_id)
  VALUES (p_entity_id, p_theme_id)
  ON CONFLICT (entity_id) 
  DO UPDATE SET 
    selected_theme_id = p_theme_id,
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_theme_to_user(UUID, UUID) TO authenticated;

-- =====================================================================================
-- END OF MIGRATION 014
-- =====================================================================================
