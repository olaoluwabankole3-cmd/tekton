# TEKTON — authenticated workspace (engineering preview)

**NOT the public demo.** The existing landing page, /demo/, and /pilot/ continue to work unchanged.

This is a separate authenticated application using a dedicated Supabase project. It will remain disabled until its own database has been provisioned, migrated, verified, and configured. The page refuses to create a client without a public Supabase URL and publishable key.

## Setup checklist

1. Create a dedicated Supabase project for TEKTON. **Do not use Converge, ALIENTO, or any other project's database.**
2. Review and apply `../supabase/migrations/20261121000000_tekton_tenant_foundation.sql` to the dedicated project only.
3. Run the Supabase security and performance advisors; fix findings. Run the authorization test plan in `../supabase/tests/README.md`.
4. Enable verified email + password auth; configure allowed redirect URLs for the dedicated staging origin `/platform/`, verify SMTP and rate limits. Review signup abuse controls.
5. Replace the blank public values in `config.js` with the new project's **public URL** and **publishable key**. These are client-side values. **Never add service_role or secret keys to this code.**
6. Deploy a separate protected staging hostname first. Do not merge or expose live tenants before authorization tests.
7. Create a test confirmed user, sign in, create a workspace, add projects, link real auth users by their UUID using the restricted RPC, and test each approval role.
8. Confirm private storage uploads, client-visible published files, no cross-tenant access, and audit event integrity.

## Active flows

- Supabase Auth: email sign-up, verified sign-in, password recovery and sign-out.
- Create organization (verified account), view only member organizations.
- Create and view real project records with DB-enforced tenant RLS.
- Raise material requests and variations using server RPC; approve in sequence as independent checkers.
- Apply an approved variation exactly once.
- Upload project files into a **private** bucket and publish explicitly for assigned clients.
- Read project-scoped documents and immutable audit history.

## Important limitations

The application is engineering-stage until a dedicated database exists and security checks pass. The existing demo is fictional and browser-local; its records are **not** auto-migrated here.

Only already-confirmed accounts can be added by UUID using the `tekton_add_existing_member` RPC. A secure email-invitation lifecycle is not complete. Public registration throttling, monitoring, migration/rollback testing, legal/privacy controls, billing, staging CI, scanning of uploaded files, retention schedules, and backup restoration drills remain on the production checklist.

The auth UI and navigation are not a security boundary. The database RLS and trusted RPC checks must be tested independently.
