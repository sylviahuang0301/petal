const photos=[{"id": 17}, {"id": 1}, {"id": 4}, {"id": 14}, {"id": 9}, {"id": 5}, {"id": 18}, {"id": 16}, {"id": 13}, {"id": 12}, {"id": 19}, {"id": 7}, {"id": 10}, {"id": 11}];
photos.forEach(p=>{const s=window.CLOSER_STORIES[p.id];p.title=s.title;p.caption=s.paragraphs.join("\n");p.sensory=s.prompt});
const $=s=>document.querySelector(s),reel=$('#reel'),dialog=$('#photoDialog');
const num=i=>String(i).padStart(2,'0');
const defaults={
 1:{place:'A café on a rain-lit street',atmosphere:'Wet pavement · warm window light'},
 4:{place:'A Christmas market',atmosphere:'Shared cups · conversation · evening lights'},
 5:{place:'An open coastline',atmosphere:'Breaking waves · sunlit sand'},
 7:{place:'The Kiss Mural · Barcelona, Spain',atmosphere:'Ceramic tiles · a shared kiss',provenance:'Place identified from the mural. Exact camera position and weather await your field notes.'},
 8:{place:'An orange-tree-lined street',atmosphere:'Low sunlight · citrus trees · long shadows'},
 9:{place:'Out on the water',atmosphere:'Open sea · wind through hair'},
 10:{place:'A seaside promenade',atmosphere:'Floating bubbles · afternoon light'},
 11:{place:'A city street during a dragon parade',atmosphere:'Rain · bright fabric · a gathering crowd'},
 12:{place:'A quiet waterfront',atmosphere:'Calm sea · clear sky · a red lead'},
 13:{place:'Port Hercule · Monaco',atmosphere:'Bright sun · grandstands · an open street',provenance:'Place identified from the circuit signage and harbour setting. Exact camera position and weather await your field notes.'},
 14:{place:'An alpine mountain terrace',atmosphere:'Mountain air · bright sun · a shared rest'},
 15:{place:'A bay beneath a hillside town',atmosphere:'Pebbles · calm water · clear sunlight'},
 16:{place:'North Shore · Llandudno, Wales',atmosphere:'Blue sky · sea air · two companions',provenance:'Place identified from the Grand Hotel and pier. Exact camera position and weather await your field notes.'},
 17:{place:'The Mound · Edinburgh, Scotland',atmosphere:'Wet stone · autumn leaves · passing dogs',provenance:'Place identified from the castle view. Exact camera position and weather await your field notes.'}
};
let saved={};try{const value=JSON.parse(localStorage.getItem('closer-field-notes-v1')||'{}');if(value&&typeof value==='object')saved=value}catch{}
let current=0,rotation=0,spinning=false,opening=false,sound=false,audioContext,lastFocus,requestId=0;
let reflections={};try{reflections=JSON.parse(localStorage.getItem('closer-reflections-v1')||'{}')||{}}catch{}
const imageCache=new Map();
function loadPhoto(p){if(imageCache.has(p.id))return imageCache.get(p.id);const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=async()=>{try{await img.decode()}catch{}resolve(img)};img.onerror=()=>{imageCache.delete(p.id);reject(new Error('Photo could not load'))};img.src=`assets/${p.id===16?'16-wild':num(p.id)}.webp`});imageCache.set(p.id,promise);return promise}
photos.forEach((p,i)=>{
 const b=document.createElement('button');b.className='frame';b.style.setProperty('--a',`${i*360/photos.length}deg`);b.dataset.number=num(i+1);b.setAttribute('aria-label',`Open photograph ${p.id}: ${p.title}`);b.innerHTML=`<img src="assets/${p.id===16?'16-wild':num(p.id)}-thumb.webp" alt="${p.title}" draggable="false">`;b.onclick=e=>{e.stopPropagation();if(!spinning&&!opening)openPhoto(i)};reel.append(b);
 const card=document.createElement('button');card.innerHTML=`<img src="assets/${p.id===16?'16-wild':num(p.id)}-thumb.webp" alt="${p.title}" loading="lazy"><span>${num(i+1)} / ${p.title}</span>`;card.onclick=()=>{if(!spinning&&!opening)openPhoto(i)};$('#grid').append(card);
});
for(let i=0;i<7;i++){
 const hole=document.createElement('i');hole.className='sprocket';hole.style.setProperty('--a',`${i*360/7+360/28}deg`);reel.append(hole);
 const mark=document.createElement('span');mark.className='reel-mark';mark.style.setProperty('--a',`${i*360/7}deg`);mark.textContent=String(i+1);reel.append(mark);
 const label=document.createElement('span');label.className='reel-label';label.style.setProperty('--a',`${i*360/7+360/28}deg`);label.textContent=['LOOK A LITTLE LONGER','THE WORLD WITHIN REACH','COLLECTED ON FILM','STAY WITH THE MOMENT','HERE / NOW / TOGETHER','A MOMENT TO KEEP','FOLLOW THE FEELING'][i];reel.append(label);
}
const arrow=document.createElement('span');arrow.className='printed-arrow';arrow.textContent='↑';reel.append(arrow);const bottomArrow=document.createElement('span');bottomArrow.className='printed-bottom';bottomArrow.textContent='↓';reel.append(bottomArrow);
function tick(){if(!sound)return;try{audioContext??=new AudioContext();const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='triangle';o.frequency.setValueAtTime(180,audioContext.currentTime);g.gain.setValueAtTime(.012,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.06);o.start();o.stop(audioContext.currentTime+.07)}catch{}}
async function spin(){
 if(spinning||opening||dialog.open)return;
 spinning=true;$('#spinBtn').disabled=true;$('#reel').setAttribute('aria-busy','true');$('#spinStatus').textContent='慢一点，留意一个正在靠近的瞬间……';
 const index=Math.floor(Math.random()*photos.length),step=360/photos.length,desired=(360-index*step)%360,delta=(desired-rotation%360+360)%360;
 const target=rotation+360+delta,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,duration=reduced?240:7200;
 // Start decoding the one selected image while the reel turns.
 loadPhoto(photos[index]).catch(()=>{});
 let prev=-1;const start=performance.now(),from=rotation;
 try{
  await new Promise(resolve=>{function frame(now){const t=Math.min((now-start)/duration,1);const ease=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;const value=from+(target-from)*ease;reel.style.transform=`rotate(${value}deg)`;const slot=Math.floor(value/step);if(slot!==prev){tick();prev=slot}if(t<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)});
  rotation=target;$('#spinStatus').textContent=`Frame ${num(index+1)} — ${photos[index].title}`;
  // Keep the interaction locked through image decoding and modal presentation.
  await openPhoto(index);
 }finally{spinning=false;$('#spinBtn').disabled=false;$('#reel').removeAttribute('aria-busy')}
}
$('#spinBtn').onclick=spin;reel.addEventListener('click',e=>{if(e.target===reel)spin()});$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').setAttribute('aria-pressed',sound);$('#soundBtn').innerHTML=`Sound ${sound?'on':'off'} <span>◌</span>`;tick()};
async function openPhoto(i){
 if(opening)return false;
 opening=true;const token=++requestId,p=photos[i];$('#nextPhoto').disabled=true;
 try{
  const loaded=await loadPhoto(p);if(token!==requestId)return false;
  current=i;const story=window.CLOSER_STORIES[p.id],base={...story.notes},notes={...base,...saved[p.id]};
  // Replace the decoded image and all text together, then show exactly one dialog.
  const img=loaded.cloneNode();img.id='fullPhoto';img.alt=story.title+'。'+story.paragraphs[0];$('#fullPhoto').replaceWith(img);
  $('#photoNumber').textContent=`FRAME ${num(i+1)} / STAY A LITTLE`;$('#noteNumber').textContent=num(i+1);$('#photoTitleEn').textContent=story.en;$('#photoTitle').textContent=p.title;$('#photoCaption').replaceChildren(...story.paragraphs.map(text=>{const paragraph=document.createElement('p');paragraph.textContent=text;return paragraph}));$('#sensory').textContent=p.sensory;
  const fields=[['PLACE','place'],['WHEN','when'],['COORDINATES','coordinates'],['SEASON','season'],['WEATHER','weather'],['TEMPERATURE','temperature'],['SMELL','smell'],['SOUND','sound'],['TOUCH','touch'],['TASTE','taste'],['IN THE FRAME','sight']];$('#metadata').replaceChildren();
  fields.forEach(([label,key])=>{if(!notes[key])return;const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=notes[key];div.append(dt,dd);$('#metadata').append(div)});
  $('#noteProvenance').hidden=true;
  $('#reflectionText').value=reflections[p.id]||'';$('#reflectionStatus').textContent='';
  $('#noteForm').hidden=true;$('#editNote').textContent=reflections[p.id]?'重读与续写 ↗':'留下此刻的感想 ↗';
  if(!dialog.open){lastFocus=document.activeElement;dialog.showModal();document.body.style.overflow='hidden'}dialog.scrollTop=0;return true;
 }catch{$('#spinStatus').textContent='照片还在路上，请再试一次。';return false}
 finally{opening=false;$('#nextPhoto').disabled=false}
}
$('#closeDialog').onclick=()=>{++requestId;dialog.close()};dialog.addEventListener('cancel',()=>{++requestId});dialog.addEventListener('close',()=>{document.body.style.overflow='';lastFocus?.focus()});
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){++requestId;dialog.close()}});
$('#nextPhoto').onclick=()=>openPhoto((current+1)%photos.length);
$('#editNote').onclick=()=>{$('#noteForm').hidden=!$('#noteForm').hidden;if(!$('#noteForm').hidden)$('#reflectionText').focus()};
$('#noteForm').onsubmit=e=>{e.preventDefault();const value=$('#reflectionText').value.trim();reflections[photos[current].id]=value;try{localStorage.setItem('closer-reflections-v1',JSON.stringify(reflections));$('#reflectionStatus').textContent=value?'已保存，留给下次的自己。':'已保存为空白。';$('#editNote').textContent=value?'重读与续写 ↗':'留下此刻的感想 ↗'}catch{$('#reflectionStatus').textContent='当前浏览器无法保存，请先复制文字留存。'}};
$('#editAll').onclick=async()=>{if(await openPhoto(current))$('#editNote').click()};
