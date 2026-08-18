const caseText = document.getElementById("caseText");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

function splitWords(text) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter(Boolean);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const converters = {
  upper: (t) => t.toUpperCase(),
  lower: (t) => t.toLowerCase(),
  title: (t) => splitWords(t).map(capitalize).join(" "),
  sentence: (t) => t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase()),
  camel: (t) => {
    const words = splitWords(t).map((w) => w.toLowerCase());
    return words.map((w, i) => (i === 0 ? w : capitalize(w))).join("");
  },
  pascal: (t) => splitWords(t).map(capitalize).join(""),
  snake: (t) => splitWords(t).map((w) => w.toLowerCase()).join("_"),
  kebab: (t) => splitWords(t).map((w) => w.toLowerCase()).join("-"),
};

document.querySelectorAll(".case-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!caseText.value.trim()) {
      setStatus(statusEl, "Type or paste some text first.", "error");
      return;
    }
    caseText.value = converters[btn.dataset.case](caseText.value);
    clearStatus(statusEl);
  });
});

copyBtn.addEventListener("click", async () => {
  if (!caseText.value) {
    setStatus(statusEl, "Nothing to copy yet.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(caseText.value);
    setStatus(statusEl, "Copied to clipboard.", "success");
  } catch (err) {
    caseText.select();
    setStatus(statusEl, "Couldn't access the clipboard automatically, the text is selected, press Ctrl/Cmd+C to copy.", "error");
  }
});

clearBtn.addEventListener("click", () => {
  caseText.value = "";
  clearStatus(statusEl);
});
