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
  update();
  clearStatus(statusEl);
});

update();
