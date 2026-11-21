# TEKTON — Architecture Decision Record 001
## Separate demonstration from real tenant operations

**Decision:** Preserve the existing `/demo/` as an explicitly fictional browser-local demonstration. Create a separate `/platform/` engineering application backed exclusively by a dedicated TEKTON Supabase project.

### Authoritative data and access
- Identity: Supabase Auth verified users.
- Authorization: `tekton_memberships` and `tekton_project_memberships`, not editable user metadata.
- Tenancy: every project, document, workflow, approval and audit event is linked to an organization.
- Client access: only assigned project basics, approved/published client information and matching private files.
- Sensitive fields: `tekton_project_controls` contains budget/progress, isolated from client-readable project rows.
- Files: private Storage bucket; object path includes tenant, project, uploader and unique filename.
- Approvals: restricted server-side RPCs check actor role, order, separate checker, and project rights.
- Financial changes: applied variations are summed on top of baseline only after sequential approvals and a final one-time application.
- Audit: append-only application events emitted by trusted RPCs; avoid client-side audit inserts.

### Security decisions and limitations
- RLS is enabled on every new exposed table; table grants are deliberately restrictive.
- Security-definer functions use empty search_path, auth.uid checks and explicit revocation from PUBLIC and anon; they must be reviewed and tested in the new database.
- No service-role key or database password in frontend source.
- Invitation acceptance, zero-trust file scanning and production operational controls are separate follow-on work.
- The frontend is NOT a substitute for a server-enforced permission model.

### Rollout strategy
Do not merge untested schema into the live site or configure another application's Supabase instance. Keep this engineering PR open until migration, live security verification and dedicated staging succeed.
