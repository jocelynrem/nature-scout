# Nature Scout

Nature Scout is a small browser-based field guide app for first grade science exploration. It uses a single static page with Tailwind via CDN, custom CSS, and plain JavaScript.

## Files

- `index.html`: app markup and Tailwind utility classes
- `styles.css`: custom styles and animations
- `script.js`: app logic for missions, camera capture, and text-to-speech

## Run Locally

Open `index.html` in a browser.

For camera access, it is usually better to serve the folder over a local web server instead of opening the file directly. For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- The app uses `navigator.mediaDevices.getUserMedia()` for camera capture.
- The text-to-speech flow expects a Gemini API key in `script.js` by setting `apiKey`.
- Tailwind is loaded from the CDN in `index.html`.
