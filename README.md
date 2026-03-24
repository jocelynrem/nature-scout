# Nature Scout

Nature Scout is a small browser-based field guide app for first grade science exploration. It uses a single static page with Bulma, Font Awesome, custom CSS, plain JavaScript, pre-generated audio files for read-aloud support, and a service worker plus web app manifest for PWA install support.

## Files

- `index.html`: app markup with Bulma and Font Awesome
- `content.js`: shared scavenger-hunt content and read-aloud text
- `manifest.webmanifest`: install metadata for the PWA
- `styles.css`: custom styles and animations
- `script.js`: app logic for missions, camera capture, and text-to-speech
- `sw.js`: service worker for caching the app shell and audio files
- `scripts/generate-audio.cjs`: one-time Gemini TTS audio generator
- `audio/`: generated `.wav` read-aloud files served by the site

## Run Locally

Open `index.html` in a browser.

For camera access, it is usually better to serve the folder over a local web server instead of opening the file directly. For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The app can then be installed as a PWA from supported browsers.

## Run Tests

This project includes a lightweight automated test suite using Node's built-in test runner.

```bash
npm test
```

The tests cover the booklet UI logic and CSS guardrails that keep the guide visible and scrollable on smaller screens.

## Generate Read-Aloud Audio

The app is set up to play local audio files so students do not call the Gemini API directly.

1. Set your Gemini key in the shell:

```bash
export GEMINI_API_KEY="your-key-here"
```

2. Generate the audio files:

```bash
node scripts/generate-audio.cjs
```

3. The script writes `.wav` files into `audio/`. Commit those files to the repo so the website can serve them directly.

If you update the narration text in `content.js`, rerun:

```bash
node scripts/generate-audio.cjs --force
```

## Generate PWA Icons

The icon files are generated from `favicon.svg` with a small helper script:

```bash
python3 scripts/generate-pwa-icons.py
```

Notes:

- This script is currently macOS-only because it uses `qlmanage` and `sips`.
- It rewrites `icon-512.png`, `icon-192.png`, and `apple-touch-icon.png`.

## Notes

- The app uses `navigator.mediaDevices.getUserMedia()` for camera capture.
- Bulma and Font Awesome are loaded from CDNs in `index.html`.
- Audio playback expects the generated files in `audio/`.
- The PWA install metadata is in `manifest.webmanifest`, and offline caching is handled by `sw.js`.
