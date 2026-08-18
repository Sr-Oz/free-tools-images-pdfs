# FairGo PDF

No worries, PDF tools done right. Free, no-signup, privacy-first browser tools for common image and
PDF tasks — compress, convert, resize, merge, split, and more.

**Your files never leave your browser.** Every tool runs entirely as client-side JavaScript. There
is no backend, no upload, and no server that ever sees your files — you could disconnect from the
internet after the page loads and every tool would still work. No account, no email gate, no
watermarked output.

## Live site

https://sr-oz.github.io/free-tools-images-pdfs/

## Tools (v1)

### Image tools
| Tool | URL | What it does |
|---|---|---|
| Compress Image | `/compress-image/` | Reduce JPEG/PNG/WebP file size with a quality slider |
| Convert Image Format | `/convert-image/` | Convert between PNG, JPG, WebP, GIF, BMP and SVG |
| Resize Image | `/resize-image/` | Resize by exact pixel dimensions or by percentage |
| Crop & Rotate Image | `/crop-rotate-image/` | Rotate, flip, and drag-to-crop |
| Add Border to Image | `/add-border-to-image/` | Add a solid colour frame around one or more images |
| Image Color Filters | `/image-color-filters/` | Grayscale, sepia, brightness, contrast and saturation |
| Round Corners / Circle Crop | `/round-corners-image/` | Round an image's corners or crop it to a circle |
| Watermark Image | `/watermark-image/` | Stamp custom text across one or more images |
| Social Media Cropper | `/social-media-cropper/` | Crop to exact Instagram/X/YouTube/LinkedIn/Facebook sizes |

### PDF tools
| Tool | URL | What it does |
|---|---|---|
| Merge PDF | `/merge-pdf/` | Combine multiple PDFs into one, in any order |
| Split PDF | `/split-pdf/` | Extract selected pages or a page range |
| Compress PDF | `/compress-pdf/` | Reduce PDF file size (quick clean or strong/rasterized) |
| Images to PDF | `/images-to-pdf/` | Combine JPG/PNG images into a single PDF |
| PDF to Images | `/pdf-to-images/` | Export every page as a PNG or JPG |
| Organise PDF Pages | `/organize-pdf/` | Rotate, delete and reorder pages |
| Extract PDF Text | `/extract-pdf-text/` | Pull all text out of a PDF to copy or download as .txt |
| Convert to Markdown | `/convert-to-markdown/` | Convert a PDF, Word (.docx) or HTML file to Markdown |
| Edit PDF Metadata | `/pdf-metadata/` | View and change title, author, subject and keywords |
| Add Page Numbers | `/add-page-numbers/` | Stamp page numbers in any position and format |
| Watermark PDF | `/watermark-pdf/` | Add a custom text watermark across every page |
| Resize PDF Pages | `/resize-pdf-pages/` | Scale every page to A4, Letter or Legal size |
| Crop PDF Pages | `/crop-pdf/` | Trim margins or unwanted edges from every page |
| Compare PDFs | `/compare-pdfs/` | Diff the text of two PDF versions line by line |
| Fill PDF Form | `/fill-pdf-form/` | Fill text fields, checkboxes and dropdowns on a PDF form |
| Sign PDF | `/sign-pdf/` | Draw or type a signature and place it on any page |

### Coming soon (v2 backlog)
- OCR (make scanned PDFs searchable)
- Cryptographically verified e-signatures
- PDF to Word / Word to PDF
- Password protect / unlock PDF
- PDF to Excel

These need either much heavier client-side models (OCR) or genuinely require server-side
processing (format conversion beyond what browsers support natively) — they're out of scope for
v1 on purpose. If you want to tackle one, see [Contributing](CONTRIBUTING.md).

### Other pages
- [Blog](/blog/) — how-to guides for the tools above
- [FAQ](/faq/) — common questions about privacy, cost, file limits and browser support
- [Support](/support/) — optional one-off or recurring support via Stripe. **The Stripe Payment Link
  URLs on this page are placeholders (`href="#"`)** — create real ones in your Stripe Dashboard
  (Payment Links → New, no backend required) and swap them into `support/index.html` before this
  page goes live.
- [Privacy Policy](/privacy-policy/) — what data is (and isn't) collected

## Tech stack

Plain HTML, CSS and vanilla JavaScript — **no build step, no framework, no bundler.** Each tool is
a static page that uses two well-maintained open-source libraries, self-hosted under
`assets/vendor/` (not loaded from a CDN — browsers block cross-origin `Worker` construction, which
`pdf.js` needs, and self-hosting also means these tools keep working even if a third-party CDN is
ever down):

- [`pdf-lib`](https://pdf-lib.js.org/) — creating/editing PDFs (merge, split, rotate, compress, images→PDF)
- [`pdf.js`](https://mozilla.github.io/pdf.js/) — rendering PDF pages to canvas (thumbnails, PDF→images)
- [`mammoth.js`](https://github.com/mwilliamson/mammoth.js) — converting Word (.docx) to HTML (Convert to Markdown)
- [`turndown`](https://github.com/mixmark-io/turndown) — converting HTML to Markdown (Convert to Markdown)
- Native Canvas API — all image compression/conversion/resize/crop/rotate

This keeps the site trivially deployable to any static host, with nothing to compile and no
`node_modules` required to run it locally.

## Running locally

Because a couple of tools load ES modules and fetch worker scripts, open the site through a local
web server rather than double-clicking `index.html` (browsers restrict module loading from
`file://`). Any static file server works, for example:

```bash
npx serve .
# or
python -m http.server 8000
```

Then open the printed local URL (e.g. `http://localhost:3000` or `http://localhost:8000`).

## Project structure

```
/
├── index.html              # Homepage listing all tools
├── faq/index.html           # FAQ
├── privacy-policy/index.html # Privacy policy
├── 404.html
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── style.css            # Shared styles (light + dark)
│   ├── tools.js              # Shared helpers (dropzone, downloads, formatting)
│   ├── img/og-image.png       # Social share image
│   ├── vendor/                 # Self-hosted pdf-lib / pdf.js (see Tech stack)
│   └── tools/                 # Per-tool logic, one file per tool
│       ├── pdf-common.js       # Shared pdf-lib / pdf.js loader + helpers
│       ├── compress-image.js
│       ├── merge-pdf.js
│       └── ...
├── compress-image/index.html   # Each tool lives at its own clean URL
├── merge-pdf/index.html
├── ...
└── .github/workflows/deploy.yml
```

Each tool page is self-contained: its own `index.html` plus one JS file in `assets/tools/`, sharing
the common CSS and helper functions.

## Deploying to GitHub Pages

This is a static site, so there's no build step:

1. In your repo, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (the included workflow at
   `.github/workflows/deploy.yml` handles the rest), or set **Source** to **Deploy from a branch**
   and pick `main` / `(root)` if you'd rather not use Actions.
3. Push to `main` — the site will be live at `https://<username>.github.io/<repo>/` within a
   couple of minutes.

To use a custom domain later, add a `CNAME` file at the repo root containing your domain, and add
the DNS records GitHub Pages documents for apex or subdomain setups.

## Contributing

Bug reports, new tools, and improvements are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
