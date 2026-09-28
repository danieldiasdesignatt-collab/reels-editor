const DB_NAME='estudio-reels-media', STORE='videos'; let db; let activeReelId=null; let sourceUrl=null; let outputUrl=null; let ffmpeg=null;
const r$=id=>document.getElementById(id);
state.projects.forEach(p=>{if(!Array.isArray(p.reels))p.reels=[]}); localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function mediaDb(){return db||(db=await openDb())} async function saveMedia(id,blob){const d=await mediaDb();return new Promise((res,rej)=>{const x=d.transaction(STORE,'readwrite');x.objectStore(STORE).put(blob,id);x.oncomplete=res;x.onerror=()=>rej(x.error)})} async function getMedia(id){const d=await mediaDb();return new Promise((res,rej)=>{const x=d.transaction(STORE).objectStore(STORE).get(id);x.onsuccess=()=>res(x.result);x.onerror=()=>rej(x.error)})}
function reel(){return current()?.reels?.find(x=>x.id===activeReelId)} function visual(p){return {logo:p.logo,primary:p.primary,accent:p.accent,background:p.background,captionStyle:p.captionStyle,captionPosition:p.captionPosition}}
function showTab(id){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.toggle('active',x.id===id))}
function renderReelList(){const p=current();if(!p)return;r$('reelList').innerHTML=(p.reels||[]).length?p.reels.map(x=>`<div class="reel-card"><div><strong>${escapeHtml(x.name)}</strong><small>${x.duration?.toFixed(1)||'?'} s · ${x.captions?.length||0} legenda(s)</small></div><button class="open-reel" data-reel="${x.id}">Editar</button></div>`).join(''):'<p class="helper">Nenhum Reel criado ainda.</p>';document.querySelectorAll('.open-reel').forEach(b=>b.onclick=()=>openReel(b.dataset.reel))}
function makeCaptionRow(c){const row=document.createElement('div');row.className='caption-row';row.innerHTML=`<label>Texto<input data-key="text" value="${escapeHtml(c.text||'')}"></label><label>Início<input data-key="start" type="number" min="0" step="0.1" value="${c.start||0}"></label><label>Fim<input data-key="end" type="number" min="0" step="0.1" value="${c.end||1}"></label><button class="remove-caption" title="Remover">×</button>`;row.querySelectorAll('input').forEach(i=>i.oninput=()=>{c[i.dataset.key]=i.dataset.key==='text'?i.value:Number(i.value);persist();renderCaptionPreview()});row.querySelector('button').onclick=()=>{reel().captions=reel().captions.filter(x=>x!==c);persist();renderReelEditor()};return row}
function renderCaptionPreview(){const x=reel();if(!x)return;const t=r$('sourceVideo').currentTime;const c=x.captions.find(a=>t>=a.start&&t<=a.end);const layer=r$('captionLayer');layer.innerHTML=c?`<span>${escapeHtml(c.text)}</span>`:'';layer.className=`caption-layer ${x.visual.captionStyle} ${x.visual.captionPosition}`;if(c)layer.querySelector('span').style.color=x.visual.accent}
function setPreviewFit(x){const stage=r$('videoStage');stage.classList.toggle('contain',x.fit==='contain');r$('sourceVideo').style.objectPosition=`${x.focusX}% ${x.focusY}%`;stage.style.background=x.visual.background}
async function openReel(id){activeReelId=id;const x=reel();if(!x)return;r$('reelsHome').classList.add('hidden');r$('reelEditor').classList.remove('hidden');r$('reelTitle').textContent=x.name;const blob=await getMedia(x.mediaId);if(!blob){r$('exportStatus').textContent='Arquivo original não encontrado neste navegador.';return}if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=URL.createObjectURL(blob);r$('sourceVideo').src=sourceUrl;r$('sourceVideo').onloadedmetadata=()=>renderReelEditor();r$('sourceVideo').ontimeupdate=renderCaptionPreview;r$('sourceVideo').onseeked=renderCaptionPreview;}
function bindNum(id,key){r$(id).oninput=e=>{const x=reel();x[key]=Number(e.target.value);if(key==='start'&&x.end<x.start)x.end=x.start;if(key==='end'&&x.end<x.start)x.start=x.end;persist();renderReelEditor(false)}}
function renderReelEditor(full=true){const x=reel();if(!x)return;const v=r$('sourceVideo');const d=x.duration||v.duration||0;x.duration=d;x.end=Math.min(x.end||d,d);r$('trimStart').value=x.start;r$('trimEnd').value=x.end;r$('trimStartRange').max=d;r$('trimEndRange').max=d;r$('trimStartRange').value=x.start;r$('trimEndRange').value=x.end;r$('fitMode').value=x.fit;r$('focusX').value=x.focusX;r$('focusY').value=x.focusY;r$('videoMeta').textContent=`Original preservado · ${d.toFixed(1)} s · ${x.width||v.videoWidth} × ${x.height||v.videoHeight}`;setPreviewFit(x);if(full){const list=r$('captionList');list.innerHTML='';x.captions.forEach(c=>list.append(makeCaptionRow(c)))}renderCaptionPreview();persist()}
function bindReelControls(){bindNum('trimStart','start');bindNum('trimEnd','end');r$('trimStartRange').oninput=e=>{r$('trimStart').value=e.target.value;r$('trimStart').dispatchEvent(new Event('input'))};r$('trimEndRange').oninput=e=>{r$('trimEnd').value=e.target.value;r$('trimEnd').dispatchEvent(new Event('input'))};r$('fitMode').oninput=e=>{reel().fit=e.target.value;persist();setPreviewFit(reel())};['focusX','focusY'].forEach(k=>r$(k).oninput=e=>{reel()[k]=Number(e.target.value);persist();setPreviewFit(reel())});r$('addCaption').onclick=()=>{const x=reel();x.captions.push({id:crypto.randomUUID(),text:'Nova legenda',start:x.start,end:Math.min(x.end,x.start+2)});persist();renderReelEditor()}}
async function importFile(file){if(!file)return;if(!file.type.startsWith('video/')){alert('Escolha um arquivo de vídeo.');return}const p=current();const url=URL.createObjectURL(file);const probe=document.createElement('video');probe.preload='metadata';probe.src=url;await new Promise((res,rej)=>{probe.onloadedmetadata=res;probe.onerror=()=>rej(new Error('Não foi possível ler este vídeo.'))});const id=crypto.randomUUID();await saveMedia(id,file);const x={id:crypto.randomUUID(),mediaId:id,name:file.name.replace(/\.[^/.]+$/,''),originalName:file.name,duration:probe.duration,width:probe.videoWidth,height:probe.videoHeight,start:0,end:probe.duration,fit:'crop',focusX:50,focusY:50,captions:[],visual:visual(p),createdAt:new Date().toISOString()};p.reels=p.reels||[];p.reels.unshift(x);persist('Vídeo original salvo neste navegador');URL.revokeObjectURL(url);await openReel(x.id)}
async function makeTestVideo(){const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d');let n=0;const stream=canvas.captureStream(30);const ac=new AudioContext(),dest=ac.createMediaStreamDestination(),osc=ac.createOscillator();osc.frequency.value=220;osc.connect(dest);osc.start();dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));const rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8,opus'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const done=new Promise(res=>rec.onstop=res);rec.start();const paint=()=>{ctx.fillStyle=`hsl(${(n*3)%360} 70% 35%)`;ctx.fillRect(0,0,640,360);ctx.fillStyle='white';ctx.font='bold 42px sans-serif';ctx.fillText('VÍDEO DE TESTE',115,160);ctx.font='26px sans-serif';ctx.fillText('áudio + imagem + legenda',145,210);n++;if(n<90)requestAnimationFrame(paint);else{osc.stop();rec.stop()}};paint();await done;await importFile(new File([new Blob(chunks,{type:'video/webm'})],'video-de-teste.webm',{type:'video/webm'}));const x=reel();x.captions.push({id:crypto.randomUUID(),text:'TESTE DE LEGENDA',start:0,end:x.duration});persist();renderReelEditor()}
function assTime(s){const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=s%60;return `${h}:${String(m).padStart(2,'0')}:${sec.toFixed(2).padStart(5,'0')}`}
function assColor(hex){return '&H00'+hex.replace('#','').match(/../g).reverse().join('').toUpperCase()}
function makeAss(x){const align=x.visual.captionPosition==='top'?8:x.visual.captionPosition==='center'?5:2;const border=x.visual.captionStyle==='clean'?0:x.visual.captionStyle==='outline'?1:3;const lines=x.captions.map(c=>{const from=assTime(Math.max(0,c.start-x.start)),to=assTime(Math.min(x.end-x.start,c.end-x.start)),text=c.text.split('\n').join('\\N').replace(/[{}]/g,'');return `Dialogue: 0,${from},${to},Default,,0,0,0,,${text}`}).join('\n');return ['[Script Info]','ScriptType: v4.00+','[V4+ Styles]','Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding',`Style: Default,Arial,76,${assColor(x.visual.accent)},${assColor(x.visual.accent)},&H00000000,&H96000000,-1,0,0,0,100,100,0,0,${border},3,2,${align},65,65,145,1`,'[Events]','Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text',lines].join('\n')}
async function engine(status){if(ffmpeg)return ffmpeg;status('Baixando o motor de exportação (primeira vez apenas)…');ffmpeg=new FFmpeg();ffmpeg.on('progress',({progress})=>status(`Exportando: ${Math.round(progress*100)}%`));ffmpeg.on('log',({message})=>console.log(message));const core='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm',pkg='https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm';await ffmpeg.load({coreURL:await toBlobURL(`${core}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${core}/ffmpeg-core.wasm`,'application/wasm'),workerURL:await toBlobURL(`${pkg}/worker.js`,'text/javascript')});return ffmpeg}
async function exportReel(){const x=reel();if(!x)return;const button=r$('exportReel'),status=t=>r$('exportStatus').textContent=t;button.disabled=true;try{status('Lendo o vídeo original…');const file=await getMedia(x.mediaId);if(!file)throw new Error('Vídeo original não encontrado neste navegador.');const f=await engine(status);const ext=(x.originalName.split('.').pop()||'mp4').replace(/[^a-z0-9]/gi,'')||'mp4';await f.writeFile(`input.${ext}`,await fetchFile(file));await f.writeFile('captions.ass',makeAss(x));let vf;if(x.fit==='crop'){const ar=x.width/x.height;let cw,ch;if(ar>9/16){ch=x.height;cw=Math.round(ch*9/16)}else{cw=x.width;ch=Math.round(cw*16/9)}const px=Math.round((x.width-cw)*x.focusX/100),py=Math.round((x.height-ch)*x.focusY/100);vf=`crop=${cw}:${ch}:${px}:${py},scale=1080:1920,subtitles=captions.ass`}else vf=`scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=${x.visual.background.replace('#','0x')},subtitles=captions.ass`;status('Preparando MP4 com áudio, corte e legendas…');await f.exec(['-ss',String(x.start),'-i',`input.${ext}`,'-t',String(x.end-x.start),'-vf',vf,'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','ultrafast','-crf','23','-c:a','aac','-movflags','+faststart','-shortest','output.mp4']);const data=await f.readFile('output.mp4');const blob=new Blob([data.buffer],{type:'video/mp4'});if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl=URL.createObjectURL(blob);r$('outputVideo').src=outputUrl;r$('downloadOutput').href=outputUrl;r$('downloadOutput').download=`${x.name||'reel'}.mp4`;r$('exportResult').classList.remove('hidden');r$('outputVideo').onloadedmetadata=()=>r$('outputMeta').textContent=`Exportado: ${r$('outputVideo').videoWidth} × ${r$('outputVideo').videoHeight} · ${r$('outputVideo').duration.toFixed(1)} s · áudio incluído quando presente no original.`;status('Exportação concluída. Assista ou baixe o MP4.')}catch(e){console.error(e);status(`Falha na exportação: ${e.message||'erro desconhecido'}. Verifique memória disponível, conexão na primeira exportação e tente um trecho menor.`)}finally{button.disabled=false}}
r$('newReel').onclick=()=>r$('videoFileInput').click();r$('videoFileInput').onchange=e=>importFile(e.target.files[0]).catch(err=>alert(err.message));r$('makeTestVideo').onclick=()=>makeTestVideo().catch(err=>alert(`Falha ao gerar teste: ${err.message}`));r$('backToReels').onclick=()=>{r$('reelEditor').classList.add('hidden');r$('reelsHome').classList.remove('hidden');renderReelList()};r$('exportReel').onclick=exportReel;bindReelControls();
const originalRender=render;render=()=>{originalRender();renderReelList()};renderReelList();

async function exportServerReel(){const x=reel();if(!x)return;const button=r$('exportReel'),status=t=>r$('exportStatus').textContent=t;button.disabled=true;try{const file=await getMedia(x.mediaId);if(!file)throw new Error('Vídeo original não encontrado neste navegador.');let vf;if(x.fit==='crop'){const ar=x.width/x.height;let cw,ch;if(ar>9/16){ch=x.height;cw=Math.round(ch*9/16)}else{cw=x.width;ch=Math.round(cw*16/9)}const px=Math.round((x.width-cw)*x.focusX/100),py=Math.round((x.height-ch)*x.focusY/100);vf=`crop=${cw}:${ch}:${px}:${py},scale=1080:1920,subtitles=captions.ass`}else vf=`scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=${x.visual.background.replace('#','0x')},subtitles=captions.ass`;const form=new FormData();form.append('video',file,x.originalName);form.append('reelId',x.id);form.append('start',String(x.start));form.append('duration',String(x.end-x.start));form.append('filter',vf);form.append('ass',makeAss(x));status('Renderizando MP4 localmente com áudio e legendas…');const response=await fetch('/api/export',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha no servidor de exportação.');if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl=data.url;r$('outputVideo').src=outputUrl;r$('downloadOutput').href=outputUrl;r$('downloadOutput').download=`${x.name||'reel'}.mp4`;r$('exportResult').classList.remove('hidden');r$('outputVideo').onloadedmetadata=()=>r$('outputMeta').textContent=`Exportado: ${r$('outputVideo').videoWidth} × ${r$('outputVideo').videoHeight} · ${r$('outputVideo').duration.toFixed(1)} s · áudio preservado.`;status('Exportação concluída. Assista ou baixe o MP4.')}catch(error){console.error(error);status(`Falha na exportação: ${error.message||'erro desconhecido'}. Tente novamente.`)}finally{button.disabled=false}}
r$('exportReel').onclick=exportServerReel;

// Camada criativa inicial: os efeitos ficam gravados no Reel, não no projeto.
// Dessa forma, mudar a identidade visual depois não altera uma edição aprovada.
function addCreativeControls(){
  const panel=document.querySelector('.controls-panel');
  if(!panel||r$('motionStyle'))return;
  const motion=document.createElement('label');
  motion.innerHTML='Movimento<select id="motionStyle"><option value="none">Sem movimento adicional</option><option value="gentle-zoom">Zoom suave e contínuo</option></select>';
  const intro=document.createElement('label');
  intro.innerHTML='Texto de abertura<input id="introText" maxlength="70" placeholder="Ex.: 3 ideias para melhorar hoje">';
  panel.append(motion,intro);
  r$('motionStyle').oninput=e=>{reel().motionStyle=e.target.value;persist();setPreviewFit(reel())};
  r$('introText').oninput=e=>{reel().introText=e.target.value;persist();renderCaptionPreview()};
}

const previousRenderReelEditor=renderReelEditor;
renderReelEditor=function(full=true){
  const x=reel();
  if(x){x.motionStyle=x.motionStyle||'none';x.introText=x.introText||'';}
  previousRenderReelEditor(full);
  addCreativeControls();
  if(x&&r$('motionStyle')){r$('motionStyle').value=x.motionStyle;r$('introText').value=x.introText;}
};

const previousSetPreviewFit=setPreviewFit;
setPreviewFit=function(x){
  previousSetPreviewFit(x);
  const stage=r$('videoStage');
  stage.classList.toggle('gentle-zoom-preview',x.motionStyle==='gentle-zoom'&&x.fit==='crop');
  let badge=stage.querySelector('.intro-preview');
  if(!badge){badge=document.createElement('div');badge.className='intro-preview';stage.append(badge);}
  badge.textContent=x.introText||'';
  badge.classList.toggle('visible',Boolean(x.introText));
};

const creativeStyle=document.createElement('style');
creativeStyle.textContent=`.video-stage.gentle-zoom-preview video{animation:reelGentleZoom 7s ease-in-out infinite alternate}@keyframes reelGentleZoom{from{transform:scale(1)}to{transform:scale(1.1)}}.intro-preview{display:none;position:absolute;top:9%;left:8%;right:8%;z-index:2;color:#fff;font:800 clamp(1.2rem,3.4vw,2.8rem)/1.05 Arial,sans-serif;text-align:center;text-transform:uppercase;text-shadow:0 3px 12px #000;pointer-events:none}.intro-preview.visible{display:block;animation:introFade 2.5s ease both}@keyframes introFade{0%{opacity:0;transform:scale(.9)}15%,76%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.04)}}`;
document.head.append(creativeStyle);

const previousMakeAss=makeAss;
makeAss=function(x){
  const base=previousMakeAss(x);
  const title=String(x.introText||'').trim().replace(/[{}\\]/g,'').replace(/\n/g,'\\N');
  if(!title)return base;
  return `${base}\nDialogue: 5,0:00:00.15,0:00:02.50,Default,,0,0,0,,{\\an5\\fs110\\bord5\\shad2\\fad(180,300)}${title}`;
};

function creativeVideoFilter(x){
  let vf;
  if(x.fit==='crop'){
    const ar=x.width/x.height;let cw,ch;
    if(ar>9/16){ch=x.height;cw=Math.round(ch*9/16)}else{cw=x.width;ch=Math.round(cw*16/9)}
    const px=Math.round((x.width-cw)*x.focusX/100),py=Math.round((x.height-ch)*x.focusY/100);
    vf=`crop=${cw}:${ch}:${px}:${py},scale=1080:1920`;
    if(x.motionStyle==='gentle-zoom')vf+=`,scale=1188:2112,crop=1080:1920:mod(n*3\\,108):mod(n*2\\,192)`;
  }else vf=`scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=${x.visual.background.replace('#','0x')}`;
  return `${vf},setsar=1,subtitles=captions.ass`;
}

async function exportCreativeReel(){
  const x=reel();if(!x)return;const button=r$('exportReel'),status=t=>r$('exportStatus').textContent=t;button.disabled=true;
  try{
    const file=await getMedia(x.mediaId);if(!file)throw new Error('Vídeo original não encontrado neste navegador.');
    const form=new FormData();form.append('video',file,x.originalName);form.append('reelId',x.id);form.append('start',String(x.start));form.append('duration',String(x.end-x.start));form.append('filter',creativeVideoFilter(x));form.append('ass',makeAss(x));
    status('Renderizando MP4 com áudio, legendas e movimento…');
    const response=await fetch('/api/export',{method:'POST',body:form});const data=await response.json();if(!response.ok)throw new Error(data.error||'Falha no servidor de exportação.');
    if(outputUrl)URL.revokeObjectURL(outputUrl);outputUrl=data.url;r$('outputVideo').src=outputUrl;r$('downloadOutput').href=outputUrl;r$('downloadOutput').download=`${x.name||'reel'}.mp4`;r$('exportResult').classList.remove('hidden');
    r$('outputVideo').onloadedmetadata=()=>r$('outputMeta').textContent=`Exportado: ${r$('outputVideo').videoWidth} × ${r$('outputVideo').videoHeight} · ${r$('outputVideo').duration.toFixed(1)} s · áudio preservado.`;status('Exportação concluída. Assista ou baixe o MP4.');
  }catch(error){console.error(error);status(`Falha na exportação: ${error.message||'erro desconhecido'}. Tente novamente.`)}finally{button.disabled=false;}
}
r$('exportReel').onclick=exportCreativeReel;
