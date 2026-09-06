# PWA setup — Field Ops Console

## 1. Files to add to your repo (same folder as index.html / admin.html)

```
/manifest.json
/sw.js
/icons/icon-192.png
/icons/icon-512.png
/icons/icon-512-maskable.png
/icons/apple-touch-icon.png   (optional, iOS home-screen icon)
```

## 2. Add these tags inside <head> of BOTH index.html and admin.html

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#050810">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="FOS">
```

## 3. Register the service worker — add this before your closing </body> tag
(or right after your existing <script> block) in BOTH files:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .catch(err => console.warn('SW registration failed:', err));
    });
  }
</script>
```

## 4. GitHub Pages notes

- GitHub Pages serves over HTTPS automatically — required for service
  workers and installability. No extra config needed there.
- `manifest.json`'s `start_url` and `scope` use relative paths ("./"),
  so this works whether your repo is served at the domain root
  (username.github.io) or in a sub-path
  (username.github.io/repo-name/) — no hardcoded domain needed.
- If your repo name is a sub-path (e.g. /repo-name/), double-check that
  `sw.js`'s registration path (`sw.js`, not `/sw.js`) stays relative too,
  which it already is above — an absolute leading slash would break the
  scope on a project-pages URL.

## 5. Two entry points (index.html + admin.html)

The manifest's `start_url` currently points at `./index.html` (the field
rep app) since that's the main user-facing entry point. If admins should
install a *separate* "app" that opens straight to admin.html:

- Duplicate `manifest.json` as `manifest-admin.json` with
  `"start_url": "./admin.html"` and a different `short_name` (e.g.
  "FOS Admin"), then link `admin.html`'s `<head>` to
  `<link rel="manifest" href="manifest-admin.json">` instead of the
  shared one. Both can share the same `sw.js` and `icons/` folder.

## 6. Verifying it worked

After pushing to GitHub and letting Pages redeploy:
1. Open the live URL on desktop Chrome → address bar should show an
   install icon (⊕ or a monitor+arrow icon).
2. On Android Chrome → menu → "Install app" / "Add to Home screen"
   should appear.
3. DevTools → Application tab → Manifest: confirms it's being read
   correctly, shows any icon/field errors.
4. DevTools → Application tab → Service Workers: confirms `sw.js` is
   registered and activated.

## 7. Every future deploy

Bump `CACHE_VERSION` at the top of `sw.js` (e.g. `fos-v1` → `fos-v2`)
whenever you push changes to index.html/admin.html/CSS/JS — otherwise
returning users may keep seeing a stale cached version until the old
service worker naturally updates.
