/*
 * MAHI: Ultimate Pen Fight boot (1.6.7). A classic script in <head>, so it runs before the first paint (the CSP allows 'self').
 * - The page colour: style.css paints the page with var(--page), which the app script sets much later. Until then the
 *   browser drew a blank page: the white flash on every load and after Update. Here --page comes from the theme-color
 *   meta for the saved theme (light, dark or the system one), so the first paint already has the page colour.
 * - After Update: the old page left its splash in sessionStorage (src/offline/splash.ts). The new page shows the same
 *   splash from its first paint, and the app fades it out when ready, so the reload is one unbroken splash. If the app
 *   never gets there, a failsafe lifts it (10 s, or any uncaught error).
 * - Reduced motion (saved setting, else the system) is set before the first paint, so the splash never animates.
 */
(function () {
  var root = document.documentElement;
  try {
    var saved = null;
    try { saved = localStorage.getItem('penfight.theme'); } catch (e) { /* Blocked storage: the system theme. */ }
    var dark = saved === 'dark' || (saved !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    var meta = document.querySelector('meta[name="theme-color"][media*="' + (dark ? 'dark' : 'light') + '"]');
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.style.colorScheme = dark ? 'dark' : 'light';
    if (meta && meta.content) root.style.setProperty('--page', meta.content);
  } catch (e) { /* The app sets the theme anyway. */ }
  try {
    // Reduced motion before the first paint: the saved setting (src/game/game-settings.ts) or the system one; either
    // asks for it. The app sets the final value from the setting when it starts.
    var motion = null;
    try { motion = JSON.parse(localStorage.getItem('penfight.settings') || 'null'); } catch (e) { /* The system one. */ }
    var reduce = !!(motion && motion.reduceMotion === true)
      || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    root.setAttribute('data-motion', reduce ? 'reduce' : 'full');
  } catch (e) { /* The app sets it anyway. */ }
  try {
    var boot = JSON.parse(sessionStorage.getItem('penfight.boot') || 'null');
    if (!boot || typeof boot.at !== 'number' || Date.now() - boot.at > 30000) { sessionStorage.removeItem('penfight.boot'); return; }
    for (var name in boot.vars) if (/^[a-zA-Z-]+$/.test(name)) root.style.setProperty('--' + name, String(boot.vars[name]));
    root.style.setProperty('--boot-text', '"' + String(boot.text || '').replace(/["\\]/g, '\\$&') + '"');
    root.setAttribute('data-boot-splash', '');
    root.classList.add('pf-updating');
    // Failsafe: the app lifts the splash when ready (liftBootSplash removes data-boot-splash). If the new build fails
    // to start (a script error, a rejected promise, a hang), the splash must never stay: it lifts after 10 s, or at once
    // on an error, and the page scrolls and takes taps again.
    var lift = function () {
      window.removeEventListener('error', lift);
      window.removeEventListener('unhandledrejection', lift);
      if (!root.hasAttribute('data-boot-splash')) return;
      root.removeAttribute('data-boot-splash');
      root.classList.remove('pf-updating');
      try { sessionStorage.removeItem('penfight.boot'); } catch (e) { /* Nothing to forget. */ }
    };
    setTimeout(lift, 10000);
    window.addEventListener('error', lift);
    window.addEventListener('unhandledrejection', lift);
  } catch (e) { /* No splash: a normal start. */ }
})();
