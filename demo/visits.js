/* TEKTON field-visit activity log. Fictional browser-only records; no GPS or real employee tracking. */
function s6Seed(company){
 const p=company==='summit'?'s1':'p1';
 const h=(title,detail,who,when)=>({title,detail,who,when});
 const sample=[
 {id:company==='summit'?'VIS-5201':'VIS-4201',projectId:p,ownerRole:'site',person:'Demo Site Engineer',type:'Site inspection',destination:company==='summit'?'Aurora Tech Campus — Podium':'Harbour View Residences — Block C',purpose:'Inspect the work area and document outstanding quality observations.',expectedBack:'2026-11-25T16:30',departedAt:'2026-11-25T08:10:00',returnedAt:'',status:'Out of office',stops:[{place:company==='summit'?'Aurora Tech Campus — Podium':'Harbour View Residences — Block C',at:'2026-11-25T08:48:00',notes:'Sample progress inspection and coordination.'}],outcome:'',followUp:'',review:null,history:[h('Visit registered','Inspection visit recorded in sample activity register.','Demo Site Engineer','25 Nov 2026, 08:00'),h('Departed office','Marked out of office.','Demo Site Engineer','25 Nov 2026, 08:10'),h('Destination recorded','Site arrival recorded manually.','Demo Site Engineer','25 Nov 2026, 08:48')]},
 {id:company==='summit'?'VIS-5202':'VIS-4202',projectId:p,ownerRole:'procurement',person:'Demo Procurement Officer',type:'Supplier visit',destination:company==='summit'?'Westlands Materials Depot':'Ikeja Materials Supplier',purpose:'Discuss fictional delivery schedules for approved material packages.',expectedBack:'2026-11-24T17:00',departedAt:'2026-11-24T10:15:00',returnedAt:'2026-11-24T13:45:00',status:'Returned',stops:[{place:company==='summit'?'Westlands Materials Depot':'Ikeja Materials Supplier',at:'2026-11-24T10:52:00',notes:'Discussed sample delivery lead times.'}],outcome:'Reviewed supplier lead times; follow-up quotation required.',followUp:'Procurement team to compare quotations.',review:null,history:[h('Visit registered','Supplier visit logged.','Demo Procurement Officer','24 Nov 2026, 10:00'),h('Departed office','Departure recorded manually.','Demo Procurement Officer','24 Nov 2026, 10:15'),h('Returned to office','Outcome submitted for independent review.','Demo Procurement Officer','24 Nov 2026, 13:45')]},
 {id:company==='summit'?'VIS-5203':'VIS-4203',projectId:p,ownerRole:'qs',person:'Demo Quantity Surveyor',type:'Client meeting',destination:company==='summit'?'Nairobi Project Coordination Office':'Magodo Project Coordination Office',purpose:'Review sample progress valuation and changes.',expectedBack:'2026-11-23T15:00',departedAt:'2026-11-23T09:05:00',returnedAt:'2026-11-23T12:50:00',status:'Reviewed',stops:[{place:company==='summit'?'Nairobi Project Coordination Office':'Magodo Project Coordination Office',at:'2026-11-23T10:10:00',notes:'Met project representative to discuss measured work.'}],outcome:'Reviewed current valuation questions and agreed a sample follow-up list.',followUp:'Prepare revised quantity notes.',review:{byRole:'pm',by:'Demo Project Manager',at:'2026-11-23T15:20:00',result:'Accepted',note:'Visit documented.'},history:[h('Visit registered','Valuation meeting registered.','Demo Quantity Surveyor','23 Nov 2026, 08:50'),h('Returned to office','Outcome and follow-up submitted.','Demo Quantity Surveyor','23 Nov 2026, 12:50'),h('Manager reviewed','Visit closure accepted.','Demo Project Manager','23 Nov 2026, 15:20')]}
 ];
 return sample;
}

function s6DB(){
 if(!data.s6Visits)data.s6Visits={};
 if(!data.s6Visits[data.activeCompany])data.s6Visits[data.activeCompany]=s6Seed(data.activeCompany);
 return data.s6Visits[data.activeCompany];
}

function s6Allowed(){return s5CanPage('visits');}

function s6CanSubmit(){return ['executive','pm','site','qs','procurement','finance','storekeeper'].includes(data.role)&&s6Allowed();}

function s6Mine(r){return r&&r.ownerRole===data.role;}

function s6Visible(r){
 if(!r||!s6Allowed())return false;
 if(data.role==='executive')return true;
 if(s6Mine(r))return s5ProjectAllowed(r.projectId);
 if(data.role==='pm')return r.ownerRole!=='executive'&&s5ProjectAllowed(r.projectId);
 return false;
}

function s6Records(){return s6DB().filter(s6Visible);}

function s6Reviewable(r){
 return r&&r.status==='Returned'&&s6Visible(r)&&r.ownerRole!==data.role&&(
 data.role==='executive'||(data.role==='pm'&&!['pm','executive'].includes(r.ownerRole))
 );
}

function s6CanUpdate(r){return !!(r&&s6Mine(r)&&s6Visible(r));}

function s6Stamp(){return new Date().toISOString();}

function s6LabelTime(v){if(!v)return 'Not recorded';try{return new Date(v).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'});}catch{return String(v)}}

function s6VisitType(t){return ['Site inspection','Client meeting','Supplier visit','Regulatory visit','Materials pickup','Project coordination','Other'].includes(t);}

function s6Log(r,title,detail){
 if(!Array.isArray(r.history))r.history=[];
 r.history.push({title,detail:detail||'',who:'Demo '+roleLabel(data.role),when:s6LabelTime(s6Stamp())});
}

function s6Ref(){return 'VIS-'+Date.now().toString(36).toUpperCase()+'-'+Math.floor(Math.random()*900+100);}

function s6Status(r){return r.status==='Out of office'?(new Date(r.expectedBack).getTime()<Date.now()?'Overdue · out of office':'Out of office'):r.status==='Returned'?'Awaiting review':r.status;}

function s6Badge(r){return `<span class="tag ${r.status==='Reviewed'?'green':r.status==='Out of office'?'warning':'blue'}">${esc(s6Status(r))}</span>`;}

function s6EstimatedLocal(hours){
 const d=new Date(Date.now()+hours*3600000);
 return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
}

function s6Page(){
 const visits=s6Records(),filter=view.s6Filter||'all';
 const shown=visits.filter(v=>filter==='all'||filter==='mine'&&s6Mine(v)||filter==='out'&&v.status==='Out of office'||filter==='review'&&v.status==='Returned'||filter==='closed'&&v.status==='Reviewed');
 const canAct=s6CanSubmit();
 const description=data.role==='executive'?'Company-wide record of field visits, destinations, return times and outstanding reviews.':data.role==='pm'?'Your assigned project visits, including relevant team activity and review queue.':'Your own offsite visits, with destination, departure, return and outcomes.';
 const filters=[['all','All relevant'],['mine','My visits'],['out','Out of office'],['review','Awaiting review'],['closed','Reviewed']];
 return heading('Field operations / activity log','Know where work happens beyond the office.',description,canAct?`<button class="button" data-s6-action="new">${icon('plus',15)} Log a field visit</button>`:'')+
 `<div class="s6-note">${icon('shield',18)}<div><strong>Work-related visits only · manually recorded</strong><span>These are fictional sample records. The demo does not collect GPS coordinates, track movement automatically or verify that a destination was visited.</span></div></div>`+
 `<div class="grid-4">${stat('Visible visits',visits.length,'Scoped to your role','clipboard')}${stat('Marked out',visits.filter(v=>v.status==='Out of office').length,'No automatic location tracking','location')}${stat('Awaiting review',visits.filter(v=>v.status==='Returned').length,'Submitted return summaries','clock')}${stat('Reviewed',visits.filter(v=>v.status==='Reviewed').length,'Completed log entries','check')}</div>`+
 `<section class="card gap-section"><div class="s6-head"><div><h2>Offsite visit register</h2><p class="muted">Record intended and actual destinations, business purpose, departure, return and outcome.</p></div>${data.role==='executive'?'<span class="tag">Management oversight</span>':''}</div><div class="s6-filters">${filters.map(([id,label])=>`<button data-s6-action="filter" data-s6-value="${id}" class="filter ${filter===id?'active':''}" aria-pressed="${filter===id}">${label}</button>`).join('')}</div><div class="table-wrap"><table class="data-table s6-table"><thead><tr><th>Visit / staff role</th><th>Destination & purpose</th><th>Project</th><th>Time out</th><th>Status</th><th></th></tr></thead><tbody>${shown.slice().reverse().map(v=>`<tr><td><b>${esc(v.id)}</b><small>${esc(v.person)}</small></td><td><b>${esc(v.destination)}</b><small>${esc(v.type)} · ${esc(v.purpose)}</small></td><td>${esc(currentCompany().projects.find(p=>p.id===v.projectId)?.name||'—')}</td><td>${esc(s6LabelTime(v.departedAt))}</td><td>${s6Badge(v)}</td><td><button class="button secondary small" data-s6-action="open" data-s6-id="${esc(v.id)}">View log</button></td></tr>`).join('')||'<tr><td colspan="6">No visits match this view.</td></tr>'}</tbody></table></div></section>`+
 `<div class="s6-info-grid"><section class="card"><h2>What staff record</h2><p class="muted">Destination, work purpose, assigned project, planned return, departure, visited stops and a return summary with follow-up actions.</p></section><section class="card"><h2>What managers review</h2><p class="muted">Which staff are currently out, what project they are visiting, time away from the office and whether a visit outcome has been submitted and independently reviewed.</p></section></div>`+
 `<p class="disclaimer mt-2">Fictional, browser-local field visit register. No real identity verification, employee GPS tracking, secure timestamps, approval enforcement or company attendance integration exists in this demonstration.</p>`;
}

function s6Detail(){
 const r=s6DB().find(x=>x.id===view.s6Visit);if(!s6Visible(r)){view.s6Visit='';return s6Page();}
 const manager=s6Reviewable(r),me=s6CanUpdate(r);
 const actions=`${me&&r.status==='Planned'?`<button class="button" data-s6-action="depart" data-s6-id="${esc(r.id)}">${icon('location',14)} Mark departed office</button>`:''}${me&&r.status==='Out of office'?`<button class="button secondary" data-s6-action="stop" data-s6-id="${esc(r.id)}">Record visited location</button><button class="button" data-s6-action="return" data-s6-id="${esc(r.id)}">Record return to office</button>`:''}${me&&r.status==='Returned'&&r.review?.result==='Needs correction'?`<button class="button" data-s6-action="return" data-s6-id="${esc(r.id)}">Update return report</button>`:''}${manager?`<button class="button" data-s6-action="review" data-s6-id="${esc(r.id)}">Review visit log</button>`:''}`;
 const card=(label,val)=>`<div><small>${esc(label)}</small><strong>${esc(val)}</strong></div>`;
 return heading('Field visit / '+esc(r.id),esc(r.destination),esc(r.type)+' · '+esc(currentCompany().projects.find(p=>p.id===r.projectId)?.name||''),`<button class="button secondary" data-s6-action="back">${icon('arrow',14)} All visits</button>`)+
 `<div class="s6-detail-grid"><section class="card"><div class="s6-detail-top"><div><div class="eyebrow">OUT-OF-OFFICE RECORD</div><h2>Visit itinerary & outcome</h2></div>${s6Badge(r)}</div><p class="muted">${esc(r.purpose)}</p><div class="s6-meta">${[['Visit reference',r.id],['Employee / role',r.person],['Project',currentCompany().projects.find(p=>p.id===r.projectId)?.name||'—'],['Planned destination',r.destination],['Planned return',s6LabelTime(r.expectedBack)],['Departure',s6LabelTime(r.departedAt)],['Return',s6LabelTime(r.returnedAt)],['Manager review',r.review?.result||'Not yet reviewed']].map(x=>card(...x)).join('')}</div><h3>Locations recorded during this visit</h3><div class="s6-stops">${(r.stops||[]).map((s,i)=>`<div><span>${i+1}</span><div><strong>${esc(s.place)}</strong><small>${esc(s6LabelTime(s.at))}</small><p>${esc(s.notes||'')}</p></div></div>`).join('')||'<p class="muted">No actual visited location has been recorded yet. The planned destination is not proof of attendance.</p>'}</div><h3>Return report</h3>${r.ownerRole==='executive'&&r.status==='Returned'?'<p class="callout">Executive activity requires a separately designated oversight reviewer in production; self-approval is not permitted and this demo does not provide a board/audit reviewer role.</p>':''}${r.outcome?`<p class="s6-outcome">${esc(r.outcome)}</p><p class="muted"><strong>Follow-up:</strong> ${esc(r.followUp||'None recorded')}</p>`:'<p class="muted">Return outcome not submitted yet.</p>'}<div class="s6-actions">${actions}</div></section><section class="card"><h2>Accountability timeline</h2><p class="muted">An example audit-style log. Entries are local to this browser.</p><div class="s6-audit">${(r.history||[]).slice().reverse().map(h=>`<div><strong>${esc(h.title)}</strong><small>${esc(h.who)} · ${esc(h.when)}</small><p>${esc(h.detail||'')}</p></div>`).join('')}</div>${r.review?`<div class="callout mt-2"><strong>Management decision</strong><p>${esc(r.review.result)} by ${esc(r.review.by)}.</p><p>${esc(r.review.note||'')}</p></div>`:''}</section></div><p class="disclaimer mt-2">All visit names and destinations are invented. Role selection is not secure identity authentication and timestamps can be manipulated in a browser-only prototype.</p>`;
}

function s6Modal(){
 const type=view.modal,visit=s6DB().find(r=>r.id===view.s6Visit),projects=getProjects();
 let title='',body='';
 if(type==='s6-new'){title='Register an out-of-office visit';body=`<form id="s6-new-form"><p class="muted">Log a work-related destination before you leave. No automatic GPS location is collected.</p><div class="form-grid"><label class="field">Project<select required name="projectId">${projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label class="field">Visit purpose category<select name="type">${['Site inspection','Client meeting','Supplier visit','Regulatory visit','Materials pickup','Project coordination','Other'].map(t=>`<option>${t}</option>`).join('')}</select></label><label class="field full">Planned destination<input name="destination" required minlength="4" maxlength="110" placeholder="Site, address or organization"/></label><label class="field full">Reason for going out<textarea name="purpose" required minlength="10" maxlength="300" placeholder="Describe the work to be completed"></textarea></label><label class="field full">Expected office return (local time)<input name="expectedBack" type="datetime-local" required value="${s6EstimatedLocal(4)}"/></label></div><div class="modal-footer"><button type="button" class="button secondary" data-s6-action="close">Cancel</button><button type="submit" class="button">Register visit</button></div></form>`;}
 else if(type==='s6-stop'&&visit){title='Record a location visited';body=`<form id="s6-stop-form"><p class="muted">Only record the actual location you visited. The time is recorded when you submit.</p><div class="form-grid"><label class="field full">Actual visited location<input name="place" maxlength="110" minlength="4" required value="${esc(visit.stops?.length?'':visit.destination)}"/></label><label class="field full">What happened at this location?<textarea name="notes" maxlength="240" minlength="5" required></textarea></label></div><div class="modal-footer"><button type="button" class="button secondary" data-s6-action="close">Cancel</button><button type="submit" class="button">Add location</button></div></form>`;}
 else if(type==='s6-return'&&visit){title='Submit an office return report';body=`<form id="s6-return-form"><p class="muted">Confirm the actual destination and results. TEKTON records a return timestamp when submitted.</p><div class="form-grid"><label class="field full">Last location visited<input name="place" required minlength="4" maxlength="110" value="${esc(visit.stops?.at(-1)?.place||visit.destination)}"/></label><label class="field full">What was accomplished?<textarea name="outcome" required minlength="10" maxlength="380">${esc(visit.outcome||'')}</textarea></label><label class="field full">Follow-up actions (optional)<textarea name="followUp" maxlength="240">${esc(visit.followUp||'')}</textarea></label></div><div class="modal-footer"><button type="button" class="button secondary" data-s6-action="close">Cancel</button><button type="submit" class="button">Submit return report</button></div></form>`;}
 else if(type==='s6-review'&&visit){title='Review visit completion';body=`<form id="s6-review-form"><div class="callout">${esc(visit.person)} · ${esc(visit.destination)}<p>Return summary: ${esc(visit.outcome||'Not submitted')}</p></div><label class="field full mt-2">Manager decision<select name="decision" required><option value="Accepted">Accept return report</option><option value="Needs correction">Request clarification</option></select></label><label class="field full mt-2">Review notes<textarea name="note" maxlength="240" minlength="4" required></textarea></label><div class="modal-footer"><button type="button" class="button secondary" data-s6-action="close">Cancel</button><button class="button" type="submit">Record review</button></div></form>`;}
 else return '';
 return `<div class="modal-layer" data-s6-action="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-top"><div><span class="eyebrow">TEKTON · FIELD ACTIVITY LOG</span><h2>${esc(title)}</h2></div><button class="icon-btn" data-s6-action="close" aria-label="Close dialog">${icon('close')}</button></div>${body}<p class="disclaimer mt-2">Fictional business records only; do not enter real employee movements or private location information in this public demo.</p></div></div>`;
}

function s6Action(el){
 const a=el.dataset.s6Action,id=el.dataset.s6Id,r=s6DB().find(x=>x.id===(id||view.s6Visit));
 if(a==='close'||a==='backdrop'){view.modal='';render();return;}
 if(a==='back'){view.s6Visit='';render();return;}
 if(a==='filter'){view.s6Filter=['all','mine','out','review','closed'].includes(el.dataset.s6Value)?el.dataset.s6Value:'all';render();return;}
 if(a==='new'){if(!s6CanSubmit())return notify('Not available for this role.');view.modal='s6-new';render();return;}
 if(a==='open'){if(!s6Visible(r))return notify('Visit unavailable for this role.');view.s6Visit=id;data.page='visits';view.modal='';render();return;}
 if(!s6Visible(r))return notify('Visit unavailable for this role.');
 if(a==='depart'){if(!s6CanUpdate(r)||r.status!=='Planned')return notify('Only the registered visitor can depart.');r.departedAt=s6Stamp();r.status='Out of office';s6Log(r,'Departed office','Staff member manually marked departure for '+r.destination);save();render();notify('Departure recorded. Record locations you actually visit.');return;}
 if(a==='stop'||a==='return'){if(!s6CanUpdate(r)||a==='stop'&&r.status!=='Out of office'||a==='return'&&!['Out of office','Returned'].includes(r.status))return notify('This action is not available for your visit.');if(a==='return'&&r.status==='Returned'&&r.review?.result!=='Needs correction')return notify('This return has already been submitted.');view.modal='s6-'+a;render();return;}
 if(a==='review'){if(!s6Reviewable(r))return notify('A different authorized manager must review this visit.');view.modal='s6-review';render();return;}
}

function s6Submit(form){
 const id=form.id,f=new FormData(form);
 if(id==='s6-new-form'){
  if(!s6CanSubmit())return notify('Visit registration is not available.');
  const projectId=String(f.get('projectId')||''),type=String(f.get('type')||''),destination=String(f.get('destination')||'').trim(),purpose=String(f.get('purpose')||'').trim(),expectedBack=String(f.get('expectedBack')||'');
  const back=new Date(expectedBack).getTime();
  if(!s5ProjectAllowed(projectId)||!s6VisitType(type)||destination.length<4||purpose.length<10||!Number.isFinite(back)||back<Date.now()-60000||back>Date.now()+31*86400000)return notify('Check project, destination, purpose and future return time.');
  const v={id:s6Ref(),projectId,ownerRole:data.role,person:'Demo '+roleLabel(data.role),type,destination,purpose,expectedBack,departedAt:'',returnedAt:'',status:'Planned',stops:[],outcome:'',followUp:'',review:null,history:[]};
  s6Log(v,'Visit registered','Planned destination: '+destination);s6DB().push(v);view.s6Visit=v.id;view.modal='';view.s6Filter='all';save();render();notify('Visit registered. Mark departure when you leave the office.');return;
 }
 const r=s6DB().find(v=>v.id===view.s6Visit);
 if(!s6Visible(r))return notify('This visit is unavailable to the current role.');
 if(id==='s6-stop-form'){
  if(!s6CanUpdate(r)||r.status!=='Out of office')return notify('Only the visitor can record actual locations.');
  const place=String(f.get('place')||'').trim(),notes=String(f.get('notes')||'').trim();
  if(place.length<4||place.length>110||notes.length<5)return notify('Enter a location and a short visit note.');
  r.stops=r.stops||[];r.stops.push({place:place.slice(0,110),notes:notes.slice(0,240),at:s6Stamp()});
  s6Log(r,'Visited location recorded',place+' — '+notes.slice(0,90));view.modal='';save();render();notify('Actual visit location logged.');return;
 }
 if(id==='s6-return-form'){
  if(!s6CanUpdate(r)||r.status!=='Out of office'&&!(r.status==='Returned'&&r.review?.result==='Needs correction'))return notify('Visit must be out of office or awaiting correction.');
  const place=String(f.get('place')||'').trim(),outcome=String(f.get('outcome')||'').trim(),followUp=String(f.get('followUp')||'').trim();
  if(place.length<4||outcome.length<10||outcome.length>380)return notify('Enter last visited location and results.');
  const wasAway=r.status==='Out of office';const last=r.stops?.at(-1);
  if(!last||last.place.toLowerCase()!==place.toLowerCase()){r.stops=r.stops||[];r.stops.push({place:place.slice(0,110),notes:'Location confirmed in return report.',at:s6Stamp()});}
  r.returnedAt=wasAway?s6Stamp():r.returnedAt;r.outcome=outcome.slice(0,380);r.followUp=followUp.slice(0,240);r.status='Returned';r.review=null;
  s6Log(r,wasAway?'Returned to office':'Return report revised',outcome.slice(0,140));view.modal='';save();render();notify('Return report submitted for independent review.');return;
 }
 if(id==='s6-review-form'){
  if(!s6Reviewable(r))return notify('Review requires an independent authorized manager.');
  const decision=String(f.get('decision')||''),note=String(f.get('note')||'').trim();
  if(!['Accepted','Needs correction'].includes(decision)||note.length<4||note.length>240)return notify('Enter a review decision and meaningful comment.');
  r.review={result:decision,note:note.slice(0,240),byRole:data.role,by:'Demo '+roleLabel(data.role),at:s6Stamp()};
  r.status=decision==='Accepted'?'Reviewed':'Returned';
  s6Log(r,decision==='Accepted'?'Visit report reviewed':'Clarification requested',note.slice(0,140));view.modal='';save();render();notify(decision==='Accepted'?'Visit reviewed and closed.':'Clarification requested from visitor.');return;
 }
}

function s6Events(){
 document.addEventListener('click',e=>{const el=e.target.closest('[data-s6-action]');if(!el)return;if(el.dataset.s6Action==='backdrop'&&el!==e.target)return;e.preventDefault();e.stopImmediatePropagation();s6Action(el);},true);
 document.addEventListener('submit',e=>{if(!['s6-new-form','s6-stop-form','s6-return-form','s6-review-form'].includes(e.target.id))return;e.preventDefault();e.stopImmediatePropagation();s6Submit(e.target);},true);
}

s6Events();
