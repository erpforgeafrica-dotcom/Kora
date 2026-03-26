describe('Sidebar Navigation', () => {
  beforeEach(() => {
    cy.visit('/app/business-admin');
    cy.window().then((win) => {
      win.localStorage.setItem('auth_role', 'business_admin');
    });
  });

  it('should expand and collapse accordion sections', () => {
    // Initially, first section should be expanded
    cy.get('[data-testid="nav-section-dashboard"]').should('have.class', 'expanded');
    
    // Click to collapse
    cy.get('[data-testid="nav-section-dashboard"] [data-testid="section-header"]').click();
    cy.get('[data-testid="nav-section-dashboard"]').should('not.have.class', 'expanded');
    
    // Click another section to expand
    cy.get('[data-testid="nav-section-customers"] [data-testid="section-header"]').click();
    cy.get('[data-testid="nav-section-customers"]').should('have.class', 'expanded');
    cy.get('[data-testid="nav-section-dashboard"]').should('not.have.class', 'expanded');
  });

  it('should highlight active navigation link', () => {
    cy.get('[data-testid="nav-link-crm"]').click();
    cy.url().should('include', '/crm');
    cy.get('[data-testid="nav-link-crm"]').should('have.class', 'active');
  });

  it('should navigate to correct pages', () => {
    const navItems = [
      { testId: 'nav-link-overview', path: '/app/business-admin' },
      { testId: 'nav-link-crm', path: '/app/business-admin/crm' },
      { testId: 'nav-link-leads', path: '/app/business-admin/leads' },
      { testId: 'nav-link-reviews', path: '/app/business-admin/reviews' }
    ];

    navItems.forEach(({ testId, path }) => {
      cy.get(`[data-testid="${testId}"]`).click();
      cy.url().should('include', path);
    });
  });

  it('should only show sections allowed for current role', () => {
    // Business admin should see business sections
    cy.get('[data-testid="nav-section-customers"]').should('exist');
    cy.get('[data-testid="nav-section-team"]').should('exist');
    
    // But not platform admin sections
    cy.get('[data-testid="nav-section-platform"]').should('not.exist');
  });
});