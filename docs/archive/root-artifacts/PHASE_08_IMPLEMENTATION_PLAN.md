# KÓRA Phase 8: Advanced Integrations - Implementation Plan

## 🎯 Priority Assessment

### IMMEDIATE START (Week 1-2)
**Phase 8A: Data & Reviews** - Zero external dependencies
- ✅ Media Management (P0)
- ✅ Reviews System (P0)
- ✅ Internal Messaging (P0)

### PARALLEL TRACK (Week 2-3)
**Phase 8B: AI Automation** - Uses existing Claude API
- ✅ CRM Scoring (P0)
- ✅ Demand Forecasting (P0)
- ✅ Auto-promotions (P0)

### REQUIRES GOOGLE SETUP (Week 3-4)
**Phase 8C: Video + GPS** - Single vendor (Google)
- Video Consultations (P0)
- GPS Tracking (P0)

### DEFERRED (Phase 9+)
**Phase 8D: Social + Canva + Blog** - Multiple OAuth flows
- Social Media (P1)
- Canva Integration (P1)
- Content Hub (P1)

---

## 📋 DECISION REQUIRED

**Which track should we start?**

### Option 1: Media + Reviews (Recommended)
- **Effort**: 16-24 hours
- **Value**: Immediate business utility
- **Risk**: Low (database only)
- **Blocks**: Nothing

### Option 2: AI Automation
- **Effort**: 24-32 hours
- **Value**: High operational impact
- **Risk**: Low (existing API)
- **Blocks**: Nothing

### Option 3: Video + GPS
- **Effort**: 32-40 hours
- **Value**: High user-facing impact
- **Risk**: Medium (Google API setup)
- **Blocks**: Requires Google credentials

---

## 🚀 RECOMMENDED START: Media + Reviews

### Why Start Here?
1. **Zero external dependencies** - pure PostgreSQL + S3
2. **Immediate business value** - businesses can upload media today
3. **Unblocks social features** - media gallery needed for posts
4. **Low risk** - no OAuth, no third-party APIs
5. **Fast to ship** - 2-3 days to production

### Implementation Order
```
Day 1: Backend
├── Migration 011 (media_assets, reviews, review_responses)
├── POST /api/media/upload (presigned S3 URLs)
├── GET /api/media (list assets)
├── POST /api/reviews (submit review)
└── GET /api/reviews (fetch with 1:10 ratio)

Day 2: Frontend
├── /app/business-admin/media (MediaGallery component)
├── /app/business-admin/reviews (BusinessReviews component)
└── Review submission form on client bookings

Day 3: Polish + Deploy
├── Drag-drop upload UX
├── Review moderation queue
└── Production deployment
```

---

## 📊 Full Phase 8 Breakdown

### Migration 011 Tables (13 total)
```sql
-- Phase 8A (P0 - Start Here)
media_assets
reviews
review_responses
conversations
messages

-- Phase 8B (P0 - Parallel)
ai_crm_scores
ai_demand_forecasts

-- Phase 8C (P0 - Google APIs)
video_sessions
staff_locations

-- Phase 8D (P1 - Deferred)
social_connections
social_posts
content_posts
```

### New Endpoints (40+ total)

**Phase 8A** (12 endpoints)
- Media: 4 endpoints
- Reviews: 5 endpoints
- Messaging: 3 endpoints

**Phase 8B** (5 endpoints)
- AI CRM: 2 endpoints
- AI Forecasting: 2 endpoints
- AI Automation: 1 endpoint

**Phase 8C** (8 endpoints)
- Video: 3 endpoints
- GPS: 5 endpoints

**Phase 8D** (15+ endpoints)
- Social: 6 endpoints
- Canva: 5 endpoints
- Content: 4 endpoints

---

## 🔧 Environment Variables Needed

### Phase 8A (Start)
```bash
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=kora-media-production
AWS_REGION=us-east-1
```

### Phase 8B (Parallel)
```bash
# Already have ANTHROPIC_API_KEY from Phase 4
```

### Phase 8C (Later)
```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_MAPS_API_KEY=
```

### Phase 8D (Deferred)
```bash
META_APP_ID=
META_APP_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=
```

---

## ✅ NEXT STEPS

**Confirm your choice:**

1. **Start with Media + Reviews** (recommended)
   - I'll create migration 011 with media_assets + reviews tables
   - Build backend endpoints for upload + review submission
   - Create MediaGallery + BusinessReviews pages

2. **Start with AI Automation**
   - I'll create AI scoring + forecasting tables
   - Build BullMQ cron jobs for nightly scoring
   - Add AI panels to business admin dashboard

3. **Start with Video + GPS**
   - Requires Google API credentials first
   - I'll create video_sessions + staff_locations tables
   - Build Google Meet integration + GPS tracking

**Reply with: 1, 2, or 3**
