# KORA Phase 2 Implementation Plan

## 📋 Overview

Phase 2 builds on Phase 1B's core CRUD foundation, adding advanced features:
1. **Payment Processing** - Multi-gateway integration
2. **Notifications** - Async email/SMS/WhatsApp dispatch
3. **Reporting** - Analytics generation and export

---

## 🏦 Module 1: PAYMENTS (`/api/payments`)

### Database Schema Additions

**New Tables:**
- `transactions` - All payment records (Stripe, PayPal, Flutterwave, Paystack)
- `invoices` - Generated from bookings/services
- `payment_methods` - Stored payment credentials
- `billing_history` - Customer payment history

### Routes & Endpoints

```typescript
// Payment Method Management
POST   /api/payments/methods              // Add payment method
GET    /api/payments/methods              // List user's methods
DELETE /api/payments/methods/:id          // Remove method

// Process Payments
POST   /api/payments/process              // Charge card/wallet
GET    /api/payments/status/:transaction_id

// Invoicing
POST   /api/payments/invoices             // Generate invoice
GET    /api/payments/invoices/:id         // Download invoice
GET    /api/payments/invoices?status=...  // List invoices

// Refunds & Disputes
POST   /api/payments/refunds              // Process refund
POST   /api/payments/disputes             // File dispute

// Analytics
GET    /api/payments/revenue?period=month // Revenue metrics
GET    /api/payments/analytics            // Payment trends
```

### Repository Methods

```typescript
// transactionRepository.ts
- create(transaction: Transaction)
- getById(id: string)
- listByBusiness(businessId: string, filters)
- listByCustomer(customerId: string)
- updateStatus(id: string, status: PaymentStatus)
- getRevenueSummary(businessId: string, dateRange)
- calculateFeatures(businessId: string) // Stripe/PayPal fees

// invoiceRepository.ts
- create(invoice: Invoice)
- getById(id: string)
- listByBusiness(businessId: string, filters)
- listByCustomer(customerId: string)
- updateStatus(id: string, status: InvoiceStatus)
```

### Service Layer

```typescript
// paymentService.ts
- processPayment(business, customer, amount, method)
- refundTransaction(transactionId, reason)
- generateInvoice(booking, markupPercentage)
- validatePaymentMethod(cardData)
- handleWebhook(provider, payload) // Stripe/PayPal webhooks

// paymentGatewayFactory.ts
- getGateway(provider: "stripe" | "paypal" | "flutterwave" | "paystack")
- charge(amount, method, metadata)
- refund(transactionId)
- getTransactionStatus(id)
```

### Integration Points

**Input from Phase 1B:**
- `bookings` table (fee calculation base)
- `services` table (pricing info)
- `businesses` table (revenue tracking)

**Output to other modules:**
- Signal to AI module for anomaly detection (unusual payment patterns)
- Create notification tasks for receipt/invoice
- Update finance dashboard

---

## 📧 Module 2: NOTIFICATIONS (`/api/notifications`)

### Database Schema Additions

**New Tables:**
- `notification_templates` - Email/SMS/Push templates with variables
- `notification_queue` - BullMQ job records
- `notification_history` - Sent/failed notifications
- `notification_preferences` - User preferences (opt-in/out)

### Routes & Endpoints

```typescript
// Notification Preferences
GET    /api/notifications/preferences     // Get user prefs
PATCH  /api/notifications/preferences     // Update prefs (email on/off, SMS on/off)

// Send Notifications (for admins/automation)
POST   /api/notifications/send            // Send immediate notification
POST   /api/notifications/schedule        // Schedule for later
GET    /api/notifications/history         // List sent notifications

// Notification Templates (admin only)
GET    /api/notifications/templates       // List templates
POST   /api/notifications/templates       // Create custom template
PATCH  /api/notifications/templates/:id   // Edit template

// Status
GET    /api/notifications/queue           // View pending jobs
GET    /api/notifications/failed          // View failed jobs
```

### Worker Implementation

```typescript
// src/workers/notificationsWorker.ts
const notificationsWorker = new Worker("notifications", async (job) => {
  switch(job.name) {
    case "send_email":
      // Use nodemailer or SendGrid
      // Render template with variables
      // Log result to notification_history
      
    case "send_sms":
      // Use Twilio or AWS SNS
      
    case "send_push":
      // Use Firebase Cloud Messaging
      
    case "send_whatsapp":
      // Use Twilio WhatsApp or WhatsApp Business API
  }
});
```

### Events Triggering Notifications

**Booking lifecycle:**
- Booking created → Send confirmation email + SMS
- Booking confirmed → Send reminder (24h before)
- Booking completed → Send receipt + request review
- Booking cancelled → Send cancellation notice

**User lifecycle:**
- User registered → Welcome email
- Payment received → Receipt email
- Password reset → Reset link email

**Business alerts:**
- New review posted → Notify business owner
- Payment failed → Alert customer + business
- Subscription expiring → Renewal reminder

### Queue Job Example

```typescript
// From bookings route
await enqueueNotification({
  organizationId: org.id,
  type: "booking_confirmed",
  userId: customer.id,
  data: {
    bookingId: booking.id,
    serviceName: service.name,
    scheduledTime: booking.scheduled_time,
    customers: [
      { email: customer.email, phone: customer.phone, name: customer.full_name }
    ]
  },
  channels: ["email", "sms"], // Based on user preferences
  sendAt: new Date()
});
```

---

## 📊 Module 3: REPORTING (`/api/reporting`)

### Database Schema Additions

**New Tables:**
- `reports_templates` - Report configurations
- `reports_generated` - Generated reports with download URLs
- `reports_schedules` - Recurring report schedules
- `analytics_snapshots` - Historical analytics for dashboards

### Routes & Endpoints

```typescript
// Generate Reports
POST   /api/reporting/generate              // Generate immediately
POST   /api/reporting/generate-and-download // Direct download
GET    /api/reporting/templates            // List available templates

// Report Management
GET    /api/reporting/reports              // List generated reports
GET    /api/reporting/reports/:id          // Get report metadata
DELETE /api/reporting/reports/:id          // Archive report

// Scheduling
POST   /api/reporting/schedules            // Create recurring report (daily/weekly/monthly)
GET    /api/reporting/schedules            // List schedules
PATCH  /api/reporting/schedules/:id        // Edit schedule
DELETE /api/reporting/schedules/:id        // Delete schedule

// Dashboard Analytics (Real-time)
GET    /api/reporting/dashboard/summary    // Top-level metrics
GET    /api/reporting/dashboard/revenue    // Revenue metrics
GET    /api/reporting/dashboard/bookings   // Booking metrics
GET    /api/reporting/dashboard/services   // Service performance
```

### Report Types

**1. Revenue Report**
- Total revenue (period)
- Revenue by service
- Revenue by payment method
- Average transaction value
- Refunds & chargebacks
- Net revenue

**2. Booking Report**
- Total bookings (period)
- Completion rate
- Cancellation rate
- Average booking value
- Busiest times/days
- Customer retention

**3. Customer Report**
- New customers (period)
- Repeat customers
- Customer lifetime value
- Churn rate
- Top customers by spend

**4. Staff Performance Report**
- Bookings handled per staff
- Customer satisfaction (reviews/ratings)
- Average booking duration
- Revenue attributed

**5. Operational Report**
- Peak hours analysis
- Service capacity utilization
- Idle time
- Staff shift patterns

### Report Generation Flow

```typescript
// reportingService.ts
async generateReport(
  businessId: string,
  reportType: "revenue" | "booking" | "customer" | "staff" | "operational",
  dateRange: { startDate: Date, endDate: Date },
  format: "pdf" | "csv" | "json"
): Promise<Report> {
  
  // 1. Query data from relevant modules
  const data = await aggregateData(businessId, reportType, dateRange);
  
  // 2. Apply calculations/transformations
  const processed = processMetrics(data, reportType);
  
  // 3. Generate output (PDF/CSV/JSON)
  const file = await renderReport(processed, format);
  
  // 4. Upload to storage (S3/Azure Blob)
  const url = await uploadToStorage(file);
  
  // 5. Create record in reports_generated
  return await reportsRepository.create({
    business_id: businessId,
    type: reportType,
    format,
    url,
    generated_at: new Date()
  });
}
```

### Worker for Scheduled Reports

```typescript
// src/workers/reportingWorker.ts
const reportingWorker = new Worker("reporting", async (job) => {
  if (job.name === "generate_scheduled_report") {
    const { scheduleId } = job.data;
    const schedule = await reportScheduleRepository.getById(scheduleId);
    
    const report = await reportingService.generateReport(
      schedule.business_id,
      schedule.report_type,
      getDateRangeForFrequency(schedule.frequency),
      schedule.format
    );
    
    // Email report to recipients
    await enqueueNotification({
      type: "scheduled_report_ready",
      userId: schedule.owner_id,
      data: { reportUrl: report.url },
      channels: ["email"]
    });
  }
});
```

---

## 🔗 Cross-Module Integration

### Data Flow

```
Bookings Created
    ↓
→ Trigger Payment Processing
    ↓
    → Generate Invoice
    ↓
    → Send Notification (email/SMS)
    ↓
    → Record Transaction
    ↓
    → Update Analytics Snapshots
    ↓
→ Financial Dashboard Updated
→ Reporting Module Updated
→ AI Module Signals (anomaly detect)
```

### Shared Dependencies

**All modules use:**
- JWT auth middleware (from Phase 1B)
- Zustand error handling (from TanStack Query)
- PostgreSQL repositories pattern
- Redis caching
- BullMQ for async tasks
- Error middleware

---

## 📅 Implementation Sequence

### Week 1: Payments Module
1. Create `transactions` + `invoices` tables (migration)
2. Implement `transactionRepository` + `invoiceRepository`
3. Create `paymentService` with Stripe integration
4. Build payment routes (`/api/payments/*`)
5. Add webhook handlers for Stripe events
6. Write contract tests (vitest + supertest)

### Week 2: Notifications Module
1. Create notification tables (migration)
2. Implement `notificationsWorker`
3. Create notification service (template rendering)
4. Build queue producers (from other modules)
5. Add email template system
6. Integrate SMS (Twilio)
7. Write tests

### Week 3: Reporting Module
1. Create `reports_*` tables (migration)
2. Implement aggregation queries
3. Create report generation service
4. Build PDF/CSV renderers
5. Create scheduled report worker
6. Build analytics dashboard queries
7. Write tests

---

## 🧪 Phase 2 Testing Strategy

### Unit Tests
- Payment validation (card format, amount)
- Invoice calculation (with taxes/fees)
- Report aggregation logic
- Notification template rendering

### Integration Tests
- Full payment flow (processing → webhook → record)
- Booking to notification pipeline
- Report generation with real data
- Error scenarios (failed payment, invalid card)

### Contract Tests
- Payment endpoint responses match OpenAPI spec
- Notification delivery (mock email/SMS)
- Report download works with various formats

---

## 📦 Deliverables for Phase 2

- ✅ 3 new modules with routes + repositories + services
- ✅ 15+ new database tables + migrations
- ✅ 25+ new API endpoints
- ✅ 2 async workers (payments webhooks, report scheduling)
- ✅ 50+ contract tests
- ✅ Complete API documentation
- ✅ Error handling for payment failures
- ✅ Multi-gateway payment support

---

## 🎯 Success Criteria

- All payment transactions recorded with proper status
- Notifications delivered within 30 seconds
- Reports generate without timeout (< 5 min)
- Zero payment discrepancies
- 99%+ notification delivery rate
- All errors gracefully handled with user-friendly messages

