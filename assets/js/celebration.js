/* Header celebration effects (emoji, stars, fireworks, ribbons) — shared by
   the section result page. Same code as in result.js. */
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
