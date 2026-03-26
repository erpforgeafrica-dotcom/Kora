describe('KORA Platform Smoke Test', () => {
  it('should load homepage without errors', () => {
    cy.visit('http://localhost:5174');
    cy.contains('KÓRA');
    cy.get('body').should('be.visible');
  });

  it('should have proper page title', () => {
    cy.visit('http://localhost:5174');
    cy.title().should('contain', 'KORA');
  });
});