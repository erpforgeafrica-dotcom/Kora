describe('RBAC UI Action Validation', () => {
  const roleTests = [
    {
      role: 'client',
      allowedActions: ['view-bookings', 'create-booking', 'view-profile'],
      forbiddenActions: ['delete-client', 'edit-staff', 'view-admin-panel']
    },
    {
      role: 'staff',
      allowedActions: ['view-schedule', 'checkin', 'add-notes'],
      forbiddenActions: ['delete-booking', 'edit-service-price', 'view-revenue']
    },
    {
      role: 'business_admin',
      allowedActions: ['view-revenue', 'edit-service', 'manage-staff'],
      forbiddenActions: ['view-platform-settings', 'manage-tenants']
    },
    {
      role: 'operations',
      allowedActions: ['view-dispatch', 'manage-jobs', 'view-alerts'],
      forbiddenActions: ['edit-pricing', 'delete-tenant']
    },
    {
      role: 'kora_admin',
      allowedActions: ['manage-tenants', 'view-platform-health', 'feature-flags'],
      forbiddenActions: [] // Admin has all permissions
    }
  ];

  roleTests.forEach(({ role, allowedActions, forbiddenActions }) => {
    describe(`Role: ${role}`, () => {
      beforeEach(() => {
        cy.window().then((win) => {
          win.localStorage.setItem('auth_role', role);
        });
        cy.visit(`/app/${role.replace('_', '-')}`);
      });

      allowedActions.forEach(action => {
        it(`should allow action: ${action}`, () => {
          cy.get(`[data-testid="${action}-btn"]`).should('be.visible').and('not.be.disabled');
          cy.get(`[data-testid="${action}-btn"]`).click();
          cy.get('[data-testid="error-toast"]').should('not.exist');
        });
      });

      forbiddenActions.forEach(action => {
        it(`should block action: ${action}`, () => {
          // Button should either not exist or be disabled
          cy.get(`[data-testid="${action}-btn"]`).should('not.exist');
          
          // If trying to access via URL, should redirect or show error
          const forbiddenPaths = {
            'delete-client': '/app/business-admin/clients/delete',
            'edit-staff': '/app/business-admin/staff/edit',
            'view-admin-panel': '/app/kora-admin',
            'delete-booking': '/app/business-admin/bookings/delete',
            'edit-service-price': '/app/business-admin/services/pricing',
            'view-revenue': '/app/business-admin/payments',
            'view-platform-settings': '/app/kora-admin/settings',
            'manage-tenants': '/app/kora-admin/tenants',
            'edit-pricing': '/app/business-admin/services/pricing',
            'delete-tenant': '/app/kora-admin/tenants/delete'
          };

          if (forbiddenPaths[action]) {
            cy.visit(forbiddenPaths[action], { failOnStatusCode: false });
            cy.contains(/access denied|forbidden|unauthorized/i).should('be.visible');
          }
        });
      });
    });
  });

  it('should show error toast when attempting forbidden API call', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('auth_role', 'staff');
    });
    cy.visit('/app/staff');

    // Intercept forbidden API call
    cy.intercept('DELETE', '/api/clients/*', {
      statusCode: 403,
      body: { error: 'Forbidden: Insufficient permissions' }
    }).as('forbiddenDelete');

    // Attempt forbidden action via API
    cy.window().then((win) => {
      win.fetch('/api/clients/123', { method: 'DELETE' });
    });

    cy.wait('@forbiddenDelete');
    cy.get('[data-testid="error-toast"]').should('contain', 'Forbidden');
  });
});