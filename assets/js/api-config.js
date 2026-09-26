/* =====================================================================
   MASCO Election Portal — API address (auto-detect)

   একই কোড দুই জায়গায় চলবে, কিছু বদলাতে হবে না:
   1) PC-তে লোকাল (START.bat → http://localhost:8080/...)
        → API = একই সার্ভার (localhost / LAN IP)
   2) GitHub Pages (https://<user>.github.io/...)
        → API = Render সার্ভার (নিচের RENDER_API_BASE)
   3) Render-এর নিজের লিংক (https://....onrender.com/...)
        → API = একই সার্ভার

   প্রয়োজনে হাতে বদলানো যায় (ব্রাউজারে একবার খুললেই মনে রাখবে):
     ?api=http://localhost:8080        নির্দিষ্ট সার্ভার ব্যবহার
     ?api=render                       Render সার্ভার ব্যবহার
     ?api=auto                         আবার স্বয়ংক্রিয় মোডে ফেরত
   ===================================================================== */
(function () {
  'use strict';

  // Render-এ ব্যাকএন্ডের ঠিকানা (Render ড্যাশবোর্ডে যে URL দেখায়)
  var RENDER_API_BASE = 'https://masco-election-portal.onrender.com';

  // PC-তে index.html সরাসরি ডাবল-ক্লিক করে খুললে (file://) এই সার্ভার ব্যবহার হবে
  var LOCAL_FALLBACK = 'http://localhost:8080';

  var STORE_KEY = 'mascoApiBaseOverride';
  var clean = function (u) { return String(u || '').trim().replace(/\/+$/, ''); };

  function readOverride() {
    try {
      var qs = new URLSearchParams(location.search);
      if (qs.has('api')) {
        var v = qs.get('api');
        if (!v || v === 'auto' || v === 'reset') { localStorage.removeItem(STORE_KEY); return ''; }
        if (v === 'render') v = RENDER_API_BASE;
        localStorage.setItem(STORE_KEY, clean(v));
        return clean(v);
      }
      return clean(localStorage.getItem(STORE_KEY));
    } catch (_) { return ''; }
  }

  function detect() {
    var host = location.hostname || '';
    var proto = location.protocol;

    if (proto === 'file:') return LOCAL_FALLBACK;

    // GitHub Pages শুধু স্ট্যাটিক ফাইল দেয়, তাই API Render থেকে আসবে
    if (/\.github\.io$/i.test(host)) return RENDER_API_BASE;

    // localhost, 127.0.0.1, LAN IP (192.168.x.x ইত্যাদি), onrender.com বা
    // অন্য যেকোনো Node সার্ভার — পেজ যে সার্ভার থেকে এসেছে সেটাই API
    return '';
  }

  var override = readOverride();
  var base = override || detect();

  window.MASCO_API_BASE = clean(base);
  window.MASCO_API_MODE = override ? 'manual' : (base === '' ? 'same-server' : (base === RENDER_API_BASE ? 'render' : 'local'));

  window.MascoApiUrl = function (path) {
    path = String(path || '');
    if (path.charAt(0) !== '/') path = '/' + path;
    return window.MASCO_API_BASE + path;
  };

  try { console.info('[MASCO] API:', window.MASCO_API_BASE || location.origin, '(' + window.MASCO_API_MODE + ')'); } catch (_) {}
})();
