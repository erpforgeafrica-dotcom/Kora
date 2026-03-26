# KÓRA v1.2 Smoke Test - Complete Workflow Documentation

## Objective
Demonstrate a complete end-to-end booking lifecycle across all three primary user roles:
1. **Client** - Books a service and makes payment
2. **Staff** - Receives appointment and completes check-in
3. **Business Admin** - Views revenue update and confirms completion

## Prerequisites
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:5174`
- Test database seeded with sample data
- All services operational (payments, notifications, AI)

---

## Smoke Test Workflow

### Phase 1: Client Booking & Payment (5 minutes)

**Step 1.1: Client Login**
```
URL: http://localhost:5174/app/client
Role: client
Expected: Client dashboard loads with "Upcoming Bookings" section
```

**Step 1.2: Browse Services**
```
Action: Click "Browse Services" in sidebar
Expected: Service catalog displays with filters
Select: "Wellness Massage" - $150, 60 minutes
```

**Step 1.3: Create Booking**
```
Action: Click "Book Now" on Wellness Massage
Form Fields:
  - Date: Tomorrow (auto-filled)
  - Time: 2:00 PM
  - Duration: 60 minutes
  - Notes: "First time client, prefer gentle massage"
Action: Click "Confirm Booking"
Expected: Booking created with status "pending"
```

**Step 1.4: Make Payment**
```
Action: Click "Pay Now" button
Payment Form:
  - Amount: $150.00 (auto-filled)
  - Card: 4242 4242 4242 4242 (test card)
  - Expiry: 12/25
  - CVC: 123
Action: Click "Complete Payment"
Expected: Payment succeeds, booking status changes to "confirmed"
Toast: "Payment successful - Booking confirmed"
```

**Step 1.5: Verify Booking Confirmation**
```
Action: Navigate to "My Bookings"
Expected: 
  - Booking appears in list with status "confirmed"
  - Confirmation email sent (check inbox)
  - Appointment shows in calendar
```

---

### Phase 2: Staff Appointment Management (5 minutes)

**Step 2.1: Staff Login**
```
URL: http://localhost:5174/app/staff
Role: staff
Expected: Staff dashboard loads with "Today's Jobs" section
```

**Step 2.2: View Schedule**
```
Action: Click "My Schedule" in sidebar
Expected: 
  - Tomorrow's appointment visible
  - Shows: "John Doe - Wellness Massage - 2:00 PM"
  - Status: "confirmed"
```

**Step 2.3: Check-In**
```
Action: Click appointment card
Action: Click "Check In" button
Expected:
  - Status changes to "in_progress"
  - Check-in time recorded
  - Timer starts for 60-minute session
```

**Step 2.4: Add Service Notes**
```
Action: Click "Add Notes" button
Notes: "Client was relaxed and satisfied. Recommended follow-up massage in 2 weeks."
Action: Click "Save Notes"
Expected: Notes saved and visible in appointment details
```

**Step 2.5: Complete Service**
```
Action: Click "Complete Service" button
Expected:
  - Status changes to "completed"
  - Completion time recorded
  - Notification sent to client
```

---

### Phase 3: Business Admin Revenue Verification (5 minutes)

**Step 3.1: Business Admin Login**
```
URL: http://localhost:5174/app/business-admin
Role: business_admin
Expected: Business admin dashboard loads
```

**Step 3.2: View Revenue Widget**
```
Expected: Revenue widget shows:
  - Today's Revenue: $150.00 (updated from payment)
  - Completed Bookings: 1
  - Pending Payments: $0
```

**Step 3.3: View AI Insights**
```
Action: Scroll to "AI Insights" section
Expected: AI card displays:
  - "Peak demand expected tomorrow 2-4pm"
  - Confidence: 92%
  - Recommendations: "Schedule additional staff"
```

**Step 3.4: View Booking Details**
```
Action: Navigate to "Bookings" → "Completed"
Expected:
  - Booking appears in completed list
  - Shows: "John Doe - Wellness Massage - $150 - Completed"
  - Staff notes visible
```

**Step 3.5: Generate Invoice**
```
Action: Click booking → "Download Invoice"
Expected:
  - PDF generated with:
    - Client name and contact
    - Service details
    - Amount: $150.00
    - Payment status: Completed
    - Staff notes
```

---

## Video Recording Instructions

### Setup
1. Open screen recording software (OBS, Camtasia, or browser DevTools)
2. Set resolution: 1280x720 (720p)
3. Set frame rate: 30fps
4. Mute system notifications

### Recording Checklist
- [ ] Start recording
- [ ] Complete Phase 1 (Client booking & payment) - ~5 min
- [ ] Complete Phase 2 (Staff check-in & completion) - ~5 min
- [ ] Complete Phase 3 (Admin verification) - ~5 min
- [ ] Stop recording
- [ ] Save as `smoke-run-v1.2.mp4`

### Video Narration (Optional)
```
"KÓRA v1.2 Smoke Test - Complete Booking Lifecycle

Phase 1: Client books a Wellness Massage service and completes payment.
Phase 2: Staff member receives the appointment, checks in, and completes the service.
Phase 3: Business admin verifies revenue update and views AI insights.

Total workflow time: ~15 minutes
All systems operational and data synchronized across roles."
```

---

## Expected Outcomes

### Client Dashboard
- ✅ Booking appears in "Upcoming Bookings"
- ✅ Payment processed successfully
- ✅ Confirmation email received
- ✅ Booking status: "confirmed"

### Staff Dashboard
- ✅ Appointment visible in "My Schedule"
- ✅ Check-in recorded
- ✅ Service notes saved
- ✅ Booking status: "completed"

### Business Admin Dashboard
- ✅ Revenue widget updated (+$150)
- ✅ Booking appears in completed list
- ✅ AI insights displayed
- ✅ Invoice generated successfully

### System Integration
- ✅ Real-time data sync across roles
- ✅ Notifications sent to all parties
- ✅ Payment processed and recorded
- ✅ AI predictions accurate
- ✅ No errors in console

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Payment fails | Verify Stripe test mode enabled, use test card 4242 4242 4242 4242 |
| Appointment not visible to staff | Refresh page, verify staff member assigned to booking |
| Revenue not updating | Check payment webhook, verify database sync |
| AI insights not showing | Verify `/api/ai/forecast` endpoint responding, check cache |
| Email not received | Check email service configuration, verify SMTP settings |

---

## Sign-Off Checklist

- [ ] All three phases completed successfully
- [ ] Video recorded and saved as `docs/smoke-run-v1.2.mp4`
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] All data synchronized correctly
- [ ] Video uploaded to release notes
- [ ] Timestamp: _______________
- [ ] Verified by: _______________