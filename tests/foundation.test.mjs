import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261121000000_tekton_tenant_foundation.sql','utf8');
const app=readFileSync('platform/app.js','utf8');
const cfg=readFileSync('platform/config.js','utf8');
const manual=readFileSync('platform/README.md','utf8');
const tables=[...sql.matchAll(/create table public\.(tekton_[a-z_]+) *\(/g)].map(m=>m[1]);
const section=(a,b)=>sql.slice(sql.indexOf(a),sql.indexOf(b));

test('all tenant tables use row-level security',()=>{
 assert.equal(tables.length,9);
 for(const t of tables)assert.ok(sql.includes('alter table public.'+t+' enable row level security;'),t);
});
test('client-readable project rows never expose internal budget or raw progress',()=>{
 const project=section('create table public.tekton_projects (','create index tekton_projects_org_idx');
 assert.ok(!project.includes('baseline_budget'));
 assert.ok(!project.includes('progress'));
 assert.match(sql,/create table public\.tekton_project_controls/);
 assert.match(sql,/create policy "project controls internal read"/);
 assert.ok(!sql.includes('grant insert(organization_id,code,name,stage,baseline_budget'));
});
test('tenant membership predicates do not trust user-editable metadata',()=>{
 assert.match(sql,/create or replace function private\.tekton_role/);
 assert.match(sql,/m\.user_id=\(select auth\.uid\(\)\)/);
 assert.doesNotMatch(sql,/raw_user_meta_data|user_metadata/);
});
test('maker-checker is independent, sequential, and prevents double application',()=>{
 for(const s of ['Maker cannot approve own request','Each approval must be made by an independent checker',
   'Earlier approvals are required','r.applied_at is not null'])assert.ok(sql.includes(s),s);
});
test('storage is private and folder ownership is enforced',()=>{
 for(const s of ["'tekton-project-private',false",'tekton_can_upload_path','tekton_can_read_file',
  "split_part(p_path,'/',3)=(select auth.uid())::text","p_visibility='client_published'"])
  assert.ok(sql.includes(s),s);
});
test('all public trusted functions revoke public execution and grant only authenticated',()=>{
 const fn=[...sql.matchAll(/create or replace function public\.(tekton_[a-z_]+)/g)].map(m=>m[1]);
 assert.ok(fn.length>=8);
 for(const n of fn){
  assert.ok(sql.includes('revoke execute on function public.'+n+'('),n);
  assert.ok(sql.includes('grant execute on function public.'+n+'('),n);
 }
 assert.ok(!sql.includes('grant update on public.tekton_workflows'));
});
test('authenticated workspace is unconfigured by default',()=>{
 assert.match(cfg,/supabaseUrl: ""/);
 assert.match(cfg,/supabasePublishableKey: ""/);
 assert.ok(app.includes('if(!configValid()){unavailable();return}'));
 assert.ok(app.includes('supabase-js@2.119.2'));
 assert.doesNotMatch(app,/sb_secret_[A-Za-z0-9]+/);
 assert.ok(manual.includes('Do not use Converge, ALIENTO'));
});
test('sensitive project changes are server-side and audited',()=>{
 for(const rpc of ['tekton_create_project','tekton_update_project_progress','tekton_apply_variation','tekton_decide_workflow'])
  assert.ok(sql.includes('function public.'+rpc),rpc);
 assert.ok(app.includes("db.rpc('tekton_create_project'"));
 assert.ok(app.includes("db.rpc('tekton_update_project_progress'"));
});
test('workspace script is valid JavaScript',()=>{
 assert.doesNotThrow(()=>new Function(app));
});
