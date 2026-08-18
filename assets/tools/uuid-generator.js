const quantityInput = document.getElementById("quantity");
const uppercaseInput = document.getElementById("uppercase");
const noHyphensInput = document.getElementById("noHyphens");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");

function generate() {
  const count = Math.min(1000, Math.max(1, Number(quantityInput.value) || 1));
  const ids = [];
  for (let i = 0; i < count; i++) {
    let id = crypto.randomUUID();
    if (noHyphensInput.checked) id = id.replace(/-/g, "");
    if (uppercaseInput.checked) id = id.toUpperCase();
    ids.push(id);
  }
  output.value = ids.join("\n");
  setStatus(statusEl, `Sorted, generated ${count} UUID${count > 1 ? "s" : ""}.`, "success");
}

generateBtn.addEventListener("click", generate);

copyBtn.addEventListener("click", async () => {
  if (!output.value) {
    setStatus(statusEl, "Generate some UUIDs first.", "error");
    return;
  }
  try {
    await navigator.clipboard.writeText(output.value);
    setStatus(statusEl, "Copied to clipboard.", "success");
  } catch (err) {
    output.select();
    setStatus(statusEl, "Couldn't access the clipboard automatically, the text is selected, press Ctrl/Cmd+C to copy.", "error");
  }
});

generate();
