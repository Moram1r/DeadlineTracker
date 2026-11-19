export function showToast(message, timeout = 2000) {
  const cont = document.getElementById('toastContainer');
  if (!cont) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  cont.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, timeout);
}
