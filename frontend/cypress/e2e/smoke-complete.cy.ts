describe('KÓRA v1.2 Smoke Test - Complete Booking Lifecycle', () => {
  
  // PHASE 1: CLIENT BOOKING & PAYMENT
  describe('Phase 1: Client Booking & Payment', () => {
    beforeEach(() => {
      cy.visit('http://localhost:5174/app/client');
      cy.window().then((win) => {
        win.localStorage.setItem('auth_role', 'client');
      });
      cy.reload();
    });

    it('should complete client booking and payment workflow', () => {
      // Browse services
      cy.get('[data-testid="browse-services-link"]').click();
      cy.contains('Wellness Massage').should('be.visible');
      
      // Create booking
      cy.get('[data-testid="book-now-btn"]').first().click();
      cy.get('[data-testid="date-input"]').type(getTomorrowDate());
      cy.get('[data-testid="time-input"]').type('14:00');
      cy.get('[data-testid="duration-select"]').select('60');
      cy.get('[data-testid="notes-input"]').type('First time client, prefer gentle massage');
      cy.get('[data-testid="confirm-booking-btn"]').click();
      
      // Verify booking created
      cy.contains('Booking confirmed').should('be.visible');
      cy.get('[data-testid="booking-status"]').should('contain', 'pending');
      
      // Make payment
      cy.get('[data-testid="pay-now-btn"]').click();
      cy.get('[data-testid="card-number"]').type('4242424242424242');
      cy.get('[data-testid="card-expiry"]').type('12/25');
      cy.get('[data-testid="card-cvc"]').type('123');
      cy.get('[data-testid="complete-payment-btn"]').click();
      
      // Verify payment success
      cy.contains('Payment successful').should('be.visible');
      cy.get('[data-testid="booking-status"]').should('contain', 'confirmed');
    });
  });
  
  // PHASE 2: STAFF APPOINTMENT MANAGEMENT
  describe('Phase 2: Staff Appointment Management', () => {
    beforeEach(() => {
      cy.visit('http://localhost:5174/app/staff');
      cy.window().then((win) => {
        win.localStorage.setItem('auth_role', 'staff');
      });
      cy.reload();
    });

    it('should complete staff appointment workflow', () => {
      // View schedule
      cy.get('[data-testid="my-schedule-link"]').click();
      cy.contains('Wellness Massage').should('be.visible');
      
      // Check in
      cy.get('[data-testid="appointment-card"]').first().click();
      cy.get('[data-testid="check-in-btn"]').click();
      cy.contains('Checked in').should('be.visible');
      
      // Add notes
      cy.get('[data-testid="add-notes-btn"]').click();
      cy.get('[data-testid="notes-textarea"]').type('Client was relaxed and satisfied. Recommended follow-up in 2 weeks.');
      cy.get('[data-testid="save-notes-btn"]').click();
      
      // Complete service
      cy.get('[data-testid="complete-service-btn"]').click();
      cy.get('[data-testid="appointment-status"]').should('contain', 'completed');
    });
  });
  
  // PHASE 3: BUSINESS ADMIN VERIFICATION
  describe('Phase 3: Business Admin Revenue Verification', () => {
    beforeEach(() => {
      cy.visit('http://localhost:5174/app/business-admin');
      cy.window().then((win) => {
        win.localStorage.setItem('auth_role', 'business_admin');
      });
      cy.reload();
    });

    it('should verify revenue update and booking completion', () => {
      // Verify revenue widget
      cy.get('[data-testid="revenue-widget"]').should('be.visible');
      cy.get('[data-testid="total-revenue"]').should('contain', '$150.00');
      
      // View AI insights
      cy.get('[data-testid="ai-insights-card"]').should('be.visible');
      cy.contains('Peak demand').should('be.visible');
      
      // View completed booking
      cy.get('[data-testid="bookings-link"]').click();
      cy.get('[data-testid="status-filter"]').select('completed');
      cy.contains('John Doe').should('be.visible');
      cy.contains('Wellness Massage').should('be.visible');
      
      // Download invoice
      cy.get('[data-testid="download-invoice-btn"]').first().click();
      cy.readFile('cypress/downloads/invoice-*.pdf').should('exist');
    });
  });
  
  // HELPER FUNCTIONS
  function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
});