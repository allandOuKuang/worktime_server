// 工时统计 PWA - 离线缓存 v7（兼容子路径托管，如 GitHub Pages /xxx/）
var CACHE = 'workhours-v7';
var SCOPE = self.registration.scope || './';
function abs(rel){
  // 把相对路径拼成 scope 下的绝对 URL，避免子路径部署时指向根域名
  if(rel === './' || rel === '/') return SCOPE;
  if(rel.startsWith('./')) rel = rel.slice(2);
  if(rel.startsWith('/')) rel = rel.slice(1);
  return SCOPE + rel;
}
var ASSETS = [
  './',
  './index.html',
  './widget.html',
  './manifest.json',
  './widget-manifest.json',
  './icon-192.png',
  './icon-512.png',
  './app-icon.png'
].map(abs);

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){ return self.clients.claim(); })
  );
});

// 接收页面的 skipWaiting 通知，新 SW 立即接管
self.addEventListener('message', function(e){
  if(e.data === 'skipWaiting'){ self.skipWaiting(); }
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);

  // 导航请求：先用缓存秒开（离线可用），后台静默拉取新版
  if(e.request.mode === 'navigate'){
    var fallback = (url.pathname.indexOf('widget') >= 0) ? abs('./widget.html') : abs('./index.html');
    e.respondWith(
      caches.match(e.request).then(function(cached){
        var networkFetch = fetch(e.request).then(function(resp){
          if(resp && resp.status === 200){
            var copy = resp.clone();
            caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          }
          return resp;
        }).catch(function(){
          return caches.match(fallback) || caches.match(abs('./'));
        });
        if(cached) return cached;
        return networkFetch;
      })
    );
    return;
  }

  // 静态资源：缓存优先，命中不联网
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(resp){
        if(resp && resp.status === 200){
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return resp;
      });
    })
  );
});
