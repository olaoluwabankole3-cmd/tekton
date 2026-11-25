# YHWH & Partners — dedicated TEKTON presentation environment

## Scope and isolation
- Prospect: **YHWH & Partners West Africa Limited** (public website: https://www.yhwhandpartners.com/).
- Live showcase: https://tekton-yhwh-presentation.vercel.app/demo/
- Dedicated Vercel project: `tekton-yhwh-presentation` (ID `prj_6paJYGD3Nr36NFaKCZtabeNxQbRY`).
- Dedicated GitHub source branch: `showcase/yhwh-and-partners` in `olaoluwabankole3-cmd/tekton`.
- Existing TEKTON `main` and `https://tekton-sooty.vercel.app/demo/` remain untouched.
- The new Vercel project was deployed from an independent source-file snapshot, not connected to Git auto-deploy. Future branch commits require a new deployment to this separate project.

## Presentation behavior
1. The page initially renders the **standard TEKTON** demo.
2. Select **YHWH Preview** in the top bar.
3. The full-screen transition introduces the **YHWH & Partners** company workspace.
4. Illustrative projects switch to power infrastructure, building construction, and road/drainage works. The dashboard retains procurement, Inventory & Stores, document controls, reports, site visits, role switching and other modules.
5. Currency figures shown in the YHWH presentation mode use **NGN**.
6. Choose **Return to TEKTON** to restore the original company/role/page. A page refresh starts in the standard TEKTON mode.

## Branding points for official company assets
- `demo/yhwh-presentation.js`: `yhwhAfterRender()` adds the temporary wordmark to the sidebar; `yhwhTransition()` contains the temporary transition monogram.
- `demo/yhwh-presentation.css`: scoped `.yhwh-mode` color tokens, sidebar/theme rules, transition treatment and responsive styling.
- Official site artwork used **without redrawing**:
  - Header wordmark: `https://www.yhwhandpartners.com/wp-content/themes/yhwh/img/logo@2x.png` → `demo/assets/yhwh-logo-official.png`.
  - Website icon: `https://www.yhwhandpartners.com/wp-content/uploads/2025/11/cropped-YHWH-Logo-270x270.png` → `demo/assets/yhwh-mark-official.png`.
- Extracted dominant colors directly from the official wordmark: **red `#FF0009`**, forest green **`#324E34`**, black **`#000000`**, and white **`#FFFFFF`**.
- User-requested presentation treatment: **red and white lead** the interface; the official forest green provides a secondary contrast color. These are sampled brand-mark colors, not a formal brand-style-guide specification.
- Source assets may be used here only as part of this prospective client's private presentation; do not imply endorsement or upload confidential company information.

## Data and security boundaries
- All project names, project values, document records, attendance-like site visits, suppliers, prices, stock quantities, procurement actions, and employee labels are **fictional samples**.
- There is no real YHWH customer data and no claim that YHWH has authorized or commissioned this software.
- Role switching and access controls are browser-local simulations and do **not** provide production authentication or server-enforced authorization.
- Do not enter real personnel, financial, legal or other sensitive information into the demo.

## Suggested meeting walkthrough
- Start in general TEKTON, introduce the idea of a single operating environment.
- Click **YHWH Preview** and show the branded executive overview.
- Open **Inventory & Stores** and show stock by location, replenishment alerts, transfers and issue records.
- Open **Procurement** and trace a sample material request from site review to PO, goods receipt and invoice matching.
- Switch to a **Site Storekeeper** or **Finance Officer** role to demonstrate restricted navigation and responsibilities.
- Open **Document Control** and contrast internal/restricted sample documents with the Client Representative view.
- Ask for their actual organizational chart, project/site count, inventory locations, current biometric devices and official brand assets before making a production scope commitment.
