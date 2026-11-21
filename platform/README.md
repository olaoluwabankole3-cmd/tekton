# TEKTON — authenticated workspace (engineering preview)

**NOT the public demo.** The existing landing page, /demo/, and /pilot/ continue to work unchanged.

This is a separate authenticated application using the dedicated **TEKTON** Supabase project in ApexSync's organization. The project and its initial migrations have been created, including a follow-up hardening migration that moves privileged code into a private schema. The public URL and publishable key are configured on this development branch. This is not yet a released production service: multi-account authorization testing and a protected staging deployment are still required.

## Setup checklist

1. ✅ Dedicated TEKTON Supabase project created: `fryyptustahhuuoorfet` in ApexSync's organization. **Do not use Converge, ALIENTO, or any other project's database.**
2. ✅ The foundation and `20261121190000_tekton_private_rpc_wrappers_and_indexes.sql` migrations have been applied to TEKTON only.
3. Run the Supabase security and performance advisors; fix findings. Run the authorization test plan in `../supabase/tests/README.md`.
4. Enable verified email + password auth; configure allowed redirect URLs for the dedicated staging origin `/platform/`, verify SMTP and rate limits. Review signup abuse controls.
5. ✅ `config.js` now includes the dedicated TEKTON **public URL** and **publishable key**. These are browser-visible values; **never add service_role or secret keys**.
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
