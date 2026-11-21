# TEKTON — Backend and tenant security acceptance plan

This plan covers the new isolated `platform/` application. The public `/demo/` remains fictional and unchanged.

## Status
- **Implemented in GitHub:** versioned PostgreSQL migration, Supabase Auth browser client, project and financial-control separation, membership/project isolation, private storage, approval state machine, audit events, and offline CI checks.
- **Not yet done:** create a **dedicated** Supabase TEKTON project; apply migrations; test with real users and database advisors; provision staging; deploy authentic platform; accept real tenant data.
- Do **not** use Converge, ALIENTO, NECore, or another app's Supabase project.

## Apply to a dedicated database
1. Select the Supabase organization and project region; verify any new-project cost with the account owner before creating it.
2. Create **TEKTON only** project. Record project ref and public URL; never share database password or secret keys in chat or GitHub.
3. Review `supabase/migrations/20261121000000_tekton_tenant_foundation.sql`; apply on a clean dedicated database only. The migration has not been run against a live database.
4. Run the read-only `supabase/tests/ddl_security_checks.sql` in the same dedicated database.
5. Run Supabase Security and Performance Advisors and fix all significant findings before any user data is admitted.
6. Configure email confirmation, protected redirect URLs, SMTP delivery, signup rate limits and suitable retention rules. Create separate verified test accounts for each role.
7. Set the public Supabase URL and **publishable** key in `platform/config.js`; never publish `sb_secret_` or `service_role` credentials. The workspace stays disabled when unconfigured.

## Mandatory authorization scenarios with real accounts
- **A/B tenant isolation:** two independent owners create separate organizations and projects. Cross-tenant SELECTs, inserts, RPC calls, UUID guesses, and storage reads must fail.
- **Client projection:** a client is assigned to one project. The client can read project basics and explicitly published files for that project only. `tekton_project_controls` must return zero rows. Internal financials, unapproved variations, material requests and audit entries must not be visible.
- **Maker–checker:** a request author must be unable to approve any step. A wrong role must be rejected. Approval #2 before #1 must fail, and an approver already used on the workflow must not approve again.
- **Director and client:** a construction variation must not become visible for client consent before internal director authorization. Client decisions only for projects to which that client is assigned.
- **Budget change:** client approval is insufficient to apply a variation; final Project Manager application is required. Two attempts to apply the same approved variation must not result in double counting.
- **Storage:** upload a valid PDF under `<org>/<project>/<uploader>/<unique-name>`, create matching document metadata, and verify private download by an internal authorized member. Unassigned clients and other tenants must fail. Assigned clients gain access only after `tekton_publish_document`.
- **Fraud and abuse:** test forged user_metadata, URL path guessing, storage object overwrite, bad MIME, over-20 MB upload, tenant_id reassignment, revoked membership, duplicate requests, and expired sessions.
- **Evidence:** confirm audit events for organization/project creation, role assignment, project-client assignment, progress update, request creation, every approval decision, variation application, and document publication.
- **Auth lifecycle:** sign-up confirmation, password recovery, logout/session refresh, two browsers, organization switching and revocation.

## External launch gates
- Gate A — Code and static CI reviewed in a PR (**current engineering stage**).
- Gate B — Dedicated Supabase database migrated, advisors run, and live authorization scenarios passed.
- Gate C — Protected TEKTON staging hostname configured, successful end-to-end flows with real test accounts.
- Gate D — production hardening: email invitations and explicit acceptance, malware scanning, backups/restore, monitoring/alerts, security review, privacy controls, deployment checks.
No real confidential company information until Gate D is accepted.

## Notes
- There is no sales contact integration in the old pilot form.
- Existing browser-local fictional data is NOT automatically imported into the new real platform.
- Role checks in JavaScript exist for usability only. SQL RLS and restricted RPCs must be authoritative.
