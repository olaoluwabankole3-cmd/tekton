"use strict";
/* Public pilot enquiry preparation: entirely client-side. No network submission. */
const form=document.getElementById('enquiry-form');
const draft=document.getElementById('draft');
const draftText=document.getElementById('draft-text');
const formError=document.getElementById('form-error');
const feedback=document.getElementById('copy-feedback');
let currentDraft='';
const max={company:100,contact:90,email:140,country:80,challenge:750};
function value(fd,k){return String(fd.get(k)||'').trim().slice(0,max[k]||100)}
function buildDraft(fd){
 const d={company:value(fd,'company'),contact:value(fd,'contact'),email:value(fd,'email'),country:value(fd,'country'),type:value(fd,'type'),projects:value(fd,'projects'),workflow:value(fd,'workflow'),challenge:value(fd,'challenge')};
 if(d.company.length<2||d.contact.length<2||d.country.length<2||d.challenge.length<15||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)||!d.type||!d.projects||!d.workflow)return null;
 return ['TEKTON — PILOT DISCUSSION ENQUIRY','Not yet sent; composed by the visitor.','', 'Company: '+d.company,'Contact: '+d.contact,'Business email: '+d.email,'Country / region: '+d.country,'Organisation type: '+d.type,'Active projects: '+d.projects,'Suggested pilot workflow: '+d.workflow,'','Operational challenge:',d.challenge,'','Requested next step: Discuss a suitable construction workflow pilot.','Note: This is an enquiry draft, not an application submission.'].join('\n');
}
form.addEventListener('submit',e=>{
 e.preventDefault();formError.hidden=true;
 if(!form.reportValidity()){formError.textContent='Complete the required fields and select a pilot workflow.';formError.hidden=false;return}
 const msg=buildDraft(new FormData(form));
 if(!msg){formError.textContent='Please check your business email and provide a more detailed challenge.';formError.hidden=false;return}
 currentDraft=msg;draftText.textContent=currentDraft;draft.hidden=false;feedback.textContent='';
 draft.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});
document.getElementById('copy-draft').addEventListener('click',async()=>{
 if(!currentDraft)return;
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(currentDraft);feedback.textContent='Enquiry copied. Choose an appropriate contact address to send it.'}
 catch(e){feedback.textContent='Copy is unavailable in this browser. Select the message above and copy it manually.'}
});
document.getElementById('email-draft').addEventListener('click',()=>{
 if(!currentDraft)return;
 const subject=encodeURIComponent('TEKTON construction operations pilot enquiry');
 const body=encodeURIComponent(currentDraft);
 window.location.href='mailto:?subject='+subject+'&body='+body;
});
form.addEventListener('input',()=>{if(!draft.hidden){draft.hidden=true;currentDraft='';feedback.textContent=''}});
