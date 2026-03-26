// frontend/cypress/e2e/crud.cy.ts
/// <reference types="cypress" />

// Utility – read a pre-generated JWT for the given role (see fixtures/jwt.json)
function jwtFor(role: "platform_admin" | "staff") {
  return cy.fixture("jwt.json").then((jwt) => jwt[role]);
}

// Helper – log in as a given role and set auth header in localStorage (app must read this token)
function loginAs(role: "platform_admin" | "staff") {
  return jwtFor(role).then((token) => {
    window.localStorage.setItem("authToken", token);
    cy.visit("/"); // reload SPA with token available
  });
}

// Generic CRUD helper (list → create → edit → delete)
function crudFlow({
  role,
  listPath,
  createBtnLabel,
  createFormFields,
  editBtnIndex = 0,
  editFormUpdates,
}: {
  role: "platform_admin";
  listPath: string;
  createBtnLabel: RegExp | string;
  createFormFields: { label: string; value: string }[];
  editBtnIndex?: number;
  editFormUpdates: { label: string; value: string }[];
}) {
  loginAs(role);

  // 1️⃣ List page
  cy.visit(listPath);
  cy.contains(createBtnLabel).should("be.visible");

  // 2️⃣ Create
  cy.contains(createBtnLabel).click();
  createFormFields.forEach(({ label, value }) => {
    cy.get(`input[name="${label}"], textarea[name="${label}"], select[name="${label}"]`)
      .clear()
      .type(value);
  });
  cy.contains(/create/i).click();

  cy.contains(createFormFields[0].value).should("exist");

  // 3️⃣ Edit
  cy.contains(/edit/i).eq(editBtnIndex).click();

  editFormUpdates.forEach(({ label, value }) => {
    cy.get(`input[name="${label}"], textarea[name="${label}"], select[name="${label}"]`)
      .clear()
      .type(value);
  });
  cy.contains(/save|update/i).click();
  cy.contains(editFormUpdates[0].value).should("exist");

  // 4️⃣ Delete
  cy.contains(/delete/i).eq(editBtnIndex).click();
  cy.on("window:confirm", () => true);
  cy.contains(editFormUpdates[0].value).should("not.exist");
}

describe("KÓRA v1.2 – Tenants & Subscriptions CRUD + RBAC", () => {
  it("Tenants CRUD works for platform_admin", () => {
    crudFlow({
      role: "platform_admin",
      listPath: "/app/kora-admin/tenants",
      createBtnLabel: /new tenant/i,
      createFormFields: [
        { label: "name", value: "Acme Corp" },
        { label: "industry", value: "Wellness" },
        { label: "status", value: "active" },
      ],
      editFormUpdates: [
        { label: "name", value: "Acme Corp Updated" },
        { label: "status", value: "suspended" },
      ],
    });
  });

  it("Subscriptions CRUD works for platform_admin", () => {
    crudFlow({
      role: "platform_admin",
      listPath: "/app/kora-admin/subscriptions",
      createBtnLabel: /new subscription/i,
      createFormFields: [
        { label: "organization_id", value: "org-123" },
        { label: "plan_name", value: "Gold" },
        { label: "billing_cycle", value: "monthly" },
        { label: "price_usd", value: "199" },
        { label: "status", value: "active" },
        { label: "start_date", value: "2024-01-01" },
        { label: "end_date", value: "2024-12-31" },
      ],
      editFormUpdates: [
        { label: "plan_name", value: "Platinum" },
        { label: "price_usd", value: "299" },
        { label: "status", value: "active" },
      ],
    });
  });

  it("RBAC – staff cannot access tenant routes", () => {
    loginAs("staff");
    cy.visit("/app/kora-admin/tenants");
    cy.url().should("not.include", "/app/kora-admin/tenants");
    cy.contains(/forbidden|access denied/i).should("exist");
  });
});
