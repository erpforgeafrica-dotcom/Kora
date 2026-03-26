describe("Runtime stability", () => {
  it("loads login without the global runtime error card", () => {
    cy.visit("/login?audit=runtime-stability");
    cy.contains("Something went wrong").should("not.exist");
    cy.contains("Sign in").should("be.visible");
  });
});
