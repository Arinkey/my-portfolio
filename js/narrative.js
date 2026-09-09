(function(){
  document.querySelectorAll('details').forEach(details=>{
    const summary=details.querySelector(':scope > summary');
    if(!summary) return;
    const openText=summary.dataset.openText;
    const closeText=summary.dataset.closeText;
    if(!openText || !closeText) return;
    const label=summary.querySelector('.details-label');
    const update=()=>{ if(label) label.textContent=details.open?closeText:openText; };
    details.addEventListener('toggle',update); update();
  });
})();
