# PHASE 4: KÓRA DASHBOARD ENHANCEMENT
## Enhanced Operations Platform with Interactive Features
**Date**: March 9, 2026 | **Scope**: Dashboard UX + Media + Social + AI + Real-time  
**Estimated Effort**: 200+ hours across 8 sprints

---

## 🎯 VISION
Transform KÓRA dashboards from static admin interfaces into **lively, intelligent operations systems** with:
- Smart navigation (accordion sidebar)
- Media management (upload/gallery)
- Social media integration (WhatsApp, Instagram, Facebook, TikTok, etc.)
- AI chatbot assistant (contextual per role)
- Live widgets (real-time data)
- Interactive maps (GPS tracking)
- Global notification center
- Quick action toolbar

---

## 📊 IMPLEMENTATION ROADMAP

### **PHASE 4.1: NAVIGATION ENHANCEMENT** (Sprint 1-2 | Week 1)
**Goal**: Migrate from flat sidebar to accordion navigation

**Tasks**:
- [ ] `NavigationAccordion.tsx` — stacked expandable menu component
- [ ] `MenuItem.tsx` — menu item with icon + label + expand trigger
- [ ] Update `AppShell.tsx` to use accordion nav
- [ ] Define nav structure for each role (client, staff, business_admin, operations)
- [ ] Persist expanded/collapsed state in localStorage
- [ ] Add smooth collapse/expand animations (200ms)

**Deliverable**: Sidebar transforms from flat list to expandable sections
**Effort**: 16 hours

---

### **PHASE 4.2: MEDIA MANAGEMENT SYSTEM** (Sprint 2-3 | Week 1-2)
**Goal**: Full media upload, gallery, and organization system

**Backend Requirements**:
```typescript
// New database tables
media_uploads {
  id: uuid
  organization_id: uuid
  uploaded_by: uuid
  file_name: string
  file_type: enum ('image', 'video', 'document')
  file_size: int
  s3_key: string
  gallery_category: enum ('service', 'staff_work', 'before_after', 'promotional', 'video', 'training')
  mime_type: string
  created_at: timestamp
  deleted_at: timestamp (soft delete)
}

media_galleries {
  id: uuid
  organization_id: uuid
  name: string
  category: enum (above)
  description: string
  is_public: boolean
  display_order: int
}
```

**Frontend Components**:
- [ ] `MediaUploadZone.tsx` — drag-drop upload with progress
- [ ] `MediaGallery.tsx` — grid gallery browser
- [ ] `GalleryCategoryManager.tsx` — organize by type
- [ ] `MediaModal.tsx` — lightbox viewer
- [ ] `MediaDeleteConfirm.tsx` — soft delete + restore

**API Endpoints** (Backend):
```
POST   /api/media/upload              → upload single file
POST   /api/media/upload/batch        → batch upload
GET    /api/media/galleries           → list galleries by org
GET    /api/media/galleries/:id       → gallery contents
DELETE /api/media/:mediaId            → soft delete
POST   /api/media/:mediaId/restore    → undelete
PATCH  /api/media/:mediaId            → update metadata
```

**Deliverable**: Full media management for all user roles
**Effort**: 40 hours

---

### **PHASE 4.3: REAL-TIME DASHBOARD WIDGETS** (Sprint 3-4 | Week 2)
**Goal**: Live metrics that update every 10-30 seconds

**Required Widgets**:
1. **Bookings Today** — count + trend
2. **Revenue Today** — gross + target
3. **Active Staff** — count + locations
4. **Emergency Alerts** — active count + latest
5. **Service Demand Trends** — 24h sparkline
6. **Client Satisfaction** — NPS score + trend
7. **Payment Processing** — pending + success rate

**Frontend Components**:
- [ ] `DashboardWidgets.tsx` — widget grid layout
- [ ] `BookingsWidget.tsx`
- [ ] `RevenueWidget.tsx`
- [ ] `ActiveStaffWidget.tsx`
- [ ] `AlertsWidget.tsx`
- [ ] `TrendSparkline.tsx` — mini chart
- [ ] `WidgetRefreshControl.tsx` — manual + auto refresh

**Backend Requirements**:
```typescript
// New WebSocket events (for real-time push)
socket.on('widget:bookings-update', (data) => { ... })
socket.on('widget:revenue-update', (data) => { ... })
socket.on('widget:alert-triggered', (data) => { ... })

// OR use polling endpoints (10-30s interval)
GET /api/dashboard/widgets/active-org  → { bookings, revenue, staff, alerts, ... }
```

**Deliverable**: Live dashboard homepage with 7 key widgets
**Effort**: 32 hours

---

### **PHASE 4.4: KÓRA SMART CHATBOT** (Sprint 4-5 | Week 2-3)
**Goal**: Context-aware AI assistant for each role

**Architecture**:
```typescript
// Chatbot context varies by role
interface ChatbotContext {
  role: DashboardRole
  organizationId: string
  userId: string
  currentModule: string  // e.g., 'bookings', 'staff', 'operations'
  systemPrompt: string   // role-specific instructions
}

// Client: service discovery, booking help
// Staff: shift management, task assignment
// Business Admin: promotion analysis, staffing forecasts
// Operations: incident monitoring, resource allocation
```

**Frontend Components**:
- [ ] `FloatingChatbot.tsx` — sticky bottom-right assistant
- [ ] `ChatWindow.tsx` — message list + input
- [ ] `ChatMessage.tsx` — text/code/actions
- [ ] `ChatActionButton.tsx` — quick actions from bot
- [ ] `ChatHistorySidebar.tsx` — conversation history

**Backend Requirements**:
```
POST /api/chat/message
  body: {
    message: string
    role: DashboardRole
    organizationId: string
    context: ChatbotContext
  }
  response: {
    message: string
    actions?: { type, label, payload }
    suggestedQueries?: string[]
  }
```

**Role-Specific Functions**:

**Client Chatbot**:
- "What services do you offer?"
- "Find me a [service type]"
- "Book an appointment for [date]"
- "Where's my booking?"
- "What's your cancellation policy?"

**Staff Chatbot**:
- "What shifts can I pick up?"
- "Mark me unavailable on [date]"
- "Show my upcoming tasks"
- "How do I clock in?"

**Business Admin Chatbot**:
- "What's my NPS this month?"
- "Which services are trending?"
- "Predict demand for [service]"
- "Suggest promotions for low-demand hours"
- "How many staff do I need on [date]?"

**Operations Chatbot**:
- "Active incidents: [summary]"
- "System health check"
- "Alert trending: [pattern]"
- "Resource allocation recommendation"
- "Cost analysis this quarter"

**Deliverable**: Context-aware AI chatbot for all 4 dashboard roles
**Effort**: 48 hours

---

### **PHASE 4.5: SOCIAL MEDIA INTEGRATION** (Sprint 5-6 | Week 3-4)
**Goal**: Connect to WhatsApp, Instagram, Facebook, TikTok, etc.

**Database Schema**:
```typescript
social_media_accounts {
  id: uuid
  organization_id: uuid
  platform: enum ('whatsapp', 'instagram', 'facebook', 'tiktok', 'pinterest', 'snapchat', 'twitter')
  account_name: string
  is_connected: boolean
  access_token_encrypted: string
  refresh_token_encrypted: string
  expires_at: timestamp
  connected_by: uuid
  connected_at: timestamp
}

social_posts {
  id: uuid
  organization_id: uuid
  platform: string
  content: string
  scheduled_for: timestamp (null = posted immediately)
  posted_at: timestamp
  likes_count: int
  comments_count: int
  shares_count: int
  engagement_rate: float
  status: enum ('draft', 'scheduled', 'posted', 'failed')
}

social_messages {
  id: uuid
  organization_id: uuid
  platform: string
  customer_id: uuid (optional)
  from_handle: string
  to_handle: string
  message: string
  direction: enum ('inbound', 'outbound')
  received_at: timestamp
  replied_at: timestamp
  read_by: uuid (optional)
}
```

**Frontend Components**:
- [ ] `SocialConnectModal.tsx` — OAuth flow for each platform
- [ ] `SocialMediaManager.tsx` — account dashboard
- [ ] `PostComposer.tsx` — create + schedule posts
- [ ] `PostAnalytics.tsx` — engagement metrics
- [ ] `InboxMessenger.tsx` — unified message center
- [ ] `AnalyticsTab.tsx` — engagement trends

**Backend Requirements**:
```
POST   /api/social/connect/:platform      → OAuth redirect
POST   /api/social/disconnect/:platform   → revoke access
GET    /api/social/accounts               → list connected accounts
POST   /api/social/posts                  → create post
PATCH  /api/social/posts/:id              → update/schedule
POST   /api/social/posts/:id/publish      → post immediately
GET    /api/social/messages               → unified inbox
POST   /api/social/messages               → send reply
GET    /api/social/analytics              → engagement metrics
```

**Supported Platforms**:
- ✅ WhatsApp (Business API)
- ✅ Instagram (Graph API)
- ✅ Facebook (Graph API)
- ✅ TikTok (Business API)
- ✅ Pinterest (API)
- ✅ Snapchat (Business API)
- ✅ Twitter/X (API v2)

**Deliverable**: Multi-platform social media management hub
**Effort**: 56 hours

---

### **PHASE 4.6: INTERACTIVE MAP SYSTEM** (Sprint 6-7 | Week 4)
**Goal**: Real-time GPS tracking and geo-based features

**Frontend Components**:
- [ ] `InteractiveMap.tsx` — main map component (Google Maps / Mapbox)
- [ ] `LocationPin.tsx` — provider/staff location marker
- [ ] `DispatchOverlay.tsx` — live dispatch visualization
- [ ] `GeoFence.tsx` — service area boundary
- [ ] `RouteOptimizer.tsx` — optimal dispatch order
- [ ] `MobileTracking.tsx` — staff location history

**Backend Requirements**:
```typescript
location_updates {
  id: uuid
  user_id: uuid
  latitude: float
  longitude: float
  accuracy: int (meters)
  heading: int (degrees)
  speed: float (km/h)
  timestamp: timestamp
}

service_area_boundaries {
  id: uuid
  organization_id: uuid
  name: string
  polygon: GeoJSON
  is_active: boolean
}

dispatch_routes {
  id: uuid
  organization_id: uuid
  staff_id: uuid
  bookings: uuid[]
  optimized_order: int[]
  total_distance: float (km)
  estimated_duration: int (minutes)
  created_at: timestamp
}
```

**API Endpoints**:
```
POST   /api/location/update                → submit staff location
GET    /api/location/active-staff          → all active staff with location
GET    /api/dispatch/optimize-route        → optimize delivery order
POST   /api/geofence/check                 → verify location in service area
GET    /api/maps/service-area/:orgId       → org's service boundaries
```

**Deliverable**: Interactive map with real-time staff tracking + dispatch optimization
**Effort**: 40 hours

---

### **PHASE 4.7: NOTIFICATION CENTER** (Sprint 7 | Week 4)
**Goal**: Global, unified notification system

**Database Schema**:
```typescript
notifications {
  id: uuid
  organization_id: uuid
  user_id: uuid
  type: enum ('booking_update', 'payment', 'alert', 'promotion', 'emergency', 'system')
  title: string
  message: string
  action_url: string (optional)
  read_at: timestamp (null = unread)
  created_at: timestamp
  expires_at: timestamp (optional)
  priority: enum ('low', 'normal', 'high', 'critical')
}

notification_preferences {
  user_id: uuid
  type: enum (above)
  channel: enum ('in_app', 'email', 'sms', 'push')
  enabled: boolean
}
```

**Frontend Components**:
- [ ] `NotificationBell.tsx` — topbar icon with unread count
- [ ] `NotificationPanel.tsx` — dropdown list
- [ ] `NotificationCenter.tsx` — full page view
- [ ] `NotificationPreferences.tsx` — settings per type
- [ ] `NotificationCard.tsx` — individual notification

**Real-time Transport**:
- WebSocket events: `notification:new`, `notification:read`
- Or: polling GET /api/notifications?since=timestamp

**Deliverable**: Real-time global notification system
**Effort**: 24 hours

---

### **PHASE 4.8: QUICK ACTION TOOLBAR** (Sprint 8 | Week 5)
**Goal**: Fast-access top toolbar for common actions

**Position**: Sticky top-right corner (or topbar)

**Role-Specific Actions**:

**Client**:
- [ ] Create Booking
- [ ] View My Bookings
- [ ] Message Support
- [ ] Wallet / Payments

**Staff**:
- [ ] Clock In/Out
- [ ] View Schedule
- [ ] Mark Unavailable
- [ ] Report Issue

**Business Admin**:
- [ ] Create Promotion
- [ ] Add Staff Member
- [ ] Analyze Demand
- [ ] Upload Media

**Operations**:
- [ ] Create Alert
- [ ] View Incidents
- [ ] Resource Allocation
- [ ] System Health

**Frontend Components**:
- [ ] `QuickActionBar.tsx` — action button grid
- [ ] `QuickActionButton.tsx` — icon + label
- [ ] `QuickActionModal.tsx` — action-specific form

**Deliverable**: Fast access toolbar with role-specific actions
**Effort**: 16 hours

---

## 📈 IMPLEMENTATION TIMELINE

| Sprint | Phase | Duration | Focus |
|--------|-------|----------|-------|
| 1-2 | 4.1 | Week 1 | Accordion Navigation |
| 2-3 | 4.2 | Week 1-2 | Media Management |
| 3-4 | 4.3 | Week 2 | Live Widgets |
| 4-5 | 4.4 | Week 2-3 | AI Chatbot |
| 5-6 | 4.5 | Week 3-4 | Social Integration |
| 6-7 | 4.6 | Week 4 | Interactive Maps |
| 7 | 4.7 | Week 4 | Notifications |
| 8 | 4.8 | Week 5 | Quick Actions |

**Total**: 8 weeks | **Parallel streams**: Phases 4.1-4.2 can overlap with 4.3-4.4

---

## 🏗️ ARCHITECTURE DECISIONS

### **Real-Time Transport**
```typescript
// Option A: WebSocket (recommended for live updates)
const socket = io('http://localhost:3000', {
  auth: { token: authToken }
})
socket.on('dashboard:widget-update', (data) => { ... })

// Option B: Server-Sent Events (simpler)
const eventSource = new EventSource('/api/events/stream?token=...')
eventSource.addEventListener('widget-update', (e) => { ... })

// Option C: Polling (fallback)
setInterval(() => fetch('/api/dashboard/widgets'), 10000)
```

### **Backend API Layer**
```typescript
// New routes structure
/api/dashboard/               → dashboard public data
/api/media/                   → media management
/api/social/                  → social integration
/api/chat/                    → chatbot
/api/widgets/                 → live metrics
/api/location/                → GPS tracking
/api/notifications/           → notification center
/api/analytics/dashboard      → analytics for each role
```

### **Data Flow**
```
User Action → Frontend Component → API Call → Backend Service
                                              ↓
                                        Database Query
                                              ↓
                                        Real-time Event (WebSocket/SSE)
                                              ↓
                                        All Connected Clients Update
```

---

## 📋 PREREQUISITE CHECKLIST

Before Phase 4.1 starts:

- [ ] Backend WebSocket server setup (Socket.io or native WS)
- [ ] S3 or similar object storage for media files
- [ ] Social media API keys provisioned (Meta, TikTok, Twitter, etc.)
- [ ] Google Maps / Mapbox API key
- [ ] AI/LLM endpoint configured (Claude, GPT-4, or internal)
- [ ] Database migrations for new tables (media, social, locations, notifications)
- [ ] Email service for notifications (SendGrid, Twilio, etc.)
- [ ] WebSocket client library installed (`socket.io-client`)
- [ ] Map library installed (`react-map-gl` or `react-google-maps`)
- [ ] HTTP client ready for OAuth flows

---

## 🎨 DESIGN LANGUAGE (Continue from Phase 3)

**Colors**:
- Background: #0c0e14 (dark navy)
- Surface: #141720 (charcoal)
- Accent: #00e5c8 (teal)
- Highlight: #f59e0b (amber)
- Secondary: #a78bfa (purple)

**Animations**:
- Accordion expand/collapse: 200ms ease-in-out
- Widget refresh: 300ms fade
- Tooltip appear: 150ms
- Drawer slide: 250ms cubic-bezier(0.4, 0, 0.2, 1)

**Spacing**:
- Token: 4px (base unit)
- Padding base: 16px (4 tokens)
- Gap base: 12px (3 tokens)
- Border radius: 8px

---

## 🚀 SUCCESS CRITERIA

Phase 4 is complete when:

- ✅ All 8 sub-phases delivered and integrated
- ✅ Dashboard feels responsive and lively (60+ FPS)
- ✅ Real-time widgets refresh within 10-30s
- ✅ Media upload works drag-drop (batch supported)
- ✅ Chatbot responds contextually for each role
- ✅ Social integration posts to 7 platforms
- ✅ Maps show live staff locations
- ✅ Notifications arrive in <500ms
- ✅ All interactions smooth (no jank)
- ✅ Mobile responsive at 375px+ width
- ✅ Accessibility: WCAG AA compliant
- ✅ Performance: Lighthouse 85+

---

## 📞 NEXT STEPS

**If approved:**
1. Confirm which Phase (4.1-4.8) to start first
2. Provision backend APIs and databases
3. Secure social media API keys
4. Set up WebSocket server
5. Schedule Sprint 1 kickoff

**Questions to resolve:**
- Real-time transport: WebSocket vs SSE vs polling?
- Map vendor: Google Maps vs Mapbox?
- Chatbot backend: Claude vs GPT-4 vs internal?
- Media storage: AWS S3 vs Cloud Storage vs self-hosted?

---

**Report Completed**: March 9, 2026 · 14:22 UTC  
**Prepared by**: AGENT_B — Frontend Intelligence Engineer  
**For**: KÓRA Phase 04 Dashboard Enhancement Initiative
