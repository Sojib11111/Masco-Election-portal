window.MASCO_API_BASE =
  'https://masco-election-portal.onrender.com';

window.MASCO_API_BASE =
  String(window.MASCO_API_BASE).replace(/\/+$/, '');

window.MascoApiUrl = function(path){
  path = String(path || '');

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return window.MASCO_API_BASE + path;
};