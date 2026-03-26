# Phase 1 Testing Guide

## Quick Start

### 1. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Test URLs

#### Clients Module
- **List:** http://localhost:5174/app/business-admin/clients
- **Create:** Click "+ New Client" button
- **Edit:** Click "Edit" on any row
- **Delete:** Click "Delete" on any row

#### Bookings Module
- **List:** http://localhost:5174/app/business-admin/bookings
- **Create:** Click "+ New Booking" button
- **Edit:** Click "Edit" on any row
- **Delete:** Click "Delete" on any row

#### Services Module
- **List:** http://localhost:5174/app/business-admin/services
- **Create:** Click "+ New Service" button
- **Edit:** Click "Edit" on any row
- **Delete:** Click "Delete" on any row

#### Staff Module
- **List:** http://localhost:5174/app/business-admin/staff
- **Create:** Click "+ New StaffMember" button
- **Edit:** Click "Edit" on any row
- **Delete:** Click "Delete" on any row

#### Payments Module (Read-Only)
- **List:** http://localhost:5174/app/business-admin/payments

---

## Expected Behavior

### Empty State
If no data exists, you should see:
```
No [Entity] yet
[+ New Entity button]
```

### Loading State
While fetching data:
```
[Skeleton rows with pulsing animation]
```

### Error State
If API fails:
```
[Amber border box with error message]
```

### Success State
Data loads and displays in table with:
- Sortable columns
- Action buttons (View, Edit, Delete)
- Row click navigation

---

## API Endpoints (Backend)

All endpoints require `X-Org-Id` header:

```bash
# List
GET /api/clients
GET /api/bookings
GET /api/services
GET /api/staff
GET /api/payments/transactions

# Create
POST /api/clients
POST /api/bookings
POST /api/services
POST /api/staff

# Update
PATCH /api/clients/:id
PATCH /api/bookings/:id
PATCH /api/services/:id
PATCH /api/staff/:id
PATCH /api/payments/transactions/:id

# Delete
DELETE /api/clients/:id
DELETE /api/bookings/:id
DELETE /api/services/:id
DELETE /api/staff/:id
```

---

## Sample Test Data

### Create Client
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

### Create Service
```json
{
  "name": "Massage Therapy",
  "description": "60-minute relaxation massage",
  "duration_minutes": 60,
  "price_cents": 8000,
  "category_id": null
}
```

### Create Staff
```json
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "role": "therapist"
}
```

### Create Booking
```json
{
  "client_id": "[client-uuid]",
  "service_id": "[service-uuid]",
  "staff_member_id": "[staff-uuid]",
  "start_time": "2024-01-15T10:00:00Z",
  "notes": "First appointment"
}
```

---

## Troubleshooting

### "Network error" or "Failed to load data"
1. Check backend is running: `curl http://localhost:3000/health`
2. Check browser console for CORS errors
3. Verify `X-Org-Id` header is being sent

### "No data showing" but API returns data
1. Open browser DevTools → Network tab
2. Check API response structure
3. Verify useCrud hook is extracting correct property name

### "Create form doesn't work"
1. Check browser console for validation errors
2. Verify all required fields are filled
3. Check backend logs for error messages

### "Delete doesn't work"
1. Confirm the delete dialog appears
2. Check if backend returns 404 (item not found)
3. Verify optimistic update removes item from UI

---

## Success Criteria

- [ ] All 5 modules load without errors
- [ ] Empty states show when no data exists
- [ ] Create forms submit successfully
- [ ] Edit forms load and save data
- [ ] Delete operations work with confirmation
- [ ] Loading skeletons appear during fetch
- [ ] Error messages display on API failure
- [ ] Navigation works between list/create/edit pages

---

## Next Steps

Once Phase 1 is verified:
1. **Phase 2:** Fix navigation paths and add role guards
2. **Phase 3:** Populate dropdown selects with real data
3. **Phase 4:** Add toast notifications
4. **Phase 5:** Add form validation
5. **Phase 6:** Add search/filter functionality
