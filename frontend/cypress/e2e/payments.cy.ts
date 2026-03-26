describe('Payments Workflow - Complete Lifecycle', () => {
  beforeEach(() => {
    cy.visit('/app/business-admin/payments');
    cy.window().then((win) => {
      win.localStorage.setItem('auth_role', 'business_admin');
    });
  });

  it('should complete full payment workflow: create → confirm → invoice', () => {
    // STEP 1: CREATE PAYMENT INTENT
    cy.get('[data-testid="create-payment-btn"]').click();
    cy.get('[data-testid="client-select"]').select('John Doe');
    cy.get('[data-testid="amount-input"]').type('150.00');
    cy.get('[data-testid="payment-method-select"]').select('card');
    cy.get('[data-testid="description-input"]').type('Wellness Massage Session');
    cy.get('[data-testid="submit-payment-btn"]').click();

    // Verify payment intent created
    cy.contains('Payment Intent Created').should('be.visible');
    cy.get('[data-testid="payment-id"]').should('contain', 'pi_');

    // STEP 2: CONFIRM PAYMENT
    cy.get('[data-testid="confirm-payment-btn"]').click();
    
    // Mock Stripe confirmation
    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 200,
      body: {
        id: 'pi_test123',
        status: 'succeeded',
        amount: 15000,
        currency: 'usd',
        client_id: '1',
        created_at: new Date().toISOString()
      }
    }).as('confirmPayment');

    cy.wait('@confirmPayment');
    cy.contains('Payment Confirmed').should('be.visible');
    cy.get('[data-testid="payment-status"]').should('contain', 'succeeded');

    // STEP 3: VERIFY INVOICE APPEARS
    cy.visit('/app/business-admin/finance/invoices');
    cy.contains('John Doe').should('be.visible');
    cy.contains('$150.00').should('be.visible');
    cy.contains('Wellness Massage Session').should('be.visible');

    // STEP 4: VERIFY REVENUE WIDGET UPDATED
    cy.visit('/app/business-admin');
    cy.get('[data-testid="revenue-widget"]').should('be.visible');
    cy.get('[data-testid="total-revenue"]').should('contain', '$150.00');
  });

  it('should handle payment failure gracefully', () => {
    cy.get('[data-testid="create-payment-btn"]').click();
    cy.get('[data-testid="client-select"]').select('John Doe');
    cy.get('[data-testid="amount-input"]').type('150.00');
    cy.get('[data-testid="submit-payment-btn"]').click();

    // Mock payment failure
    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 402,
      body: {
        error: 'card_declined',
        message: 'Your card was declined'
      }
    }).as('failedPayment');

    cy.get('[data-testid="confirm-payment-btn"]').click();
    cy.wait('@failedPayment');

    cy.get('[data-testid="error-toast"]').should('contain', 'card was declined');
    cy.get('[data-testid="payment-status"]').should('contain', 'failed');
  });

  it('should validate required payment fields', () => {
    cy.get('[data-testid="create-payment-btn"]').click();
    cy.get('[data-testid="submit-payment-btn"]').click();

    cy.contains('Client is required').should('be.visible');
    cy.contains('Amount is required').should('be.visible');
    cy.contains('Payment method is required').should('be.visible');
  });

  it('should display payment history with filters', () => {
    // Filter by status
    cy.get('[data-testid="status-filter"]').select('succeeded');
    cy.get('[data-testid="payment-row"]').each(($row) => {
      cy.wrap($row).should('contain', 'succeeded');
    });

    // Filter by date range
    cy.get('[data-testid="date-from"]').type('2024-01-01');
    cy.get('[data-testid="date-to"]').type('2024-12-31');
    cy.get('[data-testid="apply-filter-btn"]').click();

    cy.get('[data-testid="payment-row"]').should('have.length.greaterThan', 0);
  });

  it('should allow refund of completed payment', () => {
    cy.get('[data-testid="payment-row"]').first().within(() => {
      cy.get('[data-testid="refund-btn"]').click();
    });

    cy.get('[data-testid="refund-reason-select"]').select('customer_request');
    cy.get('[data-testid="confirm-refund-btn"]').click();

    cy.intercept('POST', '/api/payments/*/refund', {
      statusCode: 200,
      body: { status: 'refunded', refund_id: 're_test123' }
    }).as('refundPayment');

    cy.wait('@refundPayment');
    cy.contains('Refund Processed').should('be.visible');
  });

  it('should generate invoice PDF', () => {
    cy.get('[data-testid="payment-row"]').first().within(() => {
      cy.get('[data-testid="download-invoice-btn"]').click();
    });

    // Verify download was triggered
    cy.readFile('cypress/downloads/invoice-*.pdf').should('exist');
  });
});