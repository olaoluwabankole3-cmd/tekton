/* TEKTON landing v4 — progressive, interaction-led presentation. No backend calls. */
(()=> {
  'use strict';
  const stages=[
    {role:'01 / SITE ENGINEER',status:'REQUEST RECORDED',description:'A site material requirement enters the project record, with its quantity and supporting context.'},
    {role:'02 / PROJECT MANAGER',status:'NEED CONFIRMED',description:'The project manager checks the work package, construction schedule and reason the materials are needed.'},
    {role:'03 / QUANTITY SURVEYOR',status:'BUDGET VERIFIED',description:'The quantity surveyor reviews the allowance before the request proceeds to purchasing.'},
    {role:'04 / PROCUREMENT + FINANCE',status:'DECISION TRACEABLE',description:'Supplier selection, authorized commitment and delivery evidence become part of one documented trail.'}
  ];
  const prev=document.getElementById('heroStagePrev');
  const next=document.getElementById('heroStageNext');
  const role=document.getElementById('heroStageRole');
  const status=document.getElementById('heroStageStatus');
  const description=document.getElementById('heroStageDescription');
  const counter=document.getElementById('heroStageCounter');
  const dots=[...document.querySelectorAll('[data-hero-dot]')];
  let current=0;
  function showStage(index){
    current=Math.max(0,Math.min(stages.length-1,index));
    const stage=stages[current];
    role.textContent=stage.role;
    status.textContent=stage.status;
    description.textContent=stage.description;
    counter.textContent=String(current+1).padStart(2,'0')+' / 04';
    dots.forEach((dot,i)=>{
      dot.classList.toggle('active',i===current);
      dot.classList.toggle('complete',i<current);
    });
    prev.disabled=current===0;
    next.disabled=current===stages.length-1;
  }
  if(prev&&next&&role&&status&&description&&counter&&dots.length===4){
    prev.addEventListener('click',()=>showStage(current-1));
    next.addEventListener('click',()=>showStage(current+1));
    // Users control the sequence; it never changes while they are reading.
    showStage(0);
  }

  // Native tab semantics and arrow-key navigation for the eight module previews.
  const tablist=document.getElementById('moduleMenu');
  const tabs=[...document.querySelectorAll('[data-module][role="tab"]')];
  const syncTabs=()=>tabs.forEach(tab=>{
    tab.setAttribute('aria-controls','moduleDetail');
    tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;
  });
  if(tablist&&tabs.length){
    syncTabs();
    tabs.forEach(tab=>tab.addEventListener('click',syncTabs));
    tablist.addEventListener('keydown',event=>{
      const target=event.target.closest('[role="tab"]');
      if(!target||!tabs.includes(target))return;
      const index=tabs.indexOf(target);
      let nextIndex;
      switch(event.key){
        case 'ArrowRight':case 'ArrowDown':nextIndex=(index+1)%tabs.length;break;
        case 'ArrowLeft':case 'ArrowUp':nextIndex=(index-1+tabs.length)%tabs.length;break;
        case 'Home':nextIndex=0;break;
        case 'End':nextIndex=tabs.length-1;break;
        default:return;
      }
      event.preventDefault();
      tabs[nextIndex].click();
      tabs[nextIndex].focus();
    });
  }

  // Close the collapsible navigation on Escape or outside interaction.
  const menu=document.getElementById('mainNav');
  const toggle=document.getElementById('menuToggle');
  function closeMenu(){
    if(!menu||!toggle)return;
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');
    toggle.innerHTML='<svg class="ico"><use href="#i-menu"/></svg>';
  }
  if(menu&&toggle){
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&menu.classList.contains('open')){closeMenu();toggle.focus();}
    });
    document.addEventListener('click',event=>{
      if(menu.classList.contains('open')&&!menu.contains(event.target)&&!toggle.contains(event.target))closeMenu();
    });
  }

  // Respect reduced-motion preferences: all essential information is visible without animation.
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('reduced-motion');
  }
})();
