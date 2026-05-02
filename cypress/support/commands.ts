/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Sign in via the /auth page using email + password. */
      loginAs(email: string, password: string): Chainable<void>;
      /** Log out the current user (clears Supabase session). */
      logout(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("loginAs", (email: string, password: string) => {
  cy.session([email], () => {
    cy.visit("/auth");
    cy.get('input[type="email"]').first().clear().type(email);
    cy.get('input[type="password"]').first().clear().type(password, { log: false });
    cy.contains("button", /sign in|log in/i).click();
    cy.url({ timeout: 20000 }).should("not.include", "/auth");
  });
});

Cypress.Commands.add("logout", () => {
  cy.window().then((win) => {
    Object.keys(win.localStorage)
      .filter((k) => k.includes("supabase") || k.includes("sb-"))
      .forEach((k) => win.localStorage.removeItem(k));
  });
});

export {};
