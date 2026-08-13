(() => {
  const el = document.getElementById("terminalLines");
  if (!el) return;

  const lines = [
    "$ initializing session...",
    "$ no server connection detected",
    "$ status: 100% client-side processing",
    "$ files never leave this device"
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    el.textContent = lines.join("\n");
    return;
  }

  let lineIndex = 0;
  let charIndex = 0;
  let current = "";

  function typeStep() {
    if (lineIndex >= lines.length) {
      el.innerHTML = lines.join("\n") + '<span class="cursor">▋</span>';
      return;
    }
    const line = lines[lineIndex];
    if (charIndex <= line.length) {
      current = lines.slice(0, lineIndex).join("\n") + (lineIndex > 0 ? "\n" : "") + line.slice(0, charIndex);
      el.innerHTML = current + '<span class="cursor">▋</span>';
      charIndex++;
      setTimeout(typeStep, 22 + Math.random() * 30);
    } else {
      lineIndex++;
      charIndex = 0;
      setTimeout(typeStep, 320);
    }
  }

  let started = false;
  function start() {
    if (started) return;
    started = true;
    typeStep();
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        start();
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(el);
  }

  // Fallback in case IntersectionObserver never fires (e.g. unusual viewport/embed contexts).
  setTimeout(start, 3000);
})();
