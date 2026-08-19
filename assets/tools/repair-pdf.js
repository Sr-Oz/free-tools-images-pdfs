import { PDFLib } from "/assets/tools/pdf-common.js";

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const editor = document.getElementById("editor");
const fileSummary = document.getElementById("fileSummary");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

let currentFile = null;
let currentBytes = null;

initDropzone(dropzone, fileInput, async (files) => {
  const pdf = files.find((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  if (!pdf) {
    setStatus(statusEl, "Please choose a PDF file.", "error");
    statusEl.classList.add("visible");
    return;
  }
  currentFile = pdf;
  currentBytes = new Uint8Array(await pdf.arrayBuffer());
  fileSummary.textContent = `${pdf.name} (${formatBytes(pdf.size)})`;
  editor.style.display = "block";
  clearStatus(statusEl);
});

clearBtn.addEventListener("click", () => {
  currentFile = null;
  currentBytes = null;
  editor.style.display = "none";
  fileInput.value = "";
  clearStatus(statusEl);
});

runBtn.addEventListener("click", async () => {
  if (!currentFile) return;
  runBtn.disabled = true;
  setStatus(statusEl, "Attempting repair…", "");
  statusEl.classList.add("visible");

  try {
    const doc = await PDFLib.PDFDocument.load(currentBytes.slice(), {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
      capNumbers: true,
      parseSpeed: PDFLib.ParseSpeeds.Slow,
    });

    const pageCount = doc.getPageCount();
    if (pageCount < 1) {
      setStatus(statusEl, "This file parsed, but has no pages left to recover.", "error");
      runBtn.disabled = false;
      return;
    }

    const bytes = await doc.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    triggerDownload(blob, `${stripExtension(currentFile.name)}-repaired.pdf`);
    setStatus(
      statusEl,
      `Sorted — rebuilt a clean ${pageCount}-page PDF (${formatBytes(blob.size)}). Open it to confirm everything you need is there.`,
      "success"
    );
  } catch (err) {
    console.error(err);
    setStatus(
      statusEl,
      `Couldn't recover this file: ${err.message || "unknown error"}. The damage is likely too severe for a browser-based repair.`,
      "error"
    );
  } finally {
    runBtn.disabled = false;
  }
});
