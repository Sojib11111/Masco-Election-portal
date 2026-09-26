/* MASCO Election Portal — responsive helpers (admin panel)
   1) Mobile/tablet: hamburger button + slide-in sidebar drawer
   2) Phone: every admin table gets data-label on its cells so CSS can
      show each row as a readable card (no hidden columns). */
(function(){
  'use strict';
  var body = document.body;
  if (!body || !body.classList.contains('admin-bn-body')) return;


  /* ---------- 0. Login: show / hide password ---------- */
  (function(){
    var inp = document.getElementById('loginPass');
    if (!inp || inp.parentNode.classList.contains('pass-wrap')) return;
    var wrap = document.createElement('span');
    wrap.className = 'pass-wrap';
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    var eye = document.createElement('button');
    eye.type = 'button';
    eye.className = 'pass-eye';
    var ICON_SHOW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    var ICON_HIDE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.1 10.1 0 0 1 12 19c-7 0-11-7-11-7a18.4 18.4 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    var set = function(show){
      inp.type = show ? 'text' : 'password';
      eye.innerHTML = show ? ICON_HIDE : ICON_SHOW;
      eye.setAttribute('aria-label', show ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন');
      eye.title = eye.getAttribute('aria-label');
    };
    eye.addEventListener('click', function(){ set(inp.type === 'password'); inp.focus(); });
    inp.addEventListener('keydown', function(e){ if (e.key === 'Enter') { var b = document.getElementById('loginBtn'); if (b) b.click(); } });
    var btn = document.getElementById('loginBtn');
    if (btn) btn.addEventListener('click', function(){ set(false); });
    wrap.appendChild(eye);
    set(false);
  })();

  /* ---------- 1. Sidebar: drawer on mobile, collapse on desktop/TV ---------- */
  var topbar = document.querySelector('.bn-topbar');
  var sidebar = document.querySelector('.bn-sidebar');
  var KEY = 'mascoSidebarCollapsed';
  var isMobile = function(){ return window.innerWidth <= 900; };
  if (topbar && sidebar && !document.querySelector('.admin-menu-toggle')) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'admin-menu-toggle';
    btn.innerHTML = '<span class="amt-bars" aria-hidden="true"></span>';
    topbar.insertBefore(btn, topbar.firstChild);

    var overlay = document.createElement('div');
    overlay.className = 'admin-nav-overlay';
    document.body.appendChild(overlay);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'admin-drawer-close';
    closeBtn.setAttribute('aria-label', 'মেনু বন্ধ করুন');
    closeBtn.innerHTML = '&times;';
    sidebar.insertBefore(closeBtn, sidebar.firstChild);
    closeBtn.addEventListener('click', function(){ body.classList.remove('nav-open'); sync(); });

    var saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch (_) {}
    if (saved) body.classList.add('sidebar-collapsed');

    var sync = function(){
      var open = isMobile() ? body.classList.contains('nav-open') : !body.classList.contains('sidebar-collapsed');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'মেনু লুকান' : 'মেনু দেখান');
      btn.title = open ? 'মেনু লুকান (বড় পর্দা)' : 'মেনু দেখান';
      btn.classList.toggle('is-open', open);
    };
    var setDrawer = function(open){ body.classList.toggle('nav-open', open); sync(); };
    var setCollapsed = function(c){
      body.classList.toggle('sidebar-collapsed', c);
      try { localStorage.setItem(KEY, c ? '1' : '0'); } catch (_) {}
      sync();
      // let layouts that measure themselves (grids, charts) re-flow
      setTimeout(function(){ window.dispatchEvent(new Event('resize')); }, 320);
    };

    btn.addEventListener('click', function(){
      if (isMobile()) setDrawer(!body.classList.contains('nav-open'));
      else setCollapsed(!body.classList.contains('sidebar-collapsed'));
    });
    overlay.addEventListener('click', function(){ setDrawer(false); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') setDrawer(false);
      // Ctrl + B : show / hide menu
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B') && !/input|textarea|select/i.test((e.target || {}).tagName || '')) {
        e.preventDefault(); btn.click();
      }
    });
    sidebar.addEventListener('click', function(e){
      if (isMobile() && e.target.closest('.navbtn')) setDrawer(false);
    });
    window.addEventListener('resize', function(){ if (!isMobile()) body.classList.remove('nav-open'); sync(); }, { passive:true });
    sync();
  }

  /* ---------- 2. Table cells -> labelled cards on phones ---------- */
  function labelTable(table){
    var heads = Array.prototype.map.call(table.querySelectorAll('thead th'), function(th){
      return (th.textContent || '').trim();
    });
    if (!heads.length) return;
    table.classList.add('rt-cards');
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function(tr){
      Array.prototype.forEach.call(tr.children, function(td, i){
        var label = heads[i] || '';
        if (td.getAttribute('data-label') !== label) td.setAttribute('data-label', label);
      });
    });
  }
  function labelAll(){
    Array.prototype.forEach.call(document.querySelectorAll('.table-wrap table'), labelTable);
  }
  var pending = false;
  var mo = new MutationObserver(function(){
    if (pending) return;
    pending = true;
    requestAnimationFrame(function(){ pending = false; labelAll(); });
  });
  var main = document.querySelector('.bn-main') || document.body;
  mo.observe(main, { childList:true, subtree:true });
  labelAll();
})();
