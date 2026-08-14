import { loadPdfJsDoc, extractPdfPageTexts } from "/assets/tools/pdf-common.js";

const dropzoneA = document.getElementById("dropzoneA");
const dropzoneB = document.getElementById("dropzoneB");
const fileInputA = document.getElementById("fileInputA");
const fileInputB = document.getElementById("fileInputB");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const diffView = document.getElementById("diffView");
const addedCountEl = document.getElementById("addedCount");
const removedCountEl = document.getElementById("removedCount");

let fileA = null;
let fileB = null;

const MAX_DIFF_CELLS = 4_000_000;

function updateRunEnabled() {
  runBtn.disabled = !(fileA && fileB);
}

initDropzone(dropzoneA, fileInputA, (files) => {
  const pdf = files.find((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  if (!pdf) return;
  fileA = pdf;
  labelA.textContent = pdf.name;
  updateRunEnabled();
});

initDropzone(dropzoneB, fileInputB, (files) => {
  const pdf = files.find((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  if (!pdf) return;
  fileB = pdf;
  labelB.textContent = pdf.name;
  updateRunEnabled();
});

clearBtn.addEventListener("click", () => {
  fileA = null;
  fileB = null;
  labelA.textContent = "Original PDF";
  labelB.textContent = "Revised PDF";
  fileInputA.value = "";
  fileInputB.value = "";
  resultsEl.style.display = "none";
  diffView.innerHTML = "";
  updateRunEnabled();
  clearStatus(statusEl);
});

async function extractLines(file, label) {
  setStatus(statusEl, `Extracting text from ${label}…`, "");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdfJsDoc = await loadPdfJsDoc(bytes.slice());
  const pages = await extractPdfPageTexts(pdfJsDoc);
  return pages.join("\n").split("\n").map((l) => l.trim());
}

// Classic LCS-based line diff.
function diffLines(a, b) {
  const n = a.length, m = b.length;
  if (n * m > MAX_DIFF_CELLS) return null;

  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Int32Array(m + 1);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "same", text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "removed", text: a[i] });
      i++;
    } else {
      ops.push({ type: "added", text: b[j] });
      j++;
    }
  }
  while (i < n) { ops.push({ type: "removed", text: a[i] }); i++; }
  while (j < m) { ops.push({ type: "added", text: b[j] }); j++; }
  return ops;
}

function renderDiff(ops) {
  diffView.innerHTML = "";
  let added = 0, removed = 0;
  const frag = document.createDocumentFragment();
  for (const op of ops) {
    const line = document.createElement("span");
    line.className = `diff-line ${op.type}`;
    const prefix = op.type === "added" ? "+ " : op.type === "removed" ? "- " : "  ";
    line.textContent = prefix + (op.text || " ");
    frag.appendChild(line);
    if (op.type === "added") added++;
    if (op.type === "removed") removed++;
  }
  diffView.appendChild(frag);
  addedCountEl.textContent = String(added);
  removedCountEl.textContent = String(removed);
}

runBtn.addEventListener("click", async () => {
  if (!fileA || !fileB) return;
  runBtn.disabled = true;
  resultsEl.style.display = "none";
  setStatus(statusEl, "Comparing…", "");
  statusEl.classList.add("visible");

  try {
    const linesA = await extractLines(fileA, "the original PDF");
    const linesB = await extractLines(fileB, "the revised PDF");

    setStatus(statusEl, "Computing differences…", "");
    const ops = diffLines(linesA, linesB);

    if (!ops) {
      setStatus(statusEl, `These documents are too large for a detailed line-by-line comparison in the browser (${linesA.length} vs ${linesB.length} lines). Try Extract PDF Text on each and compare a specific section instead.`, "error");
      statusEl.classList.add("visible");
      return;
    }

    renderDiff(ops);
    resultsEl.style.display = "block";
    setStatus(statusEl, "Sorted!", "success");
  } catch (err) {
    console.error(err);
    setStatus(statusEl, `Something went wrong: ${err.message || "unknown error"}`, "error");
  } finally {
    runBtn.disabled = false;
  }
});
