let DATA=null;
let CURRENT_BRANCH='';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const bn=v=>String(v??'').replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const bnNum=v=>bn(Number(v||0).toLocaleString('en-US'));

function showApp(){ const l=$('#loginView'),a=$('#appView'); l.classList.add('hidden'); l.setAttribute('aria-hidden','true'); a.classList.remove('hidden'); a.removeAttribute('aria-hidden'); document.body.classList.remove('login-open'); const nav=document.querySelector('.bn-nav-menu'); if(nav) nav.scrollTop=0; window.scrollTo(0,0); }
function hideApp(){ const l=$('#loginView'),a=$('#appView'); a.classList.add('hidden'); a.setAttribute('aria-hidden','true'); l.classList.remove('hidden'); l.removeAttribute('aria-hidden'); document.body.classList.add('login-open'); window.scrollTo(0,0); }
function currentBranch(){ return DATA.branches.find(b=>b.id===CURRENT_BRANCH) || ElectionStore.sortedBranches(DATA,true)[0] || DATA.branches[0] || null; }
function unitName(id){ return DATA.units.find(u=>u.id===id)?.name || 'অজানা সেকশন'; }
function img(src,cls='thumb',fallback='?'){ return src?`<img class="${cls}" src="${src}" alt="">`:`<span class="avatar-fallback">${esc(fallback)}</span>`; }
function openModal(id){ $('#'+id).classList.remove('hidden'); }
function closeModal(id){ $('#'+id).classList.add('hidden'); }

function setSaveStatus(ok,message){
  const box=$('#serverSaveBox'),txt=$('#saveStatusText');
  if(!box||!txt)return;
  box.classList.toggle('save-error',!ok);
  txt.textContent=message||(ok?'তথ্য ফাইলে সংরক্ষিত':'সার্ভার সংযোগ নেই');
}
window.addEventListener('election-save-status',e=>setSaveStatus(!!e.detail?.ok,e.detail?.message));

async function save(message='তথ্য সংরক্ষণ হয়েছে'){
  try{
    await ElectionStore.save(DATA);
    setSaveStatus(true,'তথ্য স্থায়ীভাবে সংরক্ষিত');
    renderAll();
    if(message) toast(message,'ok');
    return true;
  }catch(err){
    setSaveStatus(false,'সংরক্ষণ ব্যর্থ');
    alert('তথ্য স্থায়ীভাবে সংরক্ষণ করা যায়নি। START.bat দিয়ে সার্ভার চালু আছে কি না দেখুন।\n\n'+err.message);
    return false;
  }
}
function toast(text,type='ok'){
  let t=document.querySelector('.admin-toast');
  if(!t){t=document.createElement('div');t.className='admin-toast';document.body.appendChild(t)}
  t.className=`admin-toast ${type}`;t.textContent=text;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2200);
}
function nav(page){
  $$('.section').forEach(x=>x.classList.remove('active')); $('#'+page).classList.add('active');
  $$('.navbtn[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  $('#pageTitle').textContent=$(`.navbtn[data-page="${page}"]`)?.textContent.replace(/^[^\s]+\s*/,'')||'অ্যাডমিন';
  renderAll();
}
function ensureBranch(){const branches=ElectionStore.sortedBranches(DATA,false);if(!branches.length){CURRENT_BRANCH='';return;}if(!branches.some(b=>b.id===CURRENT_BRANCH))CURRENT_BRANCH=(ElectionStore.sortedBranches(DATA,true)[0]||branches[0]).id;}

function renderAll(){
  if(!DATA)return;ensureBranch();renderBranchSelector();
  const b=currentBranch();$('#electionSub').textContent=b?`${DATA.meta.organization} • ${b.name}`:DATA.meta.organization;
  renderDashboard();renderBranches();renderElection();renderUnits();populateUnitSelects();renderCandidates();renderSymbols();renderVotes();renderVerify();
}
function renderBranchSelector(){const el=$('#adminBranchSelect');const opts=ElectionStore.sortedBranches(DATA,false).map(b=>`<option value="${b.id}">${esc(b.name)}${b.active?'':' (নিষ্ক্রিয়)'}</option>`).join('');el.innerHTML=opts||'<option value="">কোনো শাখা নেই</option>';if([...el.options].some(o=>o.value===CURRENT_BRANCH))el.value=CURRENT_BRANCH;}

function renderDashboard(){
  const branches=ElectionStore.sortedBranches(DATA,true),b=currentBranch(),units=b?ElectionStore.sortedUnits(DATA,true,b.id):[],unitIds=new Set(units.map(u=>u.id)),cands=DATA.candidates.filter(c=>c.active&&unitIds.has(c.unitId));
  $('#kpiBranches').textContent=bn(branches.length);$('#kpiUnits').textContent=bn(units.length);$('#kpiCandidates').textContent=bn(cands.length);$('#kpiVoters').textContent=bnNum(units.reduce((s,u)=>s+Number(u.voters?.total||0),0));$('#kpiVotes').textContent=bnNum(cands.reduce((s,c)=>s+Number(c.votes||0),0));
  $('#dashBranchName').textContent=b?.name||'কোনো শাখা নির্বাচন করা হয়নি';$('#dashElectionTitle').textContent=b?.electionTitle||'নির্বাচনের শিরোনাম';
  $('#dashElectionDate').textContent=b?.electionDate?`📅 ${bn(new Date(b.electionDate+'T00:00:00').toLocaleDateString('en-GB'))}`:'📅 তারিখ নির্ধারিত নয়';
  const st=$('#dashPublishStatus');const pubCount=units.filter(u=>u.published).length;st.textContent=pubCount?`✓ ${bn(pubCount)} সেকশন প্রকাশিত`:'● কোনো সেকশন প্রকাশিত নয়';st.className=`hero-publish ${pubCount?'published':'draft'}`;
  $('#dashboardUnits').innerHTML=units.length?`<div class="admin-unit-grid">${units.map(u=>{
    const male=ElectionStore.candidatesFor(DATA,u.id,'male').length,female=ElectionStore.candidatesFor(DATA,u.id,'female').length,booths=(u.booths||[]).map(x=>bn(esc(x.number))).join(', ')||'নেই';
    return `<article class="admin-unit-card"><div class="admin-unit-head"><div><small>${esc(u.code||'সেকশন')}</small><h3>${esc(u.name)}</h3></div><span>${bnNum(u.voters?.total||0)} ভোটার</span></div><div class="unit-mini-stats"><div><b>${bnNum(u.voters?.male||0)}</b><span>পুরুষ ভোটার</span></div><div><b>${bnNum(u.voters?.female||0)}</b><span>নারী ভোটার</span></div><div><b>${bn(male+female)}</b><span>প্রার্থী</span></div><div><b>${bn(Number(u.quota?.male||0)+Number(u.quota?.female||0))}</b><span>বিজয়ী</span></div></div><div class="unit-card-foot"><span>🏷 বুথ: ${booths}</span><button class="btn sm" onclick="editUnit('${u.id}')">সম্পাদনা</button></div></article>`}).join('')}</div>`:'<div class="empty">এই শাখায় কোনো সক্রিয় সেকশন নেই।</div>';
}

function renderBranches(){
  const branches=ElectionStore.sortedBranches(DATA,false);
  $('#branchTable').innerHTML=branches.length?`<div class="table-wrap"><table><thead><tr><th>ক্রম</th><th>শাখা</th><th>কোড</th><th>সেকশন</th><th>নির্বাচনের তারিখ</th><th>প্রকাশিত সেকশন</th><th>অবস্থা</th><th>কার্যক্রম</th></tr></thead><tbody>${branches.map(b=>`<tr><td>${bn(b.order)}</td><td><b>${esc(b.name)}</b><div class="subtle">${esc(b.shortName||'')}</div></td><td>${esc(b.code||'-')}</td><td>${bn(DATA.units.filter(u=>u.branchId===b.id).length)}</td><td>${b.electionDate?bn(new Date(b.electionDate+'T00:00:00').toLocaleDateString('en-GB')):'-'}</td><td><span class="badge ${DATA.units.some(u=>u.branchId===b.id&&u.published)?'on':'off'}">${bn(DATA.units.filter(u=>u.branchId===b.id&&u.published).length)} / ${bn(DATA.units.filter(u=>u.branchId===b.id&&u.active).length)}</span></td><td><span class="badge ${b.active?'on':'off'}">${b.active?'সক্রিয়':'নিষ্ক্রিয়'}</span></td><td><button class="btn sm" onclick="selectBranch('${b.id}')">নির্বাচন</button> <button class="btn sm" onclick="editBranch('${b.id}')">সম্পাদনা</button> <button class="btn sm danger" onclick="removeBranch('${b.id}')">মুছুন</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">কোনো শাখা নেই।</div>';
}
function renderElection(){const b=currentBranch();$('#organization').value=DATA.meta.organization||'MASCO Group';$('#electionBranchName').value=b?.name||'';$('#electionTitle').value=b?.electionTitle||'';$('#electionDate').value=b?.electionDate||'';$('#published').value=String(!!(b&&ElectionStore.sortedUnits(DATA,true,b.id).some(u=>u.published)));}
function renderUnits(){
  const b=currentBranch(),units=b?ElectionStore.sortedUnits(DATA,false,b.id):[];
  $('#unitTable').innerHTML=units.length?`<div class="table-wrap"><table><thead><tr><th>ক্রম</th><th>সেকশন</th><th>পুরুষ ভোটার</th><th>নারী ভোটার</th><th>মোট ভোটার</th><th>বুথ</th><th>সাধারণ আসনে বিজয়ী</th><th>সংরক্ষিত নারী আসনে বিজয়ী</th><th>প্রদত্ত ভোট</th><th>বাতিল</th><th>প্রকাশ</th><th>অবস্থা</th><th>কার্যক্রম</th></tr></thead><tbody>${units.map(u=>`<tr><td>${bn(u.order||0)}</td><td><b>${esc(u.name)}</b><div class="subtle">${esc(u.code||'')}</div></td><td>${bnNum(u.voters?.male||0)}</td><td>${bnNum(u.voters?.female||0)}</td><td><b>${bnNum(u.voters?.total||0)}</b></td><td>${(u.booths||[]).map(x=>`<span class="booth-chip">${bn(esc(x.number))}</span>`).join(' ')||'-'}</td><td>${bn(u.quota?.male||0)}</td><td>${bn(u.quota?.female||0)}</td><td>${bnNum(u.stats?.totalBallots||0)}</td><td>${bnNum(u.stats?.invalidBallots||0)}</td><td><span class="badge ${u.published?'on':'off'}">${u.published?'প্রকাশিত':'গোপন'}</span></td><td><span class="badge ${u.active?'on':'off'}">${u.active?'সক্রিয়':'নিষ্ক্রিয়'}</span></td><td><button class="btn sm" onclick="editUnit('${u.id}')">সম্পাদনা</button> <button class="btn sm danger" onclick="removeUnit('${u.id}')">মুছুন</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">নির্বাচিত শাখায় কোনো সেকশন নেই।</div>';
}
function populateUnitSelects(){
  const b=currentBranch(),units=b?ElectionStore.sortedUnits(DATA,false,b.id):[],active=b?ElectionStore.sortedUnits(DATA,true,b.id):[];
  const allOpts=units.map(u=>`<option value="${u.id}">${esc(u.name)}${u.active?'':' (নিষ্ক্রিয়)'}</option>`).join(''),activeOpts=active.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('');
  [['candidateUnit',activeOpts,false],['candidateUnitFilter',allOpts,true],['voteUnitFilter',allOpts,true],['symbolUnitFilter',allOpts,true],['symbolDashboardUnit',allOpts,true]].forEach(([id,opts,all])=>{const el=$('#'+id),old=el.value;el.innerHTML=(all?'<option value="">সব সেকশন</option>':'')+opts;if([...el.options].some(o=>o.value===old))el.value=old;});
  $('#unitBranch').innerHTML=ElectionStore.sortedBranches(DATA,false).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
}
function renderCandidates(){
  const b=currentBranch();if(!b){$('#candidateTable').innerHTML='<div class="empty">কোনো শাখা নেই।</div>';return;}
  const unitIds=new Set(ElectionStore.sortedUnits(DATA,false,b.id).map(u=>u.id)),filter=$('#candidateUnitFilter').value;let cands=DATA.candidates.filter(c=>unitIds.has(c.unitId)&&(!filter||c.unitId===filter));cands.sort((a,b)=>unitName(a.unitId).localeCompare(unitName(b.unitId))||a.gender.localeCompare(b.gender)||a.name.localeCompare(b.name));
  $('#candidateTable').innerHTML=cands.length?`<div class="table-wrap"><table><thead><tr><th>ছবি</th><th>প্রার্থী</th><th>সেকশন</th><th>আসনের ধরন</th><th>বরাদ্দকৃত প্রতীক</th><th>অবস্থা</th><th>কার্যক্রম</th></tr></thead><tbody>${cands.map(c=>`<tr><td>${img(c.photo,'thumb',(c.name||'?')[0])}</td><td><b>${esc(c.name)}</b><div class="subtle">${esc(c.employeeId||'')}</div></td><td>${esc(unitName(c.unitId))}</td><td><span class="badge ${c.gender}">${c.gender==='male'?'সাধারণ আসন':'সংরক্ষিত নারী আসন'}</span></td><td><div style="display:flex;align-items:center;gap:8px">${c.symbolPhoto?`<img class="symbol-thumb" src="${c.symbolPhoto}" alt="">`:''}<span>${esc(c.symbolName||'এখনও বরাদ্দ হয়নি')}</span></div></td><td><span class="badge ${c.active?'on':'off'}">${c.active?'সক্রিয়':'নিষ্ক্রিয়'}</span></td><td><button class="btn sm" onclick="editCandidate('${c.id}')">সম্পাদনা</button> <button class="btn sm danger" onclick="removeCandidate('${c.id}')">মুছুন</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">কোনো প্রার্থী পাওয়া যায়নি।</div>';
}

function branchSymbols(activeOnly=false){
  const b=currentBranch(); if(!b)return [];
  return DATA.symbols.filter(s=>s.branchId===b.id&&(!activeOnly||s.active)).sort((x,y)=>(x.order||0)-(y.order||0)||x.name.localeCompare(y.name));
}
function symbolById(id){return DATA.symbols.find(s=>s.id===id);}
function candidateById(id){return DATA.candidates.find(c=>c.id===id);}
function candidateSymbol(c){return symbolById(c?.symbolId)||null;}
function usedSymbolIds(exceptCandidateId='',unitId=''){
  const b=currentBranch(); if(!b)return new Set();
  const unitIds=new Set(ElectionStore.sortedUnits(DATA,false,b.id).map(u=>u.id));
  return new Set(DATA.candidates.filter(c=>c.id!==exceptCandidateId&&unitIds.has(c.unitId)&&(!unitId||c.unitId===unitId)&&c.symbolId).map(c=>c.symbolId));
}
function currentSymbolUnit(){return $('#symbolUnitFilter')?.value||'';}
function populateAllocationControls(){
  const b=currentBranch(); if(!b)return;
  const unitId=currentSymbolUnit();
  const validUnits=new Set(ElectionStore.sortedUnits(DATA,true,b.id).map(u=>u.id));
  const showAllocated=!!$('#showAllocatedCandidates')?.checked;
  let cands=DATA.candidates.filter(c=>c.active&&validUnits.has(c.unitId)&&(!unitId||c.unitId===unitId)&&(showAllocated||!c.symbolId)).sort((x,y)=>unitName(x.unitId).localeCompare(unitName(y.unitId))||x.name.localeCompare(y.name));
  const candSel=$('#allocationCandidate'),oldCand=candSel?.value||'';
  if(candSel){candSel.innerHTML='<option value="">প্রার্থী নির্বাচন করুন</option>'+cands.map(c=>`<option value="${c.id}">${c.symbolId?'✓ ':''}${esc(unitName(c.unitId))} — ${esc(c.name)}${c.employeeId?' ('+esc(c.employeeId)+')':''}${c.symbolId?' — প্রতীক বরাদ্দ হয়েছে':''}</option>`).join(''); if(cands.some(c=>c.id===oldCand))candSel.value=oldCand;}
  populateAvailableSymbols(); updateAllocationPreview();
}
function populateAvailableSymbols(){
  const cand=candidateById($('#allocationCandidate')?.value);
  const used=usedSymbolIds(cand?.id||'');
  const list=branchSymbols(true).filter(s=>!used.has(s.id)||s.id===cand?.symbolId);
  const sel=$('#allocationSymbol'); if(!sel)return; const old=sel.value;
  sel.innerHTML='<option value="">প্রতীক নির্বাচন করুন</option>'+list.map(s=>`<option value="${s.id}">${esc(s.name)}${s.id===cand?.symbolId?' — বর্তমানে বরাদ্দ':''}</option>`).join('');
  if(list.some(s=>s.id===old))sel.value=old; else if(cand?.symbolId&&list.some(s=>s.id===cand.symbolId))sel.value=cand.symbolId;
}
function updateAllocationPreview(){
  const box=$('#allocationPreview'); if(!box)return; const c=candidateById($('#allocationCandidate')?.value);
  if(!c){box.innerHTML='<div class="symbol-empty-note">প্রার্থী নির্বাচন করলে বর্তমান বরাদ্দ এখানে দেখা যাবে।</div>';return;}
  const s=candidateSymbol(c); box.innerHTML=`<div class="allocation-person">${img(c.photo,'alloc-candidate-img',(c.name||'?')[0])}<div><small>${esc(unitName(c.unitId))}</small><h3>${esc(c.name)}</h3><span>${esc(c.employeeId||'')}</span></div></div><div class="allocation-arrow">→</div><div class="allocation-symbol">${s?.photo?`<img src="${s.photo}" alt="">`:`<div class="symbol-placeholder symbol-icon-fallback">${esc(s?.icon||'🎯')}</div>`}<div><small>বর্তমান প্রতীক</small><h3>${esc(s?.name||'এখনও বরাদ্দ হয়নি')}</h3></div></div>`;
}
function renderSymbolMaster(){
  const el=$('#symbolMasterTable'); if(!el)return;
  const q=($('#symbolMasterSearch')?.value||'').trim().toLowerCase();
  const all=branchSymbols(false),used=usedSymbolIds();
  const syms=all.filter(s=>!q||String(s.name||'').toLowerCase().includes(q)||String(s.icon||'').includes(q));
  const count=$('#symbolMasterCount'); if(count)count.textContent=`(${bnNum(all.length)})`;
  el.innerHTML=syms.length?`<div class="symbol-master-grid">${syms.map(s=>{const isUsed=used.has(s.id);return `<div class="symbol-master-item ${s.active?'':'inactive'} ${isUsed?'is-used':'is-available'}">${s.photo?`<img src="${s.photo}" alt="${esc(s.name)}">`:`<div class="symbol-placeholder symbol-icon-fallback">${esc(s.icon||'🎯')}</div>`}<div class="symbol-master-info"><b>${esc(s.name)}</b><small>${isUsed?'বরাদ্দকৃত':'উপলব্ধ'} • ${s.active?'সক্রিয়':'নিষ্ক্রিয়'}</small></div><div class="symbol-master-actions"><button class="btn sm" onclick="editSymbol('${s.id}')">সম্পাদনা</button><button class="btn sm danger" onclick="removeSymbol('${s.id}')">মুছুন</button></div></div>`}).join('')}</div>`:'<div class="empty">কোনো প্রতীক পাওয়া যায়নি।</div>';
}
function renderSymbolDashboard(){
  const el=$('#symbolDashboard'); if(!el)return; const b=currentBranch(); if(!b)return; const filter=$('#symbolDashboardUnit')?.value||'';
  const size=$('#symbolCardSize')?.value||'normal';
  const unitIds=new Set(ElectionStore.sortedUnits(DATA,false,b.id).filter(u=>!filter||u.id===filter).map(u=>u.id));
  const list=DATA.candidates.filter(c=>c.active&&unitIds.has(c.unitId)).sort((x,y)=>unitName(x.unitId).localeCompare(unitName(y.unitId))||x.name.localeCompare(y.name));
  el.innerHTML=list.length?`<div class="allocation-dashboard-grid card-size-${size}">${list.map(c=>{const s=candidateSymbol(c);return `<div class="allocation-card ${s?'allocated':'pending'}"><div class="allocation-section">${esc(unitName(c.unitId))}</div><div class="allocation-card-body"><div class="candidate-mini">${img(c.photo,'dash-candidate-img',(c.name||'?')[0])}<div><b>${esc(c.name)}</b><small>${esc(c.employeeId||'')}</small></div></div><div class="dash-symbol-wrap">${s?.photo?`<img src="${s.photo}" alt="">`:`<div class="symbol-placeholder symbol-icon-fallback">${esc(s?.icon||'🎯')}</div>`}<strong>${esc(s?.name||'বরাদ্দ বাকি')}</strong></div></div></div>`}).join('')}</div>`:'<div class="empty">কোনো প্রার্থী পাওয়া যায়নি।</div>';
}
function xmlEsc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function exportSymbolAllocationExcel(){
  const b=currentBranch(); if(!b)return; const filter=$('#symbolDashboardUnit')?.value||'';
  const units=ElectionStore.sortedUnits(DATA,false,b.id).filter(u=>!filter||u.id===filter);
  const unitIds=new Set(units.map(u=>u.id));
  const list=DATA.candidates.filter(c=>c.active&&unitIds.has(c.unitId)).sort((x,y)=>unitName(x.unitId).localeCompare(unitName(y.unitId))||x.name.localeCompare(y.name));
  if(!list.length)return alert('Export করার মতো প্রার্থী নেই।');
  const rows=list.map((c,i)=>{const sym=candidateSymbol(c);return [i+1,unitName(c.unitId),c.employeeId||'',c.name||'',c.gender==='female'?'সংরক্ষিত নারী আসন':'সাধারণ আসন',sym?.name||'বরাদ্দ বাকি',sym?'বরাদ্দ সম্পন্ন':'বরাদ্দ বাকি'];});
  const sectionTitle=filter?(units[0]?.name||'নির্বাচিত সেকশন'):'সকল সেকশন';
  const title=`${b.name||'MASCO GROUP'} - প্রতীক বরাদ্দ তালিকা`;
  const headers=['ক্রমিক','সেকশন','কর্মী আইডি','প্রার্থীর নাম','আসনের ধরন','বরাদ্দকৃত প্রতীক','অবস্থা'];
  const cell=(v,style='Body')=>`<Cell ss:StyleID="${style}"><Data ss:Type="String">${xmlEsc(v)}</Data></Cell>`;
  const bodyRows=rows.map(r=>`<Row>${r.map(v=>cell(v)).join('')}</Row>`).join('');
  const xml=`<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style><Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="18" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#173F73" ss:Pattern="Solid"/></Style><Style ss:ID="SubTitle"><Alignment ss:Horizontal="Center"/><Font ss:Bold="1" ss:Color="#173F73"/></Style><Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1F5A96" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E2F0"/></Borders></Style><Style ss:ID="Body"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E6ECF3"/></Borders></Style></Styles><Worksheet ss:Name="Symbol Allocation"><Table><Column ss:Width="48"/><Column ss:Width="145"/><Column ss:Width="90"/><Column ss:Width="180"/><Column ss:Width="145"/><Column ss:Width="130"/><Column ss:Width="110"/><Row ss:Height="34"><Cell ss:MergeAcross="6" ss:StyleID="Title"><Data ss:Type="String">${xmlEsc(title)}</Data></Cell></Row><Row ss:Height="24"><Cell ss:MergeAcross="6" ss:StyleID="SubTitle"><Data ss:Type="String">${xmlEsc(sectionTitle)} | Export: ${xmlEsc(new Date().toLocaleString('en-GB'))}</Data></Cell></Row><Row ss:Height="26">${headers.map(h=>cell(h,'Header')).join('')}</Row>${bodyRows}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>3</SplitHorizontal><TopRowBottomPane>3</TopRowBottomPane><Selected/></WorksheetOptions></Worksheet></Workbook>`;
  const blob=new Blob(['\ufeff'+xml],{type:'application/vnd.ms-excel;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  const safe=sectionTitle.replace(/[\\/:*?"<>|]+/g,'-'); a.href=url;a.download=`MASCO_Symbol_Allocation_${safe}.xls`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
let ALLOCATION_LIST_MODE='allocated';
function allocationStatusCandidates(mode=ALLOCATION_LIST_MODE){
  const b=currentBranch(); if(!b)return [];
  const filter=$('#allocationListUnitFilter')?.value||'';
  const q=($('#allocationListSearch')?.value||'').trim().toLowerCase();
  const ids=new Set(ElectionStore.sortedUnits(DATA,false,b.id).filter(u=>!filter||u.id===filter).map(u=>u.id));
  return DATA.candidates.filter(c=>c.active&&ids.has(c.unitId)&&(mode==='allocated'?!!c.symbolId:!c.symbolId)).filter(c=>{
    if(!q)return true; const sym=candidateSymbol(c); return [c.name,c.employeeId,unitName(c.unitId),sym?.name].some(v=>String(v||'').toLowerCase().includes(q));
  }).sort((a,b)=>unitName(a.unitId).localeCompare(unitName(b.unitId))||a.name.localeCompare(b.name));
}
function renderAllocationStatusList(){
  const body=$('#allocationListBody'); if(!body)return;
  const list=allocationStatusCandidates();
  $('#allocationListCount').textContent=`${bnNum(list.length)} জন`;
  body.innerHTML=list.length?`<div class="status-user-grid">${list.map(c=>{const s=candidateSymbol(c);const seat=c.gender==='female'?'সংরক্ষিত নারী আসন':'সাধারণ আসন';return `<article class="status-user-card ${s?'allocated':'pending'}">${c.photo?`<img class="status-user-avatar" src="${c.photo}" alt="">`:`<div class="status-user-avatar">${esc((c.name||'?')[0])}</div>`}<div class="status-user-info"><b>${esc(c.name)}</b><small>${esc(c.employeeId||'আইডি নেই')}</small><div class="status-user-meta"><span class="status-pill">${esc(unitName(c.unitId))}</span><span class="status-pill">${esc(seat)}</span></div></div><div class="status-symbol ${s?'':'pending'}">${s?.photo?`<img src="${s.photo}" alt="">`:'<div class="symbol-placeholder">⌛</div>'}<strong>${esc(s?.name||'বরাদ্দ বাকি')}</strong></div></article>`}).join('')}</div>`:'<div class="empty">এই তালিকায় কোনো প্রার্থী পাওয়া যায়নি।</div>';
}
function openAllocationStatusList(mode){
  ALLOCATION_LIST_MODE=mode==='pending'?'pending':'allocated';
  const b=currentBranch(); if(!b)return;
  const units=ElectionStore.sortedUnits(DATA,false,b.id);
  const sel=$('#allocationListUnitFilter');
  sel.innerHTML='<option value="">সব সেকশন</option>'+units.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('');
  $('#allocationListSearch').value='';
  $('#allocationListTitle').textContent=ALLOCATION_LIST_MODE==='allocated'?'✓ বরাদ্দ সম্পন্ন প্রার্থী':'⌛ বরাদ্দ বাকি প্রার্থী';
  $('#allocationListSub').textContent=ALLOCATION_LIST_MODE==='allocated'?'যেসব প্রার্থীর প্রতীক বরাদ্দ সম্পন্ন হয়েছে':'যেসব সক্রিয় প্রার্থীর প্রতীক এখনও বরাদ্দ হয়নি';
  renderAllocationStatusList(); openModal('allocationListModal');
}
function renderSymbols(){
  const sec=$('#symbols'); if(!sec)return; const b=currentBranch(); if(!b)return;
  const unitIds=new Set(ElectionStore.sortedUnits(DATA,false,b.id).map(u=>u.id)),cands=DATA.candidates.filter(c=>c.active&&unitIds.has(c.unitId)),allocated=cands.filter(c=>c.symbolId).length;
  $('#symKpiCandidates').textContent=bnNum(cands.length); $('#symKpiSymbols').textContent=bnNum(branchSymbols(true).length); $('#symKpiAllocated').textContent=bnNum(allocated); $('#symKpiPending').textContent=bnNum(Math.max(0,cands.length-allocated));
  renderSymbolMaster(); populateAllocationControls(); renderSymbolDashboard();
}
async function allocateSymbol(candidateId,symbolId,method='MANUAL'){
  const c=candidateById(candidateId),s=symbolById(symbolId),b=currentBranch(); if(!c||!s||!b)return alert('প্রার্থী ও প্রতীক নির্বাচন করুন।');
  if(s.branchId!==b.id)return alert('এই প্রতীক নির্বাচিত শাখার নয়।');
  const branchUnitIds=new Set(ElectionStore.sortedUnits(DATA,false,b.id).map(u=>u.id));
  const conflict=DATA.candidates.find(x=>x.id!==c.id&&branchUnitIds.has(x.unitId)&&x.symbolId===s.id);
  if(conflict)return alert(`এই প্রতীক ইতোমধ্যে ${conflict.name}-কে বরাদ্দ করা হয়েছে।`);
  const previousSymbolId=c.symbolId||''; c.symbolId=s.id; c.symbolName=s.name; c.symbolPhoto=s.photo||''; c.symbolIcon=s.icon||'';
  DATA.symbolAllocations.push({id:ElectionStore.uid('alloc'),branchId:b.id,unitId:c.unitId,candidateId:c.id,symbolId:s.id,previousSymbolId,method,action:previousSymbolId&&previousSymbolId!==s.id?'CHANGED':'ALLOCATED',allocatedAt:new Date().toISOString()});
  return await save(method==='SPIN'?`${c.name} স্পিনে ${s.name} প্রতীক পেয়েছেন`:method==='LOTTERY'?`${c.name} লটারিতে ${s.name} প্রতীক পেয়েছেন`:`${c.name}-কে ${s.name} প্রতীক বরাদ্দ হয়েছে`);
}

const SPIN_STATE={candidate:null,available:[],spinning:false,result:null};
function secureRandomIndex(length){
  if(length<=1)return 0;
  const max=0x100000000-(0x100000000%length),buf=new Uint32Array(1);
  do{crypto.getRandomValues(buf);}while(buf[0]>=max);
  return buf[0]%length;
}
function closeSpinModal(){
  if(SPIN_STATE.spinning)return;
  const m=$('#spinModal'); if(m){m.classList.add('hidden');m.classList.remove('spin-complete');m.setAttribute('aria-hidden','true');} $('#startSpinBtn')?.classList.remove('hidden'); $('#spinCancelBtn')?.classList.remove('hidden'); $('#spinDoneBtn')?.classList.add('hidden');
  SPIN_STATE.candidate=null;SPIN_STATE.available=[];SPIN_STATE.result=null;
}
function spinImage(src,cls,fallback='?'){
  return src?`<img class="${cls}" src="${src}" alt="">`:`<div class="spin-photo-fallback">${esc(fallback)}</div>`;
}
function applySpinCardSize(size){
  const card=$('#spinModal .spin-modal-card'); if(!card)return;
  const safe=['compact','normal','large'].includes(size)?size:'normal';
  card.classList.remove('spin-size-compact','spin-size-normal','spin-size-large');
  card.classList.add('spin-size-'+safe);
  const sel=$('#spinCardSize'); if(sel&&sel.value!==safe)sel.value=safe;
}
function drawSpinWheel(){
  const canvas=$('#symbolWheelCanvas'); if(!canvas)return;
  const list=SPIN_STATE.available,ctx=canvas.getContext('2d'),size=560,cx=size/2,cy=size/2,r=258;
  const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  canvas.width=size*dpr;canvas.height=size*dpr;canvas.style.width='100%';canvas.style.height='auto';ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,size,size);
  if(!list.length){ctx.fillStyle='#f3f6f9';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();return;}
  const palette=['#5B5FEF','#00A7C4','#12A77A','#F2A51A','#F05B78','#9356E8','#1473E6','#20B8A5','#EF7A35','#C84D9B','#3778C2','#63A63B'];
  const arc=Math.PI*2/list.length;
  list.forEach((sym,i)=>{
    const a0=-Math.PI/2+i*arc,a1=a0+arc,mid=a0+arc/2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a0,a1);ctx.closePath();const base=palette[i%palette.length];const grad=ctx.createRadialGradient(cx,cy,72,cx,cy,r);grad.addColorStop(0,'#ffffff');grad.addColorStop(.02,base);grad.addColorStop(1,base);ctx.fillStyle=grad;ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=3;ctx.stroke();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(mid);ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.font=`700 ${list.length>12?15:list.length>8?18:21}px "Noto Sans Bengali","Segoe UI",Arial,sans-serif`;
    const label=list.length>24?String(sym.icon||'•'):String(sym.name||'প্রতীক');let name=label;if(name.length>14)name=name.slice(0,13)+'…';ctx.font=`700 ${list.length>40?19:list.length>24?17:list.length>12?15:list.length>8?18:21}px "Noto Sans Bengali","Segoe UI Emoji",Arial,sans-serif`;ctx.fillText(name,r-28,0);ctx.restore();
  });
  ctx.beginPath();ctx.arc(cx,cy,70,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#d6e0e9';ctx.lineWidth=6;ctx.stroke();
}
function openSpinModal(){
  const c=candidateById($('#allocationCandidate')?.value);
  if(!c)return alert('আগে একজন প্রার্থী নির্বাচন করুন।');
  if(c.symbolId)return alert('এই প্রার্থীর প্রতীক ইতোমধ্যে বরাদ্দ হয়েছে। একজন প্রার্থী একবারই Spin করতে পারবেন। প্রতীক পরিবর্তন করতে Management option ব্যবহার করুন।');
  const used=usedSymbolIds(c.id),available=branchSymbols(true).filter(s=>!used.has(s.id));
  if(!available.length)return alert('স্পিন করার জন্য খালি প্রতীক নেই।');
  SPIN_STATE.candidate=c;SPIN_STATE.available=available;SPIN_STATE.spinning=false;SPIN_STATE.result=null;
  const b=currentBranch(),unitCands=DATA.candidates.filter(x=>x.active&&x.unitId===c.unitId),allocated=unitCands.filter(x=>x.symbolId).length;
  $('#spinCandidatePanel').innerHTML=`<div class="spin-candidate-photo">${spinImage(c.photo,'spin-person-img',(c.name||'?')[0])}</div><span class="spin-section-label">${esc(unitName(c.unitId))}</span><h3>${esc(c.name)}</h3><p>${esc(c.employeeId||'কর্মী আইডি নেই')}</p><div class="spin-current-symbol"><small>বর্তমান প্রতীক</small><b>${esc(c.symbolName||'বরাদ্দ হয়নি')}</b></div>`;
  $('#spinRemainingBadge').textContent=`Available: ${bnNum(available.length)}`;
  $('#spinProgressBadge').textContent=`Allocated: ${bnNum(allocated)}/${bnNum(unitCands.length)}`;
  $('#spinStatus').textContent='SPIN চাপলে প্রতীক নির্বাচন শুরু হবে';
  $('#spinResult').classList.add('hidden');$('#spinResult').innerHTML='';
  $('#spinDoneBtn')?.classList.add('hidden');
  const btn=$('#startSpinBtn');btn.disabled=false;btn.textContent='SPIN';
  $('#spinCancelBtn').disabled=false;$('#spinCloseBtn').disabled=false;
  const canvas=$('#symbolWheelCanvas');canvas.style.transition='none';canvas.style.transform='rotate(0deg)';
  drawSpinWheel();
  applySpinCardSize($('#spinCardSize')?.value||'normal');
  const m=$('#spinModal');m.classList.remove('hidden');m.classList.remove('spin-complete');m.setAttribute('aria-hidden','false');
}
async function startSymbolSpin(){
  if(SPIN_STATE.spinning||!SPIN_STATE.candidate||!SPIN_STATE.available.length)return;
  const freshCandidate=candidateById(SPIN_STATE.candidate.id);
  if(freshCandidate?.symbolId){alert('এই প্রার্থীর প্রতীক ইতোমধ্যে বরাদ্দ হয়েছে। আবার Spin করা যাবে না।');closeSpinModal();populateAllocationControls();return;}
  const c=SPIN_STATE.candidate,list=SPIN_STATE.available,index=secureRandomIndex(list.length),selected=list[index];
  SPIN_STATE.spinning=true;SPIN_STATE.result=selected;
  $('#startSpinBtn').disabled=true;$('#spinCancelBtn').disabled=true;$('#spinCloseBtn').disabled=true;
  $('#spinStatus').textContent='স্পিন চলছে… প্রতীক নির্বাচন করা হচ্ছে';
  const canvas=$('#symbolWheelCanvas'),slice=360/list.length,landing=((360-((index+.5)*slice)%360)%360),turns=7+secureRandomIndex(3),deg=turns*360+landing;
  canvas.style.transition='transform 5.2s cubic-bezier(.12,.72,.12,1)';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{canvas.style.transform=`rotate(${deg}deg)`;}));
  await new Promise(resolve=>setTimeout(resolve,5350));
  $('#spinStatus').textContent=`নির্বাচিত প্রতীক: ${selected.name} — সংরক্ষণ করা হচ্ছে…`;
  const ok=await allocateSymbol(c.id,selected.id,'SPIN');
  SPIN_STATE.spinning=false;
  $('#spinCloseBtn').disabled=false;$('#spinCancelBtn').disabled=false;$('#spinCancelBtn').textContent='বন্ধ করুন';
  if(ok!==false){
    $('#spinCandidatePanel').innerHTML=`<div class="spin-candidate-photo">${spinImage(c.photo,'spin-person-img',(c.name||'?')[0])}</div><span class="spin-section-label">${esc(unitName(c.unitId))}</span><h3>${esc(c.name)}</h3><p>${esc(c.employeeId||'কর্মী আইডি নেই')}</p><div class="spin-current-symbol allocated-now"><small>বরাদ্দকৃত প্রতীক</small><b>${esc(selected.name)}</b></div>`;
    $('#spinResult').innerHTML=`<div class="spin-result-check">✓</div><div class="spin-result-person">${spinImage(c.photo,'spin-result-candidate',(c.name||'?')[0])}<div><small>${esc(unitName(c.unitId))}</small><h3>${esc(c.name)}</h3></div></div><div class="spin-result-arrow">→</div><div class="spin-result-symbol">${selected.photo?`<img src="${selected.photo}" alt="">`:`<div class="spin-symbol-fallback">${esc(selected.icon||'🎯')}</div>`}<div><small>বরাদ্দকৃত প্রতীক</small><h2>${esc(selected.name)}</h2></div></div>`;
    $('#spinResult').classList.remove('hidden');$('#spinStatus').innerHTML=`<span class="spin-success-text">✓ প্রতীক বরাদ্দ সফলভাবে সম্পন্ন হয়েছে</span>`;
    $('#startSpinBtn').classList.add('hidden'); $('#spinCancelBtn').classList.add('hidden'); $('#spinDoneBtn')?.classList.remove('hidden'); $('#spinModal')?.classList.add('spin-complete');
  }else{
    $('#spinStatus').textContent='সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।';$('#startSpinBtn').disabled=false;
  }
}

function renderVotes(){
  const b=currentBranch(),filter=$('#voteUnitFilter').value,units=b?ElectionStore.sortedUnits(DATA,true,b.id).filter(u=>!filter||u.id===filter):[];
  $('#voteTable').innerHTML=units.map(u=>{const c=DATA.candidates.filter(x=>x.unitId===u.id&&x.active).sort((a,b)=>a.gender.localeCompare(b.gender)||a.name.localeCompare(b.name));return `<div class="unit-box vote-unit-box"><div class="unit-title"><h3>${esc(u.name)}</h3><span class="subtle">মোট ভোটার: ${bnNum(u.voters?.total||0)} • বুথ: ${(u.booths||[]).map(x=>bn(esc(x.number))).join(', ')||'-'} • সাধারণ আসনে বিজয়ী: ${bn(u.quota?.male||0)} • সংরক্ষিত নারী আসনে বিজয়ী: ${bn(u.quota?.female||0)}</span></div>${c.length?`<div class="table-wrap"><table><thead><tr><th>প্রার্থী</th><th>আসনের ধরন</th><th>প্রতীক</th><th>প্রাপ্ত ভোট</th><th>বর্তমান অবস্থান</th></tr></thead><tbody>${c.map(x=>{const group=ElectionStore.groupResult(DATA,u,x.gender),rank=group.ranked.find(r=>r.id===x.id)?.rank||'-';return `<tr><td><b>${esc(x.name)}</b></td><td><span class="badge ${x.gender}">${x.gender==='male'?'সাধারণ আসন':'সংরক্ষিত নারী আসন'}</span></td><td>${esc(x.symbolName||'-')}</td><td><input class="vote-input" data-candidate-id="${x.id}" type="number" min="0" value="${Number(x.votes||0)}"></td><td>${bn(rank)}</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">এই সেকশনে সক্রিয় প্রার্থী নেই।</div>'}</div>`}).join('')||'<div class="empty">কোনো সক্রিয় সেকশন নেই।</div>';
}
function renderVerify(){
  const b=currentBranch();if(!b){$('#verifyArea').innerHTML='<div class="empty">আগে একটি শাখা নির্বাচন করুন।</div>';return;}
  const units=ElectionStore.sortedUnits(DATA,true,b.id);
  const sel=$('#publishUnitSelect');if(sel){const old=sel.value;sel.innerHTML=units.map(u=>`<option value="${u.id}">${esc(u.name)}${u.published?' — প্রকাশিত':''}</option>`).join('');if([...sel.options].some(o=>o.value===old))sel.value=old;}
  const blocks=units.map(u=>{const m=ElectionStore.groupResult(DATA,u,'male'),f=ElectionStore.groupResult(DATA,u,'female');const group=(label,g)=>`<div class="verify-group"><b>${label}</b><div>${g.winners.map(x=>`${esc(x.name)} (${bnNum(x.votes)})`).join(', ')||'বিজয়ী নির্ধারিত নেই'}${g.tie?` <span class="tie-text">⚠ ${bnNum(g.tieVote)} ভোটে সমতা — সমান ভোট পাওয়া সবাই বিজয়ী হিসেবে দেখাবে</span>`:''}</div></div>`;return `<div class="unit-box"><h3 style="margin:0">${esc(u.name)} <span class="badge ${u.published?'on':'off'}">${u.published?'প্রকাশিত':'গোপন'}</span></h3><div class="subtle">ভোটার ${bnNum(u.voters?.total||0)} • বুথ ${(u.booths||[]).map(x=>bn(esc(x.number))).join(', ')||'-'}</div>${group('সাধারণ আসন',m)}${group('সংরক্ষিত নারী আসন',f)}</div>`}).join('');
  $('#verifyArea').innerHTML=`<div class="notice">সমান ভোট বিজয়ীর সীমায় পড়লে নির্ধারিত আসনসংখ্যা অতিক্রম করলেও সমান ভোট পাওয়া সকল প্রার্থী ফলাফলে বিজয়ী হিসেবে দেখাবে। প্রকাশনা সেকশনভিত্তিক।</div><div style="margin-top:14px">${blocks||'<div class="empty">কোনো সক্রিয় সেকশন নেই।</div>'}</div>`;
}

window.selectBranch=id=>{CURRENT_BRANCH=id;renderAll();nav('dashboard');};
window.editBranch=id=>{const b=DATA.branches.find(x=>x.id===id);if(!b)return;$('#branchModalTitle').textContent='শাখা সম্পাদনা';$('#branchId').value=b.id;$('#branchName').value=b.name;$('#branchShortName').value=b.shortName||'';$('#branchCode').value=b.code||'';$('#branchOrder').value=b.order||1;$('#branchActive').value=String(!!b.active);$('#branchElectionTitle').value=b.electionTitle||'';$('#branchElectionDate').value=b.electionDate||'';$('#branchPublished').value=String(DATA.units.some(u=>u.branchId===b.id&&u.published));openModal('branchModal');};
window.removeBranch=async id=>{const linked=DATA.units.filter(u=>u.branchId===id).length;if(linked)return alert('এই শাখায় সেকশনের তথ্য আছে। মুছে না ফেলে নিষ্ক্রিয় করুন।');if(confirm('খালি শাখাটি মুছে ফেলবেন?')){DATA.branches=DATA.branches.filter(b=>b.id!==id);if(CURRENT_BRANCH===id)CURRENT_BRANCH='';await save('শাখা মুছে ফেলা হয়েছে');}};
window.editUnit=id=>{const u=DATA.units.find(x=>x.id===id);if(!u)return;$('#unitModalTitle').textContent='সেকশন সম্পাদনা';$('#unitId').value=u.id;$('#unitBranch').value=u.branchId;$('#unitName').value=u.name;$('#unitCode').value=u.code||'';$('#unitOrder').value=u.order||1;$('#maleQuota').value=u.quota?.male||0;$('#femaleQuota').value=u.quota?.female||0;$('#maleVoters').value=Number(u.voters?.male||0);$('#femaleVoters').value=Number(u.voters?.female||0);$('#totalVoters').value=Number(u.voters?.total||0);$('#boothNumbers').value=(u.booths||[]).map(x=>x.number).join(', ');$('#totalBallots').value=Number(u.stats?.totalBallots||0);$('#invalidBallots').value=Number(u.stats?.invalidBallots||0);$('#unitActive').value=String(!!u.active);openModal('unitModal');};
window.removeUnit=async id=>{const linked=DATA.candidates.filter(c=>c.unitId===id).length;if(linked)return alert('এই সেকশনে প্রার্থীর তথ্য আছে। মুছে না ফেলে নিষ্ক্রিয় করুন।');if(confirm('খালি সেকশনটি মুছে ফেলবেন?')){DATA.units=DATA.units.filter(u=>u.id!==id);await save('সেকশন মুছে ফেলা হয়েছে');}};
window.editCandidate=id=>{const c=DATA.candidates.find(x=>x.id===id);if(!c)return;$('#candidateModalTitle').textContent='প্রার্থী সম্পাদনা';$('#candidateId').value=c.id;$('#candidateUnit').value=c.unitId;$('#candidateGender').value=c.gender;$('#candidateName').value=c.name;$('#candidateEmployeeId').value=c.employeeId||'';$('#candidateActive').value=String(!!c.active);$('#candidatePhoto').value='';openModal('candidateModal');};
window.editSymbol=id=>{const s=symbolById(id);if(!s)return;$('#symbolModalTitle').textContent='প্রতীক সম্পাদনা';$('#symbolId').value=s.id;$('#symbolName').value=s.name;$('#symbolOrder').value=s.order||1;$('#symbolActive').value=String(!!s.active);$('#symbolPhoto').value='';openModal('symbolModal');};
window.removeSymbol=async id=>{const s=symbolById(id);if(!s)return;if(DATA.candidates.some(c=>c.symbolId===id))return alert('এই প্রতীক একজন প্রার্থীকে বরাদ্দ করা আছে। আগে বরাদ্দ বাতিল/পরিবর্তন করুন।');if(confirm(`${s.name} প্রতীকটি মুছে ফেলবেন?`)){DATA.symbols=DATA.symbols.filter(x=>x.id!==id);await save('প্রতীক মুছে ফেলা হয়েছে');}};
window.removeCandidate=async id=>{if(confirm('এই প্রার্থীকে মুছে ফেলবেন? সম্পন্ন নির্বাচনের ক্ষেত্রে নিষ্ক্রিয় করা নিরাপদ।')){DATA.candidates=DATA.candidates.filter(c=>c.id!==id);await save('প্রার্থী মুছে ফেলা হয়েছে');}};

function boothObjects(text){return String(text||'').split(',').map(x=>x.trim()).filter(Boolean).map((number,i)=>({id:ElectionStore.uid('booth'),number,order:i+1}));}
function autoTotalVoters(){const m=Number($('#maleVoters').value||0),f=Number($('#femaleVoters').value||0);$('#totalVoters').value=m+f;}

async function init(){
  DATA=await ElectionStore.load();ensureBranch();setSaveStatus(true,'তথ্য ফাইল থেকে তথ্য লোড হয়েছে');
  $('#loginBtn').onclick=async()=>{
    const btn=$('#loginBtn'),username=$('#loginUser').value.trim(),password=$('#loginPass').value;
    if(!username||!password)return alert('ব্যবহারকারীর নাম ও পাসওয়ার্ড লিখুন');
    btn.disabled=true;btn.textContent='লগইন হচ্ছে…';
    try{
      const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
      const body=await res.json().catch(()=>({}));
      $('#loginPass').value='';
      if(!res.ok||!body.token)throw new Error(body.message||'লগইন ব্যর্থ হয়েছে');
      sessionStorage.setItem('electionAdmin','1');
      sessionStorage.setItem('electionAdminToken',body.token);
      showApp();renderAll();
    }catch(err){alert(err.message||'ব্যবহারকারীর নাম অথবা পাসওয়ার্ড সঠিক নয়');}
    finally{btn.disabled=false;btn.textContent='লগইন';}
  };
  if(sessionStorage.getItem('electionAdminToken')){
    try{
      const chk=await fetch('/api/auth/check',{headers:{'X-Admin-Token':sessionStorage.getItem('electionAdminToken')}});
      if(chk.ok){sessionStorage.setItem('electionAdmin','1');showApp();renderAll();}
      else{sessionStorage.removeItem('electionAdmin');sessionStorage.removeItem('electionAdminToken');}
    }catch(_){sessionStorage.removeItem('electionAdmin');sessionStorage.removeItem('electionAdminToken');}
  }
  $$('.navbtn[data-page]').forEach(b=>b.onclick=()=>nav(b.dataset.page));$$('.close').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  $('#logoutBtn').onclick=async()=>{const t=sessionStorage.getItem('electionAdminToken');try{if(t)await fetch('/api/auth/logout',{method:'POST',headers:{'X-Admin-Token':t}})}catch(_){}sessionStorage.removeItem('electionAdmin');sessionStorage.removeItem('electionAdminToken');hideApp();};$('#adminBranchSelect').onchange=e=>{CURRENT_BRANCH=e.target.value;renderAll();};
  $('#exportBtn').onclick=()=>ElectionStore.exportJson(DATA);
  $('#importFile').onchange=async e=>{try{DATA=await ElectionStore.importJson(e.target.files[0]);CURRENT_BRANCH='';renderAll();toast('তথ্য সফলভাবে আপলোড ও স্থায়ীভাবে সংরক্ষণ হয়েছে');}catch(err){alert(err.message)}e.target.value='';};

  $('#addBranchBtn').onclick=()=>{$('#branchModalTitle').textContent='নতুন শাখা';$('#branchForm').reset();$('#branchId').value='';$('#branchOrder').value=Math.max(0,...DATA.branches.map(b=>Number(b.order||0)))+1;$('#branchActive').value='true';$('#branchPublished').value='false';$('#branchElectionTitle').value='অংশগ্রহণকারী কমিটি নির্বাচন-২০২৬';openModal('branchModal');};
  $('#branchForm').onsubmit=async e=>{e.preventDefault();const id=$('#branchId').value,old=DATA.branches.find(b=>b.id===id)||{},obj={id:id||ElectionStore.uid('branch'),name:$('#branchName').value.trim(),shortName:$('#branchShortName').value.trim(),code:$('#branchCode').value.trim(),order:Number($('#branchOrder').value||1),active:$('#branchActive').value==='true',electionTitle:$('#branchElectionTitle').value.trim(),electionDate:$('#branchElectionDate').value,published:DATA.units.some(u=>u.branchId===(id||old.id)&&u.published)};if(id)DATA.branches[DATA.branches.findIndex(b=>b.id===id)]={...old,...obj};else DATA.branches.push(obj);CURRENT_BRANCH=obj.id;closeModal('branchModal');await save('শাখা সংরক্ষণ হয়েছে');};
  $('#saveElectionBtn').onclick=async()=>{const b=currentBranch();if(!b)return alert('আগে একটি শাখা তৈরি/নির্বাচন করুন');DATA.meta.organization=$('#organization').value.trim()||'MASCO Group';b.electionTitle=$('#electionTitle').value.trim();b.electionDate=$('#electionDate').value;b.published=ElectionStore.sortedUnits(DATA,true,b.id).some(u=>u.published);await save('নির্বাচন সেটিং সংরক্ষণ হয়েছে');};

  $('#addUnitBtn').onclick=()=>{const b=currentBranch();if(!b)return alert('আগে একটি শাখা তৈরি/নির্বাচন করুন');$('#unitModalTitle').textContent='নতুন সেকশন';$('#unitForm').reset();$('#unitId').value='';$('#unitBranch').value=b.id;$('#unitOrder').value=Math.max(0,...ElectionStore.sortedUnits(DATA,false,b.id).map(u=>Number(u.order||0)))+1;$('#maleQuota').value=0;$('#femaleQuota').value=0;$('#maleVoters').value=0;$('#femaleVoters').value=0;$('#totalVoters').value=0;$('#totalBallots').value=0;$('#invalidBallots').value=0;$('#unitActive').value='true';openModal('unitModal');};
  $('#maleVoters').addEventListener('input',autoTotalVoters);$('#femaleVoters').addEventListener('input',autoTotalVoters);
  $('#unitForm').onsubmit=async e=>{e.preventDefault();const id=$('#unitId').value,old=DATA.units.find(u=>u.id===id)||{},m=Math.max(0,Number($('#maleVoters').value||0)),f=Math.max(0,Number($('#femaleVoters').value||0)),t=Math.max(0,Number($('#totalVoters').value||m+f)),obj={id:id||ElectionStore.uid('unit'),branchId:$('#unitBranch').value,name:$('#unitName').value.trim(),code:$('#unitCode').value.trim(),order:Number($('#unitOrder').value||1),active:$('#unitActive').value==='true',quota:{male:Number($('#maleQuota').value||0),female:Number($('#femaleQuota').value||0)},voters:{male:m,female:f,total:t},booths:boothObjects($('#boothNumbers').value),stats:{totalBallots:Math.max(0,Number($('#totalBallots').value||0)),invalidBallots:Math.max(0,Number($('#invalidBallots').value||0))},published:!!old.published};if(id)DATA.units[DATA.units.findIndex(u=>u.id===id)]={...old,...obj};else DATA.units.push(obj);CURRENT_BRANCH=obj.branchId;closeModal('unitModal');await save('সেকশন সংরক্ষণ হয়েছে');};

  $('#addCandidateBtn').onclick=()=>{if(!ElectionStore.sortedUnits(DATA,true,CURRENT_BRANCH).length)return alert('এই শাখায় আগে একটি সক্রিয় সেকশন তৈরি করুন');$('#candidateModalTitle').textContent='নতুন প্রার্থী';$('#candidateForm').reset();$('#candidateId').value='';$('#candidateActive').value='true';populateUnitSelects();openModal('candidateModal');};
  $('#candidateForm').onsubmit=async e=>{e.preventDefault();try{const id=$('#candidateId').value,old=DATA.candidates.find(c=>c.id===id)||{},photoFile=$('#candidatePhoto').files[0],obj={id:id||ElectionStore.uid('cand'),unitId:$('#candidateUnit').value,name:$('#candidateName').value.trim(),employeeId:$('#candidateEmployeeId').value.trim(),gender:$('#candidateGender').value,photo:photoFile?await ElectionStore.fileToDataUrl(photoFile):(old.photo||''),votes:Number(old.votes||0),active:$('#candidateActive').value==='true',symbolId:old.symbolId||'',symbolName:old.symbolName||'',symbolPhoto:old.symbolPhoto||'',symbolIcon:old.symbolIcon||''};if(id)DATA.candidates[DATA.candidates.findIndex(c=>c.id===id)]={...old,...obj};else DATA.candidates.push(obj);closeModal('candidateModal');await save('প্রার্থী সংরক্ষণ হয়েছে');}catch(err){alert(err.message)}};
  $('#candidateUnitFilter').onchange=renderCandidates;$('#voteUnitFilter').onchange=renderVotes;

  $('#addSymbolBtn').onclick=()=>{const b=currentBranch();if(!b)return;$('#symbolModalTitle').textContent='নতুন প্রতীক';$('#symbolForm').reset();$('#symbolId').value='';$('#symbolOrder').value=Math.max(0,...branchSymbols(false).map(s=>Number(s.order||0)))+1;$('#symbolActive').value='true';openModal('symbolModal');};
  if($('#symbolMasterSearch')) $('#symbolMasterSearch').oninput=renderSymbolMaster;
  $('#symbolForm').onsubmit=async e=>{e.preventDefault();try{const b=currentBranch(),id=$('#symbolId').value,old=symbolById(id)||{},name=$('#symbolName').value.trim();if(!name)return;const duplicate=DATA.symbols.find(s=>s.branchId===b.id&&s.id!==id&&s.name.toLowerCase()===name.toLowerCase());if(duplicate)return alert('এই নামে প্রতীক ইতোমধ্যে আছে।');const f=$('#symbolPhoto').files[0],obj={id:id||ElectionStore.uid('sym'),branchId:b.id,name,photo:f?await ElectionStore.fileToDataUrl(f):(old.photo||''),icon:old.icon||'',order:Number($('#symbolOrder').value||1),active:$('#symbolActive').value==='true'};if(id){DATA.symbols[DATA.symbols.findIndex(s=>s.id===id)]={...old,...obj};DATA.candidates.filter(c=>c.symbolId===id).forEach(c=>{c.symbolName=obj.name;c.symbolPhoto=obj.photo;});}else DATA.symbols.push(obj);closeModal('symbolModal');await save('প্রতীক সংরক্ষণ হয়েছে');}catch(err){alert(err.message)}};
  $('#symbolUnitFilter').onchange=()=>{populateAllocationControls();};
  if($('#showAllocatedCandidates')) $('#showAllocatedCandidates').onchange=()=>{populateAllocationControls();};
  $('#allocationCandidate').onchange=()=>{populateAvailableSymbols();updateAllocationPreview();};
  $('#allocationSymbol').onchange=updateAllocationPreview;
  $('#symbolDashboardUnit').onchange=renderSymbolDashboard;
  if($('#symAllocatedCard')) $('#symAllocatedCard').onclick=()=>openAllocationStatusList('allocated');
  if($('#symPendingCard')) $('#symPendingCard').onclick=()=>openAllocationStatusList('pending');
  if($('#allocationListUnitFilter')) $('#allocationListUnitFilter').onchange=renderAllocationStatusList;
  if($('#allocationListSearch')) $('#allocationListSearch').oninput=renderAllocationStatusList;
  $('#symbolCardSize').onchange=renderSymbolDashboard;
  if($('#spinCardSize')) $('#spinCardSize').onchange=e=>applySpinCardSize(e.target.value);
  $('#exportSymbolExcelBtn').onclick=exportSymbolAllocationExcel;
  $('#manualAllocateBtn').onclick=async()=>{const c=$('#allocationCandidate').value,s=$('#allocationSymbol').value;if(!c||!s)return alert('প্রার্থী এবং প্রতীক নির্বাচন করুন।');await allocateSymbol(c,s,'MANUAL');};
  $('#lotteryAllocateBtn').onclick=openSpinModal;
  $('#startSpinBtn').onclick=startSymbolSpin;
  $('#spinCancelBtn').onclick=closeSpinModal;
  $('#spinDoneBtn').onclick=closeSpinModal;
  $('#spinCloseBtn').onclick=closeSpinModal;
  $('#releaseSymbolBtn').onclick=async()=>{const c=candidateById($('#allocationCandidate').value),b=currentBranch();if(!c)return alert('প্রার্থী নির্বাচন করুন।');if(!c.symbolId)return alert('এই প্রার্থীর কোনো প্রতীক বরাদ্দ নেই।');const prev=c.symbolId;if(!confirm(`${c.name}-এর বর্তমান প্রতীক বরাদ্দ বাতিল করবেন?`))return;c.symbolId='';c.symbolName='';c.symbolPhoto='';c.symbolIcon='';DATA.symbolAllocations.push({id:ElectionStore.uid('alloc'),branchId:b.id,unitId:c.unitId,candidateId:c.id,symbolId:'',previousSymbolId:prev,method:'MANUAL',action:'RELEASED',allocatedAt:new Date().toISOString()});await save('প্রতীক বরাদ্দ বাতিল হয়েছে');};
  $('#printSymbolDashboardBtn').onclick=()=>window.print();
  $('#saveVotesBtn').onclick=async()=>{$$('.vote-input').forEach(inp=>{const c=DATA.candidates.find(x=>x.id===inp.dataset.candidateId);if(c)c.votes=Math.max(0,Number(inp.value||0));});await save('সব ভোট স্থায়ীভাবে সংরক্ষণ হয়েছে');};
  $('#previewBtn').onclick=()=>{const b=currentBranch();if(b)window.open(`index.html?branch=${encodeURIComponent(b.id)}&preview=1`,'_blank');};
  $('#publishBtn').onclick=async()=>{const b=currentBranch(),id=$('#publishUnitSelect')?.value,u=DATA.units.find(x=>x.id===id);if(!b||!u)return alert('প্রকাশের জন্য একটি সেকশন নির্বাচন করুন');if(!confirm(`${u.name} সেকশনের ফলাফল প্রকাশ করবেন?`))return;u.published=true;b.published=ElectionStore.sortedUnits(DATA,true,b.id).some(x=>x.published);await save(`${u.name} সেকশনের ফলাফল প্রকাশ হয়েছে`);};
  $('#unpublishBtn').onclick=async()=>{const b=currentBranch(),id=$('#publishUnitSelect')?.value,u=DATA.units.find(x=>x.id===id);if(!b||!u)return alert('একটি সেকশন নির্বাচন করুন');u.published=false;b.published=ElectionStore.sortedUnits(DATA,true,b.id).some(x=>x.published);await save(`${u.name} সেকশনের প্রকাশ বন্ধ হয়েছে`);};
}
init().catch(e=>alert('তথ্য লোড করা যায়নি: '+e.message));
