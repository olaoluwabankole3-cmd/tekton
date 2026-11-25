/* TEKTON inventory + linked procurement: fictional browser-local demo. */
function s4Seed(company){
 const stores=company==='summit'?[{id:'main',name:'Nairobi Central Store',kind:'Warehouse'},{id:'s1',name:'Aurora Tech Site',kind:'Project store'},{id:'s2',name:'Eastern Transit Site',kind:'Project store'}]:[{id:'main',name:'Lagos Central Warehouse',kind:'Warehouse'},{id:'p1',name:'Harbour View Site Store',kind:'Project store'},{id:'p2',name:'Cedar Park Site Store',kind:'Project store'},{id:'p3',name:'Westlink Road Site Store',kind:'Project store'}];
 const items=[
 {sku:'MAT-001',name:'Cement (50kg bags)',unit:'bags',category:'Civil materials',min:200,unitCost:22},
 {sku:'MAT-002',name:'Reinforcement steel',unit:'lengths',category:'Structural',min:120,unitCost:800},
 {sku:'MAT-003',name:'Ready-mix concrete',unit:'m³',category:'Concrete',min:40,unitCost:1050},
 {sku:'MAT-004',name:'Formwork panels',unit:'panels',category:'Structural',min:75,unitCost:670},
 {sku:'MAT-005',name:'PVC drainage pipe',unit:'lengths',category:'Plumbing',min:90,unitCost:46},
 {sku:'MAT-006',name:'Safety helmets',unit:'units',category:'PPE',min:30,unitCost:35},
 {sku:'MAT-007',name:'Diesel fuel',unit:'litres',category:'Plant & fuel',min:450,unitCost:2},
 {sku:'MAT-008',name:'Binding wire',unit:'rolls',category:'Structural',min:35,unitCost:18}
 ];
 const base=[[520,135,45,84,165,68,900,45],[120,21,0,10,35,12,180,8],[65,24,8,16,30,4,140,4],[70,0,0,30,28,10,80,6]];
 let movements=[];stores.forEach((s,i)=>{items.forEach((it,j)=>{const qty=(base[i]||base[1])[j]||0;if(qty)movements.push({id:'OPEN-'+s.id+'-'+it.sku,sku:it.sku,storeId:s.id,delta:qty,type:'Opening balance',reference:'SAMPLE-OPEN',projectId:s.id==='main'?'':s.id,by:'Demo setup',date:'2026-11-20',note:'Fictional starting stock'});});});
 return {stores,items,movements,counts:[]};
}

function s4DB(){
 if(!data.s4Inventories)data.s4Inventories={};
 if(!data.s4Inventories[data.activeCompany])data.s4Inventories[data.activeCompany]=s4Seed(data.activeCompany);
 return data.s4Inventories[data.activeCompany];
}

function s4Item(id){return s4DB().items.find(x=>x.sku===id);}

function s4StoreName(id){return s4DB().stores.find(x=>x.id===id)?.name||'Unknown store';}

function s4Qty(sku,storeId){
 return s4DB().movements.filter(m=>m.sku===sku&&(!storeId||m.storeId===storeId)).reduce((sum,m)=>sum+m.delta,0);
}

function s4StockTotal(){return s4DB().items.reduce((sum,it)=>sum+s4Qty(it.sku)*it.unitCost,0);}

function s4LowItems(){return s4DB().items.filter(x=>s4Qty(x.sku)<x.min);}

function s4Can(verb){return ({"issue":["storekeeper"],transfer:["storekeeper"],count:["storekeeper"],approve:["executive","pm"],requisition:["site"]})[verb]?.includes(data.role)||false;}

function s4Options(selected){return s4DB().stores.map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('');}

function s4ProjectOptions(selected){return getProjects().map(p=>`<option value="${esc(p.id)}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('');}

function s4Tag(txt,cls){return `<span class="tag ${cls||''}">${esc(txt)}</span>`;}

function s4Stamp(){return new Date().toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}

function s4Id(prefix){return prefix+'-'+Date.now().toString(36).toUpperCase()+'-'+Math.floor(Math.random()*999).toString().padStart(3,'0');}

function s4Log(sku,storeId,delta,type,reference,projectId,note){
 s4DB().movements.push({id:s4Id('MOV'),sku,storeId,delta,type,reference,projectId:projectId||'',by:roleLabel(data.role),date:s4Stamp(),note:(note||'').slice(0,140)});
}

function s4StockTable(){
 const inv=s4DB(),location=view.s4Location||'all',search=(view.s4Search||'').toLowerCase();
 const list=inv.items.filter(x=>`${x.sku} ${x.name} ${x.category}`.toLowerCase().includes(search));
 return `<section class="card"><div class="s4-head"><h2>Material catalogue & stock balances</h2><span class="tag">${list.length} SKUs</span></div><div class="s4-toolbar"><label>Store location<select id="s4-location"><option value="all">All locations</option>${inv.stores.map(s=>`<option value="${esc(s.id)}" ${location===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label><input id="s4-search" type="search" placeholder="Search materials / SKU" value="${esc(view.s4Search||'')}" aria-label="Search inventory items"/></div><div class="table-wrap"><table class="data-table s4-table"><thead><tr><th>Material / SKU</th><th>Category</th><th>Available</th><th>Minimum</th><th>Sample unit cost</th><th>Status</th></tr></thead><tbody>${list.map(it=>{const q=s4Qty(it.sku,location==='all'?null:location);return `<tr><td><b>${esc(it.name)}</b><small>${esc(it.sku)} · ${esc(it.unit)}</small></td><td>${esc(it.category)}</td><td><strong>${q.toLocaleString()} ${esc(it.unit)}</strong></td><td>${it.min} ${esc(it.unit)}</td><td>${money(it.unitCost)}</td><td>${s4Tag(q===0?'Out of stock':q<it.min?'Below minimum':'Available',q<it.min?'warning':'green')}</td></tr>`;}).join('')}</tbody></table></div>${!list.length?'<div class="empty">No matching materials.</div>':''}</section>`;
}

function s4Transactions(){
 const m=s4DB().movements.slice().reverse().slice(0,35);
 return `<section class="card"><div class="s4-head"><div><h2>Stock movement ledger</h2><p class="muted">Each receipt, transfer, issue and approved adjustment is recorded by location.</p></div>${s4Tag(m.length+' recent entries')}</div><div class="table-wrap"><table class="data-table s4-table"><thead><tr><th>Reference</th><th>Movement</th><th>Material</th><th>Store</th><th>Quantity</th><th>Recorded by</th></tr></thead><tbody>${m.map(t=>`<tr><td><b>${esc(t.reference)}</b><small>${esc(t.date)}</small></td><td>${esc(t.type)}</td><td>${esc(s4Item(t.sku)?.name||t.sku)}</td><td>${esc(s4StoreName(t.storeId))}</td><td><strong class="${t.delta<0?'s4-negative':'s4-positive'}">${t.delta>0?'+':''}${t.delta.toLocaleString()}</strong></td><td>${esc(t.by)}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function s4Counts(){
 const all=s4DB().counts.slice().reverse();
 return `<section class="card"><div class="s4-head"><div><h2>Physical stock counts</h2><p class="muted">Storekeeper proposes variance; Project Manager or Executive Director authorizes the adjustment.</p></div><button class="button small" data-s4-action="count" ${s4Can('count')?'':'disabled'}>${icon('plus',13)} Record count</button></div><div class="table-wrap"><table class="data-table s4-table"><thead><tr><th>Count ID</th><th>Material</th><th>Location</th><th>System / counted</th><th>Status</th><th>Decision</th></tr></thead><tbody>${all.map(c=>`<tr><td><b>${esc(c.id)}</b><small>${esc(c.date)}</small></td><td>${esc(s4Item(c.sku)?.name||c.sku)}</td><td>${esc(s4StoreName(c.storeId))}</td><td>${c.expected} / ${c.counted}</td><td>${s4Tag(c.status,c.status==='Approved'?'green':'warning')}</td><td>${c.status==='Pending'&&s4Can('approve')?`<button class="button small" data-s4-action="approve-count" data-s4-id="${esc(c.id)}">Review count</button>`:esc(c.reviewNote||'—')}</td></tr>`).join('')||'<tr><td colspan="6">No stock counts recorded yet. Switch to the Storekeeper role to start one.</td></tr>'}</tbody></table></div></section>`;
}

function s4Reorder(){
 const low=s4LowItems();
 return `<section class="card"><div class="s4-head"><div><h2>Reorder recommendations</h2><p class="muted">Stock below fictional minimum levels. Check site holdings and open an approved material request before purchasing.</p></div>${s4Tag(low.length+' alerts',low.length?'warning':'green')}</div><div class="s4-reorder-list">${low.map(i=>`<div class="s4-reorder-row"><div><strong>${esc(i.name)}</strong><small>${esc(i.sku)} · ${s4Qty(i.sku)} on hand / minimum ${i.min} ${esc(i.unit)}</small></div><div><b>Suggested +${Math.max(i.min*2-s4Qty(i.sku),1)} ${esc(i.unit)}</b><button data-s4-action="requisition" data-s4-sku="${esc(i.sku)}" class="button small secondary" ${s4Can('requisition')?'':'disabled'}>Create requisition</button></div></div>`).join('')||'<div class="empty">All sample materials meet minimum stock thresholds.</div>'}</div></section>`;
}

function s4InventoryPage(){
 const db=s4DB();const tab=view.s4Tab||'overview';const low=s4LowItems();
 const actions=`<div class="s4-actions"><button class="button" data-s4-action="requisition" ${s4Can('requisition')?'':'disabled'}>${icon('plus',15)} Material requisition</button><button class="button secondary" data-s4-action="issue" ${s4Can('issue')?'':'disabled'}>${icon('package',15)} Issue stock</button><button class="button secondary" data-s4-action="transfer" ${s4Can('transfer')?'':'disabled'}>${icon('truck',15)} Transfer stock</button></div>`;
 const tabs=[['overview','Overview'],['stock','Stock catalogue'],['movements','Movement history'],['reorder','Reorder alerts'],['counts','Stock counts']].map(([k,n])=>`<button class="${tab===k?'active':''}" data-s4-action="tab" data-s4-value="${k}" aria-pressed="${tab===k}">${n}</button>`).join('');
 const cards=`<div class="grid-4">${stat('Sample stock value',shortMoney(s4StockTotal()),'Based on fictional cost data','wallet')}${stat('Materials tracked',db.items.length+' SKUs','Across '+db.stores.length+' locations','package')}${stat('Low stock',low.length,low.length?'Replenishment worth reviewing':'All above minimum','bell')}${stat('Movements',db.movements.length,'Audit-style demo ledger','layers')}</div>`;
 const overview=`${cards}<div class="layout-2 gap-section"><section class="card"><div class="s4-head"><h2>Stock by location</h2><span class="tag">Multi-store</span></div>${db.stores.map(s=>`<div class="s4-store"><div class="s4-store-badge">${icon(s.id==='main'?'building':'hardhat',17)}</div><div><strong>${esc(s.name)}</strong><small>${esc(s.kind)} · ${db.items.filter(it=>s4Qty(it.sku,s.id)>0).length} stocked materials</small></div><b>${shortMoney(db.items.reduce((v,it)=>v+s4Qty(it.sku,s.id)*it.unitCost,0))}</b></div>`).join('')}</section><section class="card"><div class="s4-head"><h2>Items needing attention</h2>${s4Tag(low.length+' alerts','warning')}</div>${low.slice(0,5).map(i=>`<div class="s4-alert"><div><strong>${esc(i.name)}</strong><small>${s4Qty(i.sku)} available · minimum ${i.min} ${esc(i.unit)}</small></div>${s4Tag('Reorder','warning')}</div>`).join('')||'<p class="muted">No low-stock items in this sample company.</p>'}<button class="button small secondary mt-2" data-s4-action="tab" data-s4-value="reorder">View reorder list ${icon('arrow',13)}</button></section></div><div class="gap-section">${s4StockTable()}</div>`;
 const body=tab==='overview'?overview:tab==='stock'?s4StockTable():tab==='movements'?s4Transactions():tab==='reorder'?s4Reorder():s4Counts();
 return heading('Inventory & Stores','Know what is in every store.','Central warehouse and site-level stock with goods receipts, controlled issues, transfers and physical stock checks.',actions)+`<div class="s4-banner"><div><b>CONNECTED TO PROCUREMENT</b><p>An accepted delivery against an approved TEKTON purchase order adds stock to the selected store. Stock issued to a project is deducted and logged.</p></div><button class="button small" data-page="procurement">Open procurement ${icon('arrow',13)}</button></div><div class="s4-tabs" role="navigation" aria-label="Inventory sections">${tabs}</div>${body}<p class="disclaimer mt-2">Fictional inventory, suppliers, prices and role switching. This is a browser-local simulation, not an authenticated warehouse system. No physical stock moves.</p>`;
}

function s4POs(){
 const all=reqs().filter(r=>r.stage>=5);
 return `<section class="card gap-section"><div class="s4-head"><div><h2>Purchase orders & goods receipts</h2><p class="muted">POs appear after purchasing authorization; receipts update Inventory & Stores.</p></div>${s4Tag(all.length+' orders')}</div><div class="table-wrap"><table class="data-table s4-table"><thead><tr><th>Order / requisition</th><th>Supplier</th><th>Material</th><th>Received</th><th>Status</th><th>Action</th></tr></thead><tbody>${all.map(r=>{const received=(r.receipts||[]).reduce((s,x)=>s+(x.acceptedQty||0),0);return `<tr><td><b>${esc(r.poNumber||'PO-'+r.id.replace('REQ-',''))}</b><small>${esc(r.id)} · ${esc(getProject(r.projectId).name)}</small></td><td>${esc(r.vendor||'Sample vendor')}</td><td>${esc(r.item)}</td><td>${received} / ${r.qty}</td><td>${s4Tag(r.stage===7?'Invoice matched':r.stage===6?'Awaiting invoice':'Receiving',r.stage===7?'green':'warning')}</td><td><button class="button small secondary" data-request="${esc(r.id)}">View record</button></td></tr>`;}).join('')||'<tr><td colspan="6">No purchase orders yet. Follow an approved requisition through Purchasing.</td></tr>'}</tbody></table></div></section>`;
}

function s4ProcurementWorkspace(){
 const rs=reqs();const pending=rs.filter(r=>r.stage<7);const orders=rs.filter(r=>r.stage>=5);const quotes=['Atlas Materials Ltd','Cedar Construction Supplies','North Point Industrial'];
 return `<div class="s4-procurement"><section class="s4-flow-strip">${[['01','Requisition'],['02','PM + QS review'],['03','Compare quotes'],['04','Finance authorization'],['05','Purchase order'],['06','Goods receipt'],['07','3-way invoice match']].map(([n,l])=>`<div><small>${n}</small><strong>${l}</strong></div>`).join('')}</section><div class="grid-3 gap-section">${stat('Requisitions in motion',pending.length,'Departmental review and purchasing','clipboard')}${stat('Issued purchase orders',orders.length,'Authorized sample commitments','package')}${stat('Pending goods receipt',orders.filter(r=>r.stage===5).length,'Storekeeper action needed','truck')}</div><div class="layout-2 gap-section"><section class="card"><div class="s4-head"><h2>Stock-first purchasing</h2>${s4Tag('Linked to Stores','green')}</div><p class="muted">Before a new purchase, check whether available materials can be transferred from the central warehouse or another site. Use the separate Inventory dashboard to issue stock and reconcile holdings.</p><div class="s4-minigrid"><div><strong>${s4DB().items.length}</strong><small>Tracked materials</small></div><div><strong>${s4LowItems().length}</strong><small>Reorder alerts</small></div></div><button class="button secondary small" data-page="inventory">Check stock availability ${icon('arrow',13)}</button></section><section class="card"><div class="s4-head"><h2>Fictional approved supplier directory</h2>${s4Tag('Quote comparison')}</div>${quotes.map((s,i)=>`<div class="s4-vendor"><div class="s4-store-badge">${icon('building',15)}</div><div><strong>${esc(s)}</strong><small>Sample supplier ${i+1} · demonstration-only quotations</small></div></div>`).join('')}<small class="muted">Supplier approval, compliance and onboarding are production requirements.</small></section></div>${s4POs()}</div>`;
}

function s4RequestStockContext(r){
 const item=s4DB().items.find(x=>x.sku===r.sku||x.name.toLowerCase()===String(r.item).toLowerCase());
 if(!item)return `<div class="s4-request-note"><strong>Stock visibility</strong><p>This free-text material has no exact catalogue match. Procurement should reconcile its SKU before posting stock.</p><button class="button small secondary" data-page="inventory">View material catalogue</button></div>`;
 const qty=s4Qty(item.sku),shortage=Math.max(0,r.qty-qty),received=(r.receipts||[]).reduce((s,x)=>s+(x.acceptedQty||0),0);
 return `<div class="s4-request-note"><div class="s4-head"><strong>${icon('package',15)} Connected inventory check · ${esc(item.sku)}</strong>${s4Tag(shortage?'Potential shortage':'Stock available',shortage?'warning':'green')}</div><div class="s4-request-grid"><div><small>On hand in all sample stores</small><b>${qty} ${esc(item.unit)}</b></div><div><small>Requisition quantity</small><b>${r.qty} ${esc(item.unit)}</b></div><div><small>Accepted on this PO</small><b>${received} ${esc(item.unit)}</b></div></div><p>Availability is an illustrative snapshot, not reserved stock. ${shortage?'Review '+shortage+' additional '+esc(item.unit)+' against requirements.':'A transfer or issue may be appropriate before buying.'} Accepted goods receipts post to the receiving store.</p><button class="button small secondary" data-page="inventory">Open inventory ledger ${icon('arrow',13)}</button></div>`;
}

function s4OnGoodsReceived(r,receipt){
 if(!receipt||!Number.isInteger(receipt.acceptedQty)||receipt.acceptedQty<=0||receipt.inventoryPosted)return;
 const db=s4DB(),storeId=db.stores.some(s=>s.id===receipt.storeId)?receipt.storeId:'main';
 let item=db.items.find(i=>i.sku===r.sku||i.name.toLowerCase()===String(r.item).toLowerCase());
 if(!item){const sku='MAT-'+(db.items.length+1).toString().padStart(3,'0');item={sku,name:String(r.item).slice(0,90),unit:'units',category:'Purchased materials',min:0,unitCost:r.unitCost};db.items.push(item);}
 receipt.inventoryPosted=true;receipt.inventorySku=item.sku;receipt.storeId=storeId;
 s4Log(item.sku,storeId,receipt.acceptedQty,'PO goods received',r.poNumber||'PO-'+r.id.replace('REQ-',''),r.projectId,receipt.note);
}

function s4Modal(){
 const type=view.modal,db=s4DB(),selected=view.s4Sku||db.items[0].sku,stores=s4Options(view.s4Store||'main');
 let title='',body='';
 const pick=`<label class="field full">Material<select name="sku" required>${db.items.map(i=>`<option value="${esc(i.sku)}" ${selected===i.sku?'selected':''}>${esc(i.name)} · ${esc(i.sku)}</option>`).join('')}</select></label>`;
 const store=`<label class="field">Store location<select name="storeId" required>${stores}</select></label>`;
 if(type==='s4-issue'){title='Issue materials to a project';body=`<p class="muted">Available stock must not become negative. Every issue is tied to a fictional project.</p><form id="s4-issue-form" class="s4-form"><div class="form-grid">${pick}${store}<label class="field">Project<select name="projectId">${s4ProjectOptions()}</select></label><label class="field">Quantity to issue<input type="number" name="qty" min="1" step="1" max="100000" required></label><label class="field full">Issue reference<input name="ref" maxlength="60" placeholder="e.g. MIR-041" required></label></div><div class="modal-footer"><button class="button secondary" type="button" data-s4-action="close">Cancel</button><button class="button" type="submit">Record stock issue</button></div></form>`;}
 else if(type==='s4-transfer'){title='Transfer between stores';body=`<p class="muted">Stock leaves the source and arrives at the destination in one recorded demo operation.</p><form id="s4-transfer-form" class="s4-form"><div class="form-grid">${pick}${store}<label class="field">Destination store<select name="toId" required>${s4Options(db.stores[1]?.id)}</select></label><label class="field">Quantity to transfer<input type="number" name="qty" min="1" step="1" max="100000" required></label><label class="field full">Transfer reference<input name="ref" maxlength="60" placeholder="e.g. STR-104" required></label></div><div class="modal-footer"><button class="button secondary" type="button" data-s4-action="close">Cancel</button><button class="button" type="submit">Transfer stock</button></div></form>`;}
 else if(type==='s4-requisition'){title='Raise a stock-linked requisition';body=`<p class="muted">This sends a fictional material request into the existing seven-stage TEKTON procurement approval chain. Check available stock before ordering.</p><form id="s4-request-form" class="s4-form"><div class="form-grid">${pick}<label class="field">Project<select name="projectId" required>${s4ProjectOptions()}</select></label><label class="field">Quantity<input name="qty" type="number" min="1" step="1" max="100000" required></label><label class="field full">Purpose / work package<textarea name="purpose" required maxlength="230" placeholder="Describe the site need and approved drawings"></textarea></label></div><div class="modal-footer"><button class="button secondary" data-s4-action="close" type="button">Cancel</button><button class="button" type="submit">Submit for project review</button></div></form>`;}
 else if(type==='s4-count'){title='Record physical stock count';body=`<p class="muted">The count stays pending until reviewed by Project Management or the Executive Director.</p><form id="s4-count-form" class="s4-form"><div class="form-grid">${pick}${store}<label class="field">Physically counted quantity<input name="counted" type="number" min="0" step="1" max="1000000" required></label><label class="field full">Counting note<textarea name="note" maxlength="180" required></textarea></label></div><div class="modal-footer"><button class="button secondary" data-s4-action="close" type="button">Cancel</button><button class="button" type="submit">Submit count for review</button></div></form>`;}
 else if(type==='s4-approve-count'){const c=db.counts.find(x=>x.id===view.s4CountId);title='Review physical stock variance';body=c?`<p>Material: <strong>${esc(s4Item(c.sku)?.name||c.sku)}</strong></p><p>Location: ${esc(s4StoreName(c.storeId))}</p><div class="s4-request-grid"><div><small>System quantity at counting</small><b>${c.expected}</b></div><div><small>Physically counted</small><b>${c.counted}</b></div></div><p class="muted">${esc(c.note)}</p><div class="modal-footer"><button class="button secondary" data-s4-action="reject-count">Reject count</button><button class="button" data-s4-action="approve-count-now">Approve adjustment</button></div>`:'';}
 else return'';
 return `<div class="modal-layer" data-s4-action="close-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-top"><div><div class="eyebrow">TEKTON · STORES DEMO</div><h2>${esc(title)}</h2></div><button class="icon-btn" data-s4-action="close" aria-label="Close dialog">${icon('close')}</button></div>${body}<p class="disclaimer mt-2">Browser-local demonstration. No real inventory, supplier or company system is affected.</p></div></div>`;
}

function s4Action(el){
 const action=el.dataset.s4Action;
 if(action==='close-backdrop'&&el!==event.target)return;
 if(action==='close'||action==='close-backdrop'){view.modal='';render();return;}
 if(action==='tab'){view.s4Tab=el.dataset.s4Value||'overview';render();return;}
 if(action==='approve-count'){view.s4CountId=el.dataset.s4Id;view.modal='s4-approve-count';render();return;}
 if(action==='approve-count-now'||action==='reject-count'){
  if(!s4Can('approve'))return notify('Only Project Management or Executive roles can review a physical count.');
  const c=s4DB().counts.find(x=>x.id===view.s4CountId);
  if(!c||c.status!=='Pending')return notify('This count is no longer pending.');
  if(action==='approve-count-now'){
   const actual=s4Qty(c.sku,c.storeId),difference=c.counted-actual;
   if(difference)s4Log(c.sku,c.storeId,difference,'Approved count adjustment',c.id,c.storeId,'Count reviewed by management');
   c.status='Approved';c.reviewNote='Approved by '+roleLabel(data.role);
  }else{c.status='Rejected';c.reviewNote='Rejected by '+roleLabel(data.role);}
  view.modal='';save();render();notify('Stock count review recorded.');return;
 }
 const types={issue:'s4-issue',transfer:'s4-transfer',requisition:'s4-requisition',count:'s4-count'};
 if(!types[action])return;
 const role={issue:'issue',transfer:'transfer',requisition:'requisition',count:'count'}[action];
 if(!s4Can(role))return notify('Switch to the required demo role: '+(action==='requisition'?'Site Engineer':'Site Storekeeper'));
 view.s4Sku=el.dataset.s4Sku||s4DB().items[0].sku;view.modal=types[action];render();
}

function s4Submit(form){
 const f=new FormData(form),id=form.id,sku=String(f.get('sku')||''),storeId=String(f.get('storeId')||''),item=s4Item(sku),qty=Number(f.get('qty'));
 if(!item)return notify('Select a valid material.');
 if(id==='s4-request-form'){
  if(!s4Can('requisition')||!Number.isInteger(qty)||qty<=0||qty>100000)return notify('Site Engineer role and valid quantity required.');
  const projectId=String(f.get('projectId')),purpose=String(f.get('purpose')||'').trim();
  if(!getProjects().some(p=>p.id===projectId)||purpose.length<5)return notify('Enter a valid project and purpose.');
  const rid=s4Id('REQ');data.requests[data.activeCompany].unshift({id:rid,sku,projectId,item:item.name,qty,unitCost:item.unitCost,stage:0,vendor:'',date:today(),purpose:purpose.slice(0,230),requestedBy:roleLabel(data.role),history:[{who:roleLabel(data.role),title:'Stock-linked material requisition created',when:s4Stamp(),detail:'Item '+sku+' · stock available '+s4Qty(sku)+' '+item.unit}]});
  view.modal='';view.selectedReq=rid;data.page='procurement';save();render();notify('Requisition created in Procurement for project review.');return;
 }
 if(id==='s4-issue-form'||id==='s4-transfer-form'){
  if(!s4Can(id==='s4-issue-form'?'issue':'transfer'))return notify('Switch to Site Storekeeper role.');
  const ref=String(f.get('ref')||'').trim().slice(0,60);
  if(!s4DB().stores.some(s=>s.id===storeId)||!Number.isInteger(qty)||qty<=0||qty>100000||ref.length<3)return notify('Check store, reference and quantity.');
  if(s4Qty(sku,storeId)<qty)return notify('Insufficient stock at source store; no quantities changed.');
  if(id==='s4-transfer-form'){
    const toId=String(f.get('toId')||'');if(toId===storeId||!s4DB().stores.some(s=>s.id===toId))return notify('Select a different valid destination store.');
    s4Log(sku,storeId,-qty,'Transfer out',ref,'','Transferred to '+s4StoreName(toId));
    s4Log(sku,toId,qty,'Transfer in',ref,'','Transferred from '+s4StoreName(storeId));
  }else{
    const projectId=String(f.get('projectId')||'');if(!getProjects().some(p=>p.id===projectId))return notify('Choose an existing project.');
    s4Log(sku,storeId,-qty,'Issued to project',ref,projectId,'Issued for '+getProject(projectId).name);
  }
  view.modal='';save();render();notify('Stock movement recorded in the demo ledger.');return;
 }
 if(id==='s4-count-form'){
  if(!s4Can('count')||!s4DB().stores.some(s=>s.id===storeId))return notify('Switch to Site Storekeeper and choose a store.');
  const counted=Number(f.get('counted')),note=String(f.get('note')||'').trim();
  if(!Number.isInteger(counted)||counted<0||counted>1e6||note.length<4)return notify('Enter a valid count and note.');
  s4DB().counts.push({id:s4Id('COUNT'),sku,storeId,expected:s4Qty(sku,storeId),counted,note:note.slice(0,180),date:s4Stamp(),status:'Pending'});
  view.modal='';view.s4Tab='counts';save();render();notify('Count queued for independent review.');return;
 }
}

function s4Events(){
 document.addEventListener('click',e=>{const el=e.target.closest('[data-s4-action]');if(!el)return;if(el.dataset.s4Action==='close-backdrop'&&e.target!==el)return;e.preventDefault();e.stopImmediatePropagation();s4Action(el);},true);
 document.addEventListener('submit',e=>{if(!e.target.id?.startsWith('s4-'))return;e.preventDefault();e.stopImmediatePropagation();s4Submit(e.target);},true);
 document.addEventListener('change',e=>{if(e.target.id==='s4-location'){view.s4Location=e.target.value;render();}},true);
 document.addEventListener('input',e=>{if(e.target.id==='s4-search'){const val=e.target.value,pos=e.target.selectionStart;view.s4Search=val;render();let input=document.getElementById('s4-search');if(input){input.focus();input.setSelectionRange(pos,pos);}}},true);
}

s4Events();
