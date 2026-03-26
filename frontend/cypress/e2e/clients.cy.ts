describe('Clients CRUD Workflow', () => {
  beforeEach(() => {
    cy.visit('/app/business-admin/clients');
    // Mock auth state
    cy.window().then((win) => {
      win.localStorage.setItem('auth_role', 'business_admin');
    });
  });

  it('should complete full CRUD cycle for client', () => {
    // CREATE
    cy.get('[data-testid="create-client-btn"]').click();
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="last-name-input"]').type('Doe');
    cy.get('[data-testid="email-input"]').type('john.doe@example.com');
    cy.get('[data-testid="phone-input"]').type('+1234567890');
    cy.get('[data-testid="submit-btn"]').click();
    
    // Verify creation
    cy.contains('John Doe').should('be.visible');
    cy.contains('john.doe@example.com').should('be.visible');

    // EDIT
    cy.get('[data-testid="client-row"]').first().within(() => {
      cy.get('[data-testid="edit-btn"]').click();
    });
    cy.get('[data-testid="phone-input"]').clear().type('+0987654321');
    cy.get('[data-testid="submit-btn"]').click();
    
    // Verify edit
    cy.contains('+0987654321').should('be.visible');

    // DELETE
    cy.get('[data-testid="client-row"]').first().within(() => {
      cy.get('[data-testid="delete-btn"]').click();
    });
    cy.get('[data-testid="confirm-delete-btn"]').click();
    
    // Verify deletion
    cy.contains('John Doe').should('not.exist');
  });

  it('should show validation errors for required fields', () => {
    cy.get('[data-testid="create-client-btn"]').click();
    cy.get('[data-testid="submit-btn"]').click();
    
    cy.contains('First name is required').should('be.visible');
    cy.contains('Last name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
  });

  it('should filter clients by search term', () => {
    cy.get('[data-testid="search-input"]').type('john');
    cy.get('[data-testid="client-row"]').should('have.length.lessThan', 10);
  });
});