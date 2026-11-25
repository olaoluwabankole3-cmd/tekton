/* TEKTON presentation: project registration and role-scoped assignments.
   Fictional records are saved in this browser only; production requires server-side RBAC. */
function s7AddedProjects(companyId=data.activeCompany){
 if(!data.s7AddedProjects)data.s7AddedProjects={};
 if(!data.s7AddedProjects[companyId])data.s7AddedProjects[companyId]=[];
 return data.s7AddedProjects[companyId];
}
function s7AllProjects(){return currentCompany().projects.concat(s7AddedProjects());}
function s7CanCreateProject(role=data.role){return role==='pm'||role==='executive';}
function s7CreateButton(){
 return s7CanCreateProject()?'<button class="button s7-create-project" type="button" data-s7-action="new-project">'+icon('plus',15)+' New project</button>':'';
}
function s7ProjectSummary(p){
 if(!p||!p.createdInDemo)return '';
 const currency=yhwhActive?'NGN':'USD';
 const dates=[p.startDate?'Starts '+prettyDate(p.startDate):'Start not set',p.endDate?'Ends '+prettyDate(p.endDate):'Completion not set'];
 return '<section class="card s7-project-summary"><div class="s7-summary-head"><div><div class="eyebrow">NEWLY REGISTERED · FICTIONAL DEMO</div><h2>'+esc(p.name)+'</h2></div><span class="tag blue">'+esc(p.status||'Planning')+'</span></div><p class="muted">'+esc(p.description||'No project description provided.')+'</p><div class="s7-meta"><div><small>Project code</small><strong>'+esc(p.id)+'</strong></div><div><small>Project manager</small><strong>'+esc(p.manager)+'</strong></div><div><small>Planned dates</small><strong>'+esc(dates.join(' · '))+'</strong></div><div><small>Approved baseline</small><strong>'+money(p.budget)+'</strong></div></div><p class="disclaimer">Fictional project data only. No real budget approval, file storage or employee assignments occur in this preview. Currency: '+currency+'.</p></section>';
}
function s7Modal(){
 const projectRoles=[['site','Site Engineer'],['qs','Quantity Surveyor'],['procurement','Procurement Officer'],['finance','Finance Officer'],['storekeeper','Site Storekeeper']];
 const currency=yhwhActive?'NGN (₦)':'USD ($)';
 return '<div class="modal-layer" data-s7-action="backdrop"><div class="modal s7-modal" role="dialog" aria-modal="true" aria-labelledby="s7-modal-title"><div class="modal-top"><div><div class="eyebrow">PROJECT REGISTRATION · DEMO</div><h2 id="s7-modal-title">Create a new project</h2></div><button class="icon-btn" type="button" data-s7-action="close" aria-label="Close dialog">'+icon('close')+'</button></div>'+
 '<p class="muted s7-intro">Set up a project workspace for procurement, stores, reports, variation requests and controlled documents. This demonstration stores records only in your browser.</p>'+
 '<form id="s7-new-project-form"><div class="form-grid">'+
 '<label class="field full">Project name <input name="name" required maxlength="100" minlength="4" placeholder="e.g. Lagos office expansion"></label>'+
 '<label class="field">Project type <select name="type" required><option value="Building construction">Building construction</option><option value="Civil infrastructure">Civil infrastructure</option><option value="Power & utilities">Power & utilities</option><option value="Roads & drainage">Roads & drainage</option><option value="Commercial">Commercial</option><option value="Residential">Residential</option><option value="Other">Other</option></select></label>'+
 '<label class="field">City / site location <input name="location" required minlength="3" maxlength="110" placeholder="e.g. Ikeja, Lagos"></label>'+
 '<label class="field">Contract value · '+currency+' <input name="value" required type="number" min="0" max="100000000000000" step="0.01" placeholder="0"></label>'+
 '<label class="field">Approved baseline budget · '+currency+' <input name="budget" required type="number" min="0" max="100000000000000" step="0.01" placeholder="0"></label>'+
 '<label class="field">Planned start date <input name="startDate" type="date" aria-label="Planned start date"></label>'+
 '<label class="field">Target completion <input name="endDate" type="date" aria-label="Target completion date"></label>'+
 '<label class="field full">Project manager <input name="manager" required minlength="3" maxlength="80" value="Demo Project Manager" placeholder="Assigned project manager"></label>'+
 '<label class="field full">Project description <textarea name="description" maxlength="380" placeholder="Briefly describe the scope of work and responsibilities"></textarea></label></div>'+
 '<fieldset class="s7-access-roles"><legend>Project workspace access</legend><p>Executive Director and Project Manager are included. Assign the departments that will participate in this demonstration; the Client Representative is not granted access automatically.</p><div class="s7-role-grid">'+projectRoles.map(([id,label])=>'<label><input type="checkbox" name="access_'+id+'" value="yes" checked> '+esc(label)+'</label>').join('')+'</div></fieldset>'+
 '<div class="modal-footer"><button type="button" class="button secondary" data-s7-action="close">Cancel</button><button type="submit" class="button">Create project '+icon('arrow',14)+'</button></div></form><p class="disclaimer">Demo only: permissions are simulated, not authenticated. Do not enter confidential or real company information.</p></div></div>';
}
function s7SaveProject(form){
 if(!s7CanCreateProject())return notify('Only the Project Manager or Executive Director can register a project.');
 const f=new FormData(form);
 const read=k=>String(f.get(k)||'').trim();
 const name=read('name'),location=read('location'),manager=read('manager'),type=read('type'),description=read('description');
 const value=Number(read('value')),budget=Number(read('budget'));
 const startDate=read('startDate'),endDate=read('endDate');
 const types=['Building construction','Civil infrastructure','Power & utilities','Roads & drainage','Commercial','Residential','Other'];
 if(name.length<4||name.length>100||location.length<3||location.length>110||manager.length<3||manager.length>80||!types.includes(type))return notify('Enter a valid name, manager, type and site location.');
 if(!read('value')||!read('budget')||!Number.isFinite(value)||!Number.isFinite(budget)||value<0||budget<0||value>1e14||budget>1e14)return notify('Enter valid, nonnegative contract and budget figures.');
 if(startDate&&!/^\d{4}-\d{2}-\d{2}$/.test(startDate))return notify('Invalid start date.');
 if(endDate&&!/^\d{4}-\d{2}-\d{2}$/.test(endDate))return notify('Invalid completion date.');
 if(startDate&&endDate&&endDate<startDate)return notify('Completion must not be earlier than project start.');
 if(s7AllProjects().some(p=>p.name.toLowerCase()===name.toLowerCase()))return notify('A project with this name already exists in this workspace.');
 const roles=['pm','site','qs','procurement','finance','storekeeper'].filter(role=>role==='pm'||f.get('access_'+role)==='yes');
 const prefix=data.activeCompany==='yhwh'?'YH':'PRJ';
 let id;do{id=prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.floor(Math.random()*999).toString().padStart(3,'0');}while(s7AllProjects().some(p=>p.id===id));
 const project={id,name:name.slice(0,100),location:location.slice(0,110),manager:manager.slice(0,80),type,value,budget,spent:0,progress:0,status:'Planning',description:description.slice(0,380),startDate,endDate,accessRoles:roles,createdInDemo:true,createdByRole:data.role,createdAt:today()};
 s7AddedProjects().push(project);
 const inv=s4DB();
 if(!inv.stores.some(x=>x.id===id))inv.stores.push({id,name:project.name.slice(0,58)+' — Site Store',kind:'Project store'});
 view.modal='';view.selectedProject=id;view.selectedReq='';view.projectTab='overview';data.page='projects';
 save();render();notify('Sample project registered — now available in Projects, procurement and site stores.');
}
function s7Events(){
 document.addEventListener('click',e=>{
  const el=e.target.closest('[data-s7-action]');if(!el)return;
  const action=el.dataset.s7Action;
  if(action==='backdrop'&&e.target!==el)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(action==='new-project'){
   if(!s7CanCreateProject())return notify('Project creation is available to the Project Manager or Executive Director.');
   view.modal='s7-new-project';render();return;
  }
  if(action==='close'||action==='backdrop'){view.modal='';render();}
 },true);
 document.addEventListener('submit',e=>{
  if(e.target.id!=='s7-new-project-form')return;
  e.preventDefault();e.stopImmediatePropagation();
  s7SaveProject(e.target);
 },true);
}
s7Events();
