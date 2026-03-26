describe('Bookings CRUD Workflow', () => {
  beforeEach(() => {
    cy.visit('/app/business-admin/bookings');
    cy.window().then((win) => {
      win.localStorage.setItem('auth_role', 'business_admin');
    });
  });

  it('should create, confirm, and cancel booking', () => {
    // CREATE
    cy.get('[data-testid="create-booking-btn"]').click();
    cy.get('[data-testid="client-select"]').select('John Doe');
    cy.get('[data-testid="service-select"]').select('Wellness Massage');
    cy.get('[data-testid="staff-select"]').select('Jane Smith');
    cy.get('[data-testid="start-time-input"]').type('2024-02-15T10:00');
    cy.get('[data-testid="end-time-input"]').type('2024-02-15T11:00');
    cy.get('[data-testid="submit-btn"]').click();
    
    // Verify creation
    cy.contains('John Doe').should('be.visible');
    cy.contains('Wellness Massage').should('be.visible');
    cy.contains('pending').should('be.visible');

    // CONFIRM
    cy.get('[data-testid="booking-row"]').first().within(() => {
      cy.get('[data-testid="confirm-btn"]').click();
    });
    cy.contains('confirmed').should('be.visible');

    // CANCEL
    cy.get('[data-testid="booking-row"]').first().within(() => {
      cy.get('[data-testid="cancel-btn"]').click();
    });
    cy.get('[data-testid="confirm-cancel-btn"]').click();
    cy.contains('cancelled').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.get('[data-testid="create-booking-btn"]').click();
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.contains('Client is required').should('be.visible');
    cy.contains('Service is required').should('be.visible');
    cy.contains('Start time is required').should('be.visible');
  });
});