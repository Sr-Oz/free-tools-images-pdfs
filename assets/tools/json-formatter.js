const jsonInput = document.getElementById("jsonInput");
const indentSize = document.getElementById("indentSize");
const formatBtn = document.getElementById("formatBtn");
const minifyBtn = document.getElementById("minifyBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

function currentIndent() {
  const v = indentSize.value;
  return v === "tab" ? "\t" : Number(v);
}

function describeError(text, err) {
  const match = /position (\d+)/.exec(err.message);
  if (!match) return err.message;
  const pos = Number(match[1]);
  const before = text.slice(0, pos);
  const line = (before.match(/\n/g) || []).length + 1;
  const col = pos - before.lastIndexOf("\n");
  return `${err.message} (line ${line}, column ${col})`;
}

function parseOrError() {
  const text = jsonInput.value;
  if (!text.trim()) {
    setStatus(statusEl, "Paste some JSON first.", "error");
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    setStatus(statusEl, `Invalid JSON: ${describeError(text, err)}`, "error");
    return null;
  }
}

formatBtn.addEventListener("click", () => {
  const parsed = parseOrError();
  if (parsed === null) return;
  jsonInput.value = JSON.stringify(parsed, null, currentIndent());
  setStatus(statusEl, "Sorted, valid JSON, formatted.", "success");
});

minifyBtn.addEventListener("click", () => {
  const parsed = parseOrError();
  if (parsed === null) return;
  jsonInput.value = JSON.stringify(parsed);
  setStatus(statusEl, "Sorted, valid JSON, minified.", "success");
});

copyBtn.addEventListener("click", async () => {
  if (!jsonInput.value) {
    setStatus(statusEl, "Nothing to copy yet.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(jsonInput.value);
    setStatus(statusEl, "Copied to clipboard.", "success");
  } catch (err) {
    jsonInput.select();
    setStatus(statusEl, "Couldn't access the clipboard automatically, the text is selected, press Ctrl/Cmd+C to copy.", "error");
  }
});

clearBtn.addEventListener("click", () => {
  jsonInput.value = "";
  clearStatus(statusEl);
});
