# KÓRA AI System Build Prompt

Canonical UI generation brief for KÓRA platform views, dashboards, and module structure.

## Objective

Generate all platform views, pages, and dashboard modules using the KÓRA platform architecture.

The system should follow enterprise SaaS design standards similar to Salesforce, ServiceTitan, and Fresha, adapted for KÓRA.

## General Rules

- Use modular React architecture
- Generate pages from the navigation schema
- Each dashboard has its own sidebar menu
- Enforce role-based access control
- Connect all modules to backend API structure
- Scaffold loading, empty, and error states
- Prefer reusable components
- Each module should include:
  - list view
  - create view
  - detail view
  - edit view
  - analytics view where applicable

## Design Theme

- Dark navy / charcoal background
- Teal accent `#00e5c8`
- Amber accent `#f59e0b`
- Purple accent `#a78bfa`
- Clean modern SaaS typography
- Premium enterprise whitespace and layout

## Role Dashboards

### Client Dashboard
- Route: `/app/client`
- Menu:
  - Dashboard
    - Overview
    - Upcoming Bookings
    - Alerts & Reminders
  - Bookings
    - Book Service
    - My Bookings
    - Reschedule
    - Cancel Booking
    - Emergency Request
    - Telehealth Appointment
  - Services
    - Browse Services
    - Clinics
    - Home Services
    - Laundry
    - Wellness
    - Emergency
  - Providers
    - Favorite Providers
    - Nearby Providers Map
    - Recently Visited Providers
  - Loyalty & Rewards
    - Loyalty Points
    - Membership Level
    - Referral Rewards
    - Promotions
  - Payments
    - Wallet
    - Payment Methods
    - Billing History
    - Invoices
    - Subscriptions
  - Documents
    - Upload Documents
    - Medical Records
    - Insurance Files
  - Messages
    - Provider Chat
    - Support Chat
    - Notifications
  - Community
    - Reviews
    - Ratings
    - Recommendations
  - Settings
    - Profile Settings
    - Security
    - Notification Preferences
    - Language

### Business Admin Dashboard
- Route: `/app/business-admin`
- Menu:
  - Dashboard
    - Revenue Overview
    - Booking Summary
    - AI Insights
    - Customer Growth
  - Bookings
    - Booking Calendar
    - Appointment Queue
    - Emergency Requests
    - Telehealth Bookings
  - CRM
    - Customers
    - Leads
    - Opportunities
    - Customer Ranks
    - Loyalty Programs
    - Customer Feedback
  - Services
    - Service Catalog
    - Pricing
    - Service Packages
    - Service Availability
    - Promotions
  - Company
    - Branches
    - Locations
    - Business Profile
    - Operating Hours
  - Staff Management
    - Staff Directory
    - Roles & Permissions
    - Staff Schedules
    - Staff Performance
  - Operations
    - Dispatch Queue
    - Field Assignments
    - GPS Staff Tracking
    - Route Planning
  - Inventory
    - Stock
    - Warehouses
    - Suppliers
    - Purchase Orders
    - Maintenance
    - Asset Tracking
  - Payments
    - Transactions
    - Payment Gateways
    - Refunds
    - Payout Reports
    - Financial Reconciliation
  - Marketing
    - Campaigns
    - Social Media Integration
    - Promotions
    - Email/SMS Campaigns
  - AI Engine
    - Demand Forecasting
    - Booking Predictions
    - Customer Churn Detection
    - Pricing Optimization
    - Fraud Detection
  - Reports & Analytics
    - Revenue Reports
    - Staff Productivity
    - Customer Analytics
    - Service Profitability
  - Documents
    - Business Documents
    - Licenses
    - Contracts
    - Compliance Files
  - Integrations
    - Payment Gateways
    - Maps / GPS
    - Telehealth Systems
    - Social Media
  - Settings
    - Business Settings
    - Subscription Plan
    - Notifications

### Staff Dashboard
- Route: `/app/staff`
- Menu:
  - My Dashboard
    - My Schedule
    - Assigned Tasks
    - Notifications
    - Performance Summary
  - Appointments
    - Today's Bookings
    - Upcoming Bookings
    - Completed Jobs
    - Cancelled Jobs
  - Tasks
    - Assigned Tasks
    - Task Completion
    - Job Notes
  - Field Operations
    - Navigation Map
    - Route Assignments
    - GPS Tracking
    - Emergency Dispatch
  - Customer Info
    - Customer Profile
    - Visit History
    - Notes
  - Telehealth
    - Video Consultations
    - Consultation Records
  - Inventory Usage
    - Supplies Used
    - Request Supplies
  - Messages
    - Team Chat
    - Customer Chat
    - Support
  - Performance
    - Ratings
    - Reviews
    - Productivity Metrics
  - Documents
    - Upload Documents
    - Certifications
    - Work Files
  - Settings
    - Profile
    - Availability
    - Notification Settings

### Operations Command Center
- Route: `/app/operations`
- Menu:
  - Operations Dashboard
    - Live Booking Feed
    - Active Staff
    - System Alerts
    - SLA Monitoring
  - Dispatch
    - Job Assignment
    - Route Optimization
    - Field Team Tracking
    - Emergency Dispatch
  - Bookings Monitor
    - All Bookings
    - Pending Requests
    - Delayed Services
    - Escalations
  - Customers
    - Customer Incidents
    - Complaints
    - Support Tickets
  - Staff Monitoring
    - Staff Location Map
    - Performance Alerts
    - Availability
  - Service Operations
    - Service Capacity
    - Demand Spikes
    - Service Outages
  - Payments Watch
    - Payment Failures
    - Fraud Alerts
    - Refund Queue
  - AI Alerts
    - Demand Surge Prediction
    - Staff Shortage Alerts
    - Operational Anomalies
  - Support Desk
    - Live Chat Support
    - Ticket Management
    - Issue Escalation

### KÓRA Platform Admin Dashboard
- Route: `/app/kora-admin`
- Menu:
  - Platform Overview
    - Tenant Health
    - Global Revenue
    - System Uptime
    - Platform Alerts
  - Tenants
    - Businesses
    - Clinics
    - Service Companies
    - Tenant Onboarding
  - Users
    - All Users
    - Role Management
    - Access Control
  - Marketplace
    - Service Templates
    - Categories
    - Listings
  - Subscriptions & Billing
    - Plans
    - Billing Cycles
    - Revenue Analytics
    - Payment Providers
  - AI Engine
    - Model Monitoring
    - Training Data
    - AI Usage Costs
    - Automation Rules
  - Operations Oversight
    - Global Bookings
    - Incident Management
    - Escalations
  - Integrations
    - Payment Gateways
    - Maps
    - Telehealth
    - Social Media
  - Security
    - Audit Logs
    - Access Monitoring
    - Threat Detection
  - Platform Settings
    - Global Configuration
    - Feature Flags
    - Notifications

## View Generation Rules

For each menu item, generate:
- page layout
- list table
- filters
- search
- pagination
- create/edit forms
- API integration
- analytics widgets

Additionally generate:
- reusable components
- navigation breadcrumbs
- loading skeletons
- empty states
- error states

## Intent

This prompt should drive:
- complete page/view generation
- route and sidebar consistency
- enterprise SaaS UI standards
- scaffolded CRUD and analytics surfaces
