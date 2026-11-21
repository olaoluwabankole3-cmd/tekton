# TEKTON Sprint 2: Demonstration Acceptance Checklist

## Nature of the product
TEKTON is a **fictional-data browser demonstration**, not secure multi-tenant business software. It stores changes in browser local storage. Do not upload or type confidential project data.

## Project workspace
- Open **Projects**, select a sample project and switch between Overview, BOQ & cost codes, Schedule and Variations.
- Verify the original budget and applied changes are shown separately.
- Verify schedule phases and BOQ allowances are illustrative (not real measured quantities).

## Construction variations
- Open **Variations**. Existing change VAR-3102 awaits client consent.
- Switch to **Client Representative**, approve that change, and confirm the approved budget does **not** change immediately.
- Return as **Project Manager** and apply the change; confirm the affected project's approved budget increases once by $85,000.
- To test the complete flow, create another variation using Site Engineer; Project Manager assesses scope; QS assesses cost/time; Executive authorizes; Client approves; Project Manager applies.
- Rejecting a change must not affect approved project budgets or schedule extensions.
- Client view must only show internally authorized changes belonging to the assigned sample project.

## Procurement
- Begin with REQ-1042, which is seeded at Quantity Surveying budget verification.
- Continue through Procurement, select one of three fictional supplier quotes and provide a selection rationale.
- Finance authorizes; Procurement issues the sample order.
- Record an **accepted partial delivery**. Confirm that the order stays in goods receipt.
- Record **disputed materials** and verify they do not increase accepted quantity.
- Accept the outstanding balance. Only then should Finance be able to match the invoice.
- Enter a mismatched invoice amount and ensure closure fails; a matching total should complete the sample workflow.

## Quality gates
- Script parsing and event simulation tests should pass, including roles, cost accounting, states, client scope, and browser persistence.
- Verify public homepage, /demo/, /demo/main.js, /demo/sprint2.js and styles return HTTP 200.
- Verify the approved TEKTON v3 SVG logo and charcoal-grey theme remain intact.
- This is not a test of production-grade backend authorization, payments, construction standards compliance or actual supplier/document integrations.
