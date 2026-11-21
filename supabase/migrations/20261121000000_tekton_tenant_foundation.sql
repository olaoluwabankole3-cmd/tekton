-- TEKTON / phase 4 / dedicated backend ONLY
-- Apply to a NEW, dedicated TEKTON Supabase database after project selection.
-- Never run this migration against Converge, ALIENTO, or another application's DB.
begin;
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.tekton_organizations (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 48),
 name text not null check(length(btrim(name)) between 3 and 120),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table public.tekton_memberships (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.tekton_organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','admin','project_manager','site_engineer','quantity_surveyor','procurement','finance','storekeeper','client')),
 status text not null default 'active' check(status in ('active','disabled')),
 created_at timestamptz not null default now(),
 unique (organization_id,user_id)
);
create index tekton_memberships_user_idx on public.tekton_memberships(user_id,organization_id) where status='active';

create table public.tekton_projects (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.tekton_organizations(id) on delete cascade,
 code text not null check(length(btrim(code)) between 2 and 30),
 name text not null check(length(btrim(name)) between 3 and 150),
 stage text not null default 'planning' check(stage in ('planning','active','on_hold','completed','cancelled')),
 baseline_budget numeric(18,2) not null default 0 check(baseline_budget>=0),
 progress smallint not null default 0 check(progress between 0 and 100),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 unique(organization_id,code)
);
create index tekton_projects_org_idx on public.tekton_projects(organization_id,stage);
create table public.tekton_project_memberships (
 organization_id uuid not null,
 project_id uuid not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(organization_id,project_id,user_id),
 foreign key (organization_id,project_id) references public.tekton_projects(organization_id,id) on delete cascade,
 foreign key (organization_id,user_id) references public.tekton_memberships(organization_id,user_id) on delete cascade
);
create index tekton_project_memberships_user_idx on public.tekton_project_memberships(user_id,project_id);

create table public.tekton_documents (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 project_id uuid not null,
 storage_path text not null unique check(length(storage_path) between 60 and 500),
 file_name text not null check(length(btrim(file_name)) between 3 and 200),
 mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')),
 bytes bigint not null check(bytes between 1 and 20971520),
 visibility text not null default 'internal' check(visibility in ('internal','client_published')),
 uploaded_by uuid not null references auth.users(id),
 published_by uuid references auth.users(id),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 foreign key (organization_id,project_id) references public.tekton_projects(organization_id,id) on delete cascade,
 check (visibility='internal' or (published_by is not null and published_at is not null))
);
create index tekton_documents_project_idx on public.tekton_documents(organization_id,project_id,created_at desc);

create table public.tekton_workflows (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 project_id uuid not null,
 kind text not null check(kind in ('material_request','variation')),
 title text not null check(length(btrim(title)) between 8 and 200),
 description text not null default '',
 amount numeric(18,2) not null default 0 check(amount between 0 and 1000000000),
 days_delta integer not null default 0 check(days_delta between 0 and 365),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_by uuid not null references auth.users(id),
 applied_at timestamptz,
 applied_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key (organization_id,project_id) references public.tekton_projects(organization_id,id) on delete cascade,
 check (applied_at is null or (kind='variation' and status='approved' and applied_by is not null))
);
create index tekton_workflows_project_idx on public.tekton_workflows(organization_id,project_id,created_at desc);

create table public.tekton_approval_steps (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 workflow_id uuid not null,
 step_number integer not null check(step_number between 1 and 20),
 assigned_role text not null check(assigned_role in ('project_manager','quantity_surveyor','procurement','finance','owner','admin','client')),
 decision text not null default 'pending' check(decision in ('pending','approved','rejected')),
 decided_by uuid references auth.users(id),
 decided_at timestamptz,
 note text not null default '' check(length(note)<=1000),
 created_at timestamptz not null default now(),
 unique(workflow_id,step_number),
 foreign key(organization_id,workflow_id) references public.tekton_workflows(organization_id,id) on delete cascade,
 check ((decision='pending' and decided_by is null and decided_at is null) or
        (decision<>'pending' and decided_by is not null and decided_at is not null))
);
create index tekton_steps_workflow_idx on public.tekton_approval_steps(workflow_id,step_number);
create table public.tekton_audit_events (
 id bigint generated always as identity primary key,
 organization_id uuid not null references public.tekton_organizations(id) on delete cascade,
 project_id uuid,
 workflow_id uuid,
 actor_id uuid not null references auth.users(id),
 event_type text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 foreign key(organization_id,project_id) references public.tekton_projects(organization_id,id),
 foreign key(organization_id,workflow_id) references public.tekton_workflows(organization_id,id)
);
create index tekton_audit_project_idx on public.tekton_audit_events(organization_id,project_id,created_at desc);

-- Non-exposed, narrowly scoped membership predicates; NEVER trust user_metadata.
create or replace function private.tekton_role(p_org uuid)
returns text language sql stable security definer set search_path='' as $$
 select m.role from public.tekton_memberships m
 where m.organization_id=p_org and m.user_id=(select auth.uid()) and m.status='active'
 limit 1;
$$;
create or replace function private.tekton_is_member(p_org uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select (select private.tekton_role(p_org)) is not null;
$$;
create or replace function private.tekton_can_read_project(p_org uuid,p_project uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select case when (select private.tekton_role(p_org)) is null then false
 when (select private.tekton_role(p_org)) <> 'client' then exists(
  select 1 from public.tekton_projects p where p.organization_id=p_org and p.id=p_project)
 else exists(select 1 from public.tekton_project_memberships pm
  where pm.organization_id=p_org and pm.project_id=p_project and pm.user_id=(select auth.uid()))
 end;
$$;
create or replace function private.tekton_can_read_workflow(p_org uuid,p_project uuid,p_workflow uuid,p_kind text)
returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if not private.tekton_can_read_project(p_org,p_project) then return false; end if;
 if private.tekton_role(p_org)<>'client' then return true; end if;
 return p_kind='variation' and exists(
  select 1 from public.tekton_approval_steps s
  where s.organization_id=p_org and s.workflow_id=p_workflow
    and s.assigned_role='client'
 ) and exists (
  select 1 from public.tekton_approval_steps s
  where s.organization_id=p_org and s.workflow_id=p_workflow
    and s.assigned_role='owner' and s.decision='approved'
 );
end;
$$;
create or replace function private.tekton_can_read_document(p_org uuid,p_project uuid,p_visibility text)
returns boolean language sql stable security definer set search_path='' as $$
 select private.tekton_can_read_project(p_org,p_project)
    and ((select private.tekton_role(p_org))<>'client' or p_visibility='client_published');
$$;
create or replace function private.tekton_can_upload_path(p_path text)
returns boolean language sql stable security definer set search_path='' as $$
 select array_length(string_to_array(p_path,'/'),1)=4
  and split_part(p_path,'/',3)=(select auth.uid())::text
  and split_part(p_path,'/',4) not in ('','.','..')
  and exists(
   select 1 from public.tekton_projects p
   where p.organization_id::text=split_part(p_path,'/',1)
     and p.id::text=split_part(p_path,'/',2)
     and private.tekton_role(p.organization_id) in
       ('owner','admin','project_manager','site_engineer','quantity_surveyor','procurement','finance','storekeeper')
  );
$$;
create or replace function private.tekton_can_read_file(p_path text)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.tekton_documents d
  where d.storage_path=p_path
    and private.tekton_can_read_document(d.organization_id,d.project_id,d.visibility));
$$;
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

alter table public.tekton_organizations enable row level security;
alter table public.tekton_memberships enable row level security;
alter table public.tekton_projects enable row level security;
alter table public.tekton_project_memberships enable row level security;
alter table public.tekton_documents enable row level security;
alter table public.tekton_workflows enable row level security;
alter table public.tekton_approval_steps enable row level security;
alter table public.tekton_audit_events enable row level security;

create policy "org read members" on public.tekton_organizations
 for select to authenticated using ((select private.tekton_is_member(id)));
create policy "org edit administrators" on public.tekton_organizations
 for update to authenticated using ((select private.tekton_role(id)) in ('owner','admin'))
 with check ((select private.tekton_role(id)) in ('owner','admin'));
create policy "members read self or admins" on public.tekton_memberships
 for select to authenticated using (user_id=(select auth.uid()) or
 (select private.tekton_role(organization_id)) in ('owner','admin'));
create policy "projects scoped read" on public.tekton_projects
 for select to authenticated using ((select private.tekton_can_read_project(organization_id,id)));
create policy "project management create" on public.tekton_projects
 for insert to authenticated with check (
 created_by=(select auth.uid()) and
 (select private.tekton_role(organization_id)) in ('owner','admin','project_manager'));
create policy "project management update" on public.tekton_projects
 for update to authenticated
 using ((select private.tekton_role(organization_id)) in ('owner','admin','project_manager'))
 with check ((select private.tekton_role(organization_id)) in ('owner','admin','project_manager'));
create policy "project memberships restricted read" on public.tekton_project_memberships
 for select to authenticated using (user_id=(select auth.uid()) or
 (select private.tekton_role(organization_id)) in ('owner','admin','project_manager'));
create policy "document metadata project read" on public.tekton_documents
 for select to authenticated using
 ((select private.tekton_can_read_document(organization_id,project_id,visibility)));
create policy "document record insert internal" on public.tekton_documents
 for insert to authenticated with check (
 uploaded_by=(select auth.uid()) and visibility='internal'
 and (select private.tekton_role(organization_id)) in
 ('owner','admin','project_manager','site_engineer','quantity_surveyor','procurement','finance','storekeeper')
 and storage_path like organization_id::text||'/'||project_id::text||'/'||(select auth.uid())::text||'/%'
 and exists(select 1 from public.tekton_projects p
  where p.id=project_id and p.organization_id=organization_id));
create policy "workflows scoped read" on public.tekton_workflows
 for select to authenticated using
 ((select private.tekton_can_read_workflow(organization_id,project_id,id,kind)));
create policy "approval step scoped read" on public.tekton_approval_steps
 for select to authenticated using (exists(
 select 1 from public.tekton_workflows w
 where w.id=workflow_id and w.organization_id=organization_id
 and (select private.tekton_can_read_workflow(w.organization_id,w.project_id,w.id,w.kind))
 and ((select private.tekton_role(w.organization_id)) <> 'client' or assigned_role='client')
 ));
create policy "audit internal member read" on public.tekton_audit_events
 for select to authenticated using
 ((select private.tekton_role(organization_id)) in
 ('owner','admin','project_manager','site_engineer','quantity_surveyor','procurement','finance','storekeeper'));

-- Grant only required API operations. Authenticated is NOT authorization; RLS is.
revoke all on public.tekton_organizations,public.tekton_memberships,
 public.tekton_projects,public.tekton_project_memberships,public.tekton_documents,
 public.tekton_workflows,public.tekton_approval_steps,public.tekton_audit_events
 from anon,authenticated;
grant select on public.tekton_organizations,public.tekton_memberships,
 public.tekton_projects,public.tekton_project_memberships,public.tekton_documents,
 public.tekton_workflows,public.tekton_approval_steps,public.tekton_audit_events to authenticated;
grant update(name) on public.tekton_organizations to authenticated;
grant insert(organization_id,code,name,stage,baseline_budget,progress,created_by) on public.tekton_projects to authenticated;
grant update(name,stage,progress) on public.tekton_projects to authenticated;
grant insert(organization_id,project_id,storage_path,file_name,mime_type,bytes,uploaded_by)
 on public.tekton_documents to authenticated;

-- Private bucket; no public URLs, no overwrite/delete permissions.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('tekton-project-private','tekton-project-private',false,20971520,
 array['application/pdf','image/png','image/jpeg',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict(id) do nothing;
create policy "tekton upload tenant/project/actor folder"
 on storage.objects for insert to authenticated
 with check (bucket_id='tekton-project-private' and
 (select private.tekton_can_upload_path(name)));
create policy "tekton read linked project document"
 on storage.objects for select to authenticated
 using (bucket_id='tekton-project-private' and
 (select private.tekton_can_read_file(name)));

-- No anonymous execution for trusted functions; strict actor checks inside each.
create or replace function public.tekton_create_organization(p_name text,p_slug text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_uid uuid := (select auth.uid()); v_id uuid;
begin
 if v_uid is null or (select coalesce(auth.jwt()->>'is_anonymous','false'))='true'
 or not exists (select 1 from auth.users u where u.id=v_uid and u.email_confirmed_at is not null)
 then raise exception 'Verified account required' using errcode='42501'; end if;
 if length(btrim(p_name)) not between 3 and 120 or
 p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) not between 3 and 48
 then raise exception 'Invalid organization details'; end if;
 insert into public.tekton_organizations(name,slug,created_by)
 values(btrim(p_name),p_slug,v_uid) returning id into v_id;
 insert into public.tekton_memberships(organization_id,user_id,role)
 values(v_id,v_uid,'owner');
 return v_id;
end; $$;
create or replace function public.tekton_add_existing_member(p_org uuid,p_user uuid,p_role text)
returns void language plpgsql security definer set search_path='' as $$
declare v_existing text;
begin
 if (select auth.uid()) is null or private.tekton_role(p_org) not in ('owner','admin') then
  raise exception 'Organization admin access required' using errcode='42501'; end if;
 if p_role not in ('admin','project_manager','site_engineer','quantity_surveyor','procurement','finance','storekeeper','client') then
  raise exception 'Invalid member role'; end if;
 if not exists(select 1 from auth.users u where u.id=p_user and u.email_confirmed_at is not null) then
  raise exception 'User must have a verified account'; end if;
 select role into v_existing from public.tekton_memberships where organization_id=p_org and user_id=p_user;
 if v_existing='owner' then raise exception 'Owner role cannot be overwritten'; end if;
 insert into public.tekton_memberships(organization_id,user_id,role,status)
 values(p_org,p_user,p_role,'active')
 on conflict(organization_id,user_id) do update set role=excluded.role,status='active';
 insert into public.tekton_audit_events(organization_id,actor_id,event_type,details)
 values(p_org,(select auth.uid()),'member.role_assigned',jsonb_build_object('member_id',p_user,'role',p_role));
end; $$;
create or replace function public.tekton_assign_project_client(p_org uuid,p_project uuid,p_client uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or private.tekton_role(p_org) not in ('owner','admin','project_manager')
 then raise exception 'Project admin access required' using errcode='42501'; end if;
 if not exists(select 1 from public.tekton_memberships m where m.organization_id=p_org
  and m.user_id=p_client and m.status='active' and m.role='client')
 then raise exception 'Client must be an active member'; end if;
 insert into public.tekton_project_memberships(organization_id,project_id,user_id)
 values(p_org,p_project,p_client)
 on conflict do nothing;
 insert into public.tekton_audit_events(organization_id,project_id,actor_id,event_type,details)
 values(p_org,p_project,(select auth.uid()),'project.client_assigned',jsonb_build_object('client_id',p_client));
end; $$;
create or replace function public.tekton_create_workflow(
 p_project uuid,p_kind text,p_title text,p_description text,p_amount numeric,p_days_delta integer default 0)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_org uuid; v_uid uuid:=(select auth.uid());v_id uuid;v_role text;
begin
 select organization_id into v_org from public.tekton_projects where id=p_project;
 v_role:=private.tekton_role(v_org);
 if v_uid is null or v_org is null or v_role is null or v_role='client'
 then raise exception 'Authorized project membership required' using errcode='42501'; end if;
 if p_kind not in ('material_request','variation') or length(btrim(p_title)) not between 8 and 200
  or p_amount is null or p_amount<0 or p_amount>1000000000
  or p_days_delta is null or p_days_delta<0 or p_days_delta>365
 then raise exception 'Invalid workflow details'; end if;
 if p_kind='variation' and v_role not in ('owner','admin','project_manager','site_engineer')
 then raise exception 'Role cannot initiate construction variation' using errcode='42501'; end if;
 insert into public.tekton_workflows(organization_id,project_id,kind,title,description,amount,days_delta,created_by)
 values(v_org,p_project,p_kind,btrim(p_title),coalesce(left(p_description,3000),''),p_amount,p_days_delta,v_uid)
 returning id into v_id;
 if p_kind='material_request' then
  insert into public.tekton_approval_steps(organization_id,workflow_id,step_number,assigned_role)
  values (v_org,v_id,1,'project_manager'),(v_org,v_id,2,'quantity_surveyor'),
         (v_org,v_id,3,'procurement'),(v_org,v_id,4,'finance');
 else
  insert into public.tekton_approval_steps(organization_id,workflow_id,step_number,assigned_role)
  values (v_org,v_id,1,'project_manager'),(v_org,v_id,2,'quantity_surveyor'),
         (v_org,v_id,3,'owner'),(v_org,v_id,4,'client');
 end if;
 insert into public.tekton_audit_events(organization_id,project_id,workflow_id,actor_id,event_type,details)
 values(v_org,p_project,v_id,v_uid,'workflow.created',jsonb_build_object('kind',p_kind,'amount',p_amount));
 return v_id;
end; $$;
create or replace function public.tekton_decide_workflow(p_step uuid,p_decision text,p_note text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare s public.tekton_approval_steps%rowtype;r public.tekton_workflows%rowtype;v_uid uuid:=(select auth.uid());v_role text;
begin
 if v_uid is null or p_decision not in ('approved','rejected') then raise exception 'Invalid decision' using errcode='42501'; end if;
 select * into s from public.tekton_approval_steps where id=p_step for update;
 if not found then raise exception 'Approval step not found'; end if;
 select * into r from public.tekton_workflows where id=s.workflow_id for update;
 v_role:=private.tekton_role(r.organization_id);
 if r.status<>'pending' or s.decision<>'pending' then raise exception 'Workflow step already decided'; end if;
 if r.created_by=v_uid then raise exception 'Maker cannot approve own request' using errcode='42501'; end if;
 if exists (select 1 from public.tekton_approval_steps a where a.workflow_id=r.id
   and a.step_number<s.step_number and a.decision<>'approved')
 then raise exception 'Earlier approvals are required'; end if;
 if exists (select 1 from public.tekton_approval_steps a where a.workflow_id=r.id
   and a.decided_by=v_uid)
 then raise exception 'Each approval must be made by an independent checker'; end if;
 if s.assigned_role='client' then
  if v_role<>'client' or not private.tekton_can_read_project(r.organization_id,r.project_id)
  then raise exception 'Assigned client consent required' using errcode='42501'; end if;
 elsif s.assigned_role='owner' then
  if v_role not in ('owner','admin') then raise exception 'Director approval required' using errcode='42501'; end if;
 elsif v_role not in (s.assigned_role,'owner','admin') then
  raise exception 'Required departmental role is missing' using errcode='42501'; end if;
 update public.tekton_approval_steps
  set decision=p_decision,decided_by=v_uid,decided_at=now(),note=left(coalesce(p_note,''),1000)
  where id=s.id;
 if p_decision='rejected' then
  update public.tekton_workflows set status='rejected' where id=r.id;
 elsif not exists(select 1 from public.tekton_approval_steps a
  where a.workflow_id=r.id and a.decision='pending') then
  update public.tekton_workflows set status='approved' where id=r.id;
 end if;
 insert into public.tekton_audit_events(organization_id,project_id,workflow_id,actor_id,event_type,details)
 values(r.organization_id,r.project_id,r.id,v_uid,'approval.'||p_decision,
 jsonb_build_object('step',s.step_number,'role',s.assigned_role,'note',left(coalesce(p_note,''),1000)));
 return r.id;
end; $$;
create or replace function public.tekton_apply_variation(p_workflow uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.tekton_workflows%rowtype;v_uid uuid:=(select auth.uid());
begin
 select * into r from public.tekton_workflows where id=p_workflow for update;
 if not found or v_uid is null or private.tekton_role(r.organization_id) not in ('owner','admin','project_manager')
 then raise exception 'Project manager access required' using errcode='42501'; end if;
 if r.kind<>'variation' or r.status<>'approved' or r.applied_at is not null
 then raise exception 'Variation is not ready for application'; end if;
 update public.tekton_workflows set applied_at=now(),applied_by=v_uid where id=r.id;
 insert into public.tekton_audit_events(organization_id,project_id,workflow_id,actor_id,event_type,details)
 values(r.organization_id,r.project_id,r.id,v_uid,'variation.applied',
 jsonb_build_object('amount',r.amount,'days',r.days_delta));
 return r.id;
end; $$;
create or replace function public.tekton_publish_document(p_document uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare d public.tekton_documents%rowtype;v_uid uuid:=(select auth.uid());
begin
 select * into d from public.tekton_documents where id=p_document for update;
 if not found or v_uid is null or private.tekton_role(d.organization_id) not in ('owner','admin','project_manager')
 then raise exception 'Document publishing not authorized' using errcode='42501'; end if;
 if d.visibility='client_published' then raise exception 'Already published'; end if;
 update public.tekton_documents set visibility='client_published',published_by=v_uid,published_at=now() where id=d.id;
 insert into public.tekton_audit_events(organization_id,project_id,actor_id,event_type,details)
 values(d.organization_id,d.project_id,v_uid,'document.published',jsonb_build_object('document_id',d.id));
 return d.id;
end; $$;
revoke execute on function public.tekton_create_organization(text,text) from public,anon;
revoke execute on function public.tekton_add_existing_member(uuid,uuid,text) from public,anon;
revoke execute on function public.tekton_assign_project_client(uuid,uuid,uuid) from public,anon;
revoke execute on function public.tekton_create_workflow(uuid,text,text,text,numeric,integer) from public,anon;
revoke execute on function public.tekton_decide_workflow(uuid,text,text) from public,anon;
revoke execute on function public.tekton_apply_variation(uuid) from public,anon;
revoke execute on function public.tekton_publish_document(uuid) from public,anon;
grant execute on function public.tekton_create_organization(text,text) to authenticated;
grant execute on function public.tekton_add_existing_member(uuid,uuid,text) to authenticated;
grant execute on function public.tekton_assign_project_client(uuid,uuid,uuid) to authenticated;
grant execute on function public.tekton_create_workflow(uuid,text,text,text,numeric,integer) to authenticated;
grant execute on function public.tekton_decide_workflow(uuid,text,text) to authenticated;
grant execute on function public.tekton_apply_variation(uuid) to authenticated;
grant execute on function public.tekton_publish_document(uuid) to authenticated;
commit;
