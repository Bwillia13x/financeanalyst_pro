// Service Worker Registration and Management

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function registerSW() {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl);
        navigator.serviceWorker.ready.then(() => {
          console.warn('PWA: Service Worker ready in development mode');
        });
      } else {
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.warn('PWA: Service Worker registered successfully:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('PWA: New content available, will update on next visit');
              showUpdateAvailableNotification();
            } else {
              console.log('PWA: Content cached for offline use');
              showCachedNotification();
            }
          }
        });
      });
    })
    .catch((error) => {
      console.error('PWA: Service Worker registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('PWA: No internet connection found. App is running in offline mode.');
      showOfflineNotification();
    });
}

export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('PWA: Service Worker unregistration failed:', error);
      });
  }
}

// Notification functions for better UX
function showUpdateAvailableNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('FinanceAnalyst Pro Update Available', {
      body: 'A new version is available. Refresh to update.',
      icon: '/assets/images/favicon.svg',
      badge: '/assets/images/favicon.svg',
      tag: 'app-update'
    });
  }

  // Also show in-app notification
  showInAppNotification(
    'Update Available',
    'A new version of FinanceAnalyst Pro is ready. Refresh to update.',
    'info'
  );
}

function showCachedNotification() {
  showInAppNotification(
    'App Ready for Offline',
    'FinanceAnalyst Pro is now available offline for core features.',
    'success'
  );
}

function showOfflineNotification() {
  showInAppNotification(
    'Offline Mode',
    'You\'re currently offline. Some features may be limited.',
    'warning'
  );
}

function showInAppNotification(title, message, type = 'info') {
  // Create a simple notification system
  const notification = document.createElement('div');
  notification.className = `
    fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg
    ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
    ${type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' : ''}
    ${type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : ''}
    transition-all duration-300 transform translate-x-full
  `;

  notification.innerHTML = `
    <div class="flex items-start">
      <div class="flex-1">
        <h4 class="font-medium text-sm">${title}</h4>
        <p class="text-sm mt-1 opacity-90">${message}</p>
      </div>
      <button class="ml-3 text-sm opacity-60 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      console.log('PWA: Notification permission:', permission);
    });
  }
}

// Install prompt handling
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPrompt();
});

function showInstallPrompt() {
  // Show custom install button/banner
  const installBanner = document.createElement('div');
  installBanner.className = `
    fixed bottom-4 left-4 right-4 p-4 bg-blue-600 text-white rounded-lg shadow-lg
    flex items-center justify-between z-50 max-w-md mx-auto
  `;

  installBanner.innerHTML = `
    <div class="flex-1">
      <h4 class="font-medium text-sm">Install FinanceAnalyst Pro</h4>
      <p class="text-sm opacity-90 mt-1">Get faster access and offline features</p>
    </div>
    <div class="flex items-center space-x-2 ml-3">
      <button id="install-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50">
        Install
      </button>
      <button id="dismiss-btn" class="text-white opacity-60 hover:opacity-100 text-sm">
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(installBanner);

  // Handle install button click
  installBanner.querySelector('#install-btn').addEventListener('click', async() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA: Install prompt outcome:', outcome);
      deferredPrompt = null;
    }
    installBanner.remove();
  });

  // Handle dismiss button click
  installBanner.querySelector('#dismiss-btn').addEventListener('click', () => {
    installBanner.remove();
    deferredPrompt = null;
  });
}

// Handle successful installation
window.addEventListener('appinstalled', () => {
  console.log('PWA: App was installed successfully');
  showInAppNotification(
    'App Installed',
    'FinanceAnalyst Pro has been installed successfully!',
    'success'
  );
  deferredPrompt = null;
});

// Network status handling
export function setupNetworkHandling() {
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    console.log('PWA: Network status:', isOnline ? 'online' : 'offline');

    if (!isOnline) {
      showInAppNotification(
        'Connection Lost',
        'You\'re now offline. Cached content will be used.',
        'warning'
      );
    } else {
      showInAppNotification(
        'Connection Restored',
        'You\'re back online. Syncing latest data...',
        'success'
      );
    }

    // Update UI to reflect network status
    document.body.setAttribute('data-network-status', isOnline ? 'online' : 'offline');
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Initial status
  updateOnlineStatus();
}

// Initialize PWA features
export function initializePWA() {
  registerSW();
  setupNetworkHandling();
  requestNotificationPermission();

  console.log('PWA: Initialization complete');
}
