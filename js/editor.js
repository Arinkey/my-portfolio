(function(){
  const frame=document.getElementById('preview');
  const select=document.getElementById('pageSelect');
  const toggle=document.getElementById('toggleEdit');
  const textModeBtn=document.getElementById('textMode');
  const imageModeBtn=document.getElementById('imageMode');
  const download=document.getElementById('download');
  const resetDraft=document.getElementById('resetDraft');
  const undoBtn=document.getElementById('undo');
  const redoBtn=document.getElementById('redo');
  const status=document.getElementById('status');
  const shell=document.getElementById('previewShell');
  const imagePanel=document.getElementById('imagePanel');
  const imagePanelEmpty=document.getElementById('imagePanelEmpty');
  const imageControls=document.getElementById('imageControls');
  const panelPreview=document.getElementById('panelPreview');
  const originalPath=document.getElementById('originalPath');
  const targetPath=document.getElementById('targetPath');
  const fitSelect=document.getElementById('fitSelect');
  const posX=document.getElementById('posX');
  const posY=document.getElementById('posY');
  const posXValue=document.getElementById('posXValue');
  const posYValue=document.getElementById('posYValue');
  const replaceFile=document.getElementById('replaceFile');
  const downloadReplacement=document.getElementById('downloadReplacement');
  const resetImage=document.getElementById('resetImage');
  const hint=document.getElementById('hint');

  let mode='text';
  let editing=false;
  let sourceHtml='';
  let sourceDoc=null;
  let undoStack=[];
  let redoStack=[];
  let saveTimer=null;
  let isApplyingHistory=false;
  let selectedImageId=null;
  let imageState={};
  let imageObjectUrls={};
  let activePage='';
  let loadSession=0;

  const textDraftKey=(page=activePage)=>`portfolio-editor:v27:text:${page}`;
  const imageDraftKey=(page=activePage)=>`portfolio-editor:v27:image:${page}`;
  const legacyTextDraftKey=(page)=>`portfolio-editor:v26:text:${page}`;
  const legacyImageDraftKey=(page)=>`portfolio-editor:v26:image:${page}`;
  const blobKey=(id,page=activePage)=>`${page}:${id}`;
  const forbidden='script,style,link,meta,title,button,.editor-no-edit';
  const selector=[
    'h1','h2','h3','h4','p','li','dt','dd','figcaption',
    '.eyebrow','.project-subtitle','.rigged-cn-title','.rigged-v2-subtitle','.rigged-v2-tag',
    '.six-premise-line','.gullen-quote','.poster-note','.progress-item b','.progress-item span',
    '.label','.kicker','.compare-label','.goal-banner','.rigged-v2-topline span','.rigged-v2-subtitle',
    '.hero-stamp','.act-no','.six-index','.rigged-index','.rigged-v2-kicker','.media-caption',
    '.nav-brand','.nav-home','.portfolio-back','.nav-links a','.brand'
  ].join(',');

  function allEditable(doc){
    const nodes=[...doc.querySelectorAll(selector)].filter(el=>!el.closest(forbidden));
    return nodes.filter((el,i)=>!nodes.some((other,j)=>j!==i && el.contains(other) && other!==el));
  }
  function allImages(doc){
    return [...doc.querySelectorAll('img')].filter(el=>!el.closest('.editor-no-edit'));
  }
  function assignTextIds(doc){allEditable(doc).forEach((el,i)=>el.dataset.editorId=String(i));}
  function assignImageIds(doc){allImages(doc).forEach((el,i)=>el.dataset.imageEditorId=String(i));}

  function currentTextMap(doc){
    const out={};
    allEditable(doc).forEach(el=>{if(el.dataset.editorId!=null)out[el.dataset.editorId]=el.innerHTML;});
    return out;
  }
  function applyTextMap(doc,map){
    if(!map)return;
    allEditable(doc).forEach(el=>{const id=el.dataset.editorId;if(id!=null&&Object.prototype.hasOwnProperty.call(map,id))el.innerHTML=map[id];});
  }
  function cleanEditorAttrs(doc){
    doc.querySelectorAll('[data-editor-id],[data-image-editor-id]').forEach(el=>{
      el.removeAttribute('data-editor-id');el.removeAttribute('data-image-editor-id');
    });
  }
  function setStatus(text,kind=''){status.textContent=text;status.className='status'+(kind?' '+kind:'');}
  function updateHistoryButtons(){undoBtn.disabled=undoStack.length<2;redoBtn.disabled=redoStack.length===0;}

  function snapshot(push=true){
    const doc=frame.contentDocument;if(!doc)return null;
    const map=currentTextMap(doc);
    if(push){
      const serialized=JSON.stringify(map);
      const last=undoStack.length?JSON.stringify(undoStack[undoStack.length-1]):'';
      if(serialized!==last){undoStack.push(map);if(undoStack.length>80)undoStack.shift();redoStack=[];updateHistoryButtons();}
    }
    return map;
  }
  function saveTextDraft(){
    if(!activePage)return;
    const map=snapshot(true);if(!map)return;
    localStorage.setItem(textDraftKey(activePage),JSON.stringify(map));
    setStatus('已保存草稿','saved');
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>setStatus(editing?'编辑中':'',editing?'editing':''),900);
  }
  function saveImageDraft(){
    if(!activePage)return;
    localStorage.setItem(imageDraftKey(activePage),JSON.stringify(imageState));
    setStatus('图片设置已保存','saved');
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>setStatus(mode==='image'?'图片模式':'','editing'),900);
  }

  function installEditorStyles(doc){
    if(doc.getElementById('portfolio-editor-style'))return;
    const s=doc.createElement('style');s.id='portfolio-editor-style';
    s.textContent=`
      html{scroll-behavior:auto!important}
      *,*::before,*::after{animation-play-state:paused!important;transition:none!important}
      .reveal,.fx-reveal,.anthro-unlock,[data-reveal]{opacity:1!important;transform:none!important;filter:none!important;visibility:visible!important}
      [contenteditable="true"]{outline:1px dashed rgba(225,157,51,.62)!important;outline-offset:3px!important;cursor:text!important;}
      [contenteditable="true"]:focus{outline:2px solid rgba(225,157,51,.95)!important;background:rgba(225,157,51,.07)!important;}
      body.__image-editor-mode img{cursor:crosshair!important;outline:1px dashed rgba(111,185,235,.48)!important;outline-offset:2px!important;}
      body.__image-editor-mode img:hover{outline:3px solid rgba(111,185,235,.95)!important;}
      body.__image-editor-mode img.__image-selected{outline:4px solid #66b8ef!important;outline-offset:3px!important;}
    `;
    doc.head.appendChild(s);
  }

  function setTextEdit(on){
    const doc=frame.contentDocument;if(!doc)return alert('请通过 START_LOCAL_PREVIEW.bat 打开编辑器。');
    editing=on;installEditorStyles(doc);
    allEditable(doc).forEach(el=>el.contentEditable=on?'true':'false');
    toggle.textContent=on?'结束编辑文字':'开始编辑文字';
    toggle.classList.toggle('primary',!on);
    setStatus(on?'编辑中':'',on?'editing':'');
    if(on&&undoStack.length===0){undoStack=[currentTextMap(doc)];redoStack=[];updateHistoryButtons();}
  }

  function setMode(next){
    const doc=frame.contentDocument;if(!doc)return;
    if(mode==='text'&&editing)setTextEdit(false);
    mode=next;
    textModeBtn.classList.toggle('active',mode==='text');
    imageModeBtn.classList.toggle('active',mode==='image');
    document.body.classList.toggle('mode-image',mode==='image');
    document.querySelectorAll('.text-tools').forEach(el=>el.style.display=mode==='text'?'flex':'none');
    toggle.style.display=mode==='text'?'inline-block':'none';
    imagePanel.classList.toggle('open',mode==='image');
    doc.body.classList.toggle('__image-editor-mode',mode==='image');
    if(mode==='image'){
      hint.textContent='点击页面中的图片进行替换、Cover / Contain 与位置调整。图片替换后需同时下载替换图并放回提示路径。';
      setStatus('图片模式','editing');
    }else{
      hint.textContent='文字修改会自动保存为本机草稿；导出后，用下载文件覆盖 site/ 中的同名 HTML。';
      clearImageSelection();setStatus('');
    }
  }

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open('portfolio-editor-images',1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files');};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function putBlob(key,blob){
    const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(blob,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
  }
  async function getBlob(key){
    const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readonly');const r=tx.objectStore('files').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});
  }
  async function deleteBlob(key){
    const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
  }

  function sourceImageById(id){return sourceDoc?.querySelector(`[data-image-editor-id="${CSS.escape(String(id))}"]`)||null;}
  function liveImageById(id){return frame.contentDocument?.querySelector(`[data-image-editor-id="${CSS.escape(String(id))}"]`)||null;}
  function dirname(path){const i=path.lastIndexOf('/');return i>=0?path.slice(0,i+1):'';}
  function basename(path){return path.split('/').pop()||'image';}
  function sanitizeFileName(name){return name.replace(/[^a-zA-Z0-9._\-()\u4e00-\u9fff]/g,'-').replace(/-+/g,'-');}

  async function applyImageStateToLive(){
    const doc=frame.contentDocument;if(!doc)return;
    for(const img of allImages(doc)){
      const id=img.dataset.imageEditorId;if(id==null)continue;
      const state=imageState[id];if(!state)continue;
      if(state.fit)img.style.objectFit=state.fit;else img.style.removeProperty('object-fit');
      if(state.posX!=null||state.posY!=null){img.style.objectPosition=`${state.posX??50}% ${state.posY??50}%`;}
      else img.style.removeProperty('object-position');
      if(state.targetSrc&&state.hasReplacement){
        const blob=await getBlob(blobKey(id)).catch(()=>null);
        if(blob){
          if(imageObjectUrls[id])URL.revokeObjectURL(imageObjectUrls[id]);
          imageObjectUrls[id]=URL.createObjectURL(blob);img.src=imageObjectUrls[id];
        }
      }
    }
  }

  function clearImageSelection(){
    selectedImageId=null;
    frame.contentDocument?.querySelectorAll('img.__image-selected').forEach(el=>el.classList.remove('__image-selected'));
    imageControls.hidden=true;imagePanelEmpty.hidden=false;
  }
  async function selectImage(img){
    if(mode!=='image')return;
    frame.contentDocument.querySelectorAll('img.__image-selected').forEach(el=>el.classList.remove('__image-selected'));
    img.classList.add('__image-selected');
    selectedImageId=img.dataset.imageEditorId;
    const srcImg=sourceImageById(selectedImageId);
    if(!srcImg)return;
    const state=imageState[selectedImageId]||{};
    imagePanelEmpty.hidden=true;imageControls.hidden=false;
    originalPath.textContent=srcImg.getAttribute('src')||'';
    targetPath.textContent=state.targetSrc||srcImg.getAttribute('src')||'';
    fitSelect.value=state.fit||'';
    posX.value=state.posX??50;posY.value=state.posY??50;
    posXValue.textContent=`${posX.value}%`;posYValue.textContent=`${posY.value}%`;
    panelPreview.src=img.currentSrc||img.src;
    downloadReplacement.disabled=!(state.hasReplacement&&state.targetSrc);
  }

  function updateSelectedImageSettings(){
    if(selectedImageId==null)return;
    const img=liveImageById(selectedImageId);if(!img)return;
    const state=imageState[selectedImageId]||{};
    state.fit=fitSelect.value;
    state.posX=Number(posX.value);state.posY=Number(posY.value);
    imageState[selectedImageId]=state;
    if(state.fit)img.style.objectFit=state.fit;else img.style.removeProperty('object-fit');
    img.style.objectPosition=`${state.posX}% ${state.posY}%`;
    posXValue.textContent=`${state.posX}%`;posYValue.textContent=`${state.posY}%`;
    saveImageDraft();
  }

  async function handleReplacement(file){
    if(selectedImageId==null||!file)return;
    const srcImg=sourceImageById(selectedImageId);if(!srcImg)return;
    const originalSrc=srcImg.getAttribute('src')||'';
    const safeName=sanitizeFileName(file.name||'replacement-image');
    const targetSrc=dirname(originalSrc)+safeName;
    await putBlob(blobKey(selectedImageId),file);
    const state=imageState[selectedImageId]||{};
    state.hasReplacement=true;state.fileName=safeName;state.targetSrc=targetSrc;state.mime=file.type||'';
    state.fit=fitSelect.value;state.posX=Number(posX.value);state.posY=Number(posY.value);
    imageState[selectedImageId]=state;saveImageDraft();
    const img=liveImageById(selectedImageId);
    if(imageObjectUrls[selectedImageId])URL.revokeObjectURL(imageObjectUrls[selectedImageId]);
    imageObjectUrls[selectedImageId]=URL.createObjectURL(file);img.src=imageObjectUrls[selectedImageId];panelPreview.src=imageObjectUrls[selectedImageId];
    targetPath.textContent=targetSrc;downloadReplacement.disabled=false;
    setStatus('替换图已载入','saved');
  }

  async function resetSelectedImage(){
    if(selectedImageId==null)return;
    const srcImg=sourceImageById(selectedImageId);const live=liveImageById(selectedImageId);if(!srcImg||!live)return;
    await deleteBlob(blobKey(selectedImageId)).catch(()=>{});
    if(imageObjectUrls[selectedImageId]){URL.revokeObjectURL(imageObjectUrls[selectedImageId]);delete imageObjectUrls[selectedImageId];}
    delete imageState[selectedImageId];saveImageDraft();
    live.src=srcImg.getAttribute('src')||'';
    live.style.objectFit=srcImg.style.objectFit||'';live.style.objectPosition=srcImg.style.objectPosition||'';
    panelPreview.src=live.src;targetPath.textContent=srcImg.getAttribute('src')||'';fitSelect.value='';posX.value=50;posY.value=50;posXValue.textContent='50%';posYValue.textContent='50%';downloadReplacement.disabled=true;
    setStatus('已恢复原图','saved');
  }

  async function downloadSelectedReplacement(){
    if(selectedImageId==null)return;
    const state=imageState[selectedImageId];if(!state?.hasReplacement)return;
    const blob=await getBlob(blobKey(selectedImageId)).catch(()=>null);if(!blob)return alert('找不到替换图片草稿，请重新选择图片。');
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=basename(state.targetSrc);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
    setStatus('替换图已下载','saved');
  }

  function applyImageMapToExport(doc){
    allImages(doc).forEach(img=>{
      const id=img.dataset.imageEditorId;if(id==null)return;
      const state=imageState[id];if(!state)return;
      if(state.hasReplacement&&state.targetSrc)img.setAttribute('src',state.targetSrc);
      if(state.fit)img.style.objectFit=state.fit;else img.style.removeProperty('object-fit');
      if(state.posX!=null||state.posY!=null)img.style.objectPosition=`${state.posX??50}% ${state.posY??50}%`;
      else img.style.removeProperty('object-position');
    });
  }

  function framePageName(){
    try{
      const path=frame.contentWindow?.location?.pathname||'';
      return decodeURIComponent(path.split('/').pop()||'') || frame.getAttribute('src') || select.value;
    }catch(e){
      return frame.getAttribute('src') || select.value;
    }
  }

  async function loadSourceAndDraft(){
    const session=++loadSession;
    const page=framePageName();
    const docAtStart=frame.contentDocument;
    if(!docAtStart||!page)return;

    // The iframe is authoritative. Never let a stale async load from another page
    // apply its text/image map to the document that is currently visible.
    activePage=page;
    download.disabled=true;
    Object.values(imageObjectUrls).forEach(u=>URL.revokeObjectURL(u));
    imageObjectUrls={};selectedImageId=null;imageState={};
    undoStack=[];redoStack=[];updateHistoryButtons();clearImageSelection();

    let fetchedHtml='';
    let fetchedDoc=null;
    try{
      fetchedHtml=await fetch(page,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.text();});
      if(session!==loadSession || frame.contentDocument!==docAtStart || framePageName()!==page)return;
      fetchedDoc=new DOMParser().parseFromString(fetchedHtml,'text/html');
      assignTextIds(fetchedDoc);assignImageIds(fetchedDoc);
    }catch(e){
      if(session!==loadSession)return;
      console.warn('Cannot fetch source HTML',e);
    }

    if(session!==loadSession || frame.contentDocument!==docAtStart || framePageName()!==page)return;
    sourceHtml=fetchedHtml;sourceDoc=fetchedDoc;
    const doc=docAtStart;
    assignTextIds(doc);assignImageIds(doc);installEditorStyles(doc);

    let textDraft=null;
    try{
      const raw=localStorage.getItem(textDraftKey(page));
      textDraft=JSON.parse(raw||'null');
    }catch(e){}
    if(session!==loadSession || frame.contentDocument!==doc || activePage!==page)return;
    if(textDraft){applyTextMap(doc,textDraft);setStatus('已载入草稿','saved');}

    try{
      const raw=localStorage.getItem(imageDraftKey(page));
      imageState=JSON.parse(raw||'{}')||{};
    }catch(e){imageState={};}
    if(session!==loadSession || frame.contentDocument!==doc || activePage!==page)return;
    await applyImageStateToLive();
    if(session!==loadSession || frame.contentDocument!==doc || activePage!==page)return;

    undoStack=[currentTextMap(doc)];redoStack=[];updateHistoryButtons();
    doc.addEventListener('input',()=>{
      if(activePage!==page||frame.contentDocument!==doc||!editing||isApplyingHistory)return;
      clearTimeout(saveTimer);saveTimer=setTimeout(saveTextDraft,300);
    },true);
    doc.addEventListener('click',e=>{
      if(activePage!==page||frame.contentDocument!==doc||mode!=='image')return;
      const img=e.target.closest?.('img');
      if(img){e.preventDefault();e.stopPropagation();selectImage(img);}
    },true);
    doc.body.classList.toggle('__image-editor-mode',mode==='image');
    if(editing)setTextEdit(true);
    download.disabled=false;
    if(!textDraft)setStatus(`已加载：${page}`,'saved');
  }

  select.addEventListener('change',()=>{
    ++loadSession; // invalidate every pending async operation from the previous page
    activePage='';sourceHtml='';sourceDoc=null;download.disabled=true;
    editing=false;toggle.textContent='开始编辑文字';toggle.classList.add('primary');setStatus('正在切换页面…');
    undoStack=[];redoStack=[];imageState={};clearImageSelection();
    Object.values(imageObjectUrls).forEach(u=>URL.revokeObjectURL(u));imageObjectUrls={};
    frame.src=select.value;
  });
  toggle.addEventListener('click',()=>setTextEdit(!editing));
  textModeBtn.addEventListener('click',()=>setMode('text'));
  imageModeBtn.addEventListener('click',()=>setMode('image'));
  frame.addEventListener('load',loadSourceAndDraft);

  undoBtn.addEventListener('click',()=>{
    const doc=frame.contentDocument;if(!doc||undoStack.length<2)return;
    const current=undoStack.pop();redoStack.push(current);const previous=undoStack[undoStack.length-1];isApplyingHistory=true;applyTextMap(doc,previous);isApplyingHistory=false;localStorage.setItem(textDraftKey(activePage),JSON.stringify(previous));updateHistoryButtons();setStatus('已撤销','saved');
  });
  redoBtn.addEventListener('click',()=>{
    const doc=frame.contentDocument;if(!doc||!redoStack.length)return;
    const next=redoStack.pop();undoStack.push(next);isApplyingHistory=true;applyTextMap(doc,next);isApplyingHistory=false;localStorage.setItem(textDraftKey(activePage),JSON.stringify(next));updateHistoryButtons();setStatus('已重做','saved');
  });

  resetDraft.addEventListener('click',async()=>{
    if(!confirm('清除当前页面在本机保存的文字和图片编辑草稿，并恢复文件中的内容？'))return;
    const page=activePage||select.value;
    localStorage.removeItem(textDraftKey(page));localStorage.removeItem(imageDraftKey(page));
    localStorage.removeItem(legacyTextDraftKey(page));localStorage.removeItem(legacyImageDraftKey(page));
    for(const id of Object.keys(imageState))await deleteBlob(blobKey(id,page)).catch(()=>{});
    imageState={};undoStack=[];redoStack=[];activePage='';++loadSession;frame.src=page;
  });

  document.querySelectorAll('[data-device]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-device]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');shell.classList.remove('tablet','mobile');if(btn.dataset.device!=='desktop')shell.classList.add(btn.dataset.device);
  }));

  fitSelect.addEventListener('change',updateSelectedImageSettings);
  posX.addEventListener('input',updateSelectedImageSettings);
  posY.addEventListener('input',updateSelectedImageSettings);
  replaceFile.addEventListener('change',()=>{const f=replaceFile.files?.[0];if(f)handleReplacement(f).finally(()=>replaceFile.value='');});
  resetImage.addEventListener('click',resetSelectedImage);
  downloadReplacement.addEventListener('click',downloadSelectedReplacement);

  download.addEventListener('click',async()=>{
    const live=frame.contentDocument;if(!live)return;
    if(!activePage)return alert('页面仍在加载，请稍候再导出。');
    if(editing)saveTextDraft();else localStorage.setItem(textDraftKey(activePage),JSON.stringify(currentTextMap(live)));
    localStorage.setItem(imageDraftKey(activePage),JSON.stringify(imageState));
    let exportDoc;
    if(sourceHtml){
      exportDoc=new DOMParser().parseFromString(sourceHtml,'text/html');assignTextIds(exportDoc);assignImageIds(exportDoc);applyTextMap(exportDoc,currentTextMap(live));applyImageMapToExport(exportDoc);cleanEditorAttrs(exportDoc);
    }else{
      exportDoc=live.cloneNode(true);exportDoc.querySelector('#portfolio-editor-style')?.remove();exportDoc.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));cleanEditorAttrs(exportDoc);
    }
    const doctype='<!doctype html>\n';const html=doctype+exportDoc.documentElement.outerHTML;const blob=new Blob([html],{type:'text/html;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=activePage;document.body.appendChild(a);a.click();const url=a.href;a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);setStatus('HTML 已导出','saved');
  });

  setMode('text');
})();
