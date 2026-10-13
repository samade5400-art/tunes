const $=s=>document.querySelector(s),LS=localStorage;
let PL=[],cache={},queue=[],idx=-1,shuffle=LS.shuffle==='1',player,ready=false,pending=null,curKey=null;
const favs=()=>JSON.parse(LS.favs||'[]'),setFavs=f=>LS.favs=JSON.stringify(f),isFav=id=>favs().some(x=>x.id===id);
const custom=()=>JSON.parse(LS.custom||'[]');
const thumb=id=>`https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(k){if(cache[k])return cache[k];const p=allPL().find(x=>x.key===k);
 if(p.custom){cache[k]=await customTracks(p);return cache[k]}
 const r=await fetch(`data/${k}.json`);cache[k]=await r.json();return cache[k]}
const allPL=()=>PL.concat(custom());
async function customTracks(p){ // resolve ids via a hidden helper player
 return new Promise(res=>{const d=document.createElement('div');document.body.appendChild(d);
  const h=new YT.Player(d,{height:1,width:1,playerVars:{listType:'playlist',list:p.list},events:{onReady:()=>{let n=0;const t=setInterval(()=>{const ids=h.getPlaylist();
   if(ids&&ids.length||++n>20){clearInterval(t);h.destroy();d.remove();res((ids||[]).map(id=>({id,t:'Loading…',a:''})))}},300)}}})})}
function fillTitles(list){list.filter(x=>x.t==='Loading…').slice(0,60).forEach(x=>fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${x.id}`).then(r=>r.json()).then(j=>{x.t=j.title||'Unknown';x.a=j.author_name||'';const e=document.querySelector(`[data-id="${x.id}"]`);if(e){e.querySelector('.tt').textContent=x.t;e.querySelector('.ta').textContent=x.a}}).catch(()=>{}))}
function home(){setTab('home');const c=allPL().map(p=>`<div class="card" data-k="${p.key}" style="background-color:${p.c||'#333'};background-image:url(${p.img||''})"><b>${esc(p.name)}</b><small>${esc(p.sub||'')}</small></div>`).join('');
 $('#view').innerHTML=`<div class="grid">${c}<div class="card add" id="addpl"><b>＋ Add playlist</b><small>Paste a YouTube playlist link</small></div></div>`;
 document.querySelectorAll('.card[data-k]').forEach(e=>e.onclick=()=>openPL(e.dataset.k));$('#addpl').onclick=addPL;
 PL.forEach(p=>load(p.key).then(t=>{const e=document.querySelector(`.card[data-k="${p.key}"]`);if(e&&t[0])e.style.backgroundImage=`url(${thumb(t[0].id)})`}).catch(()=>{}))}
function addPL(){const u=prompt('Paste a YouTube playlist URL (or list ID):');if(!u)return;const m=u.match(/list=([\w-]+)/)||u.match(/^([\w-]{10,})$/);if(!m)return alert('No playlist ID found');
 const name=prompt('Name for this section:','My playlist')||'My playlist';const c=custom();c.push({key:'c'+Date.now(),name,sub:'Custom',list:m[1],c:'#444',custom:1});LS.custom=JSON.stringify(c);home()}
function rows(list,src){return list.map((x,i)=>`<div class="tr" data-i="${i}" data-id="${x.id}"><span class="n">${i+1}</span><img loading="lazy" src="${thumb(x.id)}"><div class="m"><div class="tt">${esc(x.t)}</div><div class="ta">${esc(x.a)}</div></div><button class="h">${isFav(x.id)?'♥':'♡'}</button></div>`).join('')}
function bindRows(list,key){document.querySelectorAll('.tr').forEach(e=>{const i=+e.dataset.i;
 e.onclick=ev=>{if(ev.target.classList.contains('h')){toggleFav(list[i]);ev.target.textContent=isFav(list[i].id)?'♥':'♡';return}playList(list,i,key)}});mark()}
async function openPL(k){setTab('home');const p=allPL().find(x=>x.key===k);$('#view').innerHTML='<div class="empty">Loading…</div>';const t=await load(k);
 $('#view').innerHTML=`<div class="hd"><button class="back" id="bk">←</button><h2>${esc(p.name)}</h2>${p.custom?'<button class="back" id="rm">🗑</button>':''}<button id="pa">▶ Play</button></div>${rows(t)}`;
 $('#bk').onclick=home;$('#pa').onclick=()=>playList(t,shuffle?Math.floor(Math.random()*t.length):0,k);
 if(p.custom){$('#rm').onclick=()=>{LS.custom=JSON.stringify(custom().filter(x=>x.key!==k));home()};fillTitles(t)}bindRows(t,k)}
function favView(){setTab('fav');const f=favs();$('#view').innerHTML=f.length?`<div class="hd"><h2>Favorites</h2><button id="pa">▶ Play all</button></div>${rows(f)}`:'<div class="empty">No favorites yet — tap ♡ on any song.</div>';
 if(f.length){$('#pa').onclick=()=>playList(f,0,'fav');bindRows(f,'fav')}}
async function search(q){q=q.trim().toLowerCase();if(!q)return home();setTab('home');await Promise.all(PL.map(p=>load(p.key).catch(()=>[])));
 const seen=new Set(),res=[];for(const k in cache)for(const x of cache[k])if(!seen.has(x.id)&&(x.t+' '+x.a).toLowerCase().includes(q)){seen.add(x.id);res.push(x)}
 $('#view').innerHTML=`<div class="hd"><h2>Results for “${esc(q)}”</h2></div>${rows(res)}${res.length?'':'<div class="empty">Not in the charts loaded here.</div>'}<p style="text-align:center"><a class="pill" style="color:#000;text-decoration:none;display:inline-block" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}">Search “${esc(q)}” on YouTube ↗</a></p>`;bindRows(res,'search')}
function setTab(v){document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v))}
function toggleFav(x){let f=favs();f=isFav(x.id)?f.filter(y=>y.id!==x.id):[{id:x.id,t:x.t,a:x.a},...f];setFavs(f);upd()}
function playList(list,i,key){queue=list.slice();curKey=key;play(i)}
function play(i){if(!queue.length)return;idx=(i+queue.length)%queue.length;const x=queue[idx];$('#bar').hidden=false;$('#ytwrap').classList.remove('idle');
 if(!ready){pending=x.id}else player.loadVideoById(x.id);upd();mediaSession(x)}
function next(){if(shuffle&&queue.length>1){let j;do j=Math.floor(Math.random()*queue.length);while(j===idx);play(j)}else play(idx+1)}
function prev(){if(ready&&player.getCurrentTime()>4)player.seekTo(0);else play(idx-1)}
function upd(){const x=queue[idx];if(!x)return;$('#nt').textContent=x.t;$('#na').textContent=x.a;$('#art').src=thumb(x.id);$('#fv').textContent=isFav(x.id)?'♥':'♡';$('#fv').classList.toggle('on',isFav(x.id));
 $('#shuf').classList.toggle('on',shuffle);document.title=x.t+' · Tunes';mark()}
function mark(){const x=queue[idx];document.querySelectorAll('.tr').forEach(e=>e.classList.toggle('cur',!!x&&e.dataset.id===x.id))}
function mediaSession(x){if(!('mediaSession' in navigator))return;navigator.mediaSession.metadata=new MediaMetadata({title:x.t,artist:x.a,artwork:[{src:`https://i.ytimg.com/vi/${x.id}/hqdefault.jpg`,sizes:'480x360'}]});
 [['play',()=>player.playVideo()],['pause',()=>player.pauseVideo()],['nexttrack',next],['previoustrack',prev]].forEach(([a,f])=>{try{navigator.mediaSession.setActionHandler(a,f)}catch(e){}})}
window.onYouTubeIframeAPIReady=()=>{player=new YT.Player('yt',{width:360,height:203,playerVars:{playsinline:1,rel:0,modestbranding:1},events:{
 onReady:()=>{ready=true;if(pending){player.loadVideoById(pending);pending=null}},
 onStateChange:e=>{$('#pp').textContent=e.data===1?'⏸':'▶';if(e.data===0)next()},
 onError:e=>{console.warn('yt error',e.data,queue[idx]&&queue[idx].id);setTimeout(next,600)}}})};
setInterval(()=>{if(ready&&player.getDuration){const d=player.getDuration();if(d&&!seeking)$('#seek').value=player.getCurrentTime()/d*1000}},1000);
let seeking=false;$('#seek').oninput=()=>seeking=true;$('#seek').onchange=()=>{seeking=false;player.seekTo($('#seek').value/1000*player.getDuration(),true)};
$('#pp').onclick=()=>{if(!ready)return;player.getPlayerState()===1?player.pauseVideo():player.playVideo()};
$('#next').onclick=next;$('#prev').onclick=prev;$('#shuf').onclick=()=>{shuffle=!shuffle;LS.shuffle=shuffle?'1':'0';upd()};
$('#fv').onclick=()=>{if(queue[idx])toggleFav(queue[idx]);if($('#tabs .on').dataset.v==='fav')favView()};
$('#vid').onclick=()=>$('#ytwrap').classList.toggle('show');
$('#home').onclick=()=>{$('#q').value='';home()};
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>b.dataset.v==='fav'?favView():home());
let st;$('#q').oninput=e=>{clearTimeout(st);st=setTimeout(()=>search(e.target.value),300)};
fetch('playlists.json').then(r=>r.json()).then(p=>{PL=p;home()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');
