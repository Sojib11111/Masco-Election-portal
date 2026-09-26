/* =====================================================================
   MASCO Election Portal — "Screen Fit" (laptop → TV duplicate display)

   The portal is designed on a 1920 × 1080 screen. On a laptop that
   runs Windows at 125–150 % scaling the browser only has ~1280–1536 CSS
   pixels, so the layout switches to its "laptop" version and, when the
   laptop screen is duplicated on a TV, the TV does not show the big
   1920 design.

   Screen Fit renders every page at exactly 1920 px width and scales it
   down to the window, so the laptop (and the duplicated TV) always show
   the full-size 1920 × 1080 design — same as a monitor at 100 %.

   • Automatic on landscape laptop / desktop windows 1024–1899 px wide
     (mouse/touchpad). Phones, tablets and 1920+ screens are unchanged.
   • Small button at bottom-right (appears when you move the mouse):
     turn Screen Fit on / off. Choice is remembered in this browser.
   • URL:  ?fit=on   ?fit=off   ?fit=auto
   ===================================================================== */
(function () {
  'use strict';
  var DESIGN_W = 1920;
  var KEY = 'mascoScreenFit';
  var FRAME_ID = 'mascoFitFrame';
  var w = window;

  function pref() {
    var v = '';
    try {
      var qs = new URLSearchParams(location.search);
      if (qs.has('fit')) {
        v = String(qs.get('fit') || '').toLowerCase();
        if (v === 'auto' || v === '') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, v === 'off' || v === '0' ? 'off' : 'on');
      }
      v = localStorage.getItem(KEY) || 'auto';
    } catch (_) { v = 'auto'; }
    return v;
  }
  function eligible() {
    var fine = true;
    try { fine = w.matchMedia('(pointer: fine)').matches || w.matchMedia('(any-pointer: fine)').matches; } catch (_) {}
    var iw = w.innerWidth, ih = w.innerHeight;
    // laptop, desktop monitor and TV (landscape, 1024 px or wider)
    return iw >= 1024 && iw > ih && (fine || iw >= 1600);
  }

  function zoomKey(e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return null;
    var k = e.key, c = e.code;
    if (k === '+' || k === '=' || c === 'NumpadAdd' || c === 'Equal') return 1;
    if (k === '-' || k === '_' || c === 'NumpadSubtract' || c === 'Minus') return -1;
    if (k === '0' || c === 'Digit0' || c === 'Numpad0') return 0;
    return null;
  }

  /* ---------- Inside the fitted frame: small bridges to the parent ---------- */
  var inFrame = false;
  try { inFrame = w.self !== w.top && w.frameElement && w.frameElement.id === FRAME_ID; } catch (_) {}
  if (inFrame) {
    var pdoc = w.parent.document;
    // Zoom (Ctrl + / Ctrl - / Ctrl 0 / Ctrl + mouse wheel) is handled by the parent
    var fwdZoom = function (d) { try { w.parent.mascoFitZoom && w.parent.mascoFitZoom(d); } catch (_) {} };
    document.addEventListener('keydown', function (e) {
      var d = zoomKey(e); if (d !== null) { e.preventDefault(); fwdZoom(d); }
    }, true);
    w.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); fwdZoom(e.deltaY < 0 ? 1 : -1); }
    }, { passive: false, capture: true });
    document.documentElement.classList.add('screen-fit-inner');
    // Fullscreen buttons inside the page make the WHOLE window fullscreen
    try {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: function () { return pdoc.fullscreenElement ? document.documentElement : null; } });
      document.documentElement.requestFullscreen = function () { return pdoc.documentElement.requestFullscreen(); };
      document.exitFullscreen = function () { return pdoc.exitFullscreen(); };
      pdoc.addEventListener('fullscreenchange', function () { document.dispatchEvent(new Event('fullscreenchange')); });
    } catch (_) {}
    // keep the browser tab title in sync
    var syncTitle = function () { try { pdoc.title = document.title; } catch (_) {} };
    syncTitle();
    document.addEventListener('DOMContentLoaded', syncTitle);
    // keep the address bar in sync (so refresh / bookmark open the same page)
    try { w.parent.history.replaceState(null, '', location.href); } catch (_) {}
    return;
  }

  var mode = pref();
  var useFit = mode === 'on' ? (w.innerWidth >= 1024)
             : mode === 'off' ? false
             : eligible();

  /* ---------- Toggle button (shown on laptop / desktop sizes) ---------- */
  function addToggle(isOn) {
    if (!eligible() && !isOn) return;
    var css = document.createElement('style');
    css.textContent =
      '#mascoFitToggle{position:fixed;right:12px;bottom:12px;z-index:2147483000;width:38px;height:38px;padding:0;' +
      'display:grid;place-items:center;border:1px solid rgba(255,255,255,.35);border-radius:50%;' +
      'background:rgba(8,30,58,.78);color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3);' +
      'opacity:0;pointer-events:none;transition:opacity .3s ease}' +
      '#mascoFitToggle svg{width:18px;height:18px}' +
      '#mascoFitToggle.off{background:rgba(90,100,115,.78)}' +
      '#mascoFitToggle.show{opacity:.85;pointer-events:auto}#mascoFitToggle:hover{opacity:1}' +
      '@media print{#mascoFitToggle{display:none!important}}';
    document.head.appendChild(css);
    var b = document.createElement('button');
    b.id = 'mascoFitToggle';
    b.type = 'button';
    b.innerHTML = isOn
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
    if (!isOn) b.classList.add('off');
    b.setAttribute('aria-label', isOn ? 'স্ক্রিন ফিট বন্ধ করুন' : 'স্ক্রিন ফিট চালু করুন');
    b.title = isOn ? 'স্ক্রিন ফিট চালু — বন্ধ করতে ক্লিক করুন' : 'স্ক্রিন ফিট বন্ধ — চালু করতে ক্লিক করুন (টিভির জন্য ভালো)';
    b.addEventListener('click', function () {
      try { localStorage.setItem(KEY, isOn ? 'off' : 'on'); } catch (_) {}
      var url = location.href.replace(/([?&])fit=[^&#]*&?/, '$1').replace(/[?&]$/, '');
      location.replace(url);
    });
    document.body.appendChild(b);
    var t = 0;
    var show = function () { b.classList.add('show'); clearTimeout(t); t = setTimeout(function () { b.classList.remove('show'); }, 2500); };
    document.addEventListener('mousemove', show, { passive: true });
    show();
    return show;
  }

  if (!useFit) {
    document.addEventListener('DOMContentLoaded', function () { addToggle(false); });
    return;
  }

  /* ---------- Build the fitted wrapper (stop the normal page load) ---------- */
  var src = location.href;
  try { w.stop(); } catch (_) {}
  var title = document.title || 'MASCO';
  document.documentElement.innerHTML =
    '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title></title><style>' +
    'html,body{margin:0;height:100%;overflow:hidden;background:#031329}' +
    '#' + FRAME_ID + '{position:absolute;left:0;top:0;border:0;display:block;transform-origin:0 0;background:#031329}' +
    '</style></head><body></body>';
  document.title = title;
  var frame = document.createElement('iframe');
  frame.id = FRAME_ID;
  frame.name = FRAME_ID;
  frame.setAttribute('allow', 'fullscreen');
  frame.setAttribute('title', title);
  document.body.appendChild(frame);

  /* Own zoom for screen-fit mode (browser zoom cannot work here, because the
     page is always re-scaled to the window). 100 % = full 1920 design.     */
  var ZKEY = 'mascoFitZoom';
  var STEPS = [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200];
  var zoom = 100;
  try { zoom = Number(localStorage.getItem(ZKEY)) || 100; } catch (_) {}
  if (STEPS.indexOf(zoom) < 0) zoom = 100;
  var badge = null, badgeTimer = 0;
  function showBadge() {
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'mascoFitZoomBadge';
      badge.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483001;' +
        'background:rgba(8,30,58,.9);color:#fff;border-radius:999px;padding:7px 16px;font:700 14px/1.2 "Segoe UI",Arial,sans-serif;' +
        'box-shadow:0 6px 20px rgba(0,0,0,.35);pointer-events:none;transition:opacity .25s ease;opacity:0';
      document.body.appendChild(badge);
    }
    badge.textContent = 'জুম: ' + zoom + '%  (Ctrl + 0 = ১০০%)';
    badge.style.opacity = '1';
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(function () { badge.style.opacity = '0'; }, 1300);
  }
  function layout() {
    var cssW = DESIGN_W * 100 / zoom;            // zoom in → narrower page → bigger content
    var s = w.innerWidth / cssW;
    frame.style.width = cssW + 'px';
    frame.style.height = Math.ceil(w.innerHeight / s) + 'px';
    frame.style.transform = 'scale(' + s + ')';
  }
  var lastZ = 0;
  w.mascoFitZoom = function (dir) {
    var now = Date.now(); if (dir !== 0 && now - lastZ < 140) return; lastZ = now;
    var i = STEPS.indexOf(zoom);
    if (dir === 0) zoom = 100;
    else zoom = STEPS[Math.max(0, Math.min(STEPS.length - 1, i + (dir > 0 ? 1 : -1)))];
    try { localStorage.setItem(ZKEY, String(zoom)); } catch (_) {}
    layout();
    showBadge();
  };
  document.addEventListener('keydown', function (e) {
    var d = zoomKey(e); if (d !== null) { e.preventDefault(); w.mascoFitZoom(d); }
  }, true);
  w.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); w.mascoFitZoom(e.deltaY < 0 ? 1 : -1); }
  }, { passive: false, capture: true });
  layout();
  w.addEventListener('resize', layout, { passive: true });
  document.addEventListener('fullscreenchange', function () { setTimeout(layout, 60); });
  frame.src = src;
  var show = addToggle(true);
  // mouse moves inside the frame also reveal the toggle button
  frame.addEventListener('load', function () {
    try { frame.contentDocument.addEventListener('mousemove', function () { show && show(); }, { passive: true }); frame.contentWindow.focus(); } catch (_) {}
  });
})();
