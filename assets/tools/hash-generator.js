const hashText = document.getElementById("hashText");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileNameLabel = document.getElementById("fileNameLabel");
const results = document.getElementById("results");
const statusEl = document.getElementById("status");

const sha1Out = document.getElementById("sha1Out");
const sha256Out = document.getElementById("sha256Out");
const sha384Out = document.getElementById("sha384Out");
const sha512Out = document.getElementById("sha512Out");

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function computeAndShow(bytes) {
  setStatus(statusEl, "Hashing…", "");
  const algos = [["SHA-1", sha1Out], ["SHA-256", sha256Out], ["SHA-384", sha384Out], ["SHA-512", sha512Out]];
  for (const [algo, out] of algos) {
    const digest = await crypto.subtle.digest(algo, bytes);
    out.value = bytesToHex(digest);
  }
  results.style.display = "block";
  clearStatus(statusEl);
}

let debounceTimer = null;
hashText.addEventListener("input", () => {
  fileInput.value = "";
  fileNameLabel.textContent = "No file selected";
  clearTimeout(debounceTimer);
  const text = hashText.value;
  if (!text) {
    results.style.display = "none";
    clearStatus(statusEl);
    return;
  }
  debounceTimer = setTimeout(() => {
    computeAndShow(new TextEncoder().encode(text));
  }, 150);
});

initDropzone(dropzone, fileInput, async (files) => {
  const file = files[0];
  if (!file) return;
  hashText.value = "";
  fileNameLabel.textContent = `${file.name} (${formatBytes(file.size)})`;
  try {
    const bytes = await file.arrayBuffer();
    await computeAndShow(bytes);
  } catch (err) {
    console.error(err);
    setStatus(statusEl, `Could not read that file: ${err.message || "unknown error"}`, "error");
  }
});

document.querySelectorAll(".copy-hash-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target.value) return;
    try {
      await navigator.clipboard.writeText(target.value);
      setStatus(statusEl, "Copied to clipboard.", "success");
    } catch (err) {
      target.select();
      setStatus(statusEl, "Couldn't access the clipboard automatically, the text is selected, press Ctrl/Cmd+C to copy.", "error");
    }
  });
});
