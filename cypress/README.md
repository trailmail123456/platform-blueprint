# Cypress E2E

End-to-end coverage for the Innovation Hub ↔ Dashboard real-time loop.

## Run

```
# 1. Install Cypress (one-time)
npm i -D cypress

# 2. Start the dev server in one terminal
npm run dev

# 3. In another terminal, set credentials for two existing test users
export CYPRESS_USER_A_EMAIL="[email protected]"
export CYPRESS_USER_A_PASSWORD="..."
export CYPRESS_USER_B_EMAIL="[email protected]"
export CYPRESS_USER_B_PASSWORD="..."

# 4. Run
npx cypress run --spec "cypress/e2e/innovation-dashboard.cy.ts"
# or interactive
npx cypress open
```

## Scenario covered

1. User A posts an idea
2. User B comments and requests to join
3. User A accepts → dashboard counters and Collaborations panel update
   **without any manual refresh** (verified via realtime + sync indicator).

The `[data-testid="sync-status"]` element must report `live` or `polling`
throughout — never `error`.
