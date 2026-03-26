import { DynamicCRUDPage } from "../dynamic/DynamicCRUDPage";

// Loyalty System
export function DynamicLoyaltyProgramsPage() {
  return <DynamicCRUDPage entity="loyalty_programs" />;
}

export function DynamicLoyaltyTransactionsPage() {
  return <DynamicCRUDPage entity="loyalty_transactions" />;
}

// Inventory Management
export function DynamicInventoryItemsPage() {
  return <DynamicCRUDPage entity="inventory_items" />;
}

// Clinical Records
export function DynamicClinicalRecordsPage() {
  return <DynamicCRUDPage entity="clinical_records" />;
}

// Emergency Contacts
export function DynamicEmergencyContactsPage() {
  return <DynamicCRUDPage entity="emergency_contacts" />;
}

// Finance
export function DynamicInvoicesPage() {
  return <DynamicCRUDPage entity="invoices" />;
}

// Marketing
export function DynamicMarketingCampaignsPage() {
  return <DynamicCRUDPage entity="marketing_campaigns" />;
}