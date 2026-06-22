import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios';

// ----------------------------------------------------
// 1. GLOBAL TOAST NOTIFICATION SYSTEM
// ----------------------------------------------------
window.showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `p-4 rounded-xl shadow-xl text-xs font-semibold text-white transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center gap-2 border ${
    type === 'error'
      ? 'bg-rose-600 border-rose-500 shadow-rose-600/10'
      : type === 'warning'
      ? 'bg-amber-500 border-amber-400 shadow-amber-500/10'
      : 'bg-emerald-600 border-emerald-500 shadow-emerald-600/10'
  }`;
  
  toast.innerText = message;
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.className = toast.className.replace('translate-y-2 opacity-0', 'translate-y-0 opacity-100');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.className = toast.className.replace('translate-y-0 opacity-100', 'translate-y-2 opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
};

// ----------------------------------------------------
// 2. GLOBAL AXIOS INTERCEPTORS FOR PROPER DATA/ERROR HANDLING
// ----------------------------------------------------
axios.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // Don't show toast for verification or login requests
      if (!response.config.url.includes('/api/auth/me') && !response.config.url.includes('/api/auth/login')) {
        const msg = response.data?.message || 'Operation completed successfully.';
        window.showToast(msg, 'success');
      }
    }
    return response;
  },
  (error) => {
    let msg = 'An unexpected error occurred.';
    if (error.code === 'ERR_NETWORK') {
      msg = 'Network connection failed. Please ensure the backend server is running.';
    } else if (error.response?.data?.message) {
      msg = error.response.data.message;
    } else if (error.response?.data?.errors?.length > 0) {
      msg = error.response.data.errors.map(e => e.msg).join(', ');
    }
    window.showToast(msg, 'error');
    return Promise.reject(error);
  }
);

// ----------------------------------------------------
// 3. GLOBAL ANTI DOUBLE-CLICK INTERCEPTOR FOR BUTTONS
// ----------------------------------------------------
document.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (button) {
    // If button already has a disabled property or loading attribute, let React handle it
    if (button.hasAttribute('disabled') || button.classList.contains('pointer-events-none')) {
      return;
    }
    
    // Add temporary pointer-events-none class to prevent fast double clicking
    button.classList.add('pointer-events-none');
    const originalOpacity = button.style.opacity;
    button.style.opacity = '0.7';
    
    setTimeout(() => {
      button.classList.remove('pointer-events-none');
      button.style.opacity = originalOpacity;
    }, 850); // Standard human double click safety margin
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
