const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "asta-one-studio-ai-layout-v2";
const LEGACY_STORAGE_KEY = "asta-one-studio-v2";
const BRAND = "ASTA ONE｜人类生活说明书";
const WIDTH = 1242;
const HEIGHT = 1660;
const SAFE = 84;
const CONTENT_BOTTOM = 1460;
const TITLE_BASELINE = 240;
const { MEDIA_FRAME, getMediaLayout } = globalThis.AstaMediaFrame;

const PAGE_DEFS = [
  { type: "cover", name: "封面", heading: "" },
  { type: "signal", name: "一手信号", heading: "一手信号" },
  { type: "explain", name: "这是什么", heading: "这是什么" },
  { type: "overseas", name: "海外怎么用", heading: "海外怎么用" },
  { type: "domestic", name: "国内怎么用", heading: "国内怎么用" },
  { type: "judgment", name: "ASTA 判断", heading: "ASTA 判断" },
];

const TEMPLATE_NAMES = {
  minimal: "极简信息卡",
  evidence: "截图增强型",
  magazine: "轻科技杂志感",
};

const THEMES = {
  minimal: { bg: "#F8F8F6", ink: "#111111", body: "#333333", muted: "#6B6B6B", weak: "#919191", accent: "#6F8194", accentDark: "#445464", pale: "#E8EDF1", imageRatio: .34 },
  evidence: { bg: "#F4F5F6", ink: "#111111", body: "#303438", muted: "#656D73", weak: "#8B9297", accent: "#657C8E", accentDark: "#3F5261", pale: "#E6ECEF", imageRatio: .45 },
  magazine: { bg: "#FFFFFF", ink: "#111111", body: "#343434", muted: "#6B6B6B", weak: "#929292", accent: "#6F8194", accentDark: "#384B5B", pale: "#EEF2F4", imageRatio: .39 },
};

const DENSITY = {
  comfortable: { heading: 64, body: 36, line: 62 },
  standard: { heading: 60, body: 34, line: 56 },
  compact: { heading: 54, body: 31, line: 51 },
};

const LEGACY_DEFAULT_HEADINGS = new Set([
  "第一印象", "隐藏看点", "体验指南", "它好在哪里", "适合谁来",
  "它正在发生什么", "为什么是现在", "它会先改变谁", "真正的难题", "留给人的问题",
  "它进入了哪个生活场景", "它替人分担了什么", "它改变了怎样的关系", "我们要防止失去什么", "留给日常的一句话",
]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultPage(index) {
  const def = PAGE_DEFS[index];
  return {
    type: def.type,
    heading: def.heading,
    title: "",
    subtitle: "",
    coverTag: "AI DISCOVERY",
    coverBadge: "",
    coverLayout: "image",
    titleAlign: "left",
    overlayStyle: "gradient",
    overlayOpacity: 40,
    bodyMode: "paragraph",
    body: "",
    points: ["", "", ""],
    imageDataUrl: "",
    imageName: "",
    imageWidth: 0,
    imageHeight: 0,
    imageFit: "cover",
    imagePositionX: 50,
    imagePositionY: 50,
    imageZoom: 100,
    sourcePlatform: "",
    publishDate: "",
    eventDate: "",
    tags: "",
    emphasis: "",
    caseName: "",
    caseSummary: "",
    useScene: "",
    result: "",
    quote: "",
    audience: "",
    actionHint: "",
    threshold: "",
    potential: "",
    rating: "",
    summary: "",
    risk: "",
  };
}

function defaultState() {
  return {
    schemaVersion: 2,
    projectName: "未命名 AI 内容",
    category: "海外AI新发现",
    template: "minimal",
    density: "standard",
    columnLabel: "AI DISCOVERY",
    platformLabel: "",
    date: today(),
    sourceUrl: "",
    authorNote: "",
    showBrand: true,
    showSources: true,
    showTags: true,
    showSafeArea: false,
    previewScale: .30,
    selectedIndex: 0,
    pages: PAGE_DEFS.map((_, index) => defaultPage(index)),
  };
}

let state = defaultState();
let previewRenderId = 0;
const imageCache = new Map();

function cleanPage(raw, index) {
  const base = defaultPage(index);
  return {
    ...base,
    ...(raw || {}),
    type: PAGE_DEFS[index].type,
    heading: index === 0 ? "" : String(raw?.heading || raw?.title || base.heading),
    title: index === 0 ? String(raw?.title || "") : "",
    subtitle: index === 0 ? String(raw?.subtitle || "") : "",
    points: Array.from({ length: 3 }, (_, i) => String(raw?.points?.[i] || "")),
  };
}

function migrateLegacy(raw) {
  const next = defaultState();
  next.projectName = raw.projectName || raw.coverTitle || raw.title || next.projectName;
  next.category = raw.category || next.category;
  next.date = raw.date || next.date;
  next.showBrand = raw.showBrand !== false;
  next.showSources = raw.showSources !== false;
  next.selectedIndex = Math.max(0, Math.min(5, Number(raw.selectedIndex || 0)));
  const oldPages = raw.pages || raw.slides || [];
  next.pages = PAGE_DEFS.map((_, index) => {
    const old = oldPages[index] || {};
    const page = cleanPage(old, index);
    if (index === 0) {
      page.title = raw.coverTitle || raw.title || old.title || "";
      page.subtitle = raw.coverSubtitle || raw.subtitle || old.subtitle || "";
    } else {
      page.heading = old.heading || old.title || PAGE_DEFS[index].heading;
      page.body = old.body || "";
    }
    return page;
  });
  return next;
}

function restoreState() {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (current?.pages?.length) {
      const needsHeadingUpgrade = !current.schemaVersion;
      state = {
        ...defaultState(),
        ...current,
        pages: PAGE_DEFS.map((_, index) => cleanPage(current.pages[index], index)),
      };
      if (needsHeadingUpgrade) {
        state.pages.slice(1).forEach((page, index) => {
          if (LEGACY_DEFAULT_HEADINGS.has(page.heading)) page.heading = PAGE_DEFS[index + 1].heading;
        });
        state.schemaVersion = 2;
      }
      return;
    }
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
    if (legacy) state = migrateLegacy(legacy);
  } catch {
    state = defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $("saveStatus").textContent = `已自动保存于 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    $("saveStatus").style.color = "";
  } catch {
    $("saveStatus").textContent = "草稿空间不足，请先导出";
    $("saveStatus").style.color = "#A94C43";
  }
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function currentPage() {
  return state.pages[state.selectedIndex];
}

function theme() {
  return THEMES[state.template] || THEMES.minimal;
}

function density() {
  return DENSITY[state.density] || DENSITY.standard;
}

function tagsOf(page) {
  return String(page.tags || "").split(/[，,、]/).map((item) => item.trim()).filter(Boolean);
}

function bodyText(page) {
  if (page.bodyMode === "points") return page.points.map((item) => item.trim()).filter(Boolean).map((item) => `• ${item}`).join("\n");
  return page.body.trim();
}

function isPageComplete(index) {
  const page = state.pages[index];
  if (index === 0) return Boolean(page.title.trim() && page.imageDataUrl);
  return Boolean(page.heading.trim() && bodyText(page));
}

function basicIssues(index) {
  const page = state.pages[index];
  const issues = [];
  if (index === 0) {
    if (!page.title.trim()) issues.push({ level: "error", message: "封面主标题未填写" });
    if (!page.imageDataUrl) issues.push({ level: "error", message: "封面图片未上传" });
    if (page.title.trim().length > 32) issues.push({ level: "warning", message: "封面标题超过 32 字" });
  } else {
    if (!page.heading.trim()) issues.push({ level: "error", message: `图 ${index + 1} 小标题未填写` });
    if (!bodyText(page)) issues.push({ level: "error", message: `图 ${index + 1} 正文未填写` });
    if (page.heading.trim().length > 20) issues.push({ level: "warning", message: `图 ${index + 1} 小标题建议不超过 20 字` });
    if (bodyText(page).length > 250) issues.push({ level: "error", message: `图 ${index + 1} 正文超过 250 字，已阻止导出` });
    else if (bodyText(page).length > 180) issues.push({ level: "warning", message: `图 ${index + 1} 正文较长，建议精简至 180 字以内` });
  }
  if (tagsOf(page).length > 3) issues.push({ level: "warning", message: `图 ${index + 1} 标签超过 3 个` });
  return issues;
}

function field(label, control, options = {}) {
  const classes = ["field", options.wide ? "wide" : ""].filter(Boolean).join(" ");
  const labelClass = options.required ? "required" : "";
  const hintClass = options.hintLevel ? `field-hint ${options.hintLevel}` : "field-hint";
  return `<label class="${classes}"><span class="${labelClass}">${label}</span>${control}${options.hint ? `<span class="${hintClass}">${escapeHtml(options.hint)}</span>` : ""}</label>`;
}

function input(name, value, placeholder = "", extra = "") {
  return `<input data-field="${name}" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder)}" ${extra} />`;
}

function textarea(name, value, placeholder = "", rows = 6) {
  return `<textarea data-field="${name}" rows="${rows}" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value)}</textarea>`;
}

function select(name, value, options) {
  return `<select data-field="${name}">${options.map(([key, label]) => `<option value="${key}" ${key === value ? "selected" : ""}>${label}</option>`).join("")}</select>`;
}

function group(title, subtitle, content) {
  return `<section class="field-group"><div class="group-heading"><h3>${title}</h3><span>${subtitle || ""}</span></div>${content}</section>`;
}

function bodyModeEditor(page) {
  const paragraph = page.bodyMode === "paragraph";
  const mode = `<div class="segmented"><button type="button" data-body-mode="paragraph" class="${paragraph ? "active" : ""}">段落模式</button><button type="button" data-body-mode="points" class="${!paragraph ? "active" : ""}">短点模式</button></div>`;
  const content = paragraph
    ? textarea("body", page.body, "用一段清楚的话解释，建议不超过 180 字", 8)
    : `<div class="point-list">${page.points.map((point, index) => `<input data-point-index="${index}" value="${escapeAttr(point)}" placeholder="信息点 ${index + 1}${index === 0 ? "（至少填写一条）" : "（选填）"}" />`).join("")}</div>`;
  const count = bodyText(page).length;
  const level = count > 250 ? "danger" : count > 180 ? "warning" : "";
  return `<div class="field-grid">${field("正文形式", mode, { wide: true })}${field("正文内容", content, { wide: true, required: true, hint: `当前 ${count} 字；建议 180 字以内，最多 250 字。`, hintLevel: level })}</div>`;
}

function imageEditor(page, required = false) {
  const size = page.imageWidth ? `${page.imageWidth} × ${page.imageHeight}px` : "";
  const clarity = page.imageWidth && (page.imageWidth < 900 || page.imageHeight < 900) ? "图片尺寸偏小，导出可能不够清晰。" : "";
  return `<div class="field-grid">
    ${field(required ? "图片" : "配图（选填）", `<div class="upload-row"><label class="upload-button"><input data-image-upload type="file" accept="image/*,.heic,.heif" />${page.imageName ? `替换：${escapeHtml(page.imageName)}` : "上传图片"}</label><button type="button" data-remove-image ${page.imageDataUrl ? "" : "disabled"}>删除</button></div>${size || clarity ? `<div class="image-info">${escapeHtml([size, clarity].filter(Boolean).join(" · "))}</div>` : ""}`, { wide: true, required })}
    ${page.imageDataUrl && page.type === "cover" ? field("显示方式", select("imageFit", page.imageFit, [["cover", "填充裁切"], ["contain", "完整显示"]])) : ""}
    ${page.imageDataUrl ? field("图片调整", `<div class="range-row"><label class="field">水平焦点<input data-field="imagePositionX" type="range" min="0" max="100" value="${page.imagePositionX}" /></label><label class="field">垂直焦点<input data-field="imagePositionY" type="range" min="0" max="100" value="${page.imagePositionY}" /></label><label class="field">图片缩放<input data-field="imageZoom" type="range" min="100" max="220" step="5" value="${page.imageZoom || 100}" /></label></div>`, { wide: true }) : ""}
  </div>`;
}

function renderCoverEditor(page) {
  const titleCount = page.title.trim().length;
  const titleLevel = titleCount > 32 ? "danger" : titleCount > 22 ? "warning" : "";
  return [
    group("封面信息", "负责点击率，保持简洁", `<div class="field-grid">
      ${field("主标题", input("title", page.title, "12—22 字，最多 3 行", "maxlength=60"), { wide: true, required: true, hint: `当前 ${titleCount} 字，建议 12—22 字。`, hintLevel: titleLevel })}
      ${field("副标题", input("subtitle", page.subtitle, "补充一句价值说明", "maxlength=80"), { wide: true })}
      ${field("英文小标签 / 栏目名", input("coverTag", page.coverTag, "AI DISCOVERY", "maxlength=24"))}
      ${field("封面角标", input("coverBadge", page.coverBadge, "例如：72小时新发现", "maxlength=24"))}
    </div>`),
    group("封面版式", "文字始终限制在安全区", `<div class="field-grid">
      ${field("封面布局", select("coverLayout", page.coverLayout, [["image", "图片背景型"], ["editorial", "白底编辑型"], ["evidence", "截图证据型"]]), { wide: true })}
      ${field("蒙版样式", select("overlayStyle", page.overlayStyle, [["none", "无蒙版"], ["black", "黑色蒙版"], ["gradient", "渐变蒙版"]]))}
      ${field("蒙版透明度", select("overlayOpacity", String(page.overlayOpacity), [["20", "20%"], ["40", "40%"], ["60", "60%"]]))}
      ${field("标题对齐", select("titleAlign", page.titleAlign, [["left", "左对齐"], ["center", "居中"]]))}
    </div>`),
    group("封面图片", "1242 × 1660 px 输出", imageEditor(page, true)),
  ].join("");
}

function commonPageHeading(page, index) {
  const count = page.heading.trim().length;
  return group("页面标题", PAGE_DEFS[index].name, `<div class="field-grid">${field("小标题", input("heading", page.heading, PAGE_DEFS[index].heading, "maxlength=40"), { wide: true, required: true, hint: `当前 ${count} 字；建议不超过 16 字，可自由修改或清空重写。`, hintLevel: count > 20 ? "warning" : "" })}</div>`);
}

function renderPageEditor(page, index) {
  const sections = [commonPageHeading(page, index), group("正文", "段落或 1—3 条短点", bodyModeEditor(page))];
  if (page.type === "signal") {
    sections.push(group("来源信息", "增强可信与及时感", `<div class="field-grid">
      ${field("来源平台", select("sourcePlatform", page.sourcePlatform, [["", "不显示"], ["X", "X"], ["Reddit", "Reddit"], ["YouTube", "YouTube"], ["GitHub", "GitHub"], ["Product Hunt", "Product Hunt"], ["其他", "其他"]]))}
      ${field("发布时间", input("publishDate", page.publishDate, "2026.07.14"))}
      ${field("事件日期", input("eventDate", page.eventDate, "2026.07.12"))}
      ${field("关键词标签", input("tags", page.tags, "最多 3 个，用逗号分隔"), { hint: `${tagsOf(page).length}/3 个标签`, hintLevel: tagsOf(page).length > 3 ? "warning" : "" })}
      ${field("强调结论", input("emphasis", page.emphasis, "一句话放大显示", "maxlength=60"), { wide: true })}
    </div>`));
  }
  if (page.type === "explain") {
    sections.push(group("解释辅助", "可选字段会自动补位", `<div class="field-grid">${field("关键词高亮", input("tags", page.tags, "AI Agent，工作流，开源工具"), { wide: true, hint: `${tagsOf(page).length}/3 个标签`, hintLevel: tagsOf(page).length > 3 ? "warning" : "" })}</div>`));
  }
  if (page.type === "overseas") {
    sections.push(group("海外案例", "填写后自动生成案例与结果模块", `<div class="field-grid">
      ${field("案例名称", input("caseName", page.caseName, "例如：某海外团队"))}
      ${field("使用场景", input("useScene", page.useScene, "例如：客户支持自动化"))}
      ${field("案例摘要", textarea("caseSummary", page.caseSummary, "一句话交代案例背景", 3), { wide: true })}
      ${field("数据 / 结果", input("result", page.result, "例如：3周获得1,200名用户"), { wide: true })}
      ${field("引用结论", input("quote", page.quote, "一句放大呈现", "maxlength=70"), { wide: true })}
    </div>`));
  }
  if (page.type === "domestic") {
    sections.push(group("落地建议", "让内容转化为具体行动", `<div class="field-grid">
      ${field("适合谁", input("audience", page.audience, "品牌人，内容创作者，创业者"), { wide: true })}
      ${field("行动提示", input("actionHint", page.actionHint, "例如：先从免费版开始试用", "maxlength=70"), { wide: true })}
    </div>`));
  }
  if (page.type === "judgment") {
    sections.push(group("ASTA 结论", "总结页保持克制，不做复杂评分表", `<div class="field-grid">
      ${field("适合谁", input("audience", page.audience, "例如：独立开发者"), { wide: true })}
      ${field("使用门槛", select("threshold", page.threshold, [["", "不显示"], ["低", "低"], ["中", "中"], ["高", "高"]]))}
      ${field("商业潜力", select("potential", page.potential, [["", "不显示"], ["低", "低"], ["中", "中"], ["高", "高"]]))}
      ${field("推荐指数", select("rating", page.rating, [["", "不显示"], ["1", "1 / 5"], ["2", "2 / 5"], ["3", "3 / 5"], ["4", "4 / 5"], ["5", "5 / 5"]]))}
      ${field("一句话总结", input("summary", page.summary, "最后留下一个明确判断", "maxlength=80"), { wide: true })}
      ${field("风险提醒", input("risk", page.risk, "说明仍需确认的边界", "maxlength=80"), { wide: true })}
    </div>`));
  }
  sections.push(group("图片", "固定容器裁切，不进入文字区", imageEditor(page, false)));
  return sections.join("");
}

function renderEditor() {
  const page = currentPage();
  const index = state.selectedIndex;
  $("editorEyebrow").textContent = `图 ${String(index + 1).padStart(2, "0")} · ${PAGE_DEFS[index].name}`;
  $("editorTitle").textContent = index === 0 ? "编辑封面" : `编辑${page.heading || PAGE_DEFS[index].name}`;
  $("pageEditor").innerHTML = index === 0 ? renderCoverEditor(page) : renderPageEditor(page, index);
  $("previousPageBtn").disabled = index === 0;
  $("nextPageBtn").disabled = index === 5;
}

function renderNav() {
  $("pageNav").innerHTML = state.pages.map((page, index) => {
    const issues = basicIssues(index);
    const complete = isPageComplete(index);
    const warning = issues.some((issue) => issue.level === "warning" || issue.level === "error");
    const status = complete ? (warning ? "需要检查" : "已完成") : (index === state.selectedIndex ? "编辑中" : "未开始");
    return `<button class="page-nav-button ${index === state.selectedIndex ? "active" : ""}" data-page-index="${index}" type="button"><span class="page-number-badge">${String(index + 1).padStart(2, "0")}</span><span class="page-nav-copy"><span class="page-nav-title">${escapeHtml(index === 0 ? "封面" : page.heading || PAGE_DEFS[index].name)}</span><span class="page-nav-status">${status}</span></span><span class="status-dot ${warning ? "warning" : complete ? "complete" : ""}"></span></button>`;
  }).join("");
}

function hydrateProjectDialog() {
  ["projectName", "category", "template", "density", "columnLabel", "platformLabel", "contentDate", "sourceUrl", "authorNote"].forEach((id) => {
    const key = id === "contentDate" ? "date" : id;
    $(id).value = state[key] ?? "";
  });
  $("showBrand").checked = state.showBrand;
  $("showSources").checked = state.showSources;
  $("showTags").checked = state.showTags;
  $("showSafeArea").checked = state.showSafeArea;
  $("previewScale").value = String(state.previewScale || .30);
}

function readProjectDialog() {
  state.projectName = $("projectName").value.trim() || "未命名 AI 内容";
  state.category = $("category").value;
  state.template = $("template").value;
  state.density = $("density").value;
  state.columnLabel = $("columnLabel").value.trim();
  state.platformLabel = $("platformLabel").value.trim();
  state.date = $("contentDate").value || today();
  state.sourceUrl = $("sourceUrl").value.trim();
  state.authorNote = $("authorNote").value;
  state.showBrand = $("showBrand").checked;
  state.showSources = $("showSources").checked;
  state.showTags = $("showTags").checked;
}

function setCurrentPage(index) {
  state.selectedIndex = Math.max(0, Math.min(5, index));
  renderNav();
  renderEditor();
  renderPreview();
  saveState();
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片无法解码"));
    image.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function drawImageInBox(ctx, image, box, page, radius = 28) {
  if (!image) return;
  const { x, y, width, height } = box;
  ctx.save();
  roundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.fillStyle = "#E8ECEE";
  ctx.fillRect(x, y, width, height);
  const contain = page.imageFit === "contain";
  const baseScale = contain ? Math.min(width / image.width, height / image.height) : Math.max(width / image.width, height / image.height);
  const zoom = Math.max(100, Math.min(220, Number(page.imageZoom || 100))) / 100;
  const scale = baseScale * zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const px = Number(page.imagePositionX ?? 50) / 100;
  const py = Number(page.imagePositionY ?? 50) / 100;
  const drawX = x + (width - drawWidth) * px;
  const drawY = y + (height - drawHeight) * py;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

function wrapLines(ctx, text, maxWidth) {
  const result = [];
  String(text || "").split("\n").forEach((paragraph) => {
    if (!paragraph) {
      result.push("");
      return;
    }
    let line = "";
    for (const char of paragraph) {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        result.push(line);
        line = char;
      } else {
        line = next;
      }
    }
    if (line) result.push(line);
  });
  return result;
}

function drawLines(ctx, text, x, y, maxWidth, lineHeight, maxHeight) {
  const lines = wrapLines(ctx, text, maxWidth);
  const maxLines = Math.max(0, Math.floor(maxHeight / lineHeight));
  const visible = lines.slice(0, maxLines);
  visible.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return { bottom: y + visible.length * lineHeight, overflow: lines.length > maxLines, lines: lines.length, visibleLines: visible.length };
}

function drawPill(ctx, text, x, y, colors, maxWidth = 360) {
  if (!text) return 0;
  ctx.font = `600 22px ${fontStack()}`;
  const width = Math.min(maxWidth, Math.ceil(ctx.measureText(text).width) + 40);
  ctx.fillStyle = colors.fill;
  roundedRect(ctx, x, y, width, 48, 24);
  ctx.fill();
  ctx.fillStyle = colors.text;
  ctx.fillText(text, x + 20, y + 31);
  return width;
}

function fontStack() {
  return '"PingFang SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif';
}

function drawSafeArea(ctx) {
  if (!state.showSafeArea) return;
  ctx.save();
  ctx.strokeStyle = "rgba(169,76,67,.55)";
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 10]);
  ctx.strokeRect(SAFE, 80, WIDTH - SAFE * 2, HEIGHT - 160);
  ctx.restore();
}

function drawFooter(ctx, index, colors) {
  const y = 1568;
  if (state.showBrand) {
    ctx.fillStyle = colors.ink;
    ctx.font = `700 16px ${fontStack()}`;
    ctx.fillText(BRAND, SAFE, y);
  }
  ctx.fillStyle = colors.muted;
  ctx.font = `500 21px ${fontStack()}`;
  ctx.textAlign = "right";
  ctx.fillText(`${String(index + 1).padStart(2, "0")} / 06`, WIDTH - SAFE, y);
  ctx.textAlign = "left";
}

function drawHeader(ctx, page, index, colors) {
  const label = state.columnLabel || state.category;
  let cursor = SAFE;
  if (label) cursor += drawPill(ctx, label, cursor, 82, { fill: colors.pale, text: colors.accentDark }, 330) + 12;
  const platform = state.showSources ? (page.sourcePlatform || state.platformLabel) : "";
  if (platform) drawPill(ctx, platform, cursor, 82, { fill: "#FFFFFF", text: colors.muted }, 250);
  ctx.fillStyle = colors.weak;
  ctx.font = `500 21px ${fontStack()}`;
  ctx.textAlign = "right";
  ctx.fillText(`${state.date || ""} · ${String(index + 1).padStart(2, "0")}`, WIDTH - SAFE, 113);
  ctx.textAlign = "left";
}

function drawCoverOverlay(ctx, page) {
  const opacity = Math.max(0, Math.min(80, Number(page.overlayOpacity || 40))) / 100;
  if (page.overlayStyle === "none") return;
  if (page.overlayStyle === "black") {
    ctx.fillStyle = `rgba(8,12,14,${opacity})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    return;
  }
  const gradient = ctx.createLinearGradient(0, HEIGHT, 0, HEIGHT * .28);
  gradient.addColorStop(0, `rgba(8,12,14,${Math.min(.88, opacity + .26)})`);
  gradient.addColorStop(.62, `rgba(8,12,14,${opacity * .35})`);
  gradient.addColorStop(1, "rgba(8,12,14,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawCover(ctx, page, image, issues) {
  const colors = theme();
  const layout = page.coverLayout || "image";
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (layout === "image") {
    if (image) drawImageInBox(ctx, image, { x: 0, y: 0, width: WIDTH, height: HEIGHT }, { ...page, imageFit: "cover" }, 0);
    drawCoverOverlay(ctx, page);
    const lightText = page.overlayStyle !== "none";
    const textColor = lightText ? "#FFFFFF" : colors.ink;
    const muted = lightText ? "rgba(255,255,255,.82)" : colors.muted;
    const alignCenter = page.titleAlign === "center";
    const x = alignCenter ? WIDTH / 2 : SAFE;
    const maxWidth = WIDTH - SAFE * 2;
    ctx.textAlign = alignCenter ? "center" : "left";
    ctx.fillStyle = muted;
    ctx.font = `650 23px ${fontStack()}`;
    ctx.fillText(page.coverTag || state.columnLabel || state.category, x, 126);
    if (page.coverBadge) drawPill(ctx, page.coverBadge, alignCenter ? SAFE : x, 174, { fill: lightText ? "rgba(255,255,255,.18)" : colors.pale, text: textColor }, 330);
    ctx.fillStyle = textColor;
    ctx.font = `750 82px ${fontStack()}`;
    const title = drawLines(ctx, page.title || "主标题待填写", x, 1080, maxWidth, 96, 300);
    if (title.overflow) issues.push({ level: "error", message: "封面标题超出安全区" });
    ctx.fillStyle = muted;
    ctx.font = `500 34px ${fontStack()}`;
    const subtitle = drawLines(ctx, page.subtitle, x, title.bottom + 38, maxWidth, 50, 110);
    if (subtitle.overflow) issues.push({ level: "error", message: "封面副标题超出安全区" });
    ctx.textAlign = "left";
    if (state.showBrand) {
      ctx.fillStyle = textColor;
      ctx.font = `700 20px ${fontStack()}`;
      ctx.fillText(BRAND, SAFE, 1555);
    }
  } else if (layout === "editorial") {
    ctx.fillStyle = colors.accentDark;
    ctx.fillRect(SAFE, 82, 48, 5);
    ctx.fillStyle = colors.accentDark;
    ctx.font = `700 24px ${fontStack()}`;
    ctx.fillText(page.coverTag || state.category, SAFE, 138);
    ctx.fillStyle = colors.ink;
    ctx.font = `750 78px ${fontStack()}`;
    const title = drawLines(ctx, page.title || "主标题待填写", SAFE, 270, WIDTH - SAFE * 2, 92, 280);
    if (title.overflow) issues.push({ level: "error", message: "封面标题超出安全区" });
    ctx.fillStyle = colors.muted;
    ctx.font = `500 32px ${fontStack()}`;
    drawLines(ctx, page.subtitle, SAFE, title.bottom + 32, 940, 48, 100);
    if (image) drawImageInBox(ctx, image, { x: SAFE, y: 720, width: WIDTH - SAFE * 2, height: 720 }, page, 30);
    drawFooter(ctx, 0, colors);
  } else {
    ctx.fillStyle = colors.pale;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawPill(ctx, page.coverTag || state.category, SAFE, 82, { fill: "#FFFFFF", text: colors.accentDark }, 360);
    if (image) drawImageInBox(ctx, image, { x: SAFE, y: 190, width: WIDTH - SAFE * 2, height: 770 }, { ...page, imageFit: page.imageFit || "contain" }, 28);
    ctx.fillStyle = colors.ink;
    ctx.font = `750 68px ${fontStack()}`;
    const title = drawLines(ctx, page.title || "主标题待填写", SAFE, 1080, WIDTH - SAFE * 2, 82, 230);
    if (title.overflow) issues.push({ level: "error", message: "封面标题超出安全区" });
    ctx.fillStyle = colors.muted;
    ctx.font = `500 30px ${fontStack()}`;
    drawLines(ctx, page.subtitle, SAFE, title.bottom + 28, 980, 46, 96);
    drawFooter(ctx, 0, colors);
  }
}

function extraRows(page) {
  const rows = [];
  if (page.type === "signal") {
    if (page.publishDate) rows.push(`发布于 ${page.publishDate}`);
    if (page.eventDate) rows.push(`事件日期 ${page.eventDate}`);
    if (page.emphasis) rows.push(page.emphasis);
  }
  if (page.type === "overseas") {
    if (page.caseName) rows.push(`案例｜${page.caseName}`);
    if (page.useScene) rows.push(`场景｜${page.useScene}`);
    if (page.result) rows.push(page.result);
    if (page.quote) rows.push(page.quote);
  }
  if (page.type === "domestic") {
    if (page.audience) rows.push(`适合｜${page.audience}`);
    if (page.actionHint) rows.push(page.actionHint);
  }
  if (page.type === "judgment") {
    const metrics = [page.threshold && `门槛 ${page.threshold}`, page.potential && `潜力 ${page.potential}`, page.rating && `推荐 ${page.rating}/5`].filter(Boolean).join(" · ");
    if (metrics) rows.push(metrics);
    if (page.audience) rows.push(`适合｜${page.audience}`);
    if (page.summary) rows.push(page.summary);
    if (page.risk) rows.push(`风险提醒｜${page.risk}`);
  }
  return rows;
}

function rectBottom(rect) {
  return rect.y + rect.height;
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function pushIssue(issues, issue) {
  if (!issues.some((item) => item.message === issue.message)) issues.push(issue);
}

function drawContentMeta(ctx, index, colors, withImage) {
  const baseline = withImage ? 860 : 112;
  const label = `ASTA ONE ${String(index + 1).padStart(2, "0")}`;
  ctx.fillStyle = colors.muted;
  ctx.font = `600 25px ${fontStack()}`;
  ctx.fillText(label, SAFE, baseline);
  return { x: SAFE, y: baseline - 28, width: 260, height: 34 };
}

function drawTitleBlock(ctx, page, index, colors, sizes, issues, options = {}) {
  const baseline = options.baseline || TITLE_BASELINE;
  const lineHeight = Math.round(sizes.heading * 1.24);
  const maxHeight = lineHeight * 3;
  ctx.fillStyle = colors.ink;
  ctx.font = `750 ${sizes.heading}px ${fontStack()}`;
  const result = drawLines(ctx, page.heading || PAGE_DEFS[index].heading, SAFE, baseline, WIDTH - SAFE * 2, lineHeight, maxHeight);
  const visualTop = baseline - sizes.heading * .92;
  const visualBottom = result.visibleLines
    ? baseline + (result.visibleLines - 1) * lineHeight + sizes.heading * .28
    : visualTop;
  const rect = { x: SAFE, y: visualTop, width: WIDTH - SAFE * 2, height: Math.max(0, visualBottom - visualTop) };
  const labelRect = options.labelRect || { x: SAFE, y: 82, width: WIDTH - SAFE * 2, height: 48 };
  const safeTop = options.safeTop || 180;
  const safeBottom = options.safeBottom || 470;

  if (result.overflow) pushIssue(issues, { level: "error", message: `图 ${index + 1} 主标题换行后超出标题安全区，已阻止导出` });
  if (rect.x < SAFE || rect.x + rect.width > WIDTH - SAFE || rect.y < safeTop || rectBottom(rect) > safeBottom) {
    pushIssue(issues, { level: "error", message: `图 ${index + 1} 主标题超出独立安全区，已阻止导出` });
  }
  if (rectsIntersect(labelRect, rect)) {
    pushIssue(issues, { level: "error", message: `图 ${index + 1} 主标题与栏目标签发生碰撞，已阻止导出` });
  }
  return { rect, nextY: rectBottom(rect) + 52 };
}

function drawTagsBlock(ctx, page, top, colors, issues, index) {
  if (!state.showTags) return { rect: null, nextY: top };
  const allTags = tagsOf(page);
  const tags = allTags.slice(0, 3);
  if (allTags.length > 3) pushIssue(issues, { level: "warning", message: `图 ${index + 1} 仅显示前 3 个标签` });
  if (!tags.length) return { rect: null, nextY: top };
  const text = tags.join("  ·  ");
  ctx.fillStyle = colors.accentDark;
  ctx.font = `600 22px ${fontStack()}`;
  ctx.fillText(text, SAFE, top + 22);
  return { rect: { x: SAFE, y: top, width: WIDTH - SAFE * 2, height: 28 }, nextY: top + 48 };
}

function drawMediaFrame(ctx, image, page) {
  if (!image) return null;
  const layout = getMediaLayout({
    imageWidth: image.width,
    imageHeight: image.height,
    focusX: page.imagePositionX,
    focusY: page.imagePositionY,
    zoom: page.imageZoom,
  });
  const frame = layout.frame;
  ctx.save();
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
  ctx.clip();
  ctx.fillStyle = "#E8ECEE";
  ctx.fillRect(frame.x, frame.y, frame.width, frame.height);
  ctx.drawImage(image, layout.image.x, layout.image.y, layout.image.width, layout.image.height);
  ctx.restore();
  return frame;
}

function drawTextModule(ctx, page, index, top, maxBottom, colors, sizes, issues) {
  const extras = extraRows(page);
  const extraFontSize = 28;
  const extraLineHeight = 46;
  ctx.font = `500 ${extraFontSize}px ${fontStack()}`;
  const extraLayouts = extras.map((row) => {
    const lines = wrapLines(ctx, row, WIDTH - SAFE * 2);
    const visibleLines = Math.min(2, lines.length);
    return { row, lines, visibleLines, height: visibleLines * extraLineHeight + 22 };
  });
  const extrasHeight = extraLayouts.reduce((sum, item) => sum + item.height, 0) + (extras.length ? 28 : 0);
  const bodyTop = top;
  const bodyBaseline = bodyTop + sizes.body;
  const bodyMaxHeight = Math.max(0, maxBottom - bodyTop - extrasHeight);
  ctx.fillStyle = colors.body;
  ctx.font = `400 ${sizes.body}px ${fontStack()}`;
  const bodyResult = drawLines(ctx, bodyText(page) || "正文待填写", SAFE, bodyBaseline, 980, sizes.line, bodyMaxHeight);
  if (bodyResult.overflow) pushIssue(issues, { level: "error", message: `图 ${index + 1} 正文超出安全区，已阻止导出` });
  const bodyVisualBottom = bodyResult.visibleLines
    ? bodyBaseline + (bodyResult.visibleLines - 1) * sizes.line + sizes.body * .3
    : bodyTop;
  let y = bodyVisualBottom + (extras.length ? 40 : 0);

  extraLayouts.forEach((item, rowIndex) => {
    const highlight = (page.type === "overseas" && rowIndex >= 2) || (page.type === "judgment" && rowIndex >= 2) || (page.type === "signal" && rowIndex === extras.length - 1 && page.emphasis);
    ctx.fillStyle = highlight ? colors.accentDark : colors.body;
    ctx.font = `${highlight ? 650 : 500} ${extraFontSize}px ${fontStack()}`;
    const result = drawLines(ctx, item.row, SAFE, y + extraFontSize, WIDTH - SAFE * 2, extraLineHeight, extraLineHeight * 2);
    if (result.overflow) pushIssue(issues, { level: "error", message: `图 ${index + 1} 补充信息过长，已阻止导出` });
    const visualBottom = result.visibleLines
      ? y + extraFontSize + (result.visibleLines - 1) * extraLineHeight + extraFontSize * .3
      : y;
    y = visualBottom + 22;
  });

  const bottom = extras.length ? y - 22 : bodyVisualBottom;
  if (bottom > maxBottom) pushIssue(issues, { level: "error", message: `图 ${index + 1} 正文与补充信息超出安全区，已阻止导出` });
  return { rect: { x: SAFE, y: bodyTop, width: 980, height: Math.max(0, bottom - bodyTop) }, bottom };
}

function checkTitleCollisions(index, titleRect, moduleRects, issues) {
  moduleRects.filter(Boolean).forEach((moduleRect) => {
    if (rectsIntersect(titleRect, moduleRect)) {
      pushIssue(issues, { level: "error", message: `图 ${index + 1} 主标题与正文或图片发生碰撞，已阻止导出` });
    }
  });
}

function drawContentPage(ctx, page, index, image, issues) {
  const colors = theme();
  const sizes = density();
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const imageRect = drawMediaFrame(ctx, image, page);
  const withImage = Boolean(imageRect);
  const meta = drawContentMeta(ctx, index, colors, withImage);
  const title = drawTitleBlock(ctx, page, index, colors, sizes, issues, {
    baseline: withImage ? 950 : 240,
    labelRect: meta,
    safeTop: withImage ? 870 : 180,
    safeBottom: withImage ? 1190 : 470,
  });
  const tags = drawTagsBlock(ctx, page, title.nextY, colors, issues, index);
  const moduleRects = [meta, tags.rect];
  if (imageRect) moduleRects.push(imageRect);
  const textTop = tags.nextY;
  const text = drawTextModule(ctx, page, index, textTop, CONTENT_BOTTOM, colors, sizes, issues);
  moduleRects.push(text.rect);

  checkTitleCollisions(index, title.rect, moduleRects, issues);

  if (state.showSources && page.sourcePlatform) {
    ctx.fillStyle = colors.muted;
    ctx.font = `500 20px ${fontStack()}`;
    ctx.fillText(`来源：${page.sourcePlatform}${page.publishDate ? ` · ${page.publishDate}` : ""}`, SAFE, 1508);
  }
  drawFooter(ctx, index, colors);
}

async function renderPageCanvas(index, options = {}) {
  if (document.fonts?.ready) await document.fonts.ready;
  const page = state.pages[index];
  const canvas = options.canvas || document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  ctx.textBaseline = "alphabetic";
  const issues = basicIssues(index);
  let image = null;
  if (page.imageDataUrl) {
    try {
      image = await loadImage(page.imageDataUrl);
    } catch (error) {
      issues.push({ level: "error", message: `图 ${index + 1}：${error.message}` });
    }
  }
  if (index === 0) drawCover(ctx, page, image, issues);
  else drawContentPage(ctx, page, index, image, issues);
  if (options.safeArea ?? state.showSafeArea) drawSafeArea(ctx);
  return { canvas, issues };
}

function applyPreviewScale() {
  const scale = Number(state.previewScale || .30);
  $("previewCanvas").style.width = `${Math.round(WIDTH * scale)}px`;
  $("previewCanvas").style.height = `${Math.round(HEIGHT * scale)}px`;
}

async function renderPreview() {
  const renderId = ++previewRenderId;
  const result = await renderPageCanvas(state.selectedIndex, { canvas: $("previewCanvas") });
  if (renderId !== previewRenderId) return;
  applyPreviewScale();
  const errors = result.issues.filter((issue) => issue.level === "error");
  const warnings = result.issues.filter((issue) => issue.level === "warning");
  const notice = errors[0]?.message || warnings[0]?.message || "页面位于安全区内，可以继续编辑。";
  $("previewNotice").textContent = notice;
  $("previewNotice").className = `preview-notice ${errors.length ? "danger" : warnings.length ? "warning" : ""}`;
  $("pageState").textContent = errors.length ? "需要修正" : warnings.length ? "需要检查" : isPageComplete(state.selectedIndex) ? "已完成" : "编辑中";
  $("pageState").className = `page-state ${errors.length || warnings.length ? "warning" : isPageComplete(state.selectedIndex) ? "complete" : ""}`;
  $("overflowSummary").textContent = errors.find((issue) => /超出安全区/.test(issue.message))?.message || "";
}

function updatePageField(fieldName, value) {
  const page = currentPage();
  if (["overlayOpacity", "imagePositionX", "imagePositionY", "imageZoom"].includes(fieldName)) page[fieldName] = Number(value);
  else page[fieldName] = value;
  if (fieldName === "heading") {
    $("editorTitle").textContent = `编辑${String(value || PAGE_DEFS[state.selectedIndex].heading).trim()}`;
  }
  const hint = document.activeElement?.closest("label.field")?.querySelector(".field-hint");
  if (hint && fieldName === "body") {
    const count = bodyText(page).length;
    hint.textContent = `当前 ${count} 字；建议 180 字以内，最多 250 字。`;
    hint.className = `field-hint ${count > 250 ? "danger" : count > 180 ? "warning" : ""}`;
  }
  if (hint && (fieldName === "heading" || fieldName === "title")) {
    const count = String(value || "").trim().length;
    const cover = fieldName === "title";
    hint.textContent = cover ? `当前 ${count} 字，建议 12—22 字。` : `当前 ${count} 字；建议不超过 16 字，可自由修改或清空重写。`;
    hint.className = `field-hint ${count > (cover ? 32 : 20) ? "danger" : count > (cover ? 22 : 16) ? "warning" : ""}`;
  }
  renderNav();
  renderPreview();
  saveState();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(blob);
  });
}

async function prepareImageFile(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const maxSide = 1900;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("图片处理失败")), "image/jpeg", .88));
    return { dataUrl: await blobToDataUrl(blob), width: canvas.width, height: canvas.height };
  } finally {
    imageCache.delete(objectUrl);
    URL.revokeObjectURL(objectUrl);
  }
}

async function handleImage(file) {
  const page = currentPage();
  $("saveStatus").textContent = "正在处理图片…";
  try {
    const image = await prepareImageFile(file);
    Object.assign(page, {
      imageDataUrl: image.dataUrl,
      imageName: file.name,
      imageWidth: image.width,
      imageHeight: image.height,
      imageFit: "cover",
      imagePositionX: 50,
      imagePositionY: 50,
      imageZoom: 100,
    });
    renderEditor();
    renderNav();
    await renderPreview();
    saveState();
  } catch (error) {
    toast(`图片处理失败：${error.message}`);
  }
}

function safeName(value) {
  return String(value || "未命名").replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_").slice(0, 42);
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG 生成失败")), "image/png", 1));
}

function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function crc32(bytes) {
  let table = crc32.table;
  if (!table) table = crc32.table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let i = 0; i < 8; i += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  let crc = -1;
  for (const byte of bytes) crc = (crc >>> 8) ^ table[(crc ^ byte) & 255];
  return (crc ^ -1) >>> 0;
}

const u16 = (value) => new Uint8Array([value & 255, value >> 8 & 255]);
const u32 = (value) => new Uint8Array([value & 255, value >> 8 & 255, value >> 16 & 255, value >> 24 & 255]);

async function zip(files) {
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
    offset += local.reduce((sum, item) => sum + item.length, 0);
  }
  const size = central.reduce((sum, item) => sum + item.length, 0);
  return new Blob([...chunks, ...central, u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(size), u32(offset), u16(0)], { type: "application/zip" });
}

async function validatePage(index) {
  const result = await renderPageCanvas(index, { safeArea: false });
  return result.issues;
}

async function exportCurrent() {
  const result = await renderPageCanvas(state.selectedIndex, { safeArea: false });
  const blocking = result.issues.filter((issue) => issue.level === "error");
  if (blocking.length) {
    toast(`无法导出：${blocking[0].message}`);
    return;
  }
  const file = `astaone_${safeName(state.projectName)}_${String(state.selectedIndex + 1).padStart(2, "0")}.png`;
  downloadBlob(file, await canvasBlob(result.canvas));
}

async function exportAll() {
  const rendered = [];
  const errors = [];
  for (let index = 0; index < 6; index += 1) {
    const result = await renderPageCanvas(index, { safeArea: false });
    result.issues.filter((issue) => issue.level === "error").forEach((issue) => errors.push(issue.message));
    rendered.push(result.canvas);
  }
  if (errors.length) {
    toast(`暂不能导出：${errors[0]}`);
    await openOverview();
    return;
  }
  $("saveStatus").textContent = "正在生成 6 张 PNG…";
  const files = [];
  for (let index = 0; index < rendered.length; index += 1) {
    files.push({ name: `astaone_${safeName(state.projectName)}_${String(index + 1).padStart(2, "0")}.png`, blob: await canvasBlob(rendered[index]) });
  }
  downloadBlob(`astaone_${safeName(state.projectName)}.zip`, await zip(files));
  saveState();
  toast("6 张 PNG 已生成");
}

async function openOverview() {
  $("overviewTitle").textContent = `${state.projectName}｜${TEMPLATE_NAMES[state.template]}`;
  $("overviewGrid").innerHTML = "";
  const allIssues = [];
  for (let index = 0; index < 6; index += 1) {
    const result = await renderPageCanvas(index, { safeArea: false });
    allIssues.push(...result.issues);
    const item = document.createElement("article");
    item.className = "overview-item";
    result.canvas.dataset.overviewIndex = String(index);
    item.appendChild(result.canvas);
    const label = document.createElement("p");
    label.textContent = `图 ${index + 1}｜${index === 0 ? "封面" : state.pages[index].heading}`;
    item.appendChild(label);
    $("overviewGrid").appendChild(item);
  }
  const unique = [...new Set(allIssues.map((issue) => issue.message))];
  $("overviewIssues").innerHTML = unique.length ? `<div class="issue-list">${unique.map((message) => `<span class="issue-chip">${escapeHtml(message)}</span>`).join("")}</div>` : `<div class="issue-list"><span class="issue-chip ok">6 张图均通过安全区检查</span></div>`;
  if (!$("overviewDialog").open) $("overviewDialog").showModal();
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("toast").classList.remove("show"), 2400);
}

function renderAll() {
  hydrateProjectDialog();
  renderNav();
  renderEditor();
  renderPreview();
}

document.addEventListener("click", async (event) => {
  const pageButton = event.target.closest("[data-page-index]");
  if (pageButton) setCurrentPage(Number(pageButton.dataset.pageIndex));

  const modeButton = event.target.closest("[data-body-mode]");
  if (modeButton) {
    currentPage().bodyMode = modeButton.dataset.bodyMode;
    renderEditor();
    renderPreview();
    saveState();
  }

  if (event.target.closest("[data-remove-image]")) {
    Object.assign(currentPage(), { imageDataUrl: "", imageName: "", imageWidth: 0, imageHeight: 0 });
    renderAll();
    saveState();
  }

  if (event.target.id === "previousPageBtn") setCurrentPage(state.selectedIndex - 1);
  if (event.target.id === "nextPageBtn") setCurrentPage(state.selectedIndex + 1);
  if (event.target.id === "projectSettingsBtn") { hydrateProjectDialog(); $("projectDialog").showModal(); }
  if (event.target.id === "saveProjectSettingsBtn") { readProjectDialog(); $("projectDialog").close(); renderAll(); saveState(); }
  if (event.target.id === "newProjectBtn" && confirm("新建项目会清空当前编辑内容，确认继续？")) { state = defaultState(); renderAll(); saveState(); $("projectDialog").showModal(); }
  if (event.target.id === "duplicateProjectBtn") {
    const name = prompt("请输入新项目名称", `${state.projectName} 副本`);
    if (name?.trim()) { state.projectName = name.trim(); saveState(); hydrateProjectDialog(); toast("已另存为新项目"); }
  }
  if (event.target.id === "previewAllBtn") await openOverview();
  if (event.target.id === "closeOverviewBtn" || event.target.id === "backToEditBtn") $("overviewDialog").close();
  if (event.target.id === "exportCurrentBtn") await exportCurrent();
  if (event.target.id === "exportAllBtn" || event.target.id === "overviewExportBtn") await exportAll();
});

document.addEventListener("input", (event) => {
  const fieldName = event.target.dataset.field;
  if (fieldName) updatePageField(fieldName, event.target.value);
  const pointIndex = event.target.dataset.pointIndex;
  if (pointIndex !== undefined) {
    currentPage().points[Number(pointIndex)] = event.target.value;
    renderNav();
    renderPreview();
    saveState();
  }
  if (event.target.id === "previewScale") {
    state.previewScale = Number(event.target.value);
    applyPreviewScale();
    saveState();
  }
  if (event.target.id === "showSafeArea") {
    state.showSafeArea = event.target.checked;
    renderPreview();
    saveState();
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.matches("[data-image-upload]") && event.target.files?.[0]) await handleImage(event.target.files[0]);
});

$("overviewGrid").addEventListener("click", (event) => {
  const canvas = event.target.closest("canvas[data-overview-index]");
  if (!canvas) return;
  $("overviewDialog").close();
  setCurrentPage(Number(canvas.dataset.overviewIndex));
});

restoreState();
renderAll();
saveState();
