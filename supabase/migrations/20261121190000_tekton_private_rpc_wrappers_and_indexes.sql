-- TEKTON: keep trusted implementations in the non-exposed private schema.
-- Public API wrappers are SECURITY INVOKER and only callable by authenticated users.
begin;

-- tekton_create_organization
alter function public.tekton_create_organization(text,text) set schema private;
alter function private.tekton_create_organization(text,text) rename to tekton_create_organization_impl;
revoke execute on function private.tekton_create_organization_impl(text,text) from public, anon, authenticated;
grant execute on function private.tekton_create_organization_impl(text,text) to authenticated;
create function public.tekton_create_organization(p_name text,p_slug text) returns uuid
language sql security invoker set search_path='' as $$
 select private.tekton_create_organization_impl(p_name,p_slug);
$$;
revoke execute on function public.tekton_create_organization(text,text) from public, anon;
grant execute on function public.tekton_create_organization(text,text) to authenticated;

-- tekton_create_project
alter function public.tekton_create_project(uuid,text,text,text,numeric) set schema private;
alter function private.tekton_create_project(uuid,text,text,text,numeric) rename to tekton_create_project_impl;
revoke execute on function private.tekton_create_project_impl(uuid,text,text,text,numeric) from public, anon, authenticated;
grant execute on function private.tekton_create_project_impl(uuid,text,text,text,numeric) to authenticated;
create function public.tekton_create_project(p_org uuid,p_code text,p_name text,p_stage text,p_baseline_budget numeric default 0) returns uuid
language sql security invoker set search_path='' as $$
 select private.tekton_create_project_impl(p_org,p_code,p_name,p_stage,p_baseline_budget);
$$;
revoke execute on function public.tekton_create_project(uuid,text,text,text,numeric) from public, anon;
grant execute on function public.tekton_create_project(uuid,text,text,text,numeric) to authenticated;

-- tekton_update_project_progress
alter function public.tekton_update_project_progress(uuid,integer,text) set schema private;
alter function private.tekton_update_project_progress(uuid,integer,text) rename to tekton_update_project_progress_impl;
revoke execute on function private.tekton_update_project_progress_impl(uuid,integer,text) from public, anon, authenticated;
grant execute on function private.tekton_update_project_progress_impl(uuid,integer,text) to authenticated;
create function public.tekton_update_project_progress(p_project uuid,p_progress integer,p_reason text) returns uuid
language sql security invoker set search_path='' as $$
 select private.tekton_update_project_progress_impl(p_project,p_progress,p_reason);
$$;
revoke execute on function public.tekton_update_project_progress(uuid,integer,text) from public, anon;
grant execute on function public.tekton_update_project_progress(uuid,integer,text) to authenticated;

-- tekton_add_existing_member
alter function public.tekton_add_existing_member(uuid,uuid,text) set schema private;
alter function private.tekton_add_existing_member(uuid,uuid,text) rename to tekton_add_existing_member_impl;
revoke execute on function private.tekton_add_existing_member_impl(uuid,uuid,text) from public, anon, authenticated;
grant execute on function private.tekton_add_existing_member_impl(uuid,uuid,text) to authenticated;
create function public.tekton_add_existing_member(p_org uuid,p_user uuid,p_role text) returns void
language sql security invoker set search_path='' as $$
 select private.tekton_add_existing_member_impl(p_org,p_user,p_role);
$$;
revoke execute on function public.tekton_add_existing_member(uuid,uuid,text) from public, anon;
grant execute on function public.tekton_add_existing_member(uuid,uuid,text) to authenticated;

-- tekton_assign_project_client
alter function public.tekton_assign_project_client(uuid,uuid,uuid) set schema private;
alter function private.tekton_assign_project_client(uuid,uuid,uuid) rename to tekton_assign_project_client_impl;
revoke execute on function private.tekton_assign_project_client_impl(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function private.tekton_assign_project_client_impl(uuid,uuid,uuid) to authenticated;
create function public.tekton_assign_project_client(p_org uuid,p_project uuid,p_client uuid) returns void
language sql security invoker set search_path='' as $$
 select private.tekton_assign_project_client_impl(p_org,p_project,p_client);
$$;
revoke execute on function public.tekton_assign_project_client(uuid,uuid,uuid) from public, anon;
grant execute on function public.tekton_assign_project_client(uuid,uuid,uuid) to authenticated;

-- tekton_create_workflow
alter function public.tekton_create_workflow(uuid,text,text,text,numeric,integer) set schema private;
alter function private.tekton_create_workflow(uuid,text,text,text,numeric,integer) rename to tekton_create_workflow_impl;
revoke execute on function private.tekton_create_workflow_impl(uuid,text,text,text,numeric,integer) from public, anon, authenticated;
grant execute on function private.tekton_create_workflow_impl(uuid,text,text,text,numeric,integer) to authenticated;
create function public.tekton_create_workflow(p_project uuid,p_kind text,p_title text,p_description text,p_amount numeric,p_days_delta integer default 0) returns uuid
language sql security invoker set search_path='' as $$
 select private.tekton_create_workflow_impl(p_project,p_kind,p_title,p_description,p_amount,p_days_delta);
$$;
revoke execute on function public.tekton_create_workflow(uuid,text,text,text,numeric,integer) from public, anon;
grant execute on function public.tekton_create_workflow(uuid,text,text,text,numeric,integer) to authenticated;

-- tekton_decide_workflow
alter function public.tekton_decide_workflow(uuid,text,text) set schema private;
alter function private.tekton_decide_workflow(uuid,text,text) rename to tekton_decide_workflow_impl;
revoke execute on function private.tekton_decide_workflow_impl(uuid,text,text) from public, anon, authenticated;
grant execute on function private.tekton_decide_workflow_impl(uuid,text,text) to authenticated;
create function public.tekton_decide_workflow(p_step uuid,p_decision text,p_note text default '') returns uuid
language sql security invoker set search_path='' as $$
 select private.tekton_decide_workflow_impl(p_step,p_decision,p_note);
$$;
revoke execute on function public.tekton_decide_workflow(uuid,text,text) from public, anon;
grant execute on function public.tekton_decide_workflow(uuid,text,text) to authenticated;

-- tekton_apply_variation
alter function public.tekton_apply_variation(uuid) set schema private;
alter function private.tekton_apply_variation(uuid) rename to tekton_apply_variation_impl;
revoke execute on function private.tekton_apply_variation_impl(uuid) from public, anon, authenticated;
grant execute on function private.tekton_apply_variation_impl(uuid) to authenticated;
create function public.tekton_apply_variation(p_workflow uuid) returns uuid
language sql security invoker set search_path='' as $$
 select private.tekton_apply_variation_impl(p_workflow);
$$;
revoke execute on function public.tekton_apply_variation(uuid) from public, anon;
grant execute on function public.tekton_apply_variation(uuid) to authenticated;

-- tekton_publish_document
alter function public.tekton_publish_document(uuid) set schema private;
alter function private.tekton_publish_document(uuid) rename to tekton_publish_document_impl;
revoke execute on function private.tekton_publish_document_impl(uuid) from public, anon, authenticated;
grant execute on function private.tekton_publish_document_impl(uuid) to authenticated;
create function public.tekton_publish_document(p_document uuid) returns uuid
language sql security invoker set search_path='' as $$
 select private.tekton_publish_document_impl(p_document);
$$;
revoke execute on function public.tekton_publish_document(uuid) from public, anon;
grant execute on function public.tekton_publish_document(uuid) to authenticated;

-- Foreign-key maintenance / reverse lookup indexes.
create index if not exists tekton_approval_steps_decided_by_idx on public.tekton_approval_steps(decided_by);
create index if not exists tekton_approval_steps_org_workflow_idx on public.tekton_approval_steps(organization_id,workflow_id);
create index if not exists tekton_audit_actor_idx on public.tekton_audit_events(actor_id);
create index if not exists tekton_audit_org_workflow_idx on public.tekton_audit_events(organization_id,workflow_id);
create index if not exists tekton_documents_published_by_idx on public.tekton_documents(published_by);
create index if not exists tekton_documents_uploaded_by_idx on public.tekton_documents(uploaded_by);
create index if not exists tekton_organizations_creator_idx on public.tekton_organizations(created_by);
create index if not exists tekton_project_controls_updated_by_idx on public.tekton_project_controls(updated_by);
create index if not exists tekton_project_memberships_org_user_idx on public.tekton_project_memberships(organization_id,user_id);
create index if not exists tekton_projects_creator_idx on public.tekton_projects(created_by);
create index if not exists tekton_workflows_applied_by_idx on public.tekton_workflows(applied_by);
create index if not exists tekton_workflows_created_by_idx on public.tekton_workflows(created_by);
commit;
