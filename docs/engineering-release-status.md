# TEKTON — Dedicated staging engineering status
Date: 2026-11-21

## Environment ownership
- Supabase organization: `apexsync.intelligence@gmail.com's Org` (`spuuxxzrwoagkxiqhaer`), Free tier.
- Dedicated Supabase project: **TEKTON** (`fryyptustahhuuoorfet`), London `eu-west-2`, project creation quoted at **$0/month**.
- Supabase console: https://supabase.com/dashboard/project/fryyptustahhuuoorfet
- Vercel team: **ApexSync** (`team_l7cweZkmC34B37kBbl1mOzHb`).
- Staging project: **tekton-secure-staging** (`prj_VEQ6Ry2IvJTeeisJBSr3bo81VWqR`).
- Staging workspace: https://tekton-secure-staging.vercel.app/platform/
- Vercel Authentication: enabled for all staging deployments.
- The original TEKTON live marketing site and fictional demo remain untouched, in the separate Ola Vercel project.

## Work completed
- ✅ Dedicated database created and reported `ACTIVE_HEALTHY`.
- ✅ Foundation migration applied to the TEKTON database only (`tekton_tenant_foundation`).
- ✅ Hardening migration applied (`tekton_private_rpc_wrappers_and_indexes`).
- ✅ All **9** TEKTON tables have RLS enabled.
- ✅ Supabase schema/security checks succeeded; private storage bucket in place.
- ✅ Supabase Security Advisor: **no findings** after hardening (2026-11-21).
- ✅ Performance Advisor: only fresh-database **unused index INFO** notices, no unindexed foreign keys.
- ✅ Privileged functions moved to non-exposed `private`; `public` functions are invoker wrappers accessible only to authenticated users.
- ✅ Dedicated Supabase public API URL + publishable key connected in `platform/config.js`; no service-role credentials in frontend.
- ✅ GitHub static CI: **10/10** checks passed on latest staging branch.
- ✅ Vercel protected staging deployment `READY`; root, app, assets and configuration returned HTTP 200 via Vercel internal fetches.

## Still required — do not merge or use live company data
1. Configure/verify Supabase Auth email confirmation, SMTP delivery and allowed redirect URL for `https://tekton-secure-staging.vercel.app/platform/` (also add exact staging origin as appropriate).
2. Sign in to staging using Vercel Authentication with an ApexSync team account.
3. Create verified Supabase **test** accounts for two separate organization owners and the roles enumerated in `supabase/tests/README.md`.
4. Run live multi-tenant RLS, maker–checker, role revocation, storage and client-visibility tests with those accounts; record evidence.
5. Test actual signup, login, recovery and session refresh in mobile and desktop browsers.
6. Add a secure invitation lifecycle, file-malware handling, audit/alerts, backup restore testing and incident controls before production.
7. Review draft PR #1 before any merge. Main and the public demo have not been changed.

The public marketing demo contains fictional local-storage data; **none** of it is a real tenant record. No production launch is claimed.
