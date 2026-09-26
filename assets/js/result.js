const escR=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const bn=v=>String(v??'').replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const bnNum=v=>bn(Number(v||0).toLocaleString('en-US'));
let RESULT_DATA=null, RESULT_BRANCH='';

function avatar(c){
  return c.photo
    ? `<img class="winner-photo" src="${c.photo}" alt="${escR(c.name)}">`
    : `<div class="winner-photo photo-fallback" aria-label="ছবি নেই">${escR((c.name||'?')[0])}</div>`;
}
function symbolVisual(c){
  if(c.symbolPhoto) return `<img class="winner-symbol-photo" src="${c.symbolPhoto}" alt="${escR(c.symbolName||'প্রতীক')}">`;
  if(c.symbolIcon) return `<span class="winner-symbol-icon" aria-hidden="true">${escR(c.symbolIcon)}</span>`;
  return `<span class="winner-symbol-icon winner-symbol-fallback" aria-hidden="true">◆</span>`;
}
function card(c){
  const nameText=String(c.name||'');
  const nameClass=nameText.length>=18?'name-xlong':(nameText.length>=13?'name-long':'');
  return `<article class="winner-card ${c.rank===1?'first':''}">
    <div class="winner-person">${avatar(c)}</div>
    <div class="winner-symbol-box">${symbolVisual(c)}</div>
    <div class="winner-info">
      <h4 class="${nameClass}" title="${escR(nameText)}">${escR(nameText)}</h4>
      <div class="winner-symbol-name">${escR(c.symbolName||'প্রতীক নেই')}</div>
      <span class="winner-label">বিজয়ী</span>
    </div>
    <div class="winner-vote-box"><span>প্রাপ্ত ভোট</span><strong>${bnNum(c.votes)}</strong></div>
  </article>`;
}
function genderBlock(data,u,gender,label){
  const g=ElectionStore.groupResult(data,u,gender);
  // Public result-এ শুধু যে আসনে বাস্তবে বিজয়ী আছে সেটিই দেখানো হবে।
  if(!g.winners.length) return '';
  return `<section class="gender-block compact-gender ${gender==='female'?'seat-reserved':'seat-general'}">
    <div class="gender-heading"><h3>${label} (${bn(g.winners.length)})</h3><span class="winner-count">${bn(g.winners.length)}/${bn(g.quota||g.winners.length)}</span></div>
    ${g.tie?`<div class="tie-alert">⚠ ${bnNum(g.tieVote)} ভোটে সমতা</div>`:''}
    <div class="winner-grid compact-winner-grid">${g.winners.map(card).join('')}</div>
  </section>`;
}
function unitBlock(data,u,showResult){
  if(!showResult){
    return `<section class="result-unit compact-unit unpublished-section" data-unit-id="${escR(u.id)}">
      <h2>${escR(u.name)}<span class="unit-total">অপ্রকাশিত</span></h2>
      <div class="unit-genders unpublished-empty" aria-label="ফলাফল এখনো প্রকাশিত হয়নি"></div>
    </section>`;
  }
  const mg=ElectionStore.groupResult(data,u,'male'),fg=ElectionStore.groupResult(data,u,'female');
  const male=genderBlock(data,u,'male','সাধারণ আসনে বিজয়ী');
  const female=genderBlock(data,u,'female','সংরক্ষিত নারী আসনে বিজয়ী');
  const totalW=mg.winners.length+fg.winners.length;
  const totalQ=mg.quota+fg.quota;
  const single=(male&&!female)||(!male&&female);
  return `<section class="result-unit compact-unit clickable-unit ${single?'single-seat-unit':''}" role="link" tabindex="0" data-unit-id="${escR(u.id)}">
    <h2>${escR(u.name)}<span class="unit-total">${bn(totalW)}/${bn(totalQ||totalW)}</span></h2>
    <div class="unit-genders ${single?'single-seat':''}">${male}${female}</div>
  </section>`;
}
function chooseGrid(n){let cols=4;if(n<=1)cols=1;else if(n===2)cols=2;else if(n===3)cols=3;else if(n<=8)cols=4;else if(n<=10)cols=5;else cols=6;return{cols,rows:Math.max(1,Math.ceil(n/cols))};}
function branchSummary(data,b,units){let mw=0,fw=0,totalVotes=0,totalCandidates=0,totalVoters=0,totalBooths=0;units.forEach(u=>{const mg=ElectionStore.groupResult(data,u,'male'),fg=ElectionStore.groupResult(data,u,'female');mw+=mg.winners.length;fw+=fg.winners.length;totalCandidates+=mg.ranked.length+fg.ranked.length;[...mg.ranked,...fg.ranked].forEach(c=>totalVotes+=Number(c.votes||0));totalVoters+=Number(u.voters?.total||0);totalBooths+=(u.booths||[]).length;});return `<div class="summary-item"><div class="summary-icon">🏭</div><div class="summary-text"><div class="summary-label">মোট সেকশন</div><div class="summary-value">${bn(units.length)}</div><div class="summary-note">${escR(b.name)}</div></div></div><div class="summary-item"><div class="summary-icon">👥</div><div class="summary-text"><div class="summary-label">মোট ভোটার</div><div class="summary-value">${bnNum(totalVoters)}</div><div class="summary-note">নিবন্ধিত ভোটার</div></div></div><div class="summary-item"><div class="summary-icon">🗳</div><div class="summary-text"><div class="summary-label">মোট বুথ</div><div class="summary-value">${bn(totalBooths)}</div><div class="summary-note">সক্রিয় সেকশনসমূহ</div></div></div><div class="summary-item"><div class="summary-icon">🏆</div><div class="summary-text"><div class="summary-label">মোট বিজয়ী</div><div class="summary-value">${bn(mw+fw)}</div><div class="summary-note">সাধারণ আসন: ${bn(mw)} • সংরক্ষিত নারী আসন: ${bn(fw)}</div></div></div><div class="summary-item"><div class="summary-icon">👤</div><div class="summary-text"><div class="summary-label">মোট প্রার্থী</div><div class="summary-value">${bn(totalCandidates)}</div><div class="summary-note">মোট প্রাপ্ত ভোট: ${bnNum(totalVotes)}</div></div></div>`;}

function summaryFooter(data,b,units){
  let mw=0,fw=0,totalVotes=0,totalCandidates=0,totalVoters=0,totalBallots=0;
  units.forEach(u=>{
    const mg=ElectionStore.groupResult(data,u,'male'),fg=ElectionStore.groupResult(data,u,'female');
    mw+=mg.winners.length;
    fw+=fg.winners.length;
    totalCandidates+=mg.ranked.length+fg.ranked.length;
    [...mg.ranked,...fg.ranked].forEach(c=>totalVotes+=Number(c.votes||0));
    totalVoters+=Number(u.voters?.total||0);
    totalBallots+=Number(u.stats?.totalBallots||0);
  });
  const turnoutPct=totalVoters>0?(totalBallots/totalVoters)*100:0;
  const turnoutText=turnoutPct.toFixed(1).replace(/\.0$/,'');
  return `<div class="v14-summary-item"><div class="v14-summary-icon">🏭</div><div><div class="v14-summary-label">মোট সেকশন</div><div class="v14-summary-value">${bn(units.length)}</div><div class="v14-summary-note">সক্রিয় সেকশন</div></div></div>
  <div class="v14-summary-item"><div class="v14-summary-icon">🏆</div><div><div class="v14-summary-label">মোট বিজয়ী</div><div class="v14-summary-value">${bn(mw+fw)}</div><div class="v14-summary-note">সাধারণ: ${bn(mw)} • সংরক্ষিত নারী: ${bn(fw)}</div></div></div>
  <div class="v14-summary-item"><div class="v14-summary-icon">👤</div><div><div class="v14-summary-label">মোট প্রার্থী</div><div class="v14-summary-value">${bn(totalCandidates)}</div><div class="v14-summary-note">সকল সক্রিয় প্রার্থী</div></div></div>
  <div class="v14-summary-item turnout-summary-item"><div class="v14-summary-icon">%</div><div><div class="v14-summary-label">মোট ভোটার উপস্থিতি</div><div class="v14-summary-value">${bn(turnoutText)}%</div><div class="v14-summary-note">ভোট দিয়েছেন ${bnNum(totalBallots)} / মোট ভোটার ${bnNum(totalVoters)}</div></div></div>
  <div class="v14-summary-item"><div class="v14-summary-icon">▥</div><div><div class="v14-summary-label">প্রার্থীদের মোট প্রাপ্ত ভোট</div><div class="v14-summary-value">${bnNum(totalVotes)}</div><div class="v14-summary-note">সকল সেকশন মিলিয়ে</div></div></div>
  <div class="v14-summary-item"><div class="v14-summary-icon">☑</div><div><div class="v14-summary-label">ফলাফলের অবস্থা</div><div class="v14-summary-value">${b.published?'প্রকাশিত':'প্রিভিউ'}</div><div class="v14-summary-note">${b.electionDate?bn(new Date(b.electionDate+'T00:00:00').toLocaleDateString('en-GB')):''}</div></div></div>`;
}
function renderBranch(){
  const data=RESULT_DATA,b=data.branches.find(x=>x.id===RESULT_BRANCH);if(!b)return;
  const qs=new URLSearchParams(location.search),isPreview=qs.get('preview')==='1';
  const titleEl=document.querySelector('#title');if(titleEl)titleEl.textContent=b.electionTitle||'অংশগ্রহণকারী কমিটি নির্বাচন-২০২৬';
  const dateEl=document.querySelector('#date');if(dateEl)dateEl.textContent=b.electionDate?`নির্বাচনের তারিখ: ${bn(new Date(b.electionDate+'T00:00:00').toLocaleDateString('en-GB'))}`:'নির্বাচনের তারিখ নির্ধারিত হয়নি';
  const units=ElectionStore.sortedUnits(data,true,b.id);
  const publishedUnits=units.filter(u=>u.published);
  const pill=document.querySelector('#statusPill');if(pill){pill.textContent=isPreview?'ফলাফল প্রিভিউ':(publishedUnits.length?'চূড়ান্ত ফলাফল':'ফলাফল এখনো প্রকাশিত নয়');pill.classList.toggle('preview',isPreview||!publishedUnits.length);}
  const root=document.querySelector('#results');if(!root)return;root.dataset.units=units.length;
  const notice=isPreview?`<div class="notice warn dashboard-notice"><b>প্রিভিউ:</b> সব সেকশনের ফলাফল দেখানো হচ্ছে।</div>`:(!publishedUnits.length?`<div class="notice warn dashboard-notice">এখনো কোনো সেকশনের ফলাফল প্রকাশিত হয়নি।</div>`:'');
  root.innerHTML=notice+(units.length?units.map(u=>unitBlock(data,u,isPreview||u.published)).join(''):'<section class="result-unit"><div class="empty">এই শাখায় কোনো সক্রিয় সেকশন নেই।</div></section>');
  root.querySelectorAll('.clickable-unit').forEach(el=>{const open=()=>location.href=`unit-result.html?branch=${encodeURIComponent(b.id)}&unit=${encodeURIComponent(el.dataset.unitId)}${isPreview?'&preview=1':''}`;el.onclick=open;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};});
  const summaryUnits=isPreview?units:publishedUnits;
  const summaryEl=document.querySelector('#resultSummary');if(summaryEl)summaryEl.innerHTML=branchSummary(data,b,summaryUnits);
  const sf=document.querySelector('#summaryFooter');if(sf)sf.innerHTML=summaryFooter(data,{...b,published:publishedUnits.length>0},summaryUnits);
  const updatedEl=document.querySelector('#lastUpdated');if(updatedEl)updatedEl.textContent=`সর্বশেষ হালনাগাদ: ${bn(new Date().toLocaleDateString('en-GB'))} ${bn(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))}`;
  layoutSectionMasonry();
  setTimeout(layoutSectionMasonry,120);
}



// V41 content-height masonry layout for the public section dashboard.
function layoutSectionMasonry(){
  const grid=document.getElementById('results');
  if(!grid)return;
  const cards=[...grid.querySelectorAll(':scope > .result-unit')];
  if(window.innerWidth<1181){
    cards.forEach(card=>card.style.gridRowEnd='');
    return;
  }
  const cs=getComputedStyle(grid);
  const row=parseFloat(cs.gridAutoRows)||4;
  const gap=parseFloat(cs.rowGap)||8;
  cards.forEach(card=>{card.style.gridRowEnd='auto';});
  requestAnimationFrame(()=>{
    cards.forEach(card=>{
      // offsetHeight is in CSS px (unaffected by page zoom on large TV screens)
      const h=Math.ceil(card.offsetHeight||card.getBoundingClientRect().height);
      const span=Math.max(1,Math.ceil((h+gap)/(row+gap)));
      card.style.gridRowEnd=`span ${span}`;
    });
  });
}

let masonryResizeTimer=0;
window.addEventListener('resize',()=>{
  clearTimeout(masonryResizeTimer);
  masonryResizeTimer=setTimeout(layoutSectionMasonry,80);
},{passive:true});
window.addEventListener('load',()=>{
  layoutSectionMasonry();
  setTimeout(layoutSectionMasonry,160);
});
if(document.fonts&&document.fonts.ready){
  document.fonts.ready.then(()=>layoutSectionMasonry()).catch(()=>{});
}

async function refreshResultData(){
  try{const fresh=await ElectionStore.load();RESULT_DATA=fresh;const branches=ElectionStore.sortedBranches(fresh,true);if(!branches.some(b=>b.id===RESULT_BRANCH))RESULT_BRANCH=branches[0]?.id||'';renderBranch();}catch(_){/* keep current rendered data */}
}
async function initResult(){
  RESULT_DATA=await ElectionStore.load();const branches=ElectionStore.sortedBranches(RESULT_DATA,true);const qs=new URLSearchParams(location.search),requested=qs.get('branch');RESULT_BRANCH=branches.some(b=>b.id===requested)?requested:(branches[0]?.id||'');const sel=document.querySelector('#publicBranchSelect');if(sel){sel.innerHTML=branches.map(b=>`<option value="${b.id}">${escR(b.name)}</option>`).join('');sel.value=RESULT_BRANCH;sel.onchange=()=>{RESULT_BRANCH=sel.value;const preview=qs.get('preview')==='1'?'&preview=1':'';history.replaceState(null,'',`?branch=${encodeURIComponent(RESULT_BRANCH)}${preview}`);renderBranch();};}renderBranch();setInterval(refreshResultData,5000);
}
const fsBtn=document.querySelector('#fullscreenBtn');if(fsBtn)fsBtn.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch(e){}});document.addEventListener('fullscreenchange',()=>{const mobileBtn=document.querySelector('#fullscreenBtnMobile');if(mobileBtn)mobileBtn.textContent=document.fullscreenElement?'⛶':'⛶';});
initResult().catch(e=>{document.querySelector('#results').innerHTML=`<section class="result-unit"><div class="notice danger">${escR(e.message)}</div></section>`;});

// V18 responsive fullscreen control
(() => {
  const btn = document.getElementById('fullscreenBtnMobile');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {}
  });
})();


// V32 floating celebration emojis: rise from the bottom of the header.
(() => {
  const layer = document.getElementById('celebrationFloatLayer');
  if (!layer || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const MAX = 16;
  const spawn = () => {
    if (!document.body.contains(layer) || document.hidden) return;
    if (layer.childElementCount >= MAX) return;
    const el = document.createElement('span');
    el.className = 'v32-float-emoji';
    const celebrationIcons = ['🎉','🎊','✨','⭐'];
    el.textContent = celebrationIcons[Math.floor(Math.random() * celebrationIcons.length)];
    const x = 5 + Math.random() * 90;
    const size = 18 + Math.random() * 18;
    const dur = 5.2 + Math.random() * 3.8;
    const d1 = -22 + Math.random() * 44;
    const d2 = -36 + Math.random() * 72;
    el.style.setProperty('--x', x.toFixed(1) + '%');
    el.style.setProperty('--size', size.toFixed(0) + 'px');
    el.style.setProperty('--dur', dur.toFixed(2) + 's');
    el.style.setProperty('--drift1', d1.toFixed(0) + 'px');
    el.style.setProperty('--drift2', d2.toFixed(0) + 'px');
    layer.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };
  for (let i = 0; i < 5; i++) setTimeout(spawn, i * 260);
  const timer = setInterval(spawn, 650);

  // V33: tiny gold/blue star particles for a richer but still professional celebration.
  const starTones = ['#ffd966','#fff1ad','#8fe5ff','#ffe277'];
  const spawnStar = () => {
    if (!document.body.contains(layer) || document.hidden) return;
    if (layer.childElementCount >= 24) return;
    const star = document.createElement('span');
    star.className = 'v33-star';
    star.textContent = Math.random() > .45 ? '✦' : '•';
    star.style.setProperty('--x', (3 + Math.random() * 94).toFixed(1) + '%');
    star.style.setProperty('--size', (6 + Math.random() * 8).toFixed(0) + 'px');
    star.style.setProperty('--dur', (4.8 + Math.random() * 3.8).toFixed(2) + 's');
    star.style.setProperty('--drift', (-30 + Math.random() * 60).toFixed(0) + 'px');
    star.style.setProperty('--tone', starTones[Math.floor(Math.random() * starTones.length)]);
    layer.appendChild(star);
    star.addEventListener('animationend', () => star.remove(), { once: true });
  };
  for (let i = 0; i < 7; i++) setTimeout(spawnStar, 180 + i * 170);
  const starTimer = setInterval(spawnStar, 430);
  window.addEventListener('beforeunload', () => { clearInterval(timer); clearInterval(starTimer); }, { once: true });
})();

// V34 celebration plus: occasional fireworks and falling ribbons in the hero.
(() => {
  const layer = document.getElementById('fireworkLayer');
  if (!layer || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#ffd45c','#fff2a8','#ff78b7','#70ddff','#7cf5b1','#ffffff'];
  let stopped = false;

  const burst = () => {
    if (stopped || document.hidden || !document.body.contains(layer)) return;
    const host = document.createElement('span');
    host.className = 'v34-burst';
    host.style.setProperty('--x', (18 + Math.random() * 64).toFixed(1) + '%');
    host.style.setProperty('--y', (22 + Math.random() * 48).toFixed(1) + '%');
    const core = document.createElement('i');
    core.className = 'v34-core';
    host.appendChild(core);
    const n = 13 + Math.floor(Math.random() * 8);
    for (let i = 0; i < n; i++) {
      const sp = document.createElement('i');
      sp.className = 'v34-spark';
      sp.style.setProperty('--a', ((360 / n) * i + (Math.random() * 10 - 5)).toFixed(1) + 'deg');
      sp.style.setProperty('--dist', (48 + Math.random() * 55).toFixed(0) + 'px');
      sp.style.setProperty('--dur', (0.95 + Math.random() * 0.55).toFixed(2) + 's');
      sp.style.setProperty('--c', colors[Math.floor(Math.random() * colors.length)]);
      host.appendChild(sp);
    }
    layer.appendChild(host);
    setTimeout(() => host.remove(), 1900);
  };

  const ribbon = () => {
    if (stopped || document.hidden || !document.body.contains(layer)) return;
    if (layer.querySelectorAll('.v34-ribbon').length > 18) return;
    const r = document.createElement('i');
    r.className = 'v34-ribbon';
    r.style.setProperty('--x', (3 + Math.random() * 94).toFixed(1) + '%');
    r.style.setProperty('--r', (-35 + Math.random() * 70).toFixed(0) + 'deg');
    r.style.setProperty('--d1', (-32 + Math.random() * 64).toFixed(0) + 'px');
    r.style.setProperty('--d2', (-46 + Math.random() * 92).toFixed(0) + 'px');
    r.style.setProperty('--dur', (4.4 + Math.random() * 2.7).toFixed(2) + 's');
    r.style.setProperty('--c', colors[Math.floor(Math.random() * (colors.length - 1))]);
    layer.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once:true });
  };

  setTimeout(burst, 900);
  setTimeout(burst, 2300);
  for (let i = 0; i < 8; i++) setTimeout(ribbon, 300 + i * 220);
  const fireTimer = setInterval(burst, 5200);
  const ribbonTimer = setInterval(ribbon, 720);
  window.addEventListener('beforeunload', () => {
    stopped = true;
    clearInterval(fireTimer);
    clearInterval(ribbonTimer);
  }, { once:true });
})();

// V2.0: keep winner names on one line — shrink the font a little if needed,
// wrap to two lines only when the name is really long.
function fitWinnerNames(){
  document.querySelectorAll('.winner-card h4').forEach(h=>{
    h.classList.remove('name-wrap');
    h.style.removeProperty('font-size');
    const base=parseFloat(getComputedStyle(h).fontSize)||15;
    if(h.scrollWidth<=h.clientWidth+1)return;
    const min=Math.max(11,base*0.78);
    let size=base;
    while(size>min&&h.scrollWidth>h.clientWidth+1){size-=0.5;h.style.setProperty('font-size',size+'px','important');}
    if(h.scrollWidth>h.clientWidth+1){h.style.setProperty('font-size',base+'px','important');h.classList.add('name-wrap');}
  });
}
(function(){
  const root=document.getElementById('results');if(!root)return;
  let t=0;const later=()=>{clearTimeout(t);t=setTimeout(()=>{fitWinnerNames();layoutSectionMasonry();},60);};
  new MutationObserver(later).observe(root,{childList:true});
  window.addEventListener('resize',later,{passive:true});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(later).catch(()=>{});
  later();
})();
