const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileListEl = document.getElementById("fileList");
const controls = document.getElementById("controls");
const actionsRow = document.getElementById("actionsRow");
const layoutSelect = document.getElementById("layout");
const columnsField = document.getElementById("columnsField");
const columnsInput = document.getElementById("columns");
const targetSizeLabel = document.getElementById("targetSizeLabel");
const targetSizeInput = document.getElementById("targetSize");
const gapInput = document.getElementById("gap");
const bgColorInput = document.getElementById("bgColor");
const formatSelect = document.getElementById("format");
const qualityField = document.getElementById("qualityField");
const qualityInput = document.getElementById("quality");
const qualityVal = document.getElementById("qualityVal");
const runBtn = document.getElementById("runBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

let files = [];
let columnsTouched = false;

function renderFileList() {
  fileListEl.innerHTML = "";
  files.forEach((f, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="name">${i + 1}. ${f.name}</span><span class="meta">${formatBytes(f.size)}</span>`;

    const upBtn = document.createElement("button");
    upBtn.className = "remove";
    upBtn.textContent = "↑";
    upBtn.disabled = i === 0;
    upBtn.addEventListener("click", () => { [files[i - 1], files[i]] = [files[i], files[i - 1]]; renderFileList(); });

    const downBtn = document.createElement("button");
    downBtn.className = "remove";
    downBtn.textContent = "↓";
    downBtn.disabled = i === files.length - 1;
    downBtn.addEventListener("click", () => { [files[i + 1], files[i]] = [files[i], files[i + 1]]; renderFileList(); });

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => { files.splice(i, 1); renderFileList(); });

    li.appendChild(upBtn);
    li.appendChild(downBtn);
    li.appendChild(removeBtn);
    fileListEl.appendChild(li);
  });

  if (!columnsTouched) columnsInput.value = String(Math.max(1, Math.ceil(Math.sqrt(files.length || 1))));

  const hasFiles = files.length >= 2;
  controls.style.display = files.length ? "block" : "none";
  actionsRow.style.display = files.length ? "flex" : "none";
  runBtn.disabled = !hasFiles;
  clearStatus(statusEl);
}

initDropzone(dropzone, fileInput, (newFiles) => {
  const images = newFiles.filter((f) => f.type.startsWith("image/"));
  if (images.length !== newFiles.length) {
    setStatus(statusEl, "Only image files are supported.", "error");
    statusEl.classList.add("visible");
  }
  files = files.concat(images);
  renderFileList();
});

columnsInput.addEventListener("input", () => { columnsTouched = true; });

function updateLayoutFields() {
  const layout = layoutSelect.value;
  columnsField.style.display = layout === "grid" ? "flex" : "none";
  targetSizeLabel.textContent = layout === "grid" ? "Cell size (px)" : layout === "row" ? "Height (px)" : "Width (px)";
}
layoutSelect.addEventListener("change", updateLayoutFields);
updateLayoutFields();

formatSelect.addEventListener("change", () => {
  qualityField.style.display = formatSelect.value === "image/jpeg" ? "flex" : "none";
});
qualityInput.addEventListener("input", () => { qualityVal.textContent = qualityInput.value; });

clearBtn.addEventListener("click", () => {
  files = [];
  columnsTouched = false;
  renderFileList();
});

async function buildGrid(images, columns, cellSize, gap, bgColor) {
  const rows = Math.ceil(images.length / columns);
  const width = columns * cellSize + (columns + 1) * gap;
  const height = rows * cellSize + (rows + 1) * gap;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  images.forEach((img, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = gap + col * (cellSize + gap);
    const y = gap + row * (cellSize + gap);

    const scale = Math.max(cellSize / img.width, cellSize / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const srcCropW = cellSize / scale;
    const srcCropH = cellSize / scale;
    const srcX = (img.width - srcCropW) / 2;
    const srcY = (img.height - srcCropH) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cellSize, cellSize);
    ctx.clip();
    ctx.drawImage(img, srcX, srcY, srcCropW, srcCropH, x, y, cellSize, cellSize);
    ctx.restore();
  });

  return canvas;
}

async function buildStrip(images, targetSize, gap, bgColor, vertical) {
  const scaledSizes = images.map((img) => {
    if (vertical) {
      const h = targetSize * (img.height / img.width);
      return { w: targetSize, h };
    }
    const w = targetSize * (img.width / img.height);
    return { w, h: targetSize };
  });

  let width, height;
  if (vertical) {
    width = targetSize + 2 * gap;
    height = scaledSizes.reduce((sum, s) => sum + s.h, 0) + gap * (images.length + 1);
  } else {
    height = targetSize + 2 * gap;
    width = scaledSizes.reduce((sum, s) => sum + s.w, 0) + gap * (images.length + 1);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let cursor = gap;
  images.forEach((img, i) => {
    const s = scaledSizes[i];
    if (vertical) {
      ctx.drawImage(img, gap, cursor, s.w, s.h);
      cursor += s.h + gap;
    } else {
      ctx.drawImage(img, cursor, gap, s.w, s.h);
      cursor += s.w + gap;
    }
  });

  return canvas;
}

runBtn.addEventListener("click", async () => {
  if (files.length < 2) return;
  runBtn.disabled = true;
  setStatus(statusEl, "Loading photos…", "");
  statusEl.classList.add("visible");

  try {
    const images = [];
    for (let i = 0; i < files.length; i++) {
      setStatus(statusEl, `Loading photo ${i + 1} of ${files.length}…`, "");
      const dataUrl = await readFileAsDataURL(files[i]);
      images.push(await loadImage(dataUrl));
    }

    setStatus(statusEl, "Building collage…", "");
    const layout = layoutSelect.value;
    const targetSize = Number(targetSizeInput.value) || 300;
    const gap = Number(gapInput.value) || 0;
    const bgColor = bgColorInput.value;

    let canvas;
    if (layout === "grid") {
      const columns = Math.max(1, Number(columnsInput.value) || 1);
      canvas = await buildGrid(images, columns, targetSize, gap, bgColor);
    } else {
      canvas = await buildStrip(images, targetSize, gap, bgColor, layout === "column");
    }

    const format = formatSelect.value;
    const quality = format === "image/jpeg" ? Number(qualityInput.value) / 100 : undefined;
    const blob = await canvasToBlob(canvas, format, quality);
    triggerDownload(blob, `collage.${extForMime(format)}`);
    setStatus(statusEl, `Sorted — created a ${canvas.width}×${canvas.height} collage (${formatBytes(blob.size)}).`, "success");
  } catch (err) {
    console.error(err);
    setStatus(statusEl, `Something went wrong: ${err.message || "unknown error"}`, "error");
  } finally {
    runBtn.disabled = false;
  }
});
