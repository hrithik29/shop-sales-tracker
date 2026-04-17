# Shop Sales Tracker

Daily sales tracker — Phase 1.

## Before deploying

Edit `src/config.ts` with real staff names, categories, and shop name. That is the only file you need to change.

## Install to home screen (Android Chrome)

1. Open the app URL in Chrome on your phone.
2. Tap the three-dot menu (⋮) at the top right.
3. Tap **Add to Home screen**.
4. Tap **Add**.

The app icon will appear on your home screen. It works fully offline after the first load.

## Install to home screen (iPhone Safari)

1. Open the app URL in Safari.
2. Tap the Share button (box with arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

## Dev setup

```bash
npm install
npm run dev
```

## Deploy (Netlify)

```bash
npm run build
# drag the dist/ folder to netlify.com/drop
```

Or connect the repo to Netlify and set build command `npm run build` and publish directory `dist`.
