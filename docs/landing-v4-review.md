# TEKTON Landing Page — Experience V4 Design Review

## Purpose
Make the product understandable and visually distinctive in the first screen and first scroll, without changing the approved TEKTON logo, brand palette, demo behavior or backend environments.

## Changes
1. Hero retains the approved headline and architectural monochrome tone, but uses clearer construction-workflow language.
2. Four-stage keyboard-friendly site → Project Manager → Quantity Surveyor → Procurement/Finance approval preview replaces the static status card. This is labelled illustrative/fictional, not live backend activity.
3. The actual interactive TEKTON dashboard is shown in the first major section below the hero, rather than being buried several sections below.
4. Desktop and mobile screenshots are presented together; the actual interactive browser demo remains one click away.
5. A concise “start on site → follow decisions → see impact” guided-demo path follows the product showcase.
6. Section hierarchy, responsive spacing, type hierarchy, status disclosures, and subtle construction-grid motion are refined.
7. Keyboard arrow navigation is added to the eight product module tabs; Escape and outside clicks close the mobile navigation.
8. Motion respects `prefers-reduced-motion`; no new JS framework, animation library or image assets are required.

## Tested
- The separate staging deployment returned HTTP 200 for the landing page, supplemental CSS/JS, existing website assets, demo and pilot.
- No duplicate HTML IDs and all in-page anchor targets match.
- Four hero stage buttons and state transitions passed interactive simulation, including bounds and previous/next controls.
- Keyboard tab focus behavior is initialized correctly.
- Mobile media-query breakpoints present for 940, 700 and 420 pixels.
- The live `https://tekton-sooty.vercel.app/` address still serves the previous production design.

## Human review still required
- Inspect in Chrome/Safari/Firefox at 360px, 390px, 768px, 1024px and 1440px, including true mobile Safari keyboard/layout.
- Review image composition, device screenshot framing, long-page rhythm, and whether the editorial hero feels authentic to TEKTON.
- Confirm the product demonstration screenshots still reflect the current demo screens.
- Confirm that the preview is preferred before merging to main and deploying to the live TEKTON domain.

## Preview
https://tekton-hcg67sinn-olaoluwas-projects-5880a129.vercel.app/

This design change does not touch `platform/`, Supabase, staging authentication or any TEKTON customer records.
