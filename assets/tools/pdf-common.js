// Shared PDF helpers, loaded as an ES module. Wraps pdf-lib (editing) and
// pdf.js (rendering) from a CDN — both run entirely client-side, no server calls
// beyond fetching the library code itself.

// Self-hosted rather than loaded from a CDN: browsers refuse to construct a Worker
// from a cross-origin script URL (SecurityError), which pdf.js needs for rendering.
// Same-origin files also mean these tools keep working even if a third-party CDN is down.
export * as PDFLib from "/assets/vendor/pdf-lib.esm.min.js";
import * as pdfjsLib from "/assets/vendor/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdf.worker.min.mjs";

export { pdfjsLib };

export async function loadPdfJsDoc(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  return loadingTask.promise;
}

export async function renderPageThumbCanvas(pdfJsDoc, pageNumber, maxWidth = 220) {
  const page = await pdfJsDoc.getPage(pageNumber);
  const viewport1 = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport1.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export async function renderPageToCanvasAtScale(pdfJsDoc, pageNumber, scale) {
  const page = await pdfJsDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export function parsePageRanges(input, pageCount) {
  const result = new Set();
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let start = parseInt(m[1], 10);
      let end = parseInt(m[2], 10);
      if (start > end) [start, end] = [end, start];
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= pageCount) result.add(i);
      }
    } else if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n >= 1 && n <= pageCount) result.add(n);
    }
  }
  return Array.from(result).sort((a, b) => a - b);
}
