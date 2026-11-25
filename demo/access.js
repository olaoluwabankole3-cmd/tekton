/* TEKTON document control & role-scoped demo. All data is fictional and local to this browser. */
function s5Pages(role=data.role){
 const matrix={
 executive:['overview','projects','my-work','setup','procurement','inventory','variations','finance','site','documents','reports','insights','settings'],
 pm:['overview','projects','my-work','procurement','inventory','variations','site','documents','reports'],
 site:['overview','projects','my-work','procurement','inventory','site','documents'],
 qs:['overview','projects','my-work','procurement','variations','documents','reports'],
 procurement:['overview','my-work','procurement','inventory','documents'],
 finance:['overview','my-work','procurement','finance','documents','reports'],
 storekeeper:['overview','my-work','procurement','inventory','documents'],
 client:['client','documents']
 };return matrix[role]||['overview'];
}

function s5CanPage(page,role=data.role){return s5Pages(role).includes(page);}

function s5RoleProjects(role=data.role){
 const all=currentCompany().projects.map(p=>p.id);
 if(['executive','procurement','finance'].includes(role))return all;
 if(['pm','qs'].includes(role))return all.slice(0,2);
 return all.slice(0,1);
}

function s5ProjectAllowed(id,role=data.role){return s5RoleProjects(role).includes(id);}

function s5FirstPage(role=data.role){return role==='client'?'client':'overview';}

function s5IsLimited(){return ['site','storekeeper'].includes(data.role);}

function s5DocRoles(record){
 if(record.id.startsWith('order-'))return ['executive','pm','qs','procurement','finance'];
 if(record.id.startsWith('change-'))return ['executive','pm','qs'];
 if(record.id.startsWith('site-'))return record.status==='Published for client'?['executive','pm','site','client']:['executive','pm','site'];
 if(record.category==='Commercial')return ['executive','pm','qs','finance','procurement'];
 if(record.category==='HSE')return ['executive','pm','site','storekeeper'];
 if(record.category==='Schedules')return ['executive','pm','site','qs'];
 if(record.category==='Drawings')return ['executive','pm','site','qs'];
 return ['executive','pm'];
}

function s5SeedDocuments(companyId){
 const ps=companies.find(c=>c.id===companyId)?.projects||companies[0].projects,p=ps[0].id;
 const base=(id,name,category,classification,status,roles,description,lines,revision='A')=>({id,type:'Controlled document',name,category,classification,status,roles,projectId:p,revision,date:'2026-11-22',description,lines,owner:'Document Control',createdByRole:'site',history:[{who:'Document Control',title:'Fictional document registered',when:'22 Nov 2026',detail:'Sample metadata only'}],clientAllowed:status==='Published'&&roles.includes('client')});
 return [
  base('DOC-DRW-041','Issued structural drawing register','Drawings','Controlled','Approved',['executive','pm','site','qs'],'Issue register of current structural drawing revisions.',['Latest issued drawing revision C','Discipline: structural','Superseded revisions tracked by document controller'],'C'),
  base('DOC-MAT-012','Rebar material specification','Technical','Controlled','Approved',['executive','pm','site','qs','procurement','storekeeper'],'Approved sample construction material specification.',['Grade and certification checks','Procurement may view specification; cannot change technical approval.'],'B'),
  base('DOC-QA-018','Concrete pour quality checklist','Quality','Controlled','Approved',['executive','pm','site'],'Hold-point record for concrete quality control.',['Pre-pour site checks','Inspector sign-off','Sample only; not a real inspection.'],'B'),
  base('DOC-GRN-029','Warehouse receiving procedure','Stores','Controlled','Approved',['executive','pm','storekeeper','procurement','finance'],'Procedure for receipts, condition checks and stock posting.',['Match goods received against authorized PO.','Record rejected quantities separately.'],'A'),
  base('DOC-FIN-009','Subcontractor payment certificate','Finance','Confidential','Approved',['executive','finance','qs'],'Confidential commercial valuation sample.',['Sample payment assessment','Commercial information restricted to authorized finance and QS roles.'],'B'),
  base('DOC-PRO-032','Supplier tender evaluation','Procurement','Confidential','Approved',['executive','procurement','finance'],'Restricted supplier commercial evaluation record.',['Sample bid evaluation','Pricing and negotiation notes are not exposed to site or stores.'],'A'),
  base('DOC-LEG-005','Contract dispute legal memorandum','Legal','Confidential','Approved',['executive'],'Privileged management example; not legal advice or a real document.',['Sample internal legal register metadata','Restricted to executive access in this preview.'],'A'),
  base('DOC-CLI-014','Client-issued fortnightly progress summary','Client communication','Client release','Published',['executive','pm','client'],'Client-facing progress brief with approved disclosure boundaries.',['Project progress and completed milestones','Open risks suitable for client communication','No unpublished internal commercial information.'],'C'),
  base('DOC-HSE-006','Approved site safety and induction plan','HSE','Client release','Published',['executive','pm','site','storekeeper','client'],'Public-to-assigned-client site safety summary.',['Site induction requirements','Emergency procedures summary','Revision B is the approved client issue.'],'B'),
  base('DOC-CLI-021','Client-approved drawing transmittal','Drawings','Client release','Published',['executive','pm','site','qs','client'],'Released drawing transmittal for the assigned project.',['Drawing transmittal reference: TR-024','Approved-for-client revision B','No actual source drawings attached.'],'B')
 ];
}

function s5DocsDB(){if(!data.s5Docs)data.s5Docs={};if(!data.s5Docs[data.activeCompany])data.s5Docs[data.activeCompany]=s5SeedDocuments(data.activeCompany);return data.s5Docs[data.activeCompany];}

function s5Overrides(){if(!data.s5DocOverrides)data.s5DocOverrides={};if(!data.s5DocOverrides[data.activeCompany])data.s5DocOverrides[data.activeCompany]={};return data.s5DocOverrides[data.activeCompany];}

function s5CanSeeDoc(d,role=data.role){
 if(!d||!s5ProjectAllowed(d.projectId,role))return false;
 if(!(d.roles||[]).includes(role))return false;
 if(role==='client')return d.status==='Published'&&d.clientAllowed===true&&d.classification==='Client release';
 return true;
}

function s5Catalog(base){
 const automatic=base.map(d=>{
  const clientAllowed=d.id.startsWith('site-')&&d.status==='Published for client';
  const roles=s5DocRoles(d);
  return {...d,classification:clientAllowed?'Client release':d.id.startsWith('order-')||d.id.startsWith('change-')?'Controlled':'Internal',
  roles,clientAllowed,status:clientAllowed?'Published':d.status,owner:'System-generated sample',history:[],createdByRole:'site'};
 });
 const stored=s5DocsDB();const merged=[...stored,...automatic].map(d=>stored.find(x=>x.id===d.id)||({...d,...(s5Overrides()[d.id]||{})}));
 return merged.filter(d=>s5CanSeeDoc(d));
}

function s5DocumentById(id){return s3DocumentCatalog().find(d=>d.id===id);}

function s5IsDocumentController(){return ['executive','pm'].includes(data.role);}

function s5EditableDoc(d){return s5IsDocumentController()&&d&&s5CanSeeDoc(d)&&d.type==='Controlled document'&&(data.role==='executive'||s5ProjectAllowed(d.projectId));}

function s5DocTag(d){const color=d.status==='Published'?'green':d.status==='Draft'?'warning':'blue';return `<span class="tag ${color}">${esc(d.status)}</span>`;}

function s5DocumentRegister(){
 const list=s3DocumentCatalog(),q=(view.query||'').trim().toLowerCase(),cat=view.s5Category||'all';
 const visible=list.filter(d=>(cat==='all'||cat===d.category)&&`${d.name} ${d.id} ${d.category} ${getProject(d.projectId).name}`.toLowerCase().includes(q));
 const categories=[...new Set(list.map(d=>d.category))].sort();
 const totals={published:list.filter(d=>d.status==='Published').length,restricted:list.filter(d=>d.classification==='Confidential').length};
 const create=s5IsDocumentController()?`<button class="button" data-s5-action="new-doc">${icon('plus',15)} Register document</button>`:'';
 return heading('Controlled document repository','The right documents. The right people.','Project-scoped visibility, controlled revisions and client publication, illustrated with fictional sample records.',create)+
 `<div class="s5-notice">${icon('shield',19)} <div><strong>${esc(roleLabel(data.role))} · access-controlled view</strong><small>You see only the records authorized for this simulated role and assigned project. This is NOT authentication or secure server-side access.</small></div></div>`+
 `<div class="grid-3">${stat('Visible records',list.length,'Within this role and project scope','file')}${stat('Client-release records',totals.published,'Explicitly published records only','check')}${stat('Confidential in your view',totals.restricted,'Not visible to other roles','lock')}</div>`+
 `<section class="card gap-section"><div class="s5-doc-toolbar"><div><h2>Central repository</h2><p>Choose a document to inspect its revision, classification and audit history.</p></div><div class="s5-doc-filters"><input id="request-search" class="search" type="search" placeholder="Search permitted documents..." value="${esc(view.query||'')}"/><select id="s5-doc-category" aria-label="Filter by document category"><option value="all">All categories</option>${categories.map(c=>`<option value="${esc(c)}" ${cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div></div><div class="table-wrap"><table class="data-table s5-doc-table"><thead><tr><th>Document / revision</th><th>Project</th><th>Classification</th><th>Workflow</th><th></th></tr></thead><tbody>${visible.map(d=>`<tr><td><strong>${esc(d.name)}</strong><small>${esc(d.id)} · Rev ${esc(d.revision||'A')} · ${esc(d.category)}</small></td><td>${esc(getProject(d.projectId).name)}</td><td><span class="s5-class">${icon(d.classification==='Confidential'?'lock':'file',13)} ${esc(d.classification)}</span></td><td>${s5DocTag(d)}</td><td><button class="button secondary small" data-s5-action="open-doc" data-s5-id="${esc(d.id)}">View record</button></td></tr>`).join('')}</tbody></table></div>${!visible.length?'<div class="empty">No documents are available for this selection.</div>':''}</section>`+
 `<p class="disclaimer mt-2">All records and document previews are fictional. No signed PDFs or actual drawings are uploaded. Access checks in this browser demonstrate intended behavior only; production requires authenticated accounts, server-side authorization, secure storage, versioning and file audit trails.</p>`;
}

function s5DocumentPage(){
 const d=s5DocumentById(view.s3Doc);if(!d){view.s3Doc='';return s5DocumentRegister();}
 const manage=s5EditableDoc(d),canReview=manage&&d.status==='Draft'&&d.createdByRole!==data.role,
 canPublish=manage&&d.status==='Approved'&&d.classification==='Client release'&&d.roles.includes('client');
 const allowed=(d.roles||[]).map(roleLabel).join(', ');
 const actions=`<div class="s5-doc-actions">${manage?`<button class="button secondary" data-s5-action="access" data-s5-id="${esc(d.id)}">Edit access roles</button><button class="button secondary" data-s5-action="revise" data-s5-id="${esc(d.id)}">New revision</button>`:''}${canReview?`<button class="button" data-s5-action="approve" data-s5-id="${esc(d.id)}">Approve revision</button>`:''}${canPublish?`<button class="button" data-s5-action="publish" data-s5-id="${esc(d.id)}">Publish to client</button>`:''}${manage&&d.status==='Published'?`<button class="button secondary" data-s5-action="unpublish" data-s5-id="${esc(d.id)}">Withdraw client release</button>`:''}</div>`;
 return heading('Document control / '+esc(d.id),esc(d.name),'Revision '+esc(d.revision||'A')+' · '+esc(getProject(d.projectId).name),`<button class="button secondary" data-s5-action="back">${icon('arrow',14)} Back to documents</button>`)+
 `<div class="s5-document-details"><section class="card"><div class="s5-doc-titlebar"><span class="tag">${esc(d.classification)}</span>${s5DocTag(d)}</div><div class="eyebrow">${esc(d.category)} · ${esc(d.type)}</div><h2>${esc(d.name)}</h2><p class="muted">${esc(d.description||'Fictional document metadata.')}</p><div class="s5-meta">${[['Project',getProject(d.projectId).name],['Document ID',d.id],['Current revision',d.revision||'A'],['Recorded date',d.date||'Demo'],['Document controller',d.owner||'Fictional owner'],['Allowed roles',allowed],['Client release',d.clientAllowed&&d.status==='Published'?'Yes — approved':'No']].map(([k,v])=>`<div><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join('')}</div><h3>Illustrative record summary</h3><div class="s5-doc-lines">${(d.lines||[]).map((line,i)=>`<p><span>${String(i+1).padStart(2,'0')}</span>${esc(line)}</p>`).join('')||'<p>No source file contents in this demonstration.</p>'}</div>${actions}</section><section class="card"><h2>Document governance</h2><p class="muted">Who may see this record, what version is current and when client release is permitted.</p><div class="s5-governance">${[['Access principle','Role + assigned project'],['Classification',d.classification],['Publication',d.status==='Published'?'Client-approved issue':'Internal / unpublished'],['File availability','Metadata and summaries only']].map(([a,b])=>`<div><small>${esc(a)}</small><strong>${esc(b)}</strong></div>`).join('')}</div><div class="split-divider"></div><h3>Revision and access history</h3>${(d.history||[]).slice(-6).reverse().map(h=>`<div class="s5-audit-row"><strong>${esc(h.title)}</strong><small>${esc(h.who||'Demo')} · ${esc(h.when||'Sample')}</small><p>${esc(h.detail||'')}</p></div>`).join('')||'<p class="muted">Generated sample record — no authored revisions.</p>'}</section></div><p class="disclaimer mt-2">Not an authentic document, legal record or real permission system. No file upload or protected file download occurs in this demo.</p>`;
}

function s5LogDoc(d,title,detail){d.history=d.history||[];d.history.push({who:roleLabel(data.role),title,detail,when:new Date().toLocaleString('en-GB')});}

function s5NewDocModal(){
 const roles=['pm','site','qs','procurement','finance','storekeeper','client'];
 return `<div class="modal-layer" data-s5-action="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="Register sample document"><div class="modal-top"><div><span class="eyebrow">DOCUMENT CONTROL · SIMULATION</span><h2>Register controlled document</h2></div><button class="icon-btn" data-s5-action="close" aria-label="Close">${icon('close')}</button></div><form id="s5-create-doc-form"><div class="form-grid"><label class="field full">Document name<input name="name" required minlength="5" maxlength="100" placeholder="e.g. Approved foundation inspection plan"></label><label class="field">Project<select name="projectId">${getProjects().map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label class="field">Category<select name="category"><option>Drawings</option><option>Quality</option><option>Technical</option><option>HSE</option><option>Stores</option><option>Procurement</option><option>Finance</option><option>Commercial</option><option>Client communication</option></select></label><label class="field">Classification<select name="classification"><option>Controlled</option><option>Confidential</option><option>Client release</option></select></label><label class="field">Initial revision<input name="revision" value="A" maxlength="8"></label><label class="field full">Document purpose<textarea name="description" maxlength="320" required minlength="10"></textarea></label></div><div class="s5-role-choices"><strong>Grant access to these roles</strong><p class="muted">Executive oversight is always included. Client visibility is not activated until an independent approval and an explicit publish action.</p>${roles.map(role=>`<label><input name="allow_${role}" type="checkbox" value="yes" ${role==='pm'?'checked':''}/> ${esc(roleLabel(role))}</label>`).join('')}</div><div class="modal-footer"><button type="button" class="button secondary" data-s5-action="close">Cancel</button><button type="submit" class="button">Save draft record</button></div></form><p class="disclaimer mt-2">Demo metadata only. Do not enter confidential information or upload real documents.</p></div></div>`;
}

function s5AccessModal(){
 const d=s5DocumentById(view.s5EditId);
 if(!s5EditableDoc(d))return '';
 const roles=['pm','site','qs','procurement','finance','storekeeper','client'];
 return `<div class="modal-layer" data-s5-action="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="Manage document access"><div class="modal-top"><div><span class="eyebrow">DOCUMENT ACCESS</span><h2>${esc(d.name)}</h2></div><button class="icon-btn" data-s5-action="close" aria-label="Close">${icon('close')}</button></div><form id="s5-access-form"><p class="muted">Choose the roles that can view this sample record. Project scope continues to apply. Only Client release documents can be published to client representatives.</p><div class="s5-role-choices">${roles.map(role=>`<label><input name="allow_${role}" type="checkbox" value="yes" ${(d.roles||[]).includes(role)?'checked':''}/> ${esc(roleLabel(role))}</label>`).join('')}</div><p class="disclaimer">Changing access does not automatically publish or unpublish a document. An approved Client release is required for client visibility.</p><div class="modal-footer"><button class="button secondary" type="button" data-s5-action="close">Cancel</button><button type="submit" class="button">Save access policy</button></div></form></div></div>`;
}

function s5Modal(){return view.modal==='s5-new-doc'?s5NewDocModal():view.modal==='s5-access'?s5AccessModal():'';}

function s5GetRoles(form){
 const rs=['pm','site','qs','procurement','finance','storekeeper','client'];
 return ['executive',...rs.filter(r=>form.get('allow_'+r)==='yes')];
}

function s5Actions(e,el){
 const action=el.dataset.s5Action,id=el.dataset.s5Id;
 if(action==='backdrop'&&e.target!==el)return;
 if(action==='back'){view.s3Doc='';view.s5EditId='';render();return;}
 if(action==='close'||action==='backdrop'){view.modal='';render();return;}
 if(action==='new-doc'){if(!s5IsDocumentController())return notify('Only authorized document controllers can register documents.');view.modal='s5-new-doc';render();return;}
 if(action==='open-doc'){if(!s5CanPage('documents'))return notify('Documents are not available for this role.');const d=s5DocumentById(id);if(!d)return notify('Document unavailable for this role.');view.s3Doc=d.id;data.page='documents';view.query='';render();return;}
 const d=s5DocumentById(id);
 if(!s5EditableDoc(d))return notify('Document control is not available for this record or role.');
 if(action==='access'){view.s5EditId=d.id;view.modal='s5-access';render();return;}
 if(action==='approve'){
  if(d.status!=='Draft'||d.createdByRole===data.role)return notify('A different role must review the drafted document.');
  d.status='Approved';d.approvedByRole=data.role;s5LogDoc(d,'Approved for internal use','Independent review by '+roleLabel(data.role));
 }else if(action==='publish'){
  if(d.status!=='Approved'||d.classification!=='Client release'||!d.roles.includes('client'))return notify('Client release must be approved and explicitly shared.');
  d.status='Published';d.clientAllowed=true;s5LogDoc(d,'Published for assigned client','Publication approved; only assigned project client can view it.');
 }else if(action==='unpublish'){
  if(d.status!=='Published')return;d.status='Approved';d.clientAllowed=false;s5LogDoc(d,'Client release withdrawn','Client publication removed from demo view.');
 }else if(action==='revise'){
  if(d.type!=='Controlled document')return;
  const prior=d.revision||'A';d.revision=prior.length===1&&/[A-Y]/.test(prior)?String.fromCharCode(prior.charCodeAt(0)+1):prior+'-1';
  d.status='Draft';d.clientAllowed=false;d.createdByRole=data.role;s5LogDoc(d,'New revision opened','Previous revision '+prior+' superseded in the sample; current '+d.revision+' awaiting independent approval.');
 }else return;
 save();render();notify('Document control decision saved in this browser.');
}

function s5Submit(form){
 const f=new FormData(form);
 if(form.id==='s5-create-doc-form'){
  if(!s5IsDocumentController())return notify('Document controller role required.');
  const name=String(f.get('name')||'').trim(),projectId=String(f.get('projectId')||''),category=String(f.get('category')||''),classification=String(f.get('classification')||'Controlled'),revision=String(f.get('revision')||'A').trim(),description=String(f.get('description')||'').trim();
  if(name.length<5||name.length>100||description.length<10||!s5ProjectAllowed(projectId)||!['Controlled','Confidential','Client release'].includes(classification)||revision.length>8||!revision.length)return notify('Check project, classification and document fields.');
  const roles=s5GetRoles(f);if(classification!=='Client release'&&roles.includes('client'))return notify('Client access requires Client release classification.');
  const d={id:'DOC-'+Date.now().toString(36).toUpperCase(),type:'Controlled document',projectId,name,category,classification,revision,date:today(),description,lines:['Registered metadata only. No actual document uploaded.'],status:'Draft',roles,clientAllowed:false,owner:roleLabel(data.role),createdByRole:data.role,history:[]};
  s5LogDoc(d,'Draft created','Access roles: '+roles.map(roleLabel).join(', '));
  s5DocsDB().unshift(d);view.modal='';view.s3Doc=d.id;view.query='';data.page='documents';save();render();notify('Draft registered. Switch to a different authorized role for review.');return;
 }
 if(form.id==='s5-access-form'){
  const d=s5DocumentById(view.s5EditId);if(!s5EditableDoc(d))return notify('Access policy change not permitted.');
  const roles=s5GetRoles(f);if(d.classification!=='Client release'&&roles.includes('client'))return notify('Client access requires Client release classification.');
  // A published record must be withdrawn before removing client permission.
  if(d.status==='Published'&&!roles.includes('client')){d.status='Approved';d.clientAllowed=false;}
  d.roles=roles;s5LogDoc(d,'Access policy revised','Allowed roles: '+roles.map(roleLabel).join(', '));
  view.modal='';save();render();notify('Sample access policy updated.');return;
 }
}

function s5Events(){
 document.addEventListener('click',e=>{const el=e.target.closest('[data-s5-action]');if(!el)return;e.preventDefault();e.stopImmediatePropagation();s5Actions(e,el);},true);
 document.addEventListener('submit',e=>{if(!['s5-create-doc-form','s5-access-form'].includes(e.target.id))return;e.preventDefault();e.stopImmediatePropagation();s5Submit(e.target);},true);
 document.addEventListener('change',e=>{if(e.target.id==='s5-doc-category'){view.s5Category=e.target.value;render();}},true);
}

function s5RoleHome(){
 const allowed=s5Pages(),role=data.role,projects=getProjects(),mine=reqs().filter(r=>nextRole(r)===role),documents=s3DocumentCatalog();
 const summaries={
 pm:['Project coordination','Track assigned work packages, approvals, field reports and controlled drawings.'],
 site:['Site engineering','Raise requisitions, report progress and review drawings issued for your project.'],
 qs:['Quantity surveying','Review quantities, variations and the commercial evidence relevant to your projects.'],
 procurement:['Purchasing & supply','Compare quotations and move authorized requisitions into approved purchase orders.'],
 finance:['Finance control','Authorize expenditure, match invoices and inspect permitted commercial records.'],
 storekeeper:['Site stores','Receive purchase orders, issue stock, transfer materials and review store procedures.']
 };
 const title=summaries[role]?.[0]||'My workspace',desc=summaries[role]?.[1]||'Only the modules assigned to this role are displayed.';
 const cards=[
 ['Projects','projects','building','Review assigned projects'],
 ['My work','my-work','tasks','See tasks requiring your action'],
 ['Procurement','procurement','package',role==='storekeeper'?'Receive deliveries':'Review purchase workflows'],
 ['Inventory & Stores','inventory','layers',role==='site'?'Check availability':'Inspect permitted stock'],
 ['Variations','variations','layers','Evaluate technical and cost changes'],
 ['Cost & Finance','finance','wallet','Financial oversight'],
 ['Site Reports','site','hardhat','Site reporting and reviews'],
 ['Documents','documents','file','Review permitted controlled records'],
 ['Sample Reports','reports','chart','Project performance summaries']
 ].filter(c=>allowed.includes(c[1]));
 return heading('Your role workspace',title,desc)+`<div class="s5-notice">${icon('shield',19)}<div><strong>Viewing as ${esc(roleLabel(role))}</strong><small>Navigation and documents are filtered by simulated role and assigned projects. Sign-in and server-side permissions are not yet implemented.</small></div></div>`+
 `<div class="grid-3">${stat('Assigned projects',projects.length,'Within this example role scope','building')}${stat('Pending role actions',mine.length,'Tasks requiring this role','tasks')}${stat('Documents available',documents.length,'Authorized in this demo view','file')}</div>`+
 `<section class="s5-role-grid gap-section">${cards.map(([label,page,ic,desc])=>`<button class="s5-role-tile" data-page="${esc(page)}"><span>${icon(ic,20)}</span><strong>${esc(label)}</strong><small>${esc(desc)}</small>${icon('arrow',15)}</button>`).join('')}</section>`;
}

function s5SiteProjectDetail(){
 const p=getProjects().find(x=>x.id===view.selectedProject);if(!p){view.selectedProject='';return s5RoleHome();}
 const updates=reports().filter(r=>r.projectId===p.id);
 return heading('Assigned site / '+esc(p.id),esc(p.name),esc(p.location),`<button class="button secondary" data-action="back-projects">Back to projects</button>`)+`<div class="grid-3">${stat('Reported progress',p.progress+'%','Example site update','trend')}${stat('Site reports',updates.length,'Within assigned project','clipboard')}${stat('Documents',s3DocumentCatalog().filter(d=>d.projectId===p.id).length,'Visible to site role','file')}</div><section class="card gap-section"><h2>Site reports</h2>${updates.map(r=>`<div class="s5-audit-row"><strong>${esc(r.id)} · ${esc(r.summary)}</strong><small>${esc(r.date)}</small></div>`).join('')||'<p>No site reports recorded.</p>'}</section><div class="s5-doc-actions"><button class="button secondary" data-page="documents">View issued drawings</button><button class="button secondary" data-page="inventory">Check material availability</button></div>`;
}

function s5LimitedProcurement(){
 const role=data.role,rs=reqs().filter(r=>role==='storekeeper'?r.stage===5||r.stage===6||r.stage===7:true);
 return heading(role==='storekeeper'?'Store receiving':'Site requisitions',role==='storekeeper'?'Goods waiting for your store.':'Requests from your project.',role==='storekeeper'?'Only receipt status and quantities are shown; finance and tender details remain private.':'Submit material needs and see the approval progress without confidential supplier or finance data.',role==='site'?`<button class="button" data-s4-action="requisition">${icon('plus')} New requisition</button>`:'')+
 `<section class="card gap-section"><h2>${role==='storekeeper'?'Authorized purchase receipts':'Material request status'}</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Request</th><th>Project</th><th>Material</th><th>Quantity</th><th>Stage</th><th></th></tr></thead><tbody>${rs.map(r=>`<tr><td><b>${esc(r.id)}</b></td><td>${esc(getProject(r.projectId).name)}</td><td>${esc(r.item)}</td><td>${r.qty}</td><td>${esc(statusText(r))}</td><td><button class="button small secondary" data-request="${esc(r.id)}">Open</button></td></tr>`).join('')||'<tr><td colspan="6">No records for this role.</td></tr>'}</tbody></table></div></section>`;
}

function s5LimitedRequestDetail(r){
 if(!r||!reqs().some(x=>x.id===r.id)||data.role==='storekeeper'&&r.stage<5)return `<div class="empty">This request is outside your assigned responsibilities.</div>`;
 const received=(r.receipts||[]).reduce((n,x)=>n+(x.acceptedQty||0),0);
 return heading('Work package / '+esc(r.id),esc(r.item),esc(getProject(r.projectId).name),'<button class="button secondary" data-action="back-procurement">Back to queue</button>')+
 `<section class="card"><h2>${esc(statusText(r))}</h2><div class="s5-meta">${[['Material',r.item],['Requested quantity',String(r.qty)],['Accepted receipts',String(received)],['Project',getProject(r.projectId).name],['Reference',r.id]].map(([l,v])=>`<div><small>${esc(l)}</small><strong>${esc(v)}</strong></div>`).join('')}</div>${data.role==='storekeeper'&&r.stage===5?`<button class="button" data-action="advance-request">${icon('package',14)} Record incoming delivery</button>`:''}<div class="callout mt-2">Commercial pricing, supplier quotations and financial authorizations are not disclosed in this role view.</div></section>`;
}

function s5StockAvailability(){
 const db=s4DB(),stores=db.stores.filter(s=>s.id==='main'||s5ProjectAllowed(s.id)),list=db.items;
 return heading('Site inventory availability','Materials available to your assigned site.','View quantities only. Stock values and adjustments are controlled by other departments.')+
 `<section class="card"><h2>Availability by store</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Material</th>${stores.map(s=>`<th>${esc(s.name)}</th>`).join('')}<th>Unit</th></tr></thead><tbody>${list.map(it=>`<tr><td><b>${esc(it.name)}</b></td>${stores.map(s=>`<td>${s4Qty(it.sku,s.id)}</td>`).join('')}<td>${esc(it.unit)}</td></tr>`).join('')}</tbody></table></div></section><p class="disclaimer mt-2">Quantity-only fictional view. No stock valuations, other sites or procurement prices are displayed.</p>`;
}

function s5StoreScope(role=data.role){
 const db=s4DB();if(['executive','procurement','finance'].includes(role))return db.stores.map(s=>s.id);
 return db.stores.filter(s=>s.id==='main'||s5ProjectAllowed(s.id,role)).map(s=>s.id);
}

function s5StoreInventoryPage(){
 const db=s4DB(),ids=s5StoreScope(),stores=db.stores.filter(s=>ids.includes(s.id)),items=db.items,counts=db.counts.filter(c=>ids.includes(c.storeId)),movements=db.movements.filter(m=>ids.includes(m.storeId)).slice(-18).reverse(),storekeeper=data.role==='storekeeper',manager=data.role==='pm';
 const actions=storekeeper?`<button class="button" data-s4-action="issue">${icon('package',15)} Issue stock</button><button class="button secondary" data-s4-action="transfer">${icon('truck',15)} Transfer</button><button class="button secondary" data-s4-action="count">Record count</button><button class="button secondary" data-s4-action="new-item">New material</button>`:'';
 return heading('Inventory & Stores',storekeeper?'Your store & material movements.':'Store stock & count approvals.','Quantities and references for authorized locations only. Financial valuations are restricted.',`<div class="s4-actions">${actions}</div>`)+
 `<div class="s5-notice">${icon('shield',18)}<div><strong>${esc(roleLabel(data.role))} · ${stores.length} authorized stores</strong><small>Other project stores and inventory valuation are excluded from this view.</small></div></div>`+
 `<div class="grid-3">${stat('Authorized locations',stores.length,'Site and central store','building')}${stat('Materials tracked',items.length,'Sample catalogue SKUs','package')}${stat('Counts pending',counts.filter(x=>x.status==='Pending').length,'Awaiting independent sign-off','clipboard')}</div>`+
 `<section class="card gap-section"><h2>Stock quantities by location</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Material / unit</th>${stores.map(s=>`<th>${esc(s.name)}</th>`).join('')}</tr></thead><tbody>${items.map(it=>`<tr><td><b>${esc(it.name)}</b><small style="display:block;color:#999">${esc(it.sku)} · ${esc(it.unit)}</small></td>${stores.map(s=>`<td>${s4Qty(it.sku,s.id).toLocaleString()}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`+
 `<section class="card gap-section"><div class="s4-head"><h2>Stock count review</h2><span class="tag">${counts.filter(x=>x.status==='Pending').length} pending</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Count</th><th>Material</th><th>Store</th><th>System / physical</th><th>Status</th><th></th></tr></thead><tbody>${counts.slice().reverse().map(x=>`<tr><td>${esc(x.id)}</td><td>${esc(items.find(y=>y.sku===x.sku)?.name||x.sku)}</td><td>${esc(s4StoreName(x.storeId))}</td><td>${x.expected} / ${x.counted}</td><td>${esc(x.status)}</td><td>${manager&&x.status==='Pending'?`<button class="button small secondary" data-s4-action="approve-count" data-s4-id="${esc(x.id)}">Review</button>`:''}</td></tr>`).join('')||'<tr><td colspan="6">No physical counts in these locations yet.</td></tr>'}</tbody></table></div></section>`+
 `<section class="card gap-section"><h2>Recent movement references</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Type</th><th>Material</th><th>Store</th><th>Change</th></tr></thead><tbody>${movements.map(x=>`<tr><td>${esc(x.reference)}</td><td>${esc(x.type)}</td><td>${esc(items.find(y=>y.sku===x.sku)?.name||x.sku)}</td><td>${esc(s4StoreName(x.storeId))}</td><td>${x.delta>0?'+':''}${x.delta}</td></tr>`).join('')}</tbody></table></div></section>`+
 `<p class="disclaimer mt-2">Illustrative browser-local store permissions and stock records only, not secure real-world stock-control access.</p>`;
}

s5Events();
