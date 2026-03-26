describe('Authentication & Role-Based Access', () => {
  const roles = [
    { role: 'client', allowedPath: '/app/client', blockedPath: '/app/kora-admin' },
    { role: 'business_admin', allowedPath: '/app/business-admin', blockedPath: '/app/kora-admin' },
    { role: 'staff', allowedPath: '/app/staff', blockedPath: '/app/business-admin' },
    { role: 'operations', allowedPath: '/app/operations', blockedPath: '/app/client' },
    { role: 'kora_admin', allowedPath: '/app/kora-admin', blockedPath: '/app/client' }
  ];

  roles.forEach(({ role, allowedPath, blockedPath }) => {
    it(`should allow ${role} access to ${allowedPath} and block ${blockedPath}`, () => {
      cy.window().then((win) => {
        win.localStorage.setItem('auth_role', role);
      });

      // Test allowed access
      cy.visit(allowedPath);
      cy.url().should('include', allowedPath);
      cy.get('[data-testid="dashboard"]').should('be.visible');

      // Test blocked access
      cy.visit(blockedPath);
      cy.url().should('not.include', blockedPath);
      cy.contains('Access Denied').should('be.visible');
    });
  });

  it('should redirect unauthenticated users to login', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('auth_role');
    });

    cy.visit('/app/business-admin');
    cy.url().should('include', '/login');
  });
});