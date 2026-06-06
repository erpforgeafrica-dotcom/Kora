-- =====================================================================================
-- Migration 010: Booking Engine Extensions & Communication Hub
-- =====================================================================================
-- Booking Slots, Availability, Resources, Schedules, Notifications, Messages
-- =====================================================================================

-- =====================================================================================
-- RESOURCES (Staff, Rooms, Equipment)
-- =====================================================================================
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  resource_code TEXT UNIQUE NOT NULL,
  resource_name TEXT NOT NULL,
  
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
    'staff', 'room', 'equipment', 'vehicle', 'facility', 'other'
  )),
  
  -- Link to actual resource
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  capacity INTEGER DEFAULT 1,
  
  is_bookable BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_tenant ON resources(tenant_id);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_employee ON resources(employee_id);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_resources_isolation ON resources
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- AVAILABILITY RULES
-- =====================================================================================
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  is_available BOOLEAN DEFAULT TRUE,
  
  effective_from DATE,
  effective_to DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_rules_tenant ON availability_rules(tenant_id);
CREATE INDEX idx_availability_rules_resource ON availability_rules(resource_id);

ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_availability_rules_isolation ON availability_rules
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BOOKING SLOTS
-- =====================================================================================
CREATE TABLE booking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  capacity INTEGER DEFAULT 1,
  booked_count INTEGER DEFAULT 0,
  
  is_available BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resource_id, slot_date, start_time)
);

CREATE INDEX idx_booking_slots_tenant ON booking_slots(tenant_id);
CREATE INDEX idx_booking_slots_service ON booking_slots(service_id);
CREATE INDEX idx_booking_slots_resource ON booking_slots(resource_id);
CREATE INDEX idx_booking_slots_date ON booking_slots(slot_date);

ALTER TABLE booking_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_booking_slots_isolation ON booking_slots
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- SCHEDULES
-- =====================================================================================
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  schedule_name TEXT NOT NULL,
  
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  
  schedule_type VARCHAR(50) CHECK (schedule_type IN (
    'work', 'meeting', 'appointment', 'break', 'unavailable', 'other'
  )),
  
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  
  recurrence_pattern VARCHAR(50) CHECK (recurrence_pattern IN (
    'none', 'daily', 'weekly', 'monthly', 'yearly'
  )),
  
  recurrence_end_date DATE,
  
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedules_tenant ON schedules(tenant_id);
CREATE INDEX idx_schedules_resource ON schedules(resource_id);
CREATE INDEX idx_schedules_start ON schedules(start_datetime);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_schedules_isolation ON schedules
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CHECK-INS
-- =====================================================================================
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_in_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  check_in_method VARCHAR(50) CHECK (check_in_method IN (
    'manual', 'qr_code', 'face', 'fingerprint', 'nfc', 'app'
  )),
  
  checked_out_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkins_tenant ON checkins(tenant_id);
CREATE INDEX idx_checkins_booking ON checkins(booking_id);
CREATE INDEX idx_checkins_time ON checkins(checked_in_at);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_checkins_isolation ON checkins
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- NOTIFICATION TEMPLATES
-- =====================================================================================
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  template_name TEXT NOT NULL,
  template_code TEXT UNIQUE NOT NULL,
  
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN (
    'email', 'sms', 'push', 'whatsapp', 'telegram', 'in_app'
  )),
  
  subject TEXT,
  body TEXT NOT NULL,
  
  variables JSONB, -- e.g., ["customer_name", "booking_date", "amount"]
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_templates_tenant ON notification_templates(tenant_id);
CREATE INDEX idx_notification_templates_code ON notification_templates(template_code);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_notification_templates_isolation ON notification_templates
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- NOTIFICATIONS
-- =====================================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  recipient_user_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'email', 'sms', 'push', 'whatsapp', 'telegram', 'in_app'
  )),
  
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
  
  subject TEXT,
  message TEXT NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'failed', 'read'
  )),
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  error_message TEXT,
  
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_notifications_isolation ON notifications
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- NOTIFICATION CHANNELS
-- =====================================================================================
CREATE TABLE notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN (
    'email', 'sms', 'whatsapp', 'telegram', 'push', 'in_app'
  )),
  
  channel_name TEXT NOT NULL,
  
  is_enabled BOOLEAN DEFAULT TRUE,
  
  configuration JSONB, -- API keys, endpoints, credentials (encrypted)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_channels_tenant ON notification_channels(tenant_id);
CREATE INDEX idx_notification_channels_type ON notification_channels(channel_type);

ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_notification_channels_isolation ON notification_channels
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CONVERSATIONS
-- =====================================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  conversation_type VARCHAR(50) CHECK (conversation_type IN (
    'direct', 'group', 'support', 'broadcast'
  )),
  
  conversation_name TEXT,
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_conversations_isolation ON conversations
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CONVERSATION PARTICIPANTS
-- =====================================================================================
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  participant_user_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  UNIQUE(conversation_id, participant_user_id)
);

CREATE INDEX idx_conversation_participants_tenant ON conversation_participants(tenant_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(participant_user_id);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_conversation_participants_isolation ON conversation_participants
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- MESSAGES
-- =====================================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  sender_user_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN (
    'text', 'image', 'video', 'audio', 'file', 'location', 'system'
  )),
  
  message_text TEXT,
  
  media_url TEXT,
  media_type VARCHAR(50),
  
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_user_id);
CREATE INDEX idx_messages_created ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_messages_isolation ON messages
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- CALLS
-- =====================================================================================
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  call_type VARCHAR(50) NOT NULL CHECK (call_type IN (
    'voice', 'video'
  )),
  
  caller_user_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  callee_user_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  call_status VARCHAR(50) NOT NULL DEFAULT 'initiated' CHECK (call_status IN (
    'initiated', 'ringing', 'answered', 'ended', 'missed', 'rejected', 'failed'
  )),
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  duration_seconds INTEGER,
  
  recording_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_tenant ON calls(tenant_id);
CREATE INDEX idx_calls_caller ON calls(caller_user_id);
CREATE INDEX idx_calls_callee ON calls(callee_user_id);
CREATE INDEX idx_calls_started ON calls(started_at);

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_calls_isolation ON calls
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- VIDEO SESSIONS (For Telemedicine, Consulting, etc.)
-- =====================================================================================
CREATE TABLE video_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  session_type VARCHAR(100) NOT NULL, -- e.g., 'telemedicine', 'consultation', 'class', 'meeting'
  
  host_user_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
  
  session_name TEXT,
  
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  meeting_url TEXT,
  meeting_id TEXT,
  meeting_password TEXT,
  
  platform VARCHAR(50) CHECK (platform IN (
    'zoom', 'google_meet', 'microsoft_teams', 'whatsapp', 'telegram', 'webrtc', 'other'
  )),
  
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),
  
  recording_url TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_sessions_tenant ON video_sessions(tenant_id);
CREATE INDEX idx_video_sessions_host ON video_sessions(host_user_id);
CREATE INDEX idx_video_sessions_scheduled ON video_sessions(scheduled_start);
CREATE INDEX idx_video_sessions_status ON video_sessions(status);

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_video_sessions_isolation ON video_sessions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 010
-- =====================================================================================
