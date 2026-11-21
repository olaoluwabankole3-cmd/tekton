/* TEKTON — isolated engineering workspace. Never use this with another app's Supabase project. */
const root=document.querySelector('#app');
const toastEl=document.querySelector('#toast');
const cfg=window.TEKTON_ENV||{};
let db=null, user=null, orgs=[], activeOrg=null, activeRole=null, projects=[], workflows=[], docs=[], approvals=[], audit=[];
let selectedProjectId=null,selectedWorkflowId=null,page='projects',authMode='signin',authRecover=false,lastNotice='';
const ROLES=['owner','admin','project_manager','site_engineer','quantity_surveyor','procurement','finance','storekeeper','client'];
const ALLOWED_MIME=new Set(['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
const BUCKET='tekton-project-private';
function h(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}
function money(v){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(v)||0);}
function nice(t){return t?new Date(t).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'—';}
function notice(message,error=false){lastNotice=String(message||'').slice(0,280);toastEl.textContent=lastNotice;toastEl.classList.toggle('error',error);toastEl.classList.add('show');}
function configValid(){return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(String(cfg.supabaseUrl||''))&&
 (/^sb_publishable_[A-Za-z0-9_\-]+$/.test(String(cfg.supabasePublishableKey||''))||/^eyJ[A-Za-z0-9._-]+$/.test(String(cfg.supabasePublishableKey||'')))&&!String(cfg.supabasePublishableKey).includes('service_role');}
function unavailable(){root.innerHTML='<section class="auth-shell"><div class="auth-aside"><img src="../brand/logos/svg/tekton-primary-dark.svg" alt="TEKTON"><div><h1>Built for the next phase.<br><em>Secure by design.</em></h1><p>The new workspace is separated from the public fictional-data demo.</p></div><small>TEKTON ENGINEERING / DEDICATED TENANT BACKEND</small></div><div class="auth-body"><div class="auth-card"><div class="eyebrow">Not provisioned</div><h2>A dedicated TEKTON backend is required</h2><p>This authenticated workspace is intentionally disabled until a new Supabase project, migrations, tenant-isolation tests and public configuration have been completed.</p><div class="notice">No other product database or API key will be reused. The public demo remains available.</div><div class="btn-row"><a href="../demo/" class="btn btn-light">Open existing demo</a></div></div></div></section>';}
function authPage(){
 const form=authMode==='reset'?'reset':authRecover?'recover':authMode;
 const submit={signin:'Sign in',signup:'Create account',reset:'Send recovery email',recover:'Update password'}[form];
 const inputs=form==='recover'?'<label class="field">New password<input type="password" name="password" autocomplete="new-password" minlength="12" required></label>':
 '<label class="field">Email address<input type="email" name="email" autocomplete="email" maxlength="140" required></label>'+
 (form==='reset'?'':'<label class="field">Password (12+ characters)<input type="password" name="password" autocomplete="'+(form==='signup'?'new-password':'current-password')+'" minlength="12" required></label>');
 root.innerHTML='<section class="auth-shell"><div class="auth-aside"><img src="../brand/logos/svg/tekton-primary-dark.svg" alt="TEKTON"><div><div class="eyebrow" style="color:#D4D4D4">CONSTRUCTION OPERATING SYSTEM</div><h1>One company.<br><em>Every decision connected.</em></h1><p>Real project records, tenant-scoped access and evidence-led departmental controls. No fictional demo data is imported.</p></div><small>ENGINEERING RELEASE / BACKEND ACCESS POLICIES APPLY</small></div><div class="auth-body"><div class="auth-card"><p class="eyebrow">Authenticated workspace</p><h2>'+h({signin:'Welcome back',signup:'Create your verified account',reset:'Recover access',recover:'Choose a new password'}[form])+'</h2><p>'+h(form==='signup'?'A verified email is required before you can create a company workspace.':'Sign-in is handled by Supabase Auth; project permissions are enforced in PostgreSQL.')+'</p><form id="auth-form">'+inputs+'<button class="btn" type="submit">'+h(submit)+'</button></form><div class="btn-row"><button class="btn btn-ghost" type="button" data-authmode="signin">Sign in</button><button class="btn btn-ghost" type="button" data-authmode="signup">Register</button><button class="btn btn-ghost" type="button" data-authmode="reset">Forgot password</button></div><div class="notice">This is a separate production-engineering workspace, not the simulated demo. Do not upload confidential data until security acceptance is complete.</div></div></div></section>';
}
function shell(content){
 const labels=[['projects','Projects'],['workflows','Approvals'],['documents','Documents'],['team','Team & roles'],['audit','Audit events']];
 const menu=labels.map(([id,label])=>'<a href="#'+id+'" data-nav="'+id+'" class="'+(page===id?'active':'')+'">'+label+'</a>').join('');
 const options=orgs.map(o=>'<option value="'+h(o.id)+'" '+(activeOrg?.id===o.id?'selected':'')+'>'+h(o.name)+'</option>').join('');
 const orgSelector=orgs.length?'<label class="field" style="margin:0;font-size:10px">Organization<select id="org-picker" style="max-width:225px;padding:9px;min-width:0">'+options+'</select></label>':'';
 root.innerHTML='<div class="app-shell"><aside class="app-aside"><a href="../index.html" style="padding:0"><img src="../brand/logos/svg/tekton-primary-dark.svg" alt="TEKTON" width="170"></a><small>SECURED COMPANY WORKSPACE<br>Not the fictional demo</small><nav aria-label="Workspace navigation">'+menu+'</nav><div style="margin-top:auto"><a href="../demo/">Open fictional demo ↗</a><button type="button" class="btn btn-light" data-logout="1">Sign out</button></div></aside><main class="app-main"><header class="app-top"><div><strong>'+h(activeOrg?.name||'No company selected')+'</strong><p>'+h(user?.email||'')+' · '+h(activeRole||'No role')+'</p></div><div class="btn-row" style="align-items:center;margin:0">'+orgSelector+'<span class="pill">AUTH + RLS</span></div></header><div class="app-content">'+content+'</div></main></div>';
}
function header(kicker,title,desc,right=''){return '<div class="app-head"><div><p class="eyebrow">'+h(kicker)+'</p><h1>'+h(title)+'</h1><p>'+h(desc)+'</p></div>'+right+'</div>';}
function owner(){return ['owner','admin'].includes(activeRole);}
function manager(){return owner()||activeRole==='project_manager';}
function internal(){return Boolean(activeRole)&&activeRole!=='client';}
function orgChooser(){
 let cards=orgs.map(o=>'<article class="panel"><h3>'+h(o.name)+'</h3><p>'+h(o.slug)+'</p><button class="btn btn-light" data-org="'+h(o.id)+'">Open workspace</button></article>').join('');
 return header('Tenant selection','Your organizations','Your memberships determine the workspaces you can enter.')+
 '<div class="grid">'+cards+'</div><section class="form-panel" style="margin-top:18px"><h2>Create a new organization</h2><p>Creates a separate tenant in the dedicated TEKTON database for your verified account.</p><form id="new-org-form"><div class="form-grid"><label class="field">Organization name<input name="name" minlength="3" maxlength="120" required></label><label class="field">Unique slug<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" minlength="3" maxlength="48" placeholder="my-construction-company" required></label></div><button class="btn" type="submit">Create tenant</button></form></section>';
}
function projectList(){
 const rows=projects.map(p=>'<tr><td><strong>'+h(p.name)+'</strong><small>'+h(p.code)+'</small></td><td>'+h(p.stage)+'</td><td>'+h(p.progress)+'%</td><td>'+money(p.baseline_budget)+'</td><td><button class="btn btn-light" data-project="'+h(p.id)+'">Open project</button></td></tr>').join('');
 let newProject=manager()?'<section class="form-panel"><h2>Add a project</h2><p>Creates a real project row, subject to PostgreSQL organization membership policies.</p><form id="new-project-form"><div class="form-grid"><label class="field">Project code<input name="code" minlength="2" maxlength="30" required></label><label class="field">Project name<input name="name" minlength="3" maxlength="150" required></label><label class="field">Baseline budget (USD)<input name="budget" type="number" min="0" max="1000000000" step="0.01" required></label><label class="field">Stage<select name="stage"><option>planning</option><option>active</option><option>on_hold</option></select></label></div><button class="btn" type="submit">Create project</button></form></section>':'';
 let rowsPanel=rows?'<div class="table-wrap"><table><thead><tr><th>Project</th><th>Stage</th><th>Progress</th><th>Baseline</th><th>View</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty">No authorized projects yet. Create a project or request access from an organization administrator.</div>';
 return header('Project delivery','Company projects','The database, not a role-switching dropdown, controls which projects you can see.')+newProject+rowsPanel;
}
function projectDetails(){
 const p=projects.find(p=>p.id===selectedProjectId);
 if(!p)return projectList();
 const changes=workflows.filter(w=>w.project_id===p.id&&w.kind==='variation'&&w.applied_at);
 const revised=changes.reduce((v,w)=>v+Number(w.amount||0),Number(p.baseline_budget||0));
 return header('Project workspace',p.name,p.code+' · '+p.stage,
 '<button class="btn btn-light" data-projectback="1">All projects</button>')+
 '<div class="stats"><div class="stat"><small>Original budget</small><strong>'+money(p.baseline_budget)+'</strong></div><div class="stat"><small>Applied change orders</small><strong>'+money(revised-p.baseline_budget)+'</strong></div><div class="stat"><small>Approved budget</small><strong>'+money(revised)+'</strong></div><div class="stat"><small>Progress</small><strong>'+h(p.progress)+'%</strong></div></div>'+
 '<div class="grid"><div class="panel"><h3>Workflow controls</h3><p>Material requests and variations must pass through independent checkers in sequence.</p><button class="btn btn-light" data-nav="workflows">Open approvals</button></div><div class="panel"><h3>Project documents</h3><p>Upload to a private, tenant-scoped bucket. Client access requires explicit publication.</p><button class="btn btn-light" data-nav="documents">Open documents</button></div></div>';
}
function workflowList(){
 const pOpts=projects.map(p=>'<option value="'+h(p.id)+'">'+h(p.name)+'</option>').join('');
 let form=internal()&&projects.length?'<section class="form-panel"><h2>Raise a controlled request</h2><p>Server-side RPC creates the workflow and its approval steps. A maker cannot approve their own request.</p><form id="new-workflow-form"><div class="form-grid"><label class="field">Project<select name="project">'+pOpts+'</select></label><label class="field">Type<select name="kind"><option value="material_request">Material request</option><option value="variation">Construction variation</option></select></label><label class="field wide">Subject<input name="title" minlength="8" maxlength="200" required></label><label class="field wide">Reason / supporting context<textarea name="description" maxlength="3000" required></textarea></label><label class="field">Estimated cost (USD)<input name="amount" type="number" step="0.01" min="0" max="1000000000" required></label><label class="field">Schedule impact (days)<input name="days" type="number" min="0" max="365" value="0"></label></div><button class="btn" type="submit">Submit for independent review</button></form></section>':'';
 let rows=workflows.map(w=>'<tr><td><strong>'+h(w.title)+'</strong><small>'+h(w.kind.replaceAll('_',' '))+'</small></td><td>'+h(projects.find(p=>p.id===w.project_id)?.name||'Assigned project')+'</td><td>'+money(w.amount)+'</td><td>'+h(w.status)+(w.applied_at?' · applied':'')+'</td><td><button class="btn btn-light" data-workflow="'+h(w.id)+'">Review</button></td></tr>').join('');
 return header('Independent approvals','Departmental decisions','The approval sequence and maker-checker rules are enforced by server-side database functions.')+
 form+(rows?'<div class="table-wrap"><table><thead><tr><th>Request</th><th>Project</th><th>Cost</th><th>Status</th><th>Open</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty">No requests are visible for this account.</div>');
}
function workflowDetail(){
 const w=workflows.find(w=>w.id===selectedWorkflowId);if(!w)return workflowList();
 const form=approvals.map(s=>{
  const canAct=s.decision==='pending'&&w.status==='pending';
  return '<div class="step"><div><strong>Step '+h(s.step_number)+' · '+h(s.assigned_role.replaceAll('_',' '))+'</strong><br><small>'+h(s.decision)+' · '+h(s.note||'')+'</small></div><span class="pill">'+h(s.decision)+'</span></div>'+
  (canAct?'<form class="step-action" data-step="'+h(s.id)+'"><label class="field" style="margin-bottom:6px">Decision note<input name="note" maxlength="1000" placeholder="Reason and supporting evidence"></label><div class="btn-row"><button class="btn" type="submit" name="decision" value="approved">Approve</button><button class="btn btn-light" type="submit" name="decision" value="rejected">Reject</button></div></form>':'');
 }).join('');
 const apply=w.kind==='variation'&&w.status==='approved'&&!w.applied_at&&manager()?'<button class="btn" data-apply="'+h(w.id)+'">Apply fully approved variation</button>':'';
 return header('Approval history',w.title,'Requested '+nice(w.created_at)+' · '+w.status,
 '<button class="btn btn-light" data-workflowback="1">All requests</button>')+
 '<div class="stats"><div class="stat"><small>Requested cost</small><strong>'+money(w.amount)+'</strong></div><div class="stat"><small>Schedule effect</small><strong>+'+h(w.days_delta)+' days</strong></div><div class="stat"><small>Project application</small><strong style="font-size:15px">'+(w.applied_at?'Applied '+nice(w.applied_at):'Not applied')+'</strong></div></div>'+
 '<section class="panel"><h2>Independent decision chain</h2><p>Buttons are only a convenience. The database verifies the actor role, project assignment, order, and independent checker identity before accepting a decision.</p>'+form+'<div class="btn-row">'+apply+'</div></section>';
}
function documentList(){
 const opts=projects.map(p=>'<option value="'+h(p.id)+'">'+h(p.name)+'</option>').join('');
 const form=internal()&&projects.length?'<section class="form-panel"><h2>Upload a private project file</h2><p>Allowed: PDF, JPEG, PNG, DOCX and XLSX. Maximum 20 MB. Uploads are not public, and metadata defaults to internal-only.</p><form id="upload-form"><div class="form-grid"><label class="field">Project<select name="project">'+opts+'</select></label><label class="field">Choose file<input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" required></label></div><button class="btn" type="submit">Upload privately</button></form></section>':'';
 const rows=docs.map(d=>'<tr><td><strong>'+h(d.file_name)+'</strong><small>'+h(d.mime_type)+'</small></td><td>'+h(projects.find(p=>p.id===d.project_id)?.name||'Assigned project')+'</td><td>'+h(d.visibility)+'</td><td>'+nice(d.created_at)+'</td><td><button class="btn btn-light" data-download="'+h(d.id)+'">Open securely</button> '+(manager()&&d.visibility==='internal'?'<button class="btn btn-light" data-publish="'+h(d.id)+'">Publish to assigned client</button>':'')+'</td></tr>').join('');
 return header('Evidence and files','Private document workspace','Files are tenant-scoped. A client can access only explicitly published files for assigned projects.')+form+
 (rows?'<div class="table-wrap"><table><thead><tr><th>File</th><th>Project</th><th>Visibility</th><th>Recorded</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty">No documents are visible in your authorized projects.</div>');
}
function teamPage(){
 return header('Enterprise access','Team membership','Administrators can attach already-verified accounts; secure invitation emails are the next engineering milestone.')+
 '<section class="panel"><h2>Your role</h2><p>Current membership: <strong>'+h(activeRole||'none')+'</strong></p><p>Roles are stored in the database, never in user-editable profile metadata.</p></section>'+
 (owner()?'<section class="form-panel"><h2>Add an existing verified user</h2><p>Enter a Supabase Auth user UUID already registered in this dedicated project. This action does not send an invitation email. The target user must accept organizational access under the later invitation workflow before general release.</p><form id="member-form"><label class="field">Verified user UUID<input name="user" required pattern="[0-9a-fA-F-]{36}" placeholder="00000000-0000-0000-0000-000000000000"></label><label class="field">Organization role<select name="role">'+ROLES.filter(r=>r!=='owner').map(r=>'<option>'+h(r)+'</option>').join('')+'</select></label><button class="btn" type="submit">Assign existing member</button></form></section>':'')+
 (manager()?'<section class="form-panel"><h2>Give a client access to a project</h2><p>Only a client already added to this organization can be assigned to a project.</p><form id="client-assignment-form"><label class="field">Client account UUID<input name="user" required pattern="[0-9a-fA-F-]{36}"></label><label class="field">Project<select name="project">'+projects.map(p=>'<option value="'+h(p.id)+'">'+h(p.name)+'</option>').join('')+'</select></label><button class="btn" type="submit">Assign client project access</button></form></section>':'');
}
function auditPage(){
 if(!internal())return header('Access limited','Audit events','Internal activity logs are not exposed to client accounts.');
 const rows=audit.map(e=>'<tr><td>'+nice(e.created_at)+'</td><td>'+h(e.event_type)+'</td><td>'+h(e.actor_id)+'</td><td><code>'+h(JSON.stringify(e.details).slice(0,150))+'</code></td></tr>').join('');
 return header('Decision evidence','Append-only audit history','Approval, membership and publication events are written by trusted database functions.')+
 (rows?'<div class="table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Actor</th><th>Details</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<div class="empty">No audit events are visible yet.</div>');
}
function renderWorkspace(){
 if(!user){authPage();return}
 if(!orgs.length){shell(orgChooser());return}
 if(!activeOrg){shell(orgChooser());return}
 let content=page==='projects'?(selectedProjectId?projectDetails():projectList()):page==='workflows'?(selectedWorkflowId?workflowDetail():workflowList()):page==='documents'?documentList():page==='team'?teamPage():auditPage();
 shell(content);
}
async function bootstrap(){
 if(!configValid()){unavailable();return}
 try{
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.119.2');
  db=createClient(cfg.supabaseUrl.replace(/\/$/,''),cfg.supabasePublishableKey,
   {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data,error}=await db.auth.getUser();if(error&&error.message!=='Auth session missing!')notice(error.message,true);
  user=data?.user||null;
  const hash=new URLSearchParams(location.hash.slice(1));
  authRecover=hash.get('type')==='recovery';
  db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')authRecover=true;
   if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED','PASSWORD_RECOVERY','INITIAL_SESSION'].includes(event)){
    setTimeout(async()=>{try{user=(await db.auth.getUser()).data?.user||null;if(user)await loadData();else authPage()}catch(e){notice(e.message,true)}},0)
   }});
  if(user)await loadData();else authPage();
 }catch(e){root.innerHTML='<div class="auth-body"><div class="auth-card"><h2>Workspace unavailable</h2><p>The secure application could not initialize. Confirm the dedicated Supabase endpoint and network connection.</p><a class="btn btn-light" href="../demo/">Back to public demo</a></div></div>';notice(e.message,true)}
}
async function loadData(){
 const {data,error}=await db.from('tekton_organizations').select('id,name,slug').order('created_at',{ascending:false});
 if(error)throw error;orgs=data||[];
 const preferred=sessionStorage.getItem('tekton.selected_org');
 activeOrg=orgs.find(o=>o.id===preferred)||orgs[0]||null;
 if(!activeOrg){activeRole=null;projects=[];workflows=[];docs=[];audit=[];renderWorkspace();return}
 const membership=await db.from('tekton_memberships').select('role').eq('organization_id',activeOrg.id).eq('user_id',user.id).maybeSingle();
 if(membership.error)throw membership.error;activeRole=membership.data?.role||null;
 await loadOrgData();renderWorkspace();
}
async function loadOrgData(){
 if(!activeOrg)return;
 const [p,w,d,a]=await Promise.all([
 db.from('tekton_projects').select('id,organization_id,code,name,stage,baseline_budget,progress,created_at').eq('organization_id',activeOrg.id).order('created_at',{ascending:false}),
 db.from('tekton_workflows').select('id,organization_id,project_id,kind,title,description,amount,days_delta,status,created_by,applied_at,created_at').eq('organization_id',activeOrg.id).order('created_at',{ascending:false}),
 db.from('tekton_documents').select('id,project_id,storage_path,file_name,mime_type,visibility,created_at').eq('organization_id',activeOrg.id).order('created_at',{ascending:false}),
 db.from('tekton_audit_events').select('id,organization_id,project_id,actor_id,event_type,details,created_at').eq('organization_id',activeOrg.id).order('created_at',{ascending:false}).limit(100)
 ]);
 for(const response of [p,w,d])if(response.error)throw response.error;
 projects=p.data||[];workflows=w.data||[];docs=d.data||[];audit=a.error?[]:a.data||[];
 if(!projects.some(p=>p.id===selectedProjectId))selectedProjectId=null;
 if(!workflows.some(w=>w.id===selectedWorkflowId)){selectedWorkflowId=null;approvals=[]}
 if(selectedWorkflowId)await loadApprovalSteps();
}
async function loadApprovalSteps(){
 if(!selectedWorkflowId){approvals=[];return}
 const r=await db.from('tekton_approval_steps')
 .select('id,workflow_id,step_number,assigned_role,decision,decided_by,decided_at,note')
 .eq('workflow_id',selectedWorkflowId).order('step_number');
 if(r.error)throw r.error;approvals=r.data||[];
}
async function perform(fn,success){
 try{const r=await fn();if(r?.error)throw r.error;
  if(success)notice(success);
  await loadData();return r?.data
 }catch(e){notice(e.message||'The action was not authorized.',true);return null}
}
function fval(fd,k){return String(fd.get(k)||'').trim()}
function validUUID(s){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)}
document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-nav],[data-logout],[data-org],[data-project],[data-projectback],[data-workflow],[data-workflowback],[data-apply],[data-download],[data-publish],[data-authmode]');
 if(!b)return;e.preventDefault();const d=b.dataset;
 if(d.authmode){authMode=d.authmode;authRecover=false;authPage();return}
 if(d.logout){await db.auth.signOut();user=null;activeOrg=null;orgs=[];authPage();return}
 if(d.org){activeOrg=orgs.find(o=>o.id===d.org)||null;if(activeOrg){sessionStorage.setItem('tekton.selected_org',activeOrg.id);await loadData()}return}
 if(d.nav){if(!activeOrg)return;page=d.nav;selectedProjectId=null;selectedWorkflowId=null;approvals=[];renderWorkspace();return}
 if(d.project){selectedProjectId=d.project;page='projects';renderWorkspace();return}
 if(d.projectback){selectedProjectId=null;renderWorkspace();return}
 if(d.workflow){selectedWorkflowId=d.workflow;page='workflows';try{await loadApprovalSteps();renderWorkspace()}catch(err){notice(err.message,true)}return}
 if(d.workflowback){selectedWorkflowId=null;approvals=[];renderWorkspace();return}
 if(d.apply){await perform(()=>db.rpc('tekton_apply_variation',{p_workflow:d.apply}),'Approved variation applied once to project reporting');return}
 if(d.download){const documentRecord=docs.find(x=>x.id===d.download);if(!documentRecord)return;
  try{const r=await db.storage.from(BUCKET).createSignedUrl(documentRecord.storage_path,60);
   if(r.error)throw r.error;if(r.data?.signedUrl)window.open(r.data.signedUrl,'_blank','noopener,noreferrer');
  }catch(err){notice(err.message,true)}return}
 if(d.publish){if(!confirm('Publish this document to assigned client users? This creates an audited project disclosure.'))return;
  await perform(()=>db.rpc('tekton_publish_document',{p_document:d.publish}),'Document published to authorized clients');return}
});
document.addEventListener('change',async e=>{
 if(e.target.id!=='org-picker')return;
 const found=orgs.find(x=>x.id===e.target.value);
 if(!found)return;
 activeOrg=found;sessionStorage.setItem('tekton.selected_org',found.id);
 selectedProjectId=null;selectedWorkflowId=null;approvals=[];page='projects';
 try{await loadData()}catch(err){notice(err.message,true)}
});
document.addEventListener('submit',async e=>{
 const f=e.target;if(!f.id&&!f.matches('.step-action'))return;
 e.preventDefault();const fd=new FormData(f);
 if(f.id==='auth-form'){
  try{
   const email=fval(fd,'email'),password=fval(fd,'password');
   if(authRecover){if(password.length<12)throw Error('Use a password of at least 12 characters.');
    const r=await db.auth.updateUser({password});if(r.error)throw r.error;authRecover=false;authMode='signin';notice('Password updated');await loadData();return}
   if(authMode==='reset'){const r=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
    if(r.error)throw r.error;notice('If that email exists, recovery instructions have been requested.');return}
   if(password.length<12)throw Error('Use a password of at least 12 characters.');
   const r=authMode==='signup'?await db.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}}):
    await db.auth.signInWithPassword({email,password});
   if(r.error)throw r.error;
   if(authMode==='signup'&&!r.data?.session)notice('Check your email for confirmation before signing in.');
   else{user=(await db.auth.getUser()).data?.user||null;if(user)await loadData()}
  }catch(err){notice(err.message,true)}
  return;
 }
 if(!user||!activeOrg&&f.id!=='new-org-form')return;
 if(f.id==='new-org-form'){await perform(()=>db.rpc('tekton_create_organization',{p_name:fval(fd,'name'),p_slug:fval(fd,'slug')}),'Organization created securely');page='projects';return}
 if(f.id==='new-project-form'){
  const code=fval(fd,'code'),name=fval(fd,'name'),budget=Number(fd.get('budget')),stage=fval(fd,'stage');
  if(!Number.isFinite(budget)||budget<0||!['planning','active','on_hold'].includes(stage))return notice('Invalid project details',true);
  await perform(()=>db.from('tekton_projects').insert({organization_id:activeOrg.id,code,name,stage,baseline_budget:budget,created_by:user.id}),'Project saved to dedicated tenant');return;
 }
 if(f.id==='new-workflow-form'){
  const proj=fval(fd,'project'),kind=fval(fd,'kind'),title=fval(fd,'title'),amount=Number(fd.get('amount')),days=Number(fd.get('days'));
  if(!projects.some(p=>p.id===proj)||!['material_request','variation'].includes(kind)||!Number.isFinite(amount)||!Number.isInteger(days))return notice('Invalid workflow details',true);
  await perform(()=>db.rpc('tekton_create_workflow',{p_project:proj,p_kind:kind,p_title:title,p_description:fval(fd,'description'),p_amount:amount,p_days_delta:days}),'Submitted for independent approvals');return;
 }
 if(f.matches('.step-action')){
  const submitter=e.submitter,decision=submitter?.value;
  if(!['approved','rejected'].includes(decision))return;
  await perform(()=>db.rpc('tekton_decide_workflow',{p_step:f.dataset.step,p_decision:decision,p_note:fval(fd,'note')}),'Decision audited and saved');return;
 }
 if(f.id==='member-form'){
  const id=fval(fd,'user'),role=fval(fd,'role');
  if(!validUUID(id)||!ROLES.includes(role)||role==='owner')return notice('Provide a valid verified user UUID and role',true);
  await perform(()=>db.rpc('tekton_add_existing_member',{p_org:activeOrg.id,p_user:id,p_role:role}),'Member role assigned by administrator');return;
 }
 if(f.id==='client-assignment-form'){
  const id=fval(fd,'user'),proj=fval(fd,'project');
  if(!validUUID(id)||!projects.some(p=>p.id===proj))return notice('Invalid project or user identifier',true);
  await perform(()=>db.rpc('tekton_assign_project_client',{p_org:activeOrg.id,p_project:proj,p_client:id}),'Client access scoped to selected project');return;
 }
 if(f.id==='upload-form'){
  const file=f.querySelector('input[name="file"]')?.files?.[0],projectId=fval(fd,'project');
  if(!file||!projects.some(p=>p.id===projectId)||!ALLOWED_MIME.has(file.type)||file.size<1||file.size>20971520)
   return notice('Use a supported file type up to 20 MB in your assigned project',true);
  const safeName=file.name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,100)||'document';
  const path=[activeOrg.id,projectId,user.id,crypto.randomUUID()+'-'+safeName].join('/');
  try{
   const upload=await db.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
   if(upload.error)throw upload.error;
   const r=await db.from('tekton_documents').insert({organization_id:activeOrg.id,project_id:projectId,
    storage_path:path,file_name:file.name.slice(0,200),mime_type:file.type,bytes:file.size,uploaded_by:user.id});
   if(r.error)throw Error('File uploaded but metadata was not recorded. An administrator must inspect the orphaned object; do not retry with the same path.');
   notice('File uploaded privately. Not visible to clients unless published.');
   await loadData();
  }catch(err){notice(err.message,true)}
  return;
 }
});
bootstrap();
