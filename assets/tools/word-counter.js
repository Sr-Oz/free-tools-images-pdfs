import { loadPdfJsDoc, extractPdfPageTexts } from "/assets/tools/pdf-common.js";

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const counterText = document.getElementById("counterText");
const wordCount = document.getElementById("wordCount");
const charCount = document.getElementById("charCount");
const charNoSpaceCount = document.getElementById("charNoSpaceCount");
const sentenceCount = document.getElementById("sentenceCount");
const paragraphCount = document.getElementById("paragraphCount");
const readingTime = document.getElementById("readingTime");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

const WORDS_PER_MINUTE = 200;

function update() {
  const text = counterText.value;

  const words = text.trim() === "" ? [] : text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  wordCount.textContent = words.length;
  charCount.textContent = text.length;
  charNoSpaceCount.textContent = text.replace(/\s/g, "").length;
  sentenceCount.textContent = sentences.length;
  paragraphCount.textContent = paragraphs.length;

  const minutes = words.length / WORDS_PER_MINUTE;
  readingTime.textContent = words.length === 0 ? "0 min" : minutes < 1 ? "< 1 min" : `${Math.ceil(minutes)} min`;
}

counterText.addEventListener("input", update);

clearBtn.addEventListener("click", () => {
  counterText.value = "";
  fileInput.value = "";
  update();
  clearStatus(statusEl);
});

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdfJsDoc = await loadPdfJsDoc(bytes.slice());
    const pages = await extractPdfPageTexts(pdfJsDoc, (i, total) => {
      setStatus(statusEl, `Reading page ${i} of ${total}…`, "");
    });
    return pages.join("\n\n");
  }
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer });
    const div = document.createElement("div");
    div.innerHTML = result.value;
    // textContent on a detached tree ignores block boundaries, join blocks
    // ourselves so paragraphs don't run together with no space between them.
    const blocks = Array.from(div.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li"));
    if (blocks.length > 0) return blocks.map((el) => el.textContent).join("\n\n");
    return div.textContent || "";
  }
  return file.text();
}

initDropzone(dropzone, fileInput, async (files) => {
  const file = files[0];
  if (!file) return;
  try {
    setStatus(statusEl, "Reading file…", "");
    const text = await extractTextFromFile(file);
    counterText.value = text;
    update();
    setStatus(statusEl, `Sorted, loaded text from ${file.name}.`, "success");
  } catch (err) {
    console.error(err);
    setStatus(statusEl, `Could not read that file: ${err.message || "unknown error"}`, "error");
  }
});

update();
