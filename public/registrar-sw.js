// Registra o service worker (arquivo próprio para a política de segurança de conteúdo não precisar liberar script inline)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
