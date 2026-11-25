/* Touch and accessibility refinements for the isolated YHWH presentation.
   The unchanged public TEKTON demo does not load this script. */
let yhwhDrawerWasOpen = false;
let yhwhLastModal = '';

function yhwhMobileEnhance(){
 const isMobile=!!(window.matchMedia&&window.matchMedia('(max-width: 920px)').matches);
 const sidebar=document.querySelector('.sidebar');
 const main=document.querySelector('.shell-main');
 const toggle=document.querySelector('.sidebar-mobile-toggle');
 if(sidebar){
  sidebar.id='yhwh-demo-navigation';
  sidebar.inert=isMobile&&!view.mobile;
  if(toggle){
   toggle.setAttribute('aria-controls','yhwh-demo-navigation');
   toggle.setAttribute('aria-expanded',String(isMobile&&!!view.mobile));
   toggle.setAttribute('aria-label',view.mobile?'Close navigation':'Open navigation');
  }
  const brand=sidebar.querySelector('.brand');
  if(brand&&!brand.querySelector('.yhwh-mobile-close')){
   brand.insertAdjacentHTML('beforeend','<button type="button" class="yhwh-mobile-close" data-action="close-menu" aria-label="Close navigation" title="Close navigation"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>');
  }
  const bottom=sidebar.querySelector('.sidebar-bottom');
  if(bottom&&!bottom.querySelector('.yhwh-mobile-site-link')){
   bottom.insertAdjacentHTML('beforeend','<a class="yhwh-mobile-site-link" href="../index.html">Back to presentation website</a>');
  }
 }
 if(main)main.inert=isMobile&&!!view.mobile;
 if(isMobile&&view.mobile&&!yhwhDrawerWasOpen){
  requestAnimationFrame(()=>document.querySelector('.sidebar .yhwh-mobile-close')?.focus());
 }
 if(isMobile&&!view.mobile&&yhwhDrawerWasOpen){
  requestAnimationFrame(()=>document.querySelector('.sidebar-mobile-toggle')?.focus());
 }
 yhwhDrawerWasOpen=isMobile&&!!view.mobile;
 
 // Records are intentionally wide rather than cramming six columns into a phone.
 document.querySelectorAll('.table-wrap').forEach((wrap,i)=>{
  if(!wrap.querySelector('table'))return;
  wrap.tabIndex=0;
  wrap.setAttribute('role','region');
  wrap.setAttribute('aria-label','Scrollable records table '+(i+1)+'; swipe sideways to see additional columns');
  if(!wrap.previousElementSibling?.classList?.contains('yhwh-swipe-hint')){
   wrap.insertAdjacentHTML('beforebegin','<div class="yhwh-swipe-hint" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18m-14-5-5 5 5 5m10-10 5 5-5 5"/></svg> Swipe sideways to see all columns</div>');
  }
 });
 if(isMobile&&yhwhActive){
  const title=document.querySelector('.top-title');
  if(title&&window.matchMedia('(max-width: 520px)').matches)title.textContent='YHWH & Partners';
 }
 const modal=document.querySelector('.modal[role="dialog"]');
 if(modal){
  const signature=view.modal||'dialog';
  if(signature!==yhwhLastModal){
   yhwhLastModal=signature;
   requestAnimationFrame(()=>{
    const topClose=modal.querySelector('[aria-label="Close"],[aria-label="Close dialog"]');
    const first=modal.querySelector('input:not([type="hidden"]),select,textarea');
    (topClose||first||modal).focus?.({preventScroll:true});
   });
  }
 }else yhwhLastModal='';
}
function yhwhMobileInit(){
 window.addEventListener('resize',()=>{
  if(window.innerWidth>920&&view.mobile){
   view.mobile=false;render();
  }
 },{passive:true});
}
yhwhMobileInit();
