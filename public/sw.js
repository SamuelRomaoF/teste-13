const CACHE_NAME = 'fire-dominios-v2';
const STATIC_CACHE_NAME = 'fire-dominios-static-v2';
const DYNAMIC_CACHE_NAME = 'fire-dominios-dynamic-v2';
const IMG_CACHE_NAME = 'fire-dominios-images-v2';

// Assets que devem ser cacheados imediatamente (críticos)
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.webmanifest'
];

// Assets estáticos que podem ser cacheados 
const STATIC_ASSETS = [
  '/assets/index-B_8ZDmFe.css',
  '/assets/react-vendor-*.js',
  '/assets/index-*.js'
];

// Imagens que devem ser cacheadas
const IMAGES_TO_CACHE = [
  '/lovable-uploads/f7ad8c87-e46c-4a74-bbc3-772f8f211c80.webp'
];

// Estratégia de cache: Cache First com fallback para network
const cacheFirstStrategy = (request, cacheName) => {
  return caches.match(request)
    .then(response => {
      // Cache hit - retorna resposta do cache
      if (response) {
        return response;
      }

      // Clone da requisição porque é consumível apenas uma vez
      const fetchRequest = request.clone();

      return fetch(fetchRequest)
        .then(response => {
          // Verificar se recebemos uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone da resposta porque é consumível apenas uma vez
          const responseToCache = response.clone();

          caches.open(cacheName)
            .then(cache => {
              cache.put(request, responseToCache);
            });

          return response;
        });
    });
};

// Estratégia de cache: Network First com fallback para cache
const networkFirstStrategy = (request, cacheName) => {
  return fetch(request)
    .then(response => {
      // Clone da resposta porque é consumível apenas uma vez
      const responseToCache = response.clone();

      caches.open(cacheName)
        .then(cache => {
          cache.put(request, responseToCache);
        });

      return response;
    })
    .catch(() => {
      return caches.match(request);
    });
};

// Install
self.addEventListener('install', event => {
  self.skipWaiting(); // Força a ativação imediata
  
  event.waitUntil(
    Promise.all([
      // Cache critical assets
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(CRITICAL_ASSETS)),
      
      // Cache static assets separately
      caches.open(STATIC_CACHE_NAME)
        .then(cache => cache.addAll(STATIC_ASSETS)),
      
      // Cache images separately
      caches.open(IMG_CACHE_NAME)
        .then(cache => cache.addAll(IMAGES_TO_CACHE))
    ])
  );
});

// Fetch
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Estratégia para assets estáticos (JS, CSS)
  if (event.request.url.match(/\.(js|css)$/i)) {
    event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE_NAME));
    return;
  }
  
  // Estratégia para imagens
  if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i) || 
      url.pathname.includes('/lovable-uploads/')) {
    event.respondWith(cacheFirstStrategy(event.request, IMG_CACHE_NAME));
    return;
  }
  
  // Para requisições HTML e API, preferir network first
  if (event.request.mode === 'navigate' || 
      (event.request.method === 'GET' && 
       event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(networkFirstStrategy(event.request, CACHE_NAME));
    return;
  }
  
  // Demais requisições: cache first para melhor performance
  event.respondWith(cacheFirstStrategy(event.request, DYNAMIC_CACHE_NAME));
});

// Activate
self.addEventListener('activate', event => {
  // Tomar controle imediatamente de todas as páginas
  self.clients.claim();
  
  const cacheAllowlist = [
    CACHE_NAME, 
    STATIC_CACHE_NAME, 
    DYNAMIC_CACHE_NAME, 
    IMG_CACHE_NAME
  ];

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheAllowlist.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      })
  );
});

// Permite sincronização offline para formulários
self.addEventListener('sync', event => {
  if (event.tag === 'sync-contact-form') {
    event.waitUntil(syncContactForm());
  }
});

// Função para sincronizar dados armazenados offline
function syncContactForm() {
  return fetch('/api/submit-contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: localStorage.getItem('pendingContactForm')
  })
  .then(response => {
    if (response.ok) {
      localStorage.removeItem('pendingContactForm');
    }
  });
}
