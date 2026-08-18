// Cryptographically secure password generator. Uses crypto.getRandomValues(),
// never Math.random(), and never leaves the browser.

const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};
const AMBIGUOUS = /[0O1lI]/g;

const passwordOutput = document.getElementById("passwordOutput");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const lengthSlider = document.getElementById("lengthSlider");
const lengthVal = document.getElementById("lengthVal");
const optUpper = document.getElementById("optUpper");
const optLower = document.getElementById("optLower");
const optNumbers = document.getElementById("optNumbers");
const optSymbols = document.getElementById("optSymbols");
const optAmbiguous = document.getElementById("optAmbiguous");
const statusEl = document.getElementById("status");
const strengthFill = document.getElementById("strengthFill");
const strengthLabel = document.getElementById("strengthLabel");

function randomInt(maxExclusive) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % maxExclusive;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function activeCharsets() {
  const sets = [];
  if (optUpper.checked) sets.push(CHARSETS.upper);
  if (optLower.checked) sets.push(CHARSETS.lower);
  if (optNumbers.checked) sets.push(CHARSETS.numbers);
  if (optSymbols.checked) sets.push(CHARSETS.symbols);
  if (optAmbiguous.checked) return sets.map((s) => s.replace(AMBIGUOUS, ""));
  return sets;
}

function generatePassword(length, sets) {
  if (sets.length === 0) return "";
  const combined = sets.join("");
  const chars = sets.map((set) => set[randomInt(set.length)]);
  while (chars.length < length) chars.push(combined[randomInt(combined.length)]);
  return shuffle(chars).slice(0, length).join("");
}

function updateStrength(password, sets) {
  if (!password) {
    strengthFill.style.width = "0%";
    strengthLabel.textContent = "";
    return;
  }
  const poolSize = sets.join("").length;
  const bits = Math.round(password.length * Math.log2(Math.max(poolSize, 2)));
  let label, color, pct;
  if (bits < 40) { label = "Weak"; color = "#c0392b"; pct = 25; }
  else if (bits < 60) { label = "Fair"; color = "#e0a800"; pct = 50; }
  else if (bits < 80) { label = "Good"; color = "#337066"; pct = 75; }
  else { label = "Strong"; color = "#004D40"; pct = 100; }
  strengthFill.style.width = `${pct}%`;
  strengthFill.style.background = color;
  strengthLabel.textContent = `${label} (~${bits} bits of entropy)`;
}

function generate() {
  const length = parseInt(lengthSlider.value, 10);
  const sets = activeCharsets();
  if (sets.length === 0) {
    setStatus(statusEl, "Choose at least one character type.", "error");
    passwordOutput.value = "";
    updateStrength("", []);
    return;
  }
  const password = generatePassword(length, sets);
  passwordOutput.value = password;
  updateStrength(password, sets);
  clearStatus(statusEl);
}

lengthSlider.addEventListener("input", () => {
  lengthVal.textContent = lengthSlider.value;
  generate();
});

[optUpper, optLower, optNumbers, optSymbols, optAmbiguous].forEach((el) => el.addEventListener("change", generate));
generateBtn.addEventListener("click", generate);

copyBtn.addEventListener("click", async () => {
  if (!passwordOutput.value) return;
  try {
    await navigator.clipboard.writeText(passwordOutput.value);
    setStatus(statusEl, "Copied to clipboard.", "success");
  } catch (err) {
    passwordOutput.select();
    setStatus(statusEl, "Couldn't access the clipboard automatically, the password is selected, press Ctrl/Cmd+C to copy.", "error");
  }
});

generate();
