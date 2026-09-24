/*
  MASCO Election API configuration.

  Same Node server deployment:
    window.MASCO_API_BASE = '';

  GitHub Pages frontend + separate Node backend:
    window.MASCO_API_BASE = 'https://YOUR-NODE-BACKEND.example.com';
*/
window.MASCO_API_BASE = window.MASCO_API_BASE || '';
window.MASCO_API_BASE = String(window.MASCO_API_BASE).replace(/\/+$/, '');
window.MascoApiUrl = function(path){
  path = String(path || '');
  if (!path.startsWith('/')) path = '/' + path;
  return window.MASCO_API_BASE + path;
};
