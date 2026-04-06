const CACHE_NAME = 'crisis-map-v1';
const OFFLINE_URLS = ['/', '/index.html'];

// Native IndexedDB wrapper for Offline-First Sync Queue
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('crisis-sync-db', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('requests')) {
                db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function saveRequest(url, method, headers, serializedBody) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('requests', 'readwrite');
            const store = tx.objectStore('requests');
            store.add({ url, method, headers, body: serializedBody, timestamp: Date.now() });
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    });
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    // Intercept API POST requests to enable offline-first queuing
    if (event.request.method === 'POST' && event.request.url.includes('/api/disasters')) {
        event.respondWith(
            fetch(event.request.clone()).catch(async (error) => {
                console.log('[Service Worker] Network failed. Queuing report in IndexedDB for Background Sync.');
                const clonedRequest = event.request.clone();
                
                try {
                    // Extract headers
                    const headers = {};
                    for (let [key, value] of clonedRequest.headers.entries()) {
                        headers[key] = value;
                    }

                    // We serialize the body. Note: FormData serialization is complex in raw SW, 
                    // we save it as a Blob or arrayBuffer.
                    const bodyBlob = await clonedRequest.blob();
                    
                    await saveRequest(event.request.url, event.request.method, headers, bodyBlob);
                    
                    // Mock success response so the UI stays responsive
                    return new Response(JSON.stringify({ 
                        message: "Saved offline. Will sync automatically when connection restores.", 
                        status: "offline_queued" 
                    }), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 200
                    });
                } catch(e) {
                    console.error("Failed to queue offline request", e);
                    throw error; // Let it fail if we can't save it
                }
            })
        );
    } else {
        // Standard caching (Network First -> Fallback to Cache)
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
    }
});
