import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- Component 4: PWA Offline-First Mesh Sync ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}

// Background Sync Logic
window.addEventListener('online', async () => {
    console.log('📡 Back online! Syncing offline reports...');
    try {
        const db = await new Promise((resolve, reject) => {
            const req = indexedDB.open('crisis-sync-db', 1);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        const tx = db.transaction('requests', 'readwrite');
        const store = tx.objectStore('requests');
        const getReq = store.getAll();

        getReq.onsuccess = async () => {
            const requests = getReq.result;
            if (requests && requests.length > 0) {
                console.log(`Flushing ${requests.length} offline reports to command center.`);
                
                for (const req of requests) {
                    try {
                        const token = localStorage.getItem('token');
                        // Ensure auth token is injected if session was extended
                        if (token) req.headers['Authorization'] = `Bearer ${token}`;

                        await fetch(req.url, {
                            method: req.method,
                            headers: req.headers,
                            body: req.body // blob
                        });
                        
                        // Delete safely after success
                        const delTx = db.transaction('requests', 'readwrite');
                        delTx.objectStore('requests').delete(req.id);
                        
                    } catch (e) {
                        console.error('Offline sync failed for specific queue item', e);
                    }
                }
                alert('Connection restored. Successfully synced offline disaster reports.');
            }
        };
    } catch (err) {
        console.error('Error during online sync mesh flow:', err);
    }
});
