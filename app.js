const $ = (id) => document.getElementById(id);

const FIXED_CARDS = [
  { type: "cover", label: "封面图", fixedTitle: "封面图", fileName: "asta-one-01-cover.png" },
  { type: "first_impression", label: "第一印象", fixedTitle: "第一印象", fileName: "asta-one-02-first-impression.png" },
  { type: "why_stay", label: "为什么想停留", fixedTitle: "为什么想停留", fileName: "asta-one-03-why-stay.png" },
  { type: "how_to_experience", label: "建议这样逛", fixedTitle: "建议这样逛", fileName: "asta-one-04-how-to-experience.png" },
  { type: "what_is_good", label: "它好在哪里", fixedTitle: "它好在哪里", fileName: "asta-one-05-what-is-good.png" },
  { type: "suitable_for", label: "适合谁来", fixedTitle: "适合谁来", fileName: "asta-one-06-suitable-for.png" },
];

const BODY_FIELDS = [
  ["firstImpressionText", 1],
  ["stayReasonText", 2],
  ["experienceGuideText", 3],
  ["goodPointText", 4],
  ["suitablePeopleText", 5],
];

const FOOTER_LABELS = [
  "城市生活方式观察",
  "松弛体验指南",
  "文化活动体验",
  "空间与品牌观察",
  "乡野生活方式观察",
  "微度假目的地观察",
];

const DEFAULT_BODIES = ["", "", "", "", "", ""];

const LEGACY_TEMPLATE_BODY_HASHES = new Set([4170533815, 2631844802, 2976450300, 2871188387, 207186632, 1211142902]);

const BODY_PLACEHOLDERS = {
  first_impression: "请填写这个地方给你的第一印象，例如空间气质、第一眼看到的场景、进入后的感受。",
  why_stay: "请填写让人愿意停下来的具体原因，例如座位、光线、动线、气味、人群或节奏。",
  how_to_experience: "请填写具体体验方法，例如什么时间去、从哪里开始、哪里适合停留。",
  what_is_good: "请填写你对这个地方的判断，例如它真正打动人的地方和为什么值得被记住。",
  suitable_for: "请填写适合什么样的人、心情、关系和场景。",
};

const EMPTY_BODY_PREVIEW = "正文待填写";

let state = {
  activeStep: "project",
  selectedIndex: 0,
  coverTitle: "",
  coverSubtitle: "",
  projectName: "",
  city: "",
  tags: "",
  footerLabel: "城市生活方式观察",
  coverOverlayType: "gradient",
  coverOverlayOpacity: 0.35,
  coverGradientDirection: "bottom",
  slides: createDefaultSlides(),
};

function createDefaultSlides() {
  return FIXED_CARDS.map((card, index) => ({
    id: `slide-${index + 1}`,
    step: index + 1,
    type: card.type,
    label: card.label,
    fixedTitle: card.fixedTitle,
    title: index === 0 ? "一个地方真正迷人的地方" : card.fixedTitle,
    subtitle: "",
    body: DEFAULT_BODIES[index],
    imageDataUrl: "",
    imageName: "",
    imagePositionX: 50,
    imagePositionY: 50,
    backgroundColor: index % 2 ? "#FFFFFF" : "#F7F4EF",
  }));
}

function normalizeSlides(slides) {
  const defaults = createDefaultSlides();
  return defaults.map((base, index) => {
    const slide = {
      ...base,
      ...(slides?.[index] || {}),
      step: index + 1,
      type: base.type,
      label: base.label,
      fixedTitle: base.fixedTitle,
      title: index === 0 ? slides?.[index]?.title || base.title : base.fixedTitle,
    };
    if (index > 0 && LEGACY_TEMPLATE_BODY_HASHES.has(stableTextHash(slide.body))) {
      slide.body = "";
    }
    return slide;
  });
}

function stableTextHash(text) {
  let hash = 0;
  for (const char of String(text || "").trim()) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return hash;
}

function saveState() {
  try {
    localStorage.setItem("asta-one-studio-v2", JSON.stringify(state));
    $("saveStatus").textContent = "已本地保存";
  } catch {
    $("saveStatus").textContent = "图片较大，当前内容未完整保存";
  }
}

function restoreState() {
  const saved = localStorage.getItem("asta-one-studio-v2");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed, slides: normalizeSlides(parsed.slides) };
    } catch {
      localStorage.removeItem("asta-one-studio-v2");
    }
  }
  hydrateFields();
}

function hydrateFields() {
  setValue("coverTitle", state.coverTitle || state.slides[0].title);
  setValue("coverSubtitle", state.coverSubtitle || state.slides[0].subtitle);
  setValue("projectName", state.projectName);
  setValue("city", state.city);
  setValue("tags", state.tags);
  setValue("footerLabel", state.footerLabel || FOOTER_LABELS[0]);
  setValue("coverOverlayType", state.coverOverlayType);
  setValue("coverOverlayOpacity", state.coverOverlayOpacity);
  setValue("coverGradientDirection", state.coverGradientDirection);
  BODY_FIELDS.forEach(([id, slideIndex]) => setValue(id, state.slides[slideIndex].body));
  updateUploadLabels();
  updateBodyHints();
  updateOverlayControls();
}

function setValue(id, value) {
  const element = $(id);
  if (element) element.value = value ?? "";
}

function getValue(id) {
  return $(id)?.value?.trim() || "";
}

function syncFields() {
  state.coverTitle = getValue("coverTitle");
  state.coverSubtitle = getValue("coverSubtitle");
  state.projectName = getValue("projectName");
  state.city = getValue("city");
  state.tags = getValue("tags");
  state.footerLabel = FOOTER_LABELS.includes(getValue("footerLabel")) ? getValue("footerLabel") : FOOTER_LABELS[0];
  state.coverOverlayType = getValue("coverOverlayType") || "none";
  state.coverOverlayOpacity = Number($("coverOverlayOpacity")?.value || 0.35);
  state.coverGradientDirection = getValue("coverGradientDirection") || "bottom";
  state.slides[0].title = state.coverTitle || "一个地方真正迷人的地方";
  state.slides[0].subtitle = state.coverSubtitle || [state.projectName, state.city].filter(Boolean).join(" | ");
  BODY_FIELDS.forEach(([id, slideIndex]) => {
    state.slides[slideIndex].body = getValue(id);
  });
}

function switchStep(step) {
  state.activeStep = step;
  document.querySelectorAll(".step").forEach((button) => button.classList.toggle("active", button.dataset.step === step));
  document.querySelectorAll(".screen").forEach((panel) => panel.classList.remove("active"));
  $(`panel-${step}`).classList.add("active");
  renderAll();
  saveState();
}

function selectedSlide() {
  return state.slides[state.selectedIndex];
}

function generateStructure() {
  syncFields();
  if (!state.coverTitle && !state.projectName) {
    $("saveStatus").textContent = "请先填写封面标题或项目名称";
    $("coverTitle").focus();
    return;
  }
  state.slides = normalizeSlides(state.slides);
  syncFields();
  switchStep("edit");
}

function renderStructurePreview() {
  $("structurePreview").innerHTML = FIXED_CARDS.map((card, index) => `
    <article class="structure-item">
      <strong>${index + 1}. ${escapeHtml(card.label)}</strong>
      <p>${index === 0 ? "主标题、副标题、项目名称、地点和封面图。" : "固定小标题，用户只填写正文内容。"}</p>
    </article>
  `).join("");
}

function renderSlideNav() {
  $("slideNav").innerHTML = state.slides.map((slide, index) => `
    <button class="nav-card ${index === state.selectedIndex ? "active" : ""}" data-slide-index="${index}" type="button">
      <span class="nav-index">${index + 1}</span>
      <span>
        <span class="nav-title">${escapeHtml(slide.label)}</span>
        <span class="nav-type">${index === 0 ? escapeHtml(slide.title) : "固定标题"}</span>
      </span>
    </button>
  `).join("");
}

function renderSlidePreview() {
  const slide = selectedSlide();
  $("currentSlideType").textContent = slide.label;
  $("currentSlideName").textContent = `第 ${slide.step} 张`;
  $("slidePreview").innerHTML = slideHtml(slide);
}

function coverOverlayStyle() {
  const opacity = state.coverOverlayOpacity || 0.35;
  if (state.coverOverlayType === "black") return `background:rgba(0,0,0,${opacity})`;
  if (state.coverOverlayType !== "gradient") return "background:transparent";
  const dir = state.coverGradientDirection || "bottom";
  const direction = { top: "to bottom", bottom: "to top", left: "to right", right: "to left" }[dir];
  return `background:linear-gradient(${direction}, rgba(0,0,0,${opacity}), rgba(0,0,0,0))`;
}

function slideHtml(slide) {
  const hasImage = Boolean(slide.imageDataUrl);
  const imageStyle = `object-position:${slide.imagePositionX ?? 50}% ${slide.imagePositionY ?? 50}%`;
  const image = hasImage ? `<img src="${slide.imageDataUrl}" alt="" style="${imageStyle}" />` : `<div class="placeholder">未上传图片</div>`;
  if (slide.type === "cover") {
    return `
      <article class="slide cover ${hasImage ? "has-image" : ""}" style="background:${slide.backgroundColor}">
        <div class="photo">${image}</div>
        <div class="shade" style="${coverOverlayStyle()}"></div>
        <div class="slide-content cover-content">
          <div class="slide-brand">ASTA ONE</div>
          <div>
            <div class="slide-title">${escapeHtml(slide.title)}</div>
            <div class="slide-subtitle">${escapeHtml(slide.subtitle)}</div>
          </div>
        </div>
      </article>
    `;
  }
  const layoutClass = hasImage ? "top-image" : "solid";
  return `
    <article class="slide inner-card ${layoutClass}" style="background:${slide.backgroundColor}">
      ${hasImage ? `<div class="photo">${image}</div>` : ""}
      <div class="slide-content">
        <div>
          <div class="card-kicker">ASTA ONE ${String(slide.step).padStart(2, "0")}</div>
          <div class="card-title-fixed">${escapeHtml(slide.fixedTitle)}</div>
          <div class="card-body ${slide.body ? "" : "empty"}">${escapeHtml(slide.body || EMPTY_BODY_PREVIEW)}</div>
        </div>
        <div class="slide-brand">ASTA ONE｜${escapeHtml(state.footerLabel || FOOTER_LABELS[0])}</div>
      </div>
    </article>
  `;
}

function renderEditor() {
  const slide = selectedSlide();
  const cropControls = slide.imageDataUrl ? `
    <div class="crop-controls">
      <div class="section-label">图片显示区域</div>
      <label>左右位置 <input id="imagePositionX" type="range" min="0" max="100" step="1" value="${slide.imagePositionX ?? 50}" /></label>
      <label>上下位置 <input id="imagePositionY" type="range" min="0" max="100" step="1" value="${slide.imagePositionY ?? 50}" /></label>
      <p class="hint">拖动滑块调整导出时显示的照片区域，不会改变原图。</p>
    </div>
  ` : "";
  if (slide.type === "cover") {
    $("slideEditor").innerHTML = `
      <label class="upload-button">
        <input id="slideImageInput" type="file" accept="image/*,.heic,.heif" />
        ${slide.imageName ? `已选择：${escapeHtml(slide.imageName)}` : "上传 / 替换封面图"}
      </label>
      <div class="image-actions"><button id="removeImageBtn" type="button">删除图片</button></div>
      ${cropControls}
      <label>封面标题<input id="editCoverTitle" type="text" value="${escapeAttr(slide.title)}" /></label>
      <label>封面副标题<input id="editCoverSubtitle" type="text" value="${escapeAttr(slide.subtitle)}" /></label>
      <label>封面蒙版
        <select id="editCoverOverlayType">
          <option value="none" ${state.coverOverlayType === "none" ? "selected" : ""}>不加蒙版</option>
          <option value="black" ${state.coverOverlayType === "black" ? "selected" : ""}>黑色蒙版</option>
          <option value="gradient" ${state.coverOverlayType === "gradient" ? "selected" : ""}>渐变蒙版</option>
        </select>
      </label>
      ${state.coverOverlayType === "none" ? "" : `<label>蒙版强度 <input id="editCoverOverlayOpacity" type="range" min="0.1" max="0.8" step="0.05" value="${state.coverOverlayOpacity}" /></label>`}
      ${state.coverOverlayType === "gradient" ? `<label>渐变方向
        <select id="editCoverGradientDirection">
          <option value="top" ${state.coverGradientDirection === "top" ? "selected" : ""}>从上到下</option>
          <option value="bottom" ${state.coverGradientDirection === "bottom" ? "selected" : ""}>从下到上</option>
          <option value="left" ${state.coverGradientDirection === "left" ? "selected" : ""}>从左到右</option>
          <option value="right" ${state.coverGradientDirection === "right" ? "selected" : ""}>从右到左</option>
        </select>
      </label>` : ""}
    `;
    return;
  }
  $("slideEditor").innerHTML = `
    <label class="upload-button">
      <input id="slideImageInput" type="file" accept="image/*,.heic,.heif" />
      ${slide.imageName ? `已选择：${escapeHtml(slide.imageName)}` : "上传 / 替换内页图片"}
    </label>
    <div class="image-actions"><button id="removeImageBtn" type="button">删除图片</button></div>
    ${cropControls}
    <div class="fixed-title-box">
      <span>固定小标题</span>
      <strong>${escapeHtml(slide.fixedTitle)}</strong>
    </div>
    <label>正文<textarea id="editBodyText" rows="9" placeholder="${escapeAttr(BODY_PLACEHOLDERS[slide.type] || "")}">${escapeHtml(slide.body)}</textarea><span class="field-hint">${bodyHint(slide.body)}</span></label>
  `;
}

function renderExport() {
  $("exportGrid").innerHTML = state.slides.map((slide, index) => `
    <article class="export-thumb" data-export-index="${index}">
      <div class="slide-preview">${slideHtml(slide)}</div>
      <p>${index + 1}. ${escapeHtml(slide.label)}</p>
    </article>
  `).join("");
}

function renderAll() {
  renderStructurePreview();
  renderSlideNav();
  renderSlidePreview();
  renderEditor();
  renderExport();
  updateOverlayControls();
  updateUploadLabels();
  updateBodyHints();
}

function updateSelected(patch) {
  state.slides[state.selectedIndex] = { ...selectedSlide(), ...patch };
  renderAll();
  saveState();
}

function updateSelectedLive(patch) {
  state.slides[state.selectedIndex] = { ...selectedSlide(), ...patch };
  renderSlideNav();
  renderSlidePreview();
  renderExport();
  saveState();
}

function updateOverlayControls() {
  const showOverlay = state.coverOverlayType !== "none";
  const showGradient = state.coverOverlayType === "gradient";
  if ($("overlayControls")) $("overlayControls").style.display = showOverlay ? "grid" : "none";
  if ($("coverGradientDirection")) $("coverGradientDirection").closest("label").style.display = showGradient ? "grid" : "none";
}

function updateUploadLabels() {
  if ($("coverUploadLabel")) $("coverUploadLabel").textContent = state.slides[0].imageName || "上传封面图";
  const count = state.slides.slice(1).filter((slide) => slide.imageDataUrl).length;
  if ($("innerUploadLabel")) $("innerUploadLabel").textContent = count ? `已上传 ${count} 张内页图片` : "上传内页图片，最多 5 张";
}

function bodyHint(text) {
  const length = String(text || "").trim().length;
  if (length > 120) return "当前文字较长，导出后可能影响手机端阅读。";
  if (length < 40) return "建议 40-120 字，手机端阅读会更舒服。";
  return "";
}

function updateBodyHints() {
  BODY_FIELDS.forEach(([id]) => {
    const field = $(id);
    const hint = field?.parentElement?.querySelector(".field-hint");
    if (hint) hint.textContent = bodyHint(field.value);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片格式无法被当前浏览器解码"));
    img.src = src;
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(blob);
  });
}

function canvasToJpegDataUrl(canvas, quality = 0.88) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("图片压缩失败"));
        return;
      }
      try {
        resolve(await blobToDataUrl(blob));
      } catch (error) {
        reject(error);
      }
    }, "image/jpeg", quality);
  });
}

async function decodeImageFile(file) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close?.() };
    } catch {
      // Fall back to <img> decoding.
    }
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    return { source: img, width: img.naturalWidth || img.width, height: img.naturalHeight || img.height, close: () => URL.revokeObjectURL(objectUrl) };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

async function prepareImageFile(file) {
  const decoded = await decodeImageFile(file);
  try {
    const maxEdge = 2400;
    const scale = Math.min(1, maxEdge / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.source, 0, 0, width, height);
    return {
      dataUrl: await canvasToJpegDataUrl(canvas),
      originalWidth: decoded.width,
      originalHeight: decoded.height,
      width,
      height,
      compressed: scale < 1,
    };
  } finally {
    decoded.close();
  }
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  String(text || "").split("\n").forEach((paragraph) => {
    let line = "";
    for (const char of paragraph) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    lines.push(line);
  });
  return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 20) {
  const allLines = wrapText(ctx, text, maxWidth);
  const lines = allLines.slice(0, maxLines);
  if (allLines.length > maxLines && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[。,.，、；;：:]*$/, "")}...`;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function drawCoverImage(ctx, img, x, y, width, height, positionX = 50, positionY = 50) {
  const scale = Math.max(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const overflowX = Math.max(0, drawWidth - width);
  const overflowY = Math.max(0, drawHeight - height);
  const offsetX = x - overflowX * (Number(positionX) / 100);
  const offsetY = y - overflowY * (Number(positionY) / 100);
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function applyCanvasCoverOverlay(ctx, width, height) {
  const opacity = state.coverOverlayOpacity || 0.35;
  if (state.coverOverlayType === "none") return;
  if (state.coverOverlayType === "black") {
    ctx.fillStyle = `rgba(0,0,0,${opacity})`;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  let gradient;
  if (state.coverGradientDirection === "top") gradient = ctx.createLinearGradient(0, 0, 0, height);
  else if (state.coverGradientDirection === "left") gradient = ctx.createLinearGradient(0, 0, width, 0);
  else if (state.coverGradientDirection === "right") gradient = ctx.createLinearGradient(width, 0, 0, 0);
  else gradient = ctx.createLinearGradient(0, height, 0, 0);
  gradient.addColorStop(0, `rgba(0,0,0,${opacity})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

async function renderSlideToCanvas(slide) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  const padding = 92;
  const img = slide.imageDataUrl ? await loadImage(slide.imageDataUrl) : null;

  ctx.fillStyle = slide.backgroundColor || "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (slide.type === "cover") {
    if (img) drawCoverImage(ctx, img, 0, 0, canvas.width, canvas.height, slide.imagePositionX, slide.imagePositionY);
    else {
      ctx.fillStyle = "#E8E8ED";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    applyCanvasCoverOverlay(ctx, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 34px -apple-system, BlinkMacSystemFont, PingFang SC";
    ctx.fillText("ASTA ONE", padding, 110);
    ctx.font = "760 78px -apple-system, BlinkMacSystemFont, PingFang SC";
    drawWrappedText(ctx, slide.title, padding, 970, 840, 92, 4);
    ctx.font = "400 34px -apple-system, BlinkMacSystemFont, PingFang SC";
    drawWrappedText(ctx, slide.subtitle, padding, 1250, 860, 48, 2);
    return canvas;
  }

  const hasImage = Boolean(img);
  if (hasImage) {
    const imageHeight = 640;
    drawCoverImage(ctx, img, 0, 0, canvas.width, imageHeight, slide.imagePositionX, slide.imagePositionY);
    ctx.fillStyle = slide.backgroundColor || "#FFFFFF";
    ctx.fillRect(0, imageHeight, canvas.width, canvas.height - imageHeight);
  }

  const top = hasImage ? 760 : 300;
  ctx.fillStyle = "#777777";
  ctx.font = "400 28px -apple-system, BlinkMacSystemFont, PingFang SC";
  ctx.fillText(`ASTA ONE ${String(slide.step).padStart(2, "0")}`, padding, top);
  ctx.fillStyle = "#111111";
  ctx.font = "600 52px -apple-system, BlinkMacSystemFont, PingFang SC";
  const bodyStart = drawWrappedText(ctx, slide.fixedTitle, padding, top + 78, 860, 62, 2) + 48;
  ctx.fillStyle = "#2B2B2B";
  ctx.font = "400 34px -apple-system, BlinkMacSystemFont, PingFang SC";
  drawWrappedText(ctx, slide.body, padding, bodyStart, 860, 56, hasImage ? 7 : 10);
  ctx.fillStyle = "#111111";
  ctx.font = "700 28px -apple-system, BlinkMacSystemFont, PingFang SC";
  ctx.fillText(`ASTA ONE｜${state.footerLabel || FOOTER_LABELS[0]}`, padding, 1340);
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("导出失败"))), "image/png", 1);
  });
}

async function downloadCurrent() {
  const canvas = await renderSlideToCanvas(selectedSlide());
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = FIXED_CARDS[state.selectedIndex].fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = Array.from({ length: 256 }, (_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    });
  }
  let crc = -1;
  for (const byte of buf) crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  return (crc ^ -1) >>> 0;
}

function u16(value) {
  return new Uint8Array([value & 255, (value >> 8) & 255]);
}

function u32(value) {
  return new Uint8Array([value & 255, (value >> 8) & 255, (value >> 16) & 255, (value >> 24) & 255]);
}

async function createZip(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(data);
    const local = [u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data];
    chunks.push(...local);
    central.push(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name);
    offset += local.reduce((sum, part) => sum + part.length, 0);
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = [u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralSize), u32(offset), u16(0)];
  return new Blob([...chunks, ...central, ...end], { type: "application/zip" });
}

async function exportAll() {
  const files = [];
  for (let index = 0; index < state.slides.length; index++) {
    const canvas = await renderSlideToCanvas(state.slides[index]);
    files.push({ name: FIXED_CARDS[index].fileName, blob: await canvasToBlob(canvas) });
  }
  const zip = await createZip(files);
  const url = URL.createObjectURL(zip);
  const link = document.createElement("a");
  link.href = url;
  link.download = "asta-one-place-notes.zip";
  link.click();
  URL.revokeObjectURL(url);
}

function resetAll() {
  localStorage.removeItem("asta-one-studio-v2");
  state = {
    activeStep: "project",
    selectedIndex: 0,
    coverTitle: "",
    coverSubtitle: "",
    projectName: "",
    city: "",
    tags: "",
    footerLabel: FOOTER_LABELS[0],
    coverOverlayType: "gradient",
    coverOverlayOpacity: 0.35,
    coverGradientDirection: "bottom",
    slides: createDefaultSlides(),
  };
  hydrateFields();
  switchStep("project");
}

function uploadErrorMessage(file, error) {
  const name = file?.name || "";
  const type = file?.type || "未知格式";
  if (/\.hei(c|f)$/i.test(name) || /hei(c|f)/i.test(type)) {
    return "这张可能是 HEIC/HEIF 原图，当前网页无法直接解码。请在照片里导出为 JPG 后再上传。";
  }
  return `图片处理失败：${error?.message || type}。建议换成 JPG 或 PNG 再试。`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

document.addEventListener("click", async (event) => {
  const step = event.target.closest("[data-step]")?.dataset.step;
  if (step) switchStep(step);

  const slideIndex = event.target.closest("[data-slide-index]")?.dataset.slideIndex;
  if (slideIndex !== undefined) {
    state.selectedIndex = Number(slideIndex);
    renderAll();
    saveState();
  }

  const exportIndex = event.target.closest("[data-export-index]")?.dataset.exportIndex;
  if (exportIndex !== undefined) {
    state.selectedIndex = Number(exportIndex);
    switchStep("edit");
  }

  if (event.target.id === "generateStructureBtn") generateStructure();
  if (event.target.id === "resetBtn") resetAll();
  if (event.target.id === "removeImageBtn") updateSelected({ imageDataUrl: "", imageName: "" });
  if (event.target.id === "exportCurrentBtn") await downloadCurrent();
  if (event.target.id === "exportAllBtn") await exportAll();
});

document.addEventListener("input", (event) => {
  const id = event.target.id;
  if (["coverTitle", "coverSubtitle", "projectName", "city", "tags", "footerLabel", "coverOverlayType", "coverOverlayOpacity", "coverGradientDirection"].includes(id)) {
    syncFields();
    renderAll();
    saveState();
  }
  if (BODY_FIELDS.some(([fieldId]) => fieldId === id)) {
    syncFields();
    updateBodyHints();
    renderAll();
    saveState();
  }
  if (id === "editCoverTitle") {
    state.coverTitle = event.target.value.trim();
    state.slides[0].title = event.target.value;
    setValue("coverTitle", event.target.value);
    updateSelectedLive({ title: event.target.value });
  }
  if (id === "editCoverSubtitle") {
    state.coverSubtitle = event.target.value.trim();
    state.slides[0].subtitle = event.target.value;
    setValue("coverSubtitle", event.target.value);
    updateSelectedLive({ subtitle: event.target.value });
  }
  if (id === "editBodyText") {
    updateSelectedLive({ body: event.target.value });
    const hint = event.target.parentElement?.querySelector(".field-hint");
    if (hint) hint.textContent = bodyHint(event.target.value);
    const field = BODY_FIELDS.find(([, slideIndex]) => slideIndex === state.selectedIndex)?.[0];
    if (field) setValue(field, event.target.value);
  }
  if (id === "editCoverOverlayOpacity") {
    state.coverOverlayOpacity = Number(event.target.value);
    setValue("coverOverlayOpacity", event.target.value);
    renderSlidePreview();
    renderExport();
    saveState();
  }
  if (id === "imagePositionX") {
    updateSelectedLive({ imagePositionX: Number(event.target.value) });
  }
  if (id === "imagePositionY") {
    updateSelectedLive({ imagePositionY: Number(event.target.value) });
  }
});

document.addEventListener("change", async (event) => {
  const id = event.target.id;
  if (id === "footerLabel") {
    syncFields();
    renderSlidePreview();
    renderExport();
    saveState();
  }
  if (["coverOverlayType", "coverGradientDirection", "editCoverOverlayType", "editCoverGradientDirection"].includes(id)) {
    const typeMap = { editCoverOverlayType: "coverOverlayType", editCoverGradientDirection: "coverGradientDirection" };
    const stateKey = typeMap[id] || id;
    state[stateKey] = event.target.value;
    setValue(stateKey, event.target.value);
    renderAll();
    saveState();
  }
  if (id === "editCoverOverlayOpacity") {
    state.coverOverlayOpacity = Number(event.target.value);
    setValue("coverOverlayOpacity", event.target.value);
    renderAll();
    saveState();
  }
  if (id === "coverImageInput" && event.target.files?.[0]) {
    await handleImageForSlide(event.target.files[0], 0);
  }
  if (id === "innerImagesInput" && event.target.files?.length) {
    const files = [...event.target.files].slice(0, 5);
    for (let index = 0; index < files.length; index++) await handleImageForSlide(files[index], index + 1);
    state.selectedIndex = 1;
    switchStep("edit");
  }
  if (id === "slideImageInput" && event.target.files?.[0]) {
    await handleImageForSlide(event.target.files[0], state.selectedIndex);
  }
});

async function handleImageForSlide(file, slideIndex) {
  $("saveStatus").textContent = "正在处理图片...";
  try {
    const image = await prepareImageFile(file);
    state.slides[slideIndex] = {
      ...state.slides[slideIndex],
      imageDataUrl: image.dataUrl,
      imageName: file.name,
      imageInfo: image,
      imagePositionX: 50,
      imagePositionY: 50,
    };
    renderAll();
    saveState();
    $("saveStatus").textContent = image.compressed
      ? `已上传，已从 ${image.originalWidth}×${image.originalHeight} 优化为 ${image.width}×${image.height}`
      : "图片已上传";
  } catch (error) {
    console.error("[image-upload]", error);
    $("saveStatus").textContent = uploadErrorMessage(file, error);
  }
}

restoreState();
renderAll();
switchStep(state.activeStep || "project");
