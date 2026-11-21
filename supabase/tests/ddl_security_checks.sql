-- Read-only sanity checks: run AFTER applying migration to a DEDICATED TEKTON Supabase database.
-- Does not substitute for multi-user security testing.
do $$
declare v_missing text; v_public text; v_deletable text;
begin
 select string_agg(c.relname,', ') into v_missing
 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r'
 and c.relname like 'tekton_%' and c.relrowsecurity=false;
 if v_missing is not null then raise exception 'TEKTON tables missing RLS: %',v_missing; end if;
 if exists(select 1 from information_schema.columns
   where table_schema='public' and table_name='tekton_projects'
   and column_name in ('baseline_budget','progress'))
 then raise exception 'Sensitive internal project fields are in client-readable rows'; end if;
 if not exists(select 1 from pg_catalog.pg_tables
   where schemaname='public' and tablename='tekton_project_controls')
 then raise exception 'Project financial controls table is missing'; end if;
 select string_agg(c.relname,', ') into v_public
 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relname like 'tekton_%'
 and pg_catalog.has_table_privilege('anon',c.oid,'SELECT');
 if v_public is not null then raise exception 'Anon access to tables: %',v_public; end if;
 select string_agg(c.relname,', ') into v_deletable
 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind='r' and c.relname like 'tekton_%'
 and pg_catalog.has_table_privilege('authenticated',c.oid,'DELETE');
 if v_deletable is not null then raise exception 'Client DELETE grants detected: %',v_deletable; end if;
 if (select b.public from storage.buckets b where id='tekton-project-private') is distinct from false
 then raise exception 'TEKTON document bucket must be private'; end if;
 if not exists(select 1 from pg_catalog.pg_policies
  where schemaname='storage' and tablename='objects'
  and policyname='tekton upload tenant/project/actor folder')
 then raise exception 'Tenant storage INSERT policy missing'; end if;
 if not exists(select 1 from pg_catalog.pg_policies
  where schemaname='storage' and tablename='objects'
  and policyname='tekton read linked project document')
 then raise exception 'Tenant storage SELECT policy missing'; end if;
 raise notice 'TEKTON static RLS, grants, and storage checks passed. Proceed with live multi-user tests.';
end $$;
