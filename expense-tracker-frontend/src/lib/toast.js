export const showToast = (message, type = 'info') => {
  const toastContainer = document.querySelector('.toast');
  if (!toastContainer) {
    console.warn('Toast container (.toast) not found in DOM');
    return;
  }

  const toast = document.createElement('div');
  
  // DaisyUI alert classes + animation
  toast.className = `alert alert-${type} shadow-lg mb-3 opacity-0 translate-y-[-20px] transition-all duration-500 ease-out`;

  // Icon + message
  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
  };

  // Safe DOM construction - no innerHTML with user data to prevent XSS
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center gap-3';

  // Icon is static SVG from our own icons map, safe to use innerHTML
  const iconWrapper = document.createElement('span');
  iconWrapper.innerHTML = icons[type] || icons.info;
  wrapper.appendChild(iconWrapper);

  const messageSpan = document.createElement('span');
  messageSpan.className = 'text-sm font-medium';
  messageSpan.textContent = message; // Safe - no HTML injection
  wrapper.appendChild(messageSpan);

  toast.appendChild(wrapper);

  // Append first
  toastContainer.appendChild(toast);

  // Trigger enter animation (reflow needed)
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-[-20px]');
    toast.classList.add('opacity-100', 'translate-y-0');
  });

  // Auto remove after 4 seconds
  const removeToast = () => {
    toast.classList.add('opacity-0', 'translate-y-[-20px]');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  const timeout = setTimeout(removeToast, 4000);

  // Optional: Allow manual dismiss
  toast.addEventListener('click', () => {
    clearTimeout(timeout);
    removeToast();
  });
};

// Shortcuts
export const toastSuccess = (msg) => showToast(msg, 'success');
export const toastError = (msg) => showToast(msg, 'error');
export const toastWarning = (msg) => showToast(msg, 'warning');
export const toastInfo = (msg) => showToast(msg, 'info');