/**
 * Service Worker Registration
 *
 * Registers the service worker on page load, detects updates,
 * and prompts the user to refresh for the latest version.
 *
 * NOTE: For production builds, consider adding vite-plugin-pwa
 * for better precaching and automatic manifest generation.
 * The manual sw.js approach works fine for development.
 */

const SW_PATH = '/sw.js';

export function register() {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service workers are not supported in this browser.');
    return;
  }

  // In development mode, automatically unregister any existing service worker to prevent stale asset caching
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
    return;
  }


  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        scope: '/',
      });

      console.log('[SW] Service worker registered successfully:', registration.scope);

      // Check for updates periodically (every 60 minutes)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Detect updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available - prompt user to refresh
            showUpdateNotification();
          }
        });
      });
    } catch (error) {
      console.error('[SW] Service worker registration failed:', error);
    }
  });

  // Handle controller change (when skipWaiting is called)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Page will be reloaded by the user via the notification prompt
  });
}

/**
 * Show a notification banner prompting the user to refresh for updates.
 * Uses a simple DOM-based toast since this runs outside React's tree.
 */
function showUpdateNotification() {
  // Avoid duplicate notifications
  if (document.getElementById('sw-update-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'sw-update-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #E31B23;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 99999;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: Inter, sans-serif;
    font-size: 14px;
  `;

  toast.innerHTML = `
    <span>A new version is available!</span>
    <button id="sw-update-btn" style="
      background: white;
      color: #E31B23;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
    ">Refresh</button>
    <button id="sw-dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid rgba(255,255,255,0.4);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    ">Later</button>
  `;

  document.body.appendChild(toast);

  document.getElementById('sw-update-btn')?.addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('sw-dismiss-btn')?.addEventListener('click', () => {
    toast.remove();
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
