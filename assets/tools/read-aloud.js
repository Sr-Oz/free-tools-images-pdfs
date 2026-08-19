import { loadPdfJsDoc, extractPdfPageTexts } from "/assets/tools/pdf-common.js";

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const sourceText = document.getElementById("sourceText");
const voiceSelect = document.getElementById("voiceSelect");
const rateInput = document.getElementById("rateInput");
const rateVal = document.getElementById("rateVal");
const pitchInput = document.getElementById("pitchInput");
const pitchVal = document.getElementById("pitchVal");
const volumeInput = document.getElementById("volumeInput");
const volumeVal = document.getElementById("volumeVal");
const readingView = document.getElementById("readingView");
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

const MAX_CHUNK_LEN = 200;
const supported = "speechSynthesis" in window;

let voices = [];
let wordSpans = []; // { start, end, el }
let chunks = []; // { text, start }
let chunkIndex = 0;
let activeSpan = null;
let isPaused = false;
let isPlaying = false;

if (!supported) {
  setStatus(statusEl, "Your browser doesn't support the Web Speech API, so this tool can't read text aloud here. Try a recent Chrome, Edge or Safari.", "error");
  statusEl.classList.add("visible");
  playBtn.disabled = true;
}

function populateVoices() {
  voices = window.speechSynthesis.getVoices();
  const prevValue = voiceSelect.value;
  voiceSelect.innerHTML = "";
  voices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `${v.name} (${v.lang})${v.default ? " — default" : ""}`;
    voiceSelect.appendChild(opt);
  });
  if (prevValue && voices[Number(prevValue)]) {
    voiceSelect.value = prevValue;
  } else {
    const enIndex = voices.findIndex((v) => v.lang && v.lang.startsWith("en"));
    voiceSelect.value = String(enIndex >= 0 ? enIndex : 0);
  }
}

if (supported) {
  populateVoices();
  window.speechSynthesis.addEventListener("voiceschanged", populateVoices);
}

rateInput.addEventListener("input", () => { rateVal.textContent = Number(rateInput.value).toFixed(1); });
pitchInput.addEventListener("input", () => { pitchVal.textContent = Number(pitchInput.value).toFixed(1); });
volumeInput.addEventListener("input", () => { volumeVal.textContent = Math.round(Number(volumeInput.value) * 100); });

function splitIntoChunks(text, maxLen) {
  const result = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + maxLen, text.length);
    if (end < text.length) {
      let breakAt = -1;
      for (let j = end; j > i; j--) {
        if (/[.!?]/.test(text[j - 1]) && /\s/.test(text[j] || "")) { breakAt = j; break; }
        if (text[j] === "\n") { breakAt = j; break; }
      }
      if (breakAt === -1) {
        for (let j = end; j > i; j--) {
          if (/\s/.test(text[j])) { breakAt = j; break; }
        }
      }
      if (breakAt !== -1 && breakAt > i) end = breakAt;
    }
    result.push({ text: text.slice(i, end), start: i });
    i = end;
  }
  return result;
}

function buildReadingView(text) {
  readingView.innerHTML = "";
  wordSpans = [];
  const re = /\S+/g;
  let match;
  let lastEnd = 0;
  const frag = document.createDocumentFragment();
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastEnd) {
      frag.appendChild(document.createTextNode(text.slice(lastEnd, match.index)));
    }
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = match[0];
    frag.appendChild(span);
    wordSpans.push({ start: match.index, end: match.index + match[0].length, el: span });
    lastEnd = match.index + match[0].length;
  }
  if (lastEnd < text.length) frag.appendChild(document.createTextNode(text.slice(lastEnd)));
  readingView.appendChild(frag);
}

function findWordSpan(globalIndex) {
  let lo = 0, hi = wordSpans.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const w = wordSpans[mid];
    if (globalIndex < w.start) hi = mid - 1;
    else if (globalIndex >= w.end) lo = mid + 1;
    else return w;
  }
  return null;
}

function highlightAt(globalIndex) {
  const w = findWordSpan(globalIndex);
  if (!w || w.el === activeSpan) return;
  if (activeSpan) activeSpan.classList.remove("active");
  w.el.classList.add("active");
  activeSpan = w.el;
  w.el.scrollIntoView({ block: "center", behavior: "smooth" });
}

function clearHighlight() {
  if (activeSpan) activeSpan.classList.remove("active");
  activeSpan = null;
}

function setPlaybackState(playing, paused) {
  isPlaying = playing;
  isPaused = paused;
  playBtn.disabled = playing && !paused ? true : false;
  playBtn.innerHTML = paused
    ? '<span class="material-symbols-outlined" aria-hidden="true" style="vertical-align:middle;">play_arrow</span> Resume'
    : '<span class="material-symbols-outlined" aria-hidden="true" style="vertical-align:middle;">play_arrow</span> Play';
  pauseBtn.disabled = !playing || paused;
  stopBtn.disabled = !playing;
}

function speakChunk(i) {
  if (i >= chunks.length) {
    setPlaybackState(false, false);
    clearHighlight();
    setStatus(statusEl, "Sorted, finished reading.", "success");
    return;
  }
  chunkIndex = i;
  const chunk = chunks[i];
  const utterance = new SpeechSynthesisUtterance(chunk.text);
  const voice = voices[Number(voiceSelect.value)];
  if (voice) utterance.voice = voice;
  utterance.rate = Number(rateInput.value);
  utterance.pitch = Number(pitchInput.value);
  utterance.volume = Number(volumeInput.value);

  utterance.onboundary = (e) => {
    if (typeof e.charIndex === "number") highlightAt(chunk.start + e.charIndex);
  };
  utterance.onend = () => {
    if (!isPlaying) return; // stopped
    speakChunk(i + 1);
  };
  utterance.onerror = (e) => {
    if (e.error === "canceled" || e.error === "interrupted") return;
    console.error(e);
    setStatus(statusEl, `Speech error: ${e.error || "unknown"}`, "error");
    setPlaybackState(false, false);
  };

  window.speechSynthesis.speak(utterance);
}

function startReading() {
  const text = sourceText.value.trim();
  if (!text) {
    setStatus(statusEl, "Add some text first, type, paste, or drop a file.", "error");
    statusEl.classList.add("visible");
    return;
  }
  window.speechSynthesis.cancel();
  buildReadingView(sourceText.value);
  chunks = splitIntoChunks(sourceText.value, MAX_CHUNK_LEN);
  setPlaybackState(true, false);
  clearStatus(statusEl);
  speakChunk(0);
}

playBtn.addEventListener("click", () => {
  if (!supported) return;
  if (isPaused) {
    window.speechSynthesis.resume();
    setPlaybackState(true, false);
    return;
  }
  startReading();
});

pauseBtn.addEventListener("click", () => {
  if (!supported || !isPlaying || isPaused) return;
  window.speechSynthesis.pause();
  setPlaybackState(true, true);
});

stopBtn.addEventListener("click", () => {
  if (!supported) return;
  isPlaying = false;
  window.speechSynthesis.cancel();
  setPlaybackState(false, false);
  clearHighlight();
  clearStatus(statusEl);
});

clearBtn.addEventListener("click", () => {
  if (supported) {
    isPlaying = false;
    window.speechSynthesis.cancel();
  }
  sourceText.value = "";
  fileInput.value = "";
  readingView.innerHTML = "";
  wordSpans = [];
  setPlaybackState(false, false);
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
    statusEl.classList.add("visible");
    const text = await extractTextFromFile(file);
    sourceText.value = text;
    setStatus(statusEl, `Sorted — loaded text from ${file.name}.`, "success");
  } catch (err) {
    console.error(err);
    setStatus(statusEl, `Could not read that file: ${err.message || "unknown error"}`, "error");
  }
});
