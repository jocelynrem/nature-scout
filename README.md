# Nature Scout

Nature Scout is a small browser-based field guide app for first grade science exploration. It uses a single static page with Bulma, Font Awesome, custom CSS, plain JavaScript, and pre-generated audio files for read-aloud support.

## Files

- `index.html`: app markup with Bulma and Font Awesome
- `content.js`: shared scavenger-hunt content and read-aloud text
- `styles.css`: custom styles and animations
- `script.js`: app logic for missions, camera capture, and text-to-speech
- `scripts/generate-audio.cjs`: one-time Gemini TTS audio generator
- `audio/`: generated `.wav` read-aloud files served by the site

## Run Locally

Open `index.html` in a browser.

For camera access, it is usually better to serve the folder over a local web server instead of opening the file directly. For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

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

## Notes

- The app uses `navigator.mediaDevices.getUserMedia()` for camera capture.
- Bulma and Font Awesome are loaded from CDNs in `index.html`.
- Audio playback expects the generated files in `audio/`.
