const ElectionStore = (() => {
  const CACHE_KEY = 'mascoElectionDataV3Cache';
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const bnYear = v => String(v).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);

  function uid(prefix='id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }

  function normalize(data) {
    data = data || {};
    data.meta = data.meta || {};
    data.meta.organization = data.meta.organization || 'MASCO Group';
    data.meta.appName = data.meta.appName || 'মাসকো নির্বাচন ফলাফল ব্যবস্থাপনা';
    data.meta.version = '10.0.0';
    data.meta.storage = 'server-json';

    data.branches = Array.isArray(data.branches) ? data.branches : [];
    data.units = Array.isArray(data.units) ? data.units : [];
    data.candidates = Array.isArray(data.candidates) ? data.candidates : [];
    data.symbols = Array.isArray(data.symbols) ? data.symbols : [];
    data.symbolAllocations = Array.isArray(data.symbolAllocations) ? data.symbolAllocations : [];

    if (!data.branches.length) {
      data.branches.push({
        id:'branch-concept', name:'Concept Knitting Limited', shortName:'Concept', code:'CKL',
        order:1, active:true, electionTitle:'অংশগ্রহণকারী কমিটি নির্বাচন-২০২৬', electionDate:'', published:false
      });
    }

    const firstBranch = data.branches[0]?.id;
    data.branches.forEach((b,i)=>{
      b.id = b.id || uid('branch');
      b.name = b.name || `Branch ${i+1}`;
      b.order = Number(b.order || i+1);
      b.active = b.active !== false;
      b.electionTitle = b.electionTitle || 'অংশগ্রহণকারী কমিটি নির্বাচন';
      if (/Workers Participation Committee Election/i.test(b.electionTitle)) {
        const y = String(b.electionTitle).match(/\d{4}/)?.[0] || '';
        b.electionTitle = `অংশগ্রহণকারী কমিটি নির্বাচন${y ? '-' + bnYear(y) : ''}`;
      }
      b.electionDate = b.electionDate || '';
      b.published = !!b.published;
    });

    const hadSectionPublish = data.units.some(u => Object.prototype.hasOwnProperty.call(u,'published'));
    data.units.forEach((u,i)=>{
      u.id = u.id || uid('unit');
      u.branchId = u.branchId || firstBranch;
      u.name = u.name || `Unit ${i+1}`;
      u.order = Number(u.order || i+1);
      u.active = u.active !== false;
      // Section-wise public result status. Legacy branch-wide published data migrates safely.
      u.published = Object.prototype.hasOwnProperty.call(u,'published') ? !!u.published : (!hadSectionPublish && !!data.branches.find(b=>b.id===u.branchId)?.published);
      u.quota = u.quota || {};
      u.quota.male = Number(u.quota.male || 0);
      u.quota.female = Number(u.quota.female || 0);
      u.voters = u.voters || {};
      u.voters.male = Number(u.voters.male || 0);
      u.voters.female = Number(u.voters.female || 0);
      u.voters.total = Number(u.voters.total || (u.voters.male + u.voters.female));
      u.stats = u.stats || {};
      u.stats.totalBallots = Number(u.stats.totalBallots || 0);
      u.stats.invalidBallots = Number(u.stats.invalidBallots || 0);
      u.booths = Array.isArray(u.booths) ? u.booths : [];
      u.booths = u.booths.map((b,idx)=> typeof b === 'string'
        ? {id:uid('booth'), number:b, order:idx+1}
        : {id:b.id||uid('booth'), number:String(b.number||b.name||''), order:Number(b.order||idx+1)});
    });

    data.candidates.forEach(c=>{
      c.id = c.id || uid('cand');
      c.active = c.active !== false;
      c.votes = Number(c.votes || 0);
      c.gender = c.gender === 'female' ? 'female' : 'male';
      c.photo = c.photo || '';
      c.symbolPhoto = c.symbolPhoto || '';
      c.symbolId = c.symbolId || '';
    });

    // Symbol Master migration: existing candidate symbols are preserved and converted
    // to reusable master symbols. A symbol is unique inside a branch.
    const symbolKey = (branchId,name) => `${branchId}::${String(name||'').trim().toLowerCase()}`;
    const byKey = new Map();
    data.symbols.forEach((sym,i)=>{
      sym.id = sym.id || uid('sym');
      sym.branchId = sym.branchId || firstBranch;
      sym.name = String(sym.name||'').trim();
      sym.photo = sym.photo || '';
      sym.icon = sym.icon || '';
      sym.order = Number(sym.order || i+1);
      sym.active = sym.active !== false;
      if(sym.name) byKey.set(symbolKey(sym.branchId,sym.name),sym);
    });

    data.candidates.forEach(c=>{
      const branchId = branchForUnit(data,c.unitId)?.id || firstBranch;
      if(!c.symbolId && c.symbolName){
        const key=symbolKey(branchId,c.symbolName);
        let sym=byKey.get(key);
        if(!sym){
          sym={id:uid('sym'),branchId,name:c.symbolName,photo:c.symbolPhoto||'',icon:c.symbolIcon||'',order:data.symbols.length+1,active:true};
          data.symbols.push(sym); byKey.set(key,sym);
        }else if(!sym.photo && c.symbolPhoto){ sym.photo=c.symbolPhoto; }
        c.symbolId=sym.id;
      }
      if(c.symbolId){
        const sym=data.symbols.find(x=>x.id===c.symbolId);
        if(sym){ c.symbolName=sym.name; c.symbolPhoto=sym.photo||''; c.symbolIcon=sym.icon||''; }
      }
    });

    data.symbolAllocations = data.symbolAllocations.map(a=>({
      id:a.id||uid('alloc'), branchId:a.branchId||firstBranch, unitId:a.unitId||'', candidateId:a.candidateId||'',
      symbolId:a.symbolId||'', method:a.method==='LOTTERY'?'LOTTERY':'MANUAL', allocatedAt:a.allocatedAt||new Date().toISOString(),
      action:a.action||'ALLOCATED', previousSymbolId:a.previousSymbolId||''
    }));
    return data;
  }

  async function apiGet() {
    const res = await fetch('/api/data', {cache:'no-store'});
    if (!res.ok) throw new Error(`সার্ভার থেকে তথ্য পড়া যায়নি (${res.status})`);
    return normalize(await res.json());
  }

  function adminToken(){ return sessionStorage.getItem('electionAdminToken') || ''; }

  async function apiSave(data) {
    const normalized = normalize(data);
    const token = adminToken();
    if(!token) throw new Error('Admin session নেই। আবার লগইন করুন।');
    const res = await fetch('/api/data', {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Token':token},
      body:JSON.stringify(normalized)
    });
    if (!res.ok) {
      let msg='';
      try{ const body=await res.json(); msg=body.message||''; }catch(_){ try{msg=await res.text()}catch(__){} }
      if(res.status===401){ sessionStorage.removeItem('electionAdminToken'); sessionStorage.removeItem('electionAdmin'); }
      throw new Error(msg || `তথ্য ফাইলে সংরক্ষণ করা যায়নি (${res.status})`);
    }
    window.dispatchEvent(new CustomEvent('election-save-status',{detail:{ok:true,at:new Date()}}));
    return normalized;
  }

  async function load() {
    return clone(await apiGet());
  }

  async function save(data) {
    try { return await apiSave(data); }
    catch (err) {
      window.dispatchEvent(new CustomEvent('election-save-status',{detail:{ok:false,message:err.message}}));
      throw err;
    }
  }

  function exportJson(data) {
    const blob = new Blob([JSON.stringify(normalize(data), null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`masco-election-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=async()=>{
        try {
          const data=normalize(JSON.parse(reader.result));
          if(!Array.isArray(data.branches)||!Array.isArray(data.units)||!Array.isArray(data.candidates)) throw new Error('তথ্য ফাইলের গঠন সঠিক নয়');
          await save(data); resolve(data);
        } catch(e){reject(e)}
      };
      reader.onerror=reject; reader.readAsText(file);
    });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve,reject)=>{
      if(!file) return resolve('');
      if(file.size>1.5*1024*1024) return reject(new Error('ছবির সাইজ সর্বোচ্চ ১.৫ MB হতে পারবে।'));
      const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file);
    });
  }

  function sortedBranches(data,activeOnly=false){return data.branches.filter(b=>!activeOnly||b.active).sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name));}
  function sortedUnits(data,activeOnly=false,branchId=''){return data.units.filter(u=>(!activeOnly||u.active)&&(!branchId||u.branchId===branchId)).sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name));}
  function candidatesFor(data,unitId,gender,activeOnly=true){return data.candidates.filter(c=>c.unitId===unitId&&(!gender||c.gender===gender)&&(!activeOnly||c.active)).sort((a,b)=>(b.votes||0)-(a.votes||0)||a.name.localeCompare(b.name));}
  function groupResult(data,unit,gender){const list=candidatesFor(data,unit.id,gender,true);const quota=Math.max(0,Number(unit.quota?.[gender]||0));let lastVote=null,lastRank=0;const ranked=list.map((c,i)=>{const v=Number(c.votes||0);if(i===0||v!==lastVote)lastRank=i+1;lastVote=v;return{...c,rank:lastRank};});let winners=[];let tie=false,tieVote=null;if(quota>0&&ranked.length){const cutoffIndex=Math.min(quota,ranked.length)-1;const cutoffVote=Number(ranked[cutoffIndex]?.votes||0);winners=ranked.filter((c,i)=>i<quota||Number(c.votes||0)===cutoffVote);tie=winners.length>quota;tieVote=tie?cutoffVote:null;}return{quota,ranked,winners,tie,tieVote};}
  function hasBlockingTie(){return false;}
  function branchForUnit(data,unitId){const u=data.units.find(x=>x.id===unitId);return data.branches.find(b=>b.id===u?.branchId);}

  return {load,save,uid,exportJson,importJson,fileToDataUrl,normalize,sortedBranches,sortedUnits,candidatesFor,groupResult,hasBlockingTie,branchForUnit};
})();
