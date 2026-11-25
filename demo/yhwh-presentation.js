/* YHWH & Partners isolated presentation mode. No customer data is used. */
let yhwhActive=false;
let yhwhTransitioning=false;
function yhwhBoot(){
 if(data.activeCompany==='yhwh'){
  const prior=data.yhwhReturn||{};
  data.activeCompany=prior.company&&prior.company!=='yhwh'?prior.company:'horizon';
  data.role=prior.role||'executive';data.page=prior.page||'overview';
  if(typeof prior.demoSeen==='boolean')data.demoSeen=prior.demoSeen;
  if(prior.s3Setup)data.s3Setup=prior.s3Setup;
  delete data.yhwhReturn;
 }
}

function yhwhEnsure(){
 if(!companies.some(c=>c.id==='yhwh')){
  companies.push({
   id:'yhwh',name:'YHWH & Partners West Africa Limited',accent:'#BA9B5B',
   projects:[
    {id:'y1',name:'Power Infrastructure Works · Sample',location:'Lagos, Nigeria',value:3200000000,budget:2950000000,spent:1440000000,progress:53,manager:'Demo Project Lead',type:'Power & utilities'},
    {id:'y2',name:'Building Development · Sample',location:'Lagos, Nigeria',value:1800000000,budget:1650000000,spent:640000000,progress:42,manager:'Demo Project Lead',type:'Building construction'},
    {id:'y3',name:'Road & Drainage Works · Sample',location:'Ogun State, Nigeria',value:1150000000,budget:1050000000,spent:320000000,progress:29,manager:'Demo Project Lead',type:'Civil infrastructure'}
   ]
  });
 }
 data.requests=data.requests||{};
 if(!Array.isArray(data.requests.yhwh)){
  const r=(id,projectId,item,sku,qty,unitCost,stage,purpose)=>{
   const req=seededRequest(id,projectId,item,qty,unitCost,stage);
   req.sku=sku;req.purpose=purpose;req.vendor='Example Supplier — fictional';
   req.history=[{who:'Demo Site Engineer',title:'Illustrative requisition created',when:'Sample record',detail:purpose}];
   return req;
  };
  data.requests.yhwh=[
   r('YH-REQ-1042','y1','Reinforcement steel','MAT-002',120,850000,1,'Example reinforcement package for power-site civil works'),
   r('YH-REQ-1038','y2','Cement (50kg bags)','MAT-001',200,12500,5,'Example building structural concrete activities'),
   r('YH-REQ-1027','y3','Diesel fuel','MAT-007',350,1500,2,'Example fuel replenishment for infrastructure operations')
  ];
 }
 data.reports=data.reports||{};
 if(!Array.isArray(data.reports.yhwh))data.reports.yhwh=[
  {id:'YH-SR-101',projectId:'y1',summary:'Sample field record: foundation preparation, utility coordination and hold-point review.',progress:53,author:'Demo Site Engineer',date:today(),published:true},
  {id:'YH-SR-102',projectId:'y2',summary:'Sample field record: structural sequencing and material readiness discussion.',progress:42,author:'Demo Site Engineer',date:today(),published:false}
 ];
 data.docs=data.docs||{};
 if(!Array.isArray(data.docs.yhwh))data.docs.yhwh=[
  {name:'Power site — sample drawing register.pdf',category:'Drawings',projectId:'y1',date:today()},
  {name:'Building works — sample cost summary.xlsx',category:'Commercial',projectId:'y2',date:today()},
  {name:'Roadworks — sample HSE checklist.pdf',category:'HSE',projectId:'y3',date:today()}
 ];
 data.variations=data.variations||{};
 if(!Array.isArray(data.variations.yhwh))data.variations.yhwh=[
  {id:'YH-VAR-021',projectId:'y1',title:'Example cable-route coordination change',reason:'Hypothetical site design coordination to illustrate approval handoffs.',reference:'DEMO-SI-021',stage:2,costDelta:17500000,daysDelta:4,technical:'Illustrative technical assessment; not an actual YHWH instruction.',history:[{who:'Demo Site Engineer',title:'Illustrative change raised',detail:'Sample coordination issue',when:'Sample record'}]},
  {id:'YH-VAR-022',projectId:'y2',title:'Example building-services design revision',reason:'Fictional coordination change for presentation purposes.',reference:'DEMO-RFI-022',stage:1,costDelta:0,daysDelta:0,technical:'Awaiting fictional cost assessment.',history:[{who:'Demo Project Manager',title:'Technical review opened',detail:'Illustrative revision',when:'Sample record'}]}
 ];
 data.s4Inventories=data.s4Inventories||{};
 if(!data.s4Inventories.yhwh){
  const inv=s4Seed('horizon');
  const map={p1:'y1',p2:'y2',p3:'y3'};
  const names={main:'Central Materials Warehouse',p1:'Power Project Site Store',p2:'Building Works Store',p3:'Road & Drainage Store'};
  inv.stores.forEach(st=>{st.name=names[st.id]||st.name;st.id=map[st.id]||st.id;});
  inv.movements.forEach(m=>{m.storeId=map[m.storeId]||m.storeId;m.projectId=map[m.projectId]||m.projectId;});
  const prices={'MAT-001':12500,'MAT-002':850000,'MAT-003':150000,'MAT-004':35000,'MAT-005':18000,'MAT-006':12000,'MAT-007':1500,'MAT-008':5500};
  inv.items.forEach(it=>{it.unitCost=prices[it.sku]||it.unitCost;});
  data.s4Inventories.yhwh=inv;
 }
 data.s6Visits=data.s6Visits||{};
 if(!data.s6Visits.yhwh){
  const v=s6Seed('horizon');
  v.forEach((a,i)=>{a.id='YH-VIS-0'+(i+1);a.projectId='y1';if(i===0)a.destination='Power Infrastructure Site · Sample';if(i===1)a.destination='Sample Materials Supplier · Lagos';if(i===2)a.destination='Sample Project Coordination Office';a.stops.forEach(st=>st.place=a.destination);});
  data.s6Visits.yhwh=v;
 }
}

function yhwhBanner(){
 return '<section class="yhwh-context" aria-label="YHWH presentation context"><div class="yhwh-context-rail"></div><div class="yhwh-context-message"><span class="yhwh-context-kicker">PRIVATE ENTERPRISE PRESENTATION · FICTIONAL SCENARIO</span><strong>YHWH & Partners <span>Construction Operations Workspace</span></strong><p>A tailored demonstration for an engineering, procurement, construction and project-management company. All projects, amounts, employees and workflow records shown here are illustrative.</p></div><div class="yhwh-context-sectors"><span>POWER</span><span>BUILDINGS</span><span>CIVIL WORKS</span></div></section>';
}

function yhwhAfterRender(){
 document.documentElement.classList.toggle('yhwh-mode',yhwhActive);
 const content=document.querySelector('.content');
 const companyPicker=document.getElementById('company-picker');
 if(companyPicker&&companyPicker.parentElement)companyPicker.parentElement.hidden=yhwhActive;
 const back=document.querySelector('.site-back');
 if(back){back.textContent=yhwhActive?'← TEKTON website':'← Return to website';}
 if(!yhwhActive){document.title='TEKTON — Interactive Demo';const favicon=document.querySelector('link[rel="icon"]');if(favicon)favicon.href='../brand/icons/svg/tekton-favicon.svg';return;}
 document.title='YHWH & Partners — Enterprise Operations Presentation';
 document.documentElement.style.setProperty('--accent','#FF0009');
 const favicon=document.querySelector('link[rel="icon"]');
 if(favicon)favicon.href='assets/yhwh-mark-official.png';
 const brand=document.querySelector('.sidebar .brand');
 if(brand&&!brand.querySelector('.yhwh-brand')){
  brand.insertAdjacentHTML('beforeend','<div class="yhwh-brand" aria-label="Official YHWH & Partners West Africa Limited company logo"><img class="yhwh-brand-img" src="assets/yhwh-logo-official.png" alt="YHWH & Partners West Africa Limited" width="320" height="86"><small class="yhwh-brand-caption">ENTERPRISE OPERATIONS PREVIEW</small></div>');
 }
 if(content)content.insertAdjacentHTML('afterbegin',yhwhBanner());
 const pill=document.querySelector('.demo-pill');
 if(pill)pill.innerHTML='<span class="yhwh-pill-dot"></span> YHWH CONCEPT · SAMPLE DATA';
 const help=document.querySelector('.side-help');
 if(help){
  const h=help.querySelector('b'),p=help.querySelector('p'),btn=help.querySelector('button');
  if(h)h.textContent='Present the connected workflow';
  if(p)p.textContent='Show how site requirements become approved purchases, stock receipts and management decisions.';
  if(btn)btn.textContent='Explore the demo workflow';
 }
 const hero=document.querySelector('.hero-content');
 if(hero&&data.page==='overview'){
  const kicker=hero.querySelector('.eyebrow'),headline=hero.querySelector('h2'),desc=hero.querySelector('p');
  if(kicker)kicker.textContent='YHWH & PARTNERS · ENTERPRISE PREVIEW';
  if(headline)headline.innerHTML='One connected view of<br>engineering and construction.';
  if(desc)desc.textContent='Track site execution, stores, purchasing, approvals, budgets and document control together—across sample power, building and civil works projects.';
  const badge=document.querySelector('.hero-badge');
  if(badge)badge.textContent='Illustrative demonstration · not company records';
 }
}

function yhwhTransition(toYhwh){
 const body=document.body;
 const panel=document.createElement('div');
 panel.className='yhwh-transition';
 panel.setAttribute('aria-live','polite');
 panel.innerHTML='<div class="yhwh-transition-art"></div><div class="yhwh-transition-stage"><div class="yhwh-transition-logo">'+(toYhwh?'<img src="assets/yhwh-logo-official.png" alt="YHWH & Partners West Africa Limited official logo" width="320" height="86">':'<div class="yhwh-return-brand">TEKTON</div>')+'</div><div class="yhwh-transition-overline">'+(toYhwh?'A DEDICATED WORKSPACE':'RETURNING TO THE PLATFORM')+'</div><div class="yhwh-transition-title">'+(toYhwh?'YHWH & Partners':'TEKTON')+'</div><div class="yhwh-transition-subtitle">'+(toYhwh?'Construction operations, connected.':'Unified construction operations.')+'</div><div class="yhwh-transition-progress"><span></span></div></div>';
 body.appendChild(panel);
 requestAnimationFrame(()=>panel.classList.add('is-visible'));
 return panel;
}

function yhwhSwitch(){
 if(yhwhTransitioning)return;
 yhwhTransitioning=true;
 const next=!yhwhActive;
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const layer=yhwhTransition(next);
 window.setTimeout(()=>{
  if(next){
   data.yhwhReturn={company:data.activeCompany,role:data.role,page:data.page,demoSeen:!!data.demoSeen,s3Setup:JSON.parse(JSON.stringify(data.s3Setup||s3DefaultSetup()))};
   yhwhEnsure();
   yhwhActive=true;
   data.activeCompany='yhwh';data.role='executive';data.page='overview';data.demoSeen=true;
   data.s3Setup={...s3DefaultSetup(),name:'YHWH & Partners West Africa Limited',type:'Infrastructure contractor',region:'Nigeria',size:'25–100 employees',modules:['projects','procurement','finance','site','documents','variations']};
  }else{
   yhwhActive=false;
   const prior=data.yhwhReturn||{};
   data.activeCompany=prior.company&&prior.company!=='yhwh'?prior.company:'horizon';
   data.role=prior.role||'executive';data.page=prior.page||'overview';
   data.demoSeen=typeof prior.demoSeen==='boolean'?prior.demoSeen:true;
   if(prior.s3Setup)data.s3Setup=prior.s3Setup;
   delete data.yhwhReturn;
  }
  view.modal='';view.selectedReq='';view.selectedProject='';view.selectedVariation='';view.s3Doc='';view.s3Report='';view.s6Visit='';
  view.query='';view.filter='all';view.projectTab='overview';view.s4Tab='overview';view.mobile=false;
  save();render();
  window.scrollTo({top:0,behavior:'instant'});
  window.setTimeout(()=>{
   layer.classList.remove('is-visible');
   layer.classList.add('is-exiting');
   window.setTimeout(()=>{layer.remove();yhwhTransitioning=false;},reduced?10:520);
  },reduced?30:390);
 },reduced?40:550);
}

function yhwhEvents(){
 document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-yhwh-switch]');
  if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();yhwhSwitch();
 },true);
}

yhwhEvents();
