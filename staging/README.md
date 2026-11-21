# TEKTON — protected staging deployment

This directory supplies the root page and robots.txt for a **separate Vercel project in ApexSync's Vercel organization**. Application files are deployed from `platform/`; brand assets from `brand/`. This does not redeploy the public TEKTON website.

Vercel project: `tekton-secure-staging` (`prj_VEQ6Ry2IvJTeeisJBSr3bo81VWqR`). Vercel Authentication (SSO protection) is enabled for **all** deployments.

The browser configuration at `platform/config.js` contains only the dedicated TEKTON public Supabase API URL and publishable key. No secret database or service-role credentials should ever be sent to the frontend.

The new backend is a staging engineering system only. A real test-user matrix, permitted redirect URLs, email confirmation, org onboarding, and RLS acceptance are required before any customer use.
