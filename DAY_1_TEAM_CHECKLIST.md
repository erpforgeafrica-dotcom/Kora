# KORA Phase 1 Implementation: Actionable Day-1 Checklist
**Start Date**: April 23, 2026  
**Duration**: 2 weeks (80 hours)  
**Team Size**: 3 developers  
**Revenue Target**: +$45K/month

---

## 🚀 BEFORE YOU START

### Step 1: Database Migrations (30 min)
```bash
cd backend
npm install  # If needed

# Apply 3 critical migrations
npm run db:migrate

# Verify migrations applied
npx knex migrate:list
# Should show: 047_users_profile_extension ✅
#             048_iam_connected_accounts ✅
#             049_staff_members_consolidation ✅
```

### Step 2: Feature Branch Setup (15 min)
```bash
git checkout -b phase-1/stub-pages-epic
# Create one branch per developer

# Dev 1: phase-1/feature-notifications
# Dev 2: phase-1/feature-mobile-optimization
# Dev 3: phase-1/feature-anomaly-dashboard
```

### Step 3: Verify Build (15 min)
```bash
# Frontend
cd frontend
npm install
npm run dev  # Should start on :5173

# Backend (in separate terminal)
cd backend
npm install
npm run dev  # Should start on :3000
# Verify: curl http://localhost:3000/health

# Should return: { "status": "ok" }
```

---

## 📝 DEVELOPER ASSIGNMENT

### Developer #1: Stub Pages (Core UX)
**Responsibility**: Implement 5 high-priority stub pages  
**Effort**: 40 hours (5-6 hours per page)

#### Day 1-2: ClientNotificationsPage
```
Time: 6 hours (2 hours design, 2 hours backend, 2 hours integration)

Checklist:
□ Copy template from IMPLEMENTATION_GUIDE_PHASE_1_3.md
□ Create file: frontend/src/pages/audience/ClientNotificationsPage.tsx
□ Implement backend endpoints:
  - GET /api/notifications/preferences/:userId
  - POST /api/notifications/preferences/:userId
  - GET /api/notifications/history
  - PATCH /api/notifications/:id (mark as read)
□ Test with real user data
□ Deploy to dev environment
□ Measure: Preference save success rate + notification delivery latency
```

**Backend Support** (if missing):
```bash
# Check if notification_preferences table exists
psql -U kora -d kora -c "SELECT * FROM notification_preferences LIMIT 1"

# If missing, create:
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  preferences JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX idx_notification_preferences_user_org 
  ON notification_preferences(user_id, organization_id);
```

#### Day 3: ClientLoyaltyPage
```
Time: 6 hours

Checklist:
□ Template: frontend/src/pages/audience/ClientLoyaltyPage.tsx
□ Show: Points balance, redemption history, available rewards
□ Backend: GET /api/loyalty/balance, POST /api/loyalty/redeem
□ Test with test data
□ Deploy
```

#### Day 4: AccountSettingsPage
```
Time: 6 hours

Checklist:
□ Template: frontend/src/pages/audience/AccountSettingsPage.tsx
□ Sections: Profile, Privacy, Notifications, Billing
□ Backend: PATCH /api/users/:id/profile
□ Test: Profile update success rate
□ Deploy
```

#### Day 5: StaffNotesPage
```
Time: 6 hours

Checklist:
□ Template: frontend/src/pages/staff/StaffNotesPage.tsx
□ Features: Note editor, history, tagging
□ Backend: POST /api/staff-notes, GET /api/bookings/:id/notes
□ Mobile test: Check-in on phone
□ Deploy
```

#### Week 2, Day 1-3: ReportsPage, MyAvailabilityPage, StaffSchedulesPage
```
Repeat pattern (6h each):
□ Copy template
□ Create component
□ Implement backend endpoints
□ Test
□ Deploy daily at 4 PM
```

---

### Developer #2: Mobile Optimization (User Experience)
**Responsibility**: Optimize frontend for mobile  
**Effort**: 25 hours

#### Day 1-2: Mobile Layout Component
```
Time: 8 hours (design + implementation)

Checklist:
□ Create: frontend/src/components/layout/MobileLayout.tsx
□ Code: Copy MobileLayout template from IMPLEMENTATION_GUIDE_PHASE_1_3.md
□ Features:
  - Sticky header with menu toggle
  - Overlay navigation
  - Bottom tab bar (Bookings, Clients, Settings)
  - Minimum 44px touch targets
□ Test on:
  - iPhone SE (375px width)
  - Android Pixel 4 (412px width)
  - Desktop (verify no regression)
□ Measure: Mobile PageSpeed score (target >80)
```

**Test on Real Devices**:
```bash
# iOS (if Mac available)
npm run dev  # Note the tunnel URL
# Open Safari on iPhone and navigate to tunnel URL

# Android (Chrome DevTools)
# Or use Expo for React Native preview
```

#### Day 3: Mobile Form Component
```
Time: 8 hours

Checklist:
□ Create: frontend/src/components/ui/MobileForm.tsx
□ Copy template from IMPLEMENTATION_GUIDE_PHASE_1_3.md
□ Ensure:
  - Full-width inputs
  - Minimum 44px height
  - Large submit button
  - Error messages visible
□ Refactor BookingCheckout to use MobileForm
□ Test mobile checkout flow
□ Measure: Mobile conversion rate before/after
```

#### Day 4-5: Apply Mobile Pattern Across Pages
```
Time: 9 hours

Checklist:
□ Refactor 5 pages to use MobileLayout:
  - Dashboard.tsx
  - BookingCheckout.tsx
  - ClientProfile.tsx
  - StaffAvailability.tsx
  - AdminDashboard.tsx
□ Verify all forms have min-height: 44px
□ Test on mobile
□ Lighthouse audit for each page
□ Measure: Mobile PageSpeed trend
```

**Measurement Checklist**:
```bash
# Before mobile optimization
npm run build -- frontend
npm run lighthouse frontend/dist/index.html

# After optimization
npm run lighthouse frontend/dist/index.html

# Target: Mobile score 80+, Desktop 85+
```

---

### Developer #3: Anomaly Alerts & Intelligence (Decision Support)
**Responsibility**: Surface hidden AI intelligence  
**Effort**: 35 hours

#### Day 1-2: Anomaly Alerts Dashboard
```
Time: 10 hours

Checklist:
□ Create: frontend/src/pages/audience/AnomalyAlertsPage.tsx
□ Copy code template from IMPLEMENTATION_GUIDE_PHASE_1_3.md
□ Backend setup: GET /api/ai/anomalies
  - Returns: { id, title, severity, description, metrics, suggested_action }
  - Severity: critical, warning, info
  - Real-time polling: 5-second interval
□ UI Features:
  - Severity filter buttons
  - Actionable buttons (Execute, Dismiss)
  - Timestamp display
□ Test:
  - Trigger test anomaly
  - Verify alert surfaces <5 seconds
  - Test action execution
□ Deploy
```

**Backend Anomaly Endpoint** (if missing):
```typescript
// backend/src/modules/ai/routes.ts
aiRoutes.get('/anomalies', requireAuth, async (req, res, next) => {
  try {
    const orgId = res.locals.auth.organizationId;
    const anomalies = await queryDb(
      `SELECT id, title, severity, description, metrics, suggested_action, detected_at
       FROM anomalies 
       WHERE organization_id = $1 
       AND dismissed_at IS NULL
       ORDER BY detected_at DESC
       LIMIT 20`,
      [orgId]
    );
    res.json(anomalies);
  } catch (err) {
    next(err);
  }
});
```

#### Day 3: Churn Risk Dashboard (if time)
```
Time: 8 hours

Checklist:
□ Create: frontend/src/pages/admin/ChurnRiskPage.tsx
□ Backend: GET /api/ai/churn-risk
  - Returns clients at risk with score and reasons
□ Features:
  - Risk score visualization
  - Intervention suggestions
  - Quick action buttons
□ Test
□ Deploy
```

#### Day 4-5: Scheduling Recommendations (if time)
```
Time: 10 hours

Checklist:
□ Create: frontend/src/pages/staff/SchedulingRecommendationsPage.tsx
□ Backend: POST /api/ai/schedule-optimization
  - Input: staffIds, clientId, serviceId
  - Output: Top 3 recommended time slots with reasoning
□ Integration: Show on BookingCheckout as "AI recommends"
□ Test: Verify recommendations match staff availability
□ Deploy
```

#### Day 5: Performance Monitoring
```
Time: 7 hours

Checklist:
□ Add logging to anomaly detection
□ Create dashboard: admin/SystemHealth
□ Show: API latency, error rate, WebSocket connections (for next phase)
□ Test with load
□ Deploy
```

---

## 📊 DAILY DEPLOYMENT CHECKLIST

### 4 PM DAILY DEPLOYMENT (Each Developer)

```bash
# 1. Verify tests pass
npm run test -- <feature-file>  # 5 min

# 2. Build production
npm run build

# 3. Create PR with description:
# Title: "Feat: Implement [PageName] UI"
# Description:
#   - Feature: [What it does]
#   - Backend support: [Endpoints created/verified]
#   - Testing: [Manual tests performed]
#   - Impact: [Revenue/UX improvement]

# 4. Merge to main (after review)

# 5. Deploy to staging
npm run deploy:staging  # If configured

# 6. Verify on staging
curl https://kora-staging.example.com/[page]

# 7. Monitor for 1 hour
# Check for errors: grep "ERROR" logs.txt

# 8. Deploy to production
npm run deploy:production

# 9. Monitor production
# Check: Real user transactions, API latency
```

---

## 📈 SUCCESS METRICS TO TRACK

### Daily (EOD)
```
□ Pages implemented: __ of 10
□ Mobile PageSpeed: __ (target: 80+)
□ Backend test coverage: __% (target: 80%+)
□ Production errors: __ (target: 0)
□ Deployment time: __ minutes (target: <30 min)
```

### Weekly (Friday)
```
□ Revenue impact: $__ (target: +$45K by Friday Week 2)
□ User satisfaction: NPS __ (target: +10 points)
□ Mobile adoption: __% (target: >35%)
□ Staff adoption: __% (target: >70%)
□ Technical debt: __ issues (target: <5)
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Cannot find NotificationPreference table"
**Fix**:
```bash
# Check migrations applied
npm run db:migrate

# Or manually create
psql -U kora -d kora < backend/src/db/migrations/047_users_profile_extension.sql
```

### Issue: "Mobile buttons don't respond to touch"
**Fix**: Add `style={{ minHeight: '44px' }}` to button/input elements

### Issue: "API endpoint returns 404"
**Fix**: 
```bash
# Check backend is running
curl http://localhost:3000/health

# Check route is registered in backend/src/app.ts
grep "notifications" src/app.ts
```

### Issue: "Tests failing"
**Fix**:
```bash
# Run specific test in watch mode
npm run test:watch -- ClientNotificationsPage.test.ts

# View test output
npm run test -- --reporter=verbose
```

---

## 🎯 END OF WEEK 1 TARGET STATE

By Friday EOD (April 26):
- [ ] 5 critical stub pages deployed and functional
- [ ] Mobile optimization across all deployed pages
- [ ] Anomaly dashboard live and collecting alerts
- [ ] +$45K/month revenue measured
- [ ] Mobile PageSpeed >80
- [ ] 0 production errors
- [ ] Team ready for Week 2 (WebSocket infrastructure)

---

## 📞 ESCALATION PATH

**Questions?**
1. Check IMPLEMENTATION_GUIDE_PHASE_1_3.md (code templates)
2. Check USER_JOURNEY_BUSINESS_ALIGNMENT.md (why we're doing this)
3. Ask tech lead: [TBD]

**Blockers?**
1. Database issue: Check migrations
2. Missing API: Add endpoint following pattern
3. Mobile UI broken: Add minHeight: 44px

---

**READY TO START? Let's go! 🚀**

*Questions? Review the full IMPLEMENTATION_GUIDE_PHASE_1_3.md for templates and patterns.*
