const departments = ["BD", "Operation", "Content", "CS"];
const priorityLabels = {
  high: "High Priority",
  normal: "Normal",
  low: "Low",
};
const categories = [
  {
    id: "todo",
    title: "TODO",
    hint: "需要执行的事项",
    keywords: [
      "todo",
      "to do",
      "要做",
      "需要做",
      "follow up",
      "跟进",
      "安排",
      "准备",
      "send",
      "update",
      "check",
      "submit",
      "create",
      "做",
    ],
  },
  {
    id: "pending",
    title: "Pending / Need Confirm",
    hint: "还没确认，需要 Coco 决定",
    keywords: [
      "pending",
      "confirm",
      "need confirm",
      "decide",
      "approval",
      "approve",
      "coco",
      "确认",
      "决定",
      "待确认",
      "需要coco",
      "需要 coco",
      "老板",
    ],
  },
  {
    id: "issues",
    title: "Issues / Blockers",
    hint: "卡住的问题",
    keywords: [
      "issue",
      "issues",
      "blocker",
      "blocked",
      "stuck",
      "delay",
      "cannot",
      "can't",
      "problem",
      "问题",
      "卡住",
      "延迟",
      "不能",
      "还没给",
      "没收到",
      "缺",
    ],
  },
];

const storageKey = "coforyou-meeting-board-v1";
// Paste the Google Apps Script Web App URL here after deployment.
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyUz6zHDX9XzY1PpC0tHdZJg8dAh4Bk3IK0559zQGGzWVlXs3fcaK5RX-tE0lYoOdeLFg/exec";
let activeDepartment = departments[0];
let activeTaskRef = null;
let currentView = "board";
let state = ensureStateShape(loadState());
let sheetSaveTimer = null;
let pendingPreviewTasks = [];
let recentTaskIds = new Set();
let lastCocoPendingCount = null;

const continuationPrefixes = [
  "后续优化",
  "备注",
  "补充",
  "说明",
  "details",
  "detail",
  "note",
  "notes",
  "description",
];

const departmentTabs = document.querySelector("#departmentTabs");
const inputPanel = document.querySelector("#inputPanel");
const boardHeader = document.querySelector("#boardHeader");
const activeDepartmentStats = document.querySelector("#activeDepartmentStats");
const activeDepartmentTitle = document.querySelector("#activeDepartmentTitle");
const boardDepartmentTitle = document.querySelector("#boardDepartmentTitle");
const meetingTitle = document.querySelector("#meetingTitle");
const meetingDate = document.querySelector("#meetingDate");
const defaultPriority = document.querySelector("#defaultPriority");
const summaryInput = document.querySelector("#summaryInput");
const organizeButton = document.querySelector("#organizeButton");
const clearInputButton = document.querySelector("#clearInputButton");
const previewPanel = document.querySelector("#previewPanel");
const previewList = document.querySelector("#previewList");
const confirmPreviewButton = document.querySelector("#confirmPreviewButton");
const cancelPreviewButton = document.querySelector("#cancelPreviewButton");
const listGrid = document.querySelector("#listGrid");
const completedSection = document.querySelector("#completedSection");
const completedList = document.querySelector("#completedList");
const completedCount = document.querySelector("#completedCount");
const cocoPendingView = document.querySelector("#cocoPendingView");
const cocoPendingList = document.querySelector("#cocoPendingList");
const cocoPendingTotal = document.querySelector("#cocoPendingTotal");
const taskModal = document.querySelector("#taskModal");
const modalDepartment = document.querySelector("#modalDepartment");
const modalTaskText = document.querySelector("#modalTaskText");
const modalCategory = document.querySelector("#modalCategory");
const modalPriority = document.querySelector("#modalPriority");
const modalMeetingTitle = document.querySelector("#modalMeetingTitle");
const modalDue = document.querySelector("#modalDue");
const modalNotes = document.querySelector("#modalNotes");
const closeModalButton = document.querySelector("#closeModalButton");
const cancelModalButton = document.querySelector("#cancelModalButton");
const saveTaskButton = document.querySelector("#saveTaskButton");
const deleteTaskButton = document.querySelector("#deleteTaskButton");
const toast = document.querySelector("#toast");

function getToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function createEmptyDepartment() {
  return categories.reduce((items, category) => {
    items[category.id] = [];
    return items;
  }, {});
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) return saved;
  } catch (error) {
    // Ignore broken local data and rebuild below.
  }

  return departments.reduce((board, department) => {
    board[department] = createEmptyDepartment();
    return board;
  }, {});
}

function ensureStateShape(savedState) {
  const nextState = savedState || {};
  departments.forEach((department) => {
    if (!nextState[department]) nextState[department] = createEmptyDepartment();
    categories.forEach((category) => {
      if (!Array.isArray(nextState[department][category.id])) nextState[department][category.id] = [];
    });
  });
  return nextState;
}

function saveState() {
  saveLocalState();
  queueSheetSave();
}

function saveLocalState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function flattenState() {
  return departments.flatMap((department) =>
    categories.flatMap((category) =>
      (state[department]?.[category.id] || []).map((task) => ({
        id: task.id,
        department,
        category: category.id,
        text: task.text || "",
        sectionTitle: task.sectionTitle || "",
        owner: task.owner || "",
        due: task.due || "",
        meetingTitle: task.meetingTitle || "",
        meetingDate: task.meetingDate || "",
        priority: task.priority || "normal",
        notes: task.notes || "",
        done: Boolean(task.done),
        cocoEmailSentAt: task.cocoEmailSentAt || "",
        updatedAt: task.updatedAt || new Date().toISOString(),
      }))
    )
  );
}

function stateFromRows(rows) {
  const nextState = departments.reduce((board, department) => {
    board[department] = createEmptyDepartment();
    return board;
  }, {});

  rows.forEach((row) => {
    const department = normalizeDepartment(row.department);
    const categoryId = normalizeCategory(row.category);
    if (!department || !categoryId) return;

    nextState[department][categoryId].push({
      id: row.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text: row.text || "",
      sectionTitle: row.sectionTitle || "",
      owner: row.owner || "",
      due: row.due || "",
      meetingTitle: row.meetingTitle || "Untitled Meeting",
      meetingDate: row.meetingDate || getToday(),
      priority: row.priority || "normal",
      notes: row.notes || "",
      category: categoryId,
      done: parseBoolean(row.done),
      cocoEmailSentAt: row.cocoEmailSentAt || "",
      updatedAt: row.updatedAt || new Date().toISOString(),
    });
  });

  return ensureStateShape(nextState);
}

function normalizeDepartment(value) {
  const text = String(value || "").trim().toLowerCase();
  return departments.find((department) => department.toLowerCase() === text) || "";
}

function normalizeCategory(value) {
  const text = String(value || "").trim().toLowerCase();
  const matched = categories.find(
    (category) => category.id === text || category.title.toLowerCase() === text
  );
  return matched?.id || "";
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  return ["true", "yes", "y", "1", "done", "已完成"].includes(text);
}

function loadSheetState() {
  if (!SHEET_API_URL) return;

  const callbackName = `coforyouMeetingSheet${Date.now()}${Math.random().toString(16).slice(2)}`;
  const separator = SHEET_API_URL.includes("?") ? "&" : "?";
  const script = document.createElement("script");
  let timeoutId = null;

  function cleanup() {
    window.clearTimeout(timeoutId);
    delete window[callbackName];
    script.remove();
  }

  window[callbackName] = (data) => {
    const rows = Array.isArray(data) ? data : data.tasks || [];
    state = stateFromRows(rows);
    saveLocalState();
    renderBoard();
    showToast("已同步 Google Sheet");
    cleanup();
  };

  script.onerror = () => {
    cleanup();
    showToast("Sheet 暂时同步不到，先用本地资料");
  };
  timeoutId = window.setTimeout(script.onerror, 8000);
  script.src = `${SHEET_API_URL}${separator}callback=${callbackName}&t=${Date.now()}`;
  document.body.appendChild(script);
}

function queueSheetSave() {
  if (!SHEET_API_URL) return;
  window.clearTimeout(sheetSaveTimer);
  sheetSaveTimer = window.setTimeout(saveSheetState, 650);
}

async function saveSheetState() {
  if (!SHEET_API_URL) return;

  const payload = JSON.stringify({ tasks: flattenState() });
  try {
    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({ payload }),
    });
  } catch (error) {
    showToast("Sheet 保存失败，已先存在本机");
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function parseSummary(text) {
  const rawLines = normalizeText(text)
    .split(/\n|\r/g)
    .map((line) => line.replace(/[\u2060]/g, ""))
    .filter((line) => line.trim());
  const tasks = [];
  let currentCategory = "todo";
  let currentTask = null;

  rawLines.forEach((rawLine) => {
    if (isSeparatorLine(rawLine)) return;

    const trimmedLine = rawLine.trim();
    const line = cleanSummaryLine(rawLine);
    if (!line) return;

    const explicitCategory = getExplicitCategory(line);
    if (explicitCategory && isCategoryOnlyLine(line)) {
      currentCategory = explicitCategory;
      currentTask = null;
      return;
    }

    const actionTask = parseActionTask(line);
    if (!isDescriptionLine(rawLine) && actionTask) {
      currentTask = addParsedTask(tasks, actionTask.title, explicitCategory || currentCategory);
      if (actionTask.detail) currentTask.details.push(actionTask.detail);
      return;
    }

    if (isDescriptionLine(rawLine) || (currentTask && isDetailLine(trimmedLine))) {
      if (currentTask) {
        currentTask.details.push(cleanDescriptionLine(rawLine));
      } else {
        currentTask = addParsedTask(tasks, cleanDescriptionLine(rawLine), explicitCategory || currentCategory);
      }
      return;
    }

    const categoryId = explicitCategory || currentCategory || classifyLine(line);
    const taskText = stripCategoryLabel(line);
    currentTask = addParsedTask(tasks, taskText, categoryId || currentCategory);
  });

  return tasks;
}

function classifyLine(line) {
  const explicitCategory = getExplicitCategory(line);
  if (explicitCategory) return explicitCategory;

  const lower = line.toLowerCase();
  const categoryScores = categories.map((category) => ({
    id: category.id,
    score: category.keywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length,
  }));

  categoryScores.sort((a, b) => b.score - a.score);
  return categoryScores[0].score > 0 ? categoryScores[0].id : "todo";
}

function getExplicitCategory(line) {
  const lower = line.toLowerCase().trim();
  if (/^(todo|to do)$/.test(lower)) return "todo";
  if (/^(pending|need confirm|confirm)$/.test(lower)) return "pending";
  if (/^(issue|issues|blocker|blockers)$/.test(lower)) return "issues";

  const labelMap = [
    { id: "todo", pattern: "todo|to do" },
    { id: "pending", pattern: "pending|need confirm|confirm" },
    { id: "issues", pattern: "issue|issues|blocker|blockers" },
  ];

  for (const item of labelMap) {
    const pattern = item.pattern;
    const leading = new RegExp(`^\\s*(?:\\[|\\(|#)?(?:${pattern})(?:\\]|\\))?\\s*[:：\\-—,，]?\\s+`, "i");
    const trailing = new RegExp(`\\s*(?:[:：\\-—,，]|\\s)\\s*(?:\\[|\\()?\\s*(?:${pattern})\\s*(?:\\]|\\))?\\s*$`, "i");
    if (leading.test(lower) || trailing.test(lower)) return item.id;
  }

  return "";
}

function stripCategoryLabel(line) {
  let cleaned = line.trim();
  const labels = "todo|to do|pending|need confirm|confirm|issue|issues|blocker|blockers";
  cleaned = cleaned.replace(new RegExp(`^\\s*(?:\\[|\\(|#)?(?:${labels})(?:\\]|\\))?\\s*[:：\\-—,，]?\\s+`, "i"), "");
  cleaned = cleaned.replace(new RegExp(`\\s*(?:[:：\\-—,，]|\\s)\\s*(?:\\[|\\()?\\s*(?:${labels})\\s*(?:\\]|\\))?\\s*$`, "i"), "");
  return cleaned.trim();
}

function isCategoryOnlyLine(line) {
  return /^(todo|to do|pending|need confirm|confirm|issue|issues|blocker|blockers)$/i.test(line.trim());
}

function findOwner(line) {
  const ownerMatch =
    line.match(/(?:owner|pic|负责人)[:：]\s*([A-Za-z\u4e00-\u9fa5 ]{2,18})/i) ||
    line.match(/@([A-Za-z\u4e00-\u9fa5]{2,18})/);
  return ownerMatch ? ownerMatch[1].trim() : "负责人待补充";
}

function findDate(line) {
  const dateMatch =
    line.match(/\b\d{1,2}\/\d{1,2}\b/) ||
    line.match(/\b\d{4}-\d{1,2}-\d{1,2}\b/) ||
    line.match(/(?:today|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday|今天|明天|周一|周二|周三|周四|周五|周六|周日)/i);
  return dateMatch ? dateMatch[0] : "日期待补充";
}

function addParsedTask(tasks, text, categoryId) {
  const task = {
    text: text || "待补充事项",
    categoryId,
    sectionTitle: "",
    details: [],
  };
  tasks.push(task);
  return task;
}

function parseActionTask(line) {
  const actionMatch = line.match(/^(?:action|行动|下一步)[:：]\s*(.+)$/i);
  const content = actionMatch ? actionMatch[1].trim() : line.trim();
  const bracketMatch = content.match(/^(【[^】]+】)(.*)$/);
  if (!bracketMatch) return null;

  return {
    title: bracketMatch[1].trim(),
    detail: bracketMatch[2].trim(),
  };
}

function isDetailLine(line) {
  const cleaned = line.trim();
  if (/^https?:\/\//i.test(cleaned)) return true;
  return continuationPrefixes.some((prefix) => cleaned.toLowerCase().startsWith(prefix.toLowerCase()));
}

function isDescriptionLine(line) {
  const raw = String(line || "");
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^\s+/.test(raw)) return true;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (/^\s*(?:[-*•·]|[▪◦○●]|[🌟⭐️✅])/.test(raw)) return true;
  if (/^\s*(?:\d+\s*[.)、。]|\d+\u20e3\ufe0f?)/.test(raw)) return true;
  if (/^\s*[A-Za-z]\s*[.)、:：-]/.test(raw)) return true;
  return false;
}

function cleanDescriptionLine(line) {
  return String(line || "")
    .replace(/[\u2060]/g, "")
    .trim()
    .replace(/^\s*(?:[-*•·]|[▪◦○●]|[🌟⭐️✅])\s*/u, "")
    .replace(/^\s*(?:\d+\s*[.)、。]|\d+\u20e3\ufe0f?)\s*/, "")
    .replace(/^\s*[A-Za-z]\s*[.)、:：-]\s*/, "")
    .trim();
}

function isSeparatorLine(line) {
  return /^[﹉_\-=—\s]+$/.test(line);
}

function cleanSummaryLine(line) {
  return line
    .replace(/[\u2060]/g, "")
    .replace(/^\s*(?:[-*•·]|[▪◦○●]|[🌟⭐️✅])\s*/u, "")
    .trim();
}

function createTask(parsedTask, categoryId) {
  const text = stripCategoryLabel(parsedTask.text) || parsedTask.text;
  const title = meetingTitle.value.trim() || `${activeDepartment} Meeting`;
  const notes = parsedTask.details.join("\n");
  const searchText = `${text}\n${notes}`;
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    sectionTitle: parsedTask.sectionTitle || "",
    owner: findOwner(searchText),
    due: findDate(searchText),
    meetingTitle: title,
    meetingDate: meetingDate.value || getToday(),
    priority: defaultPriority.value || "normal",
    notes,
    category: categoryId,
    done: false,
    cocoEmailSentAt: "",
    updatedAt: new Date().toISOString(),
  };
}

function organizeSummary() {
  const parsedTasks = parseSummary(summaryInput.value);
  if (!parsedTasks.length) return;

  pendingPreviewTasks = parsedTasks;
  renderPreview();
  showToast(`已预览 ${parsedTasks.length} 个事项`);
}

function renderPreview() {
  previewPanel.hidden = !pendingPreviewTasks.length;
  previewList.innerHTML = pendingPreviewTasks.length
    ? pendingPreviewTasks
        .map(
          (task, index) => `
            <article class="preview-item" data-preview-index="${index}">
              <div class="preview-item-head">
                <span class="preview-number">${index + 1}</span>
                <button class="preview-remove" type="button" data-preview-remove="${index}">移除</button>
              </div>
              <label class="field">
                <span>分类</span>
                <select data-preview-field="categoryId">
                  ${categories
                    .map(
                      (category) =>
                        `<option value="${category.id}" ${category.id === task.categoryId ? "selected" : ""}>${escapeHtml(
                          category.title
                        )}</option>`
                    )
                    .join("")}
                </select>
              </label>
              <label class="field">
                <span>外面会显示的事项</span>
                <input data-preview-field="text" type="text" value="${escapeAttribute(task.text || "")}" />
              </label>
              <label class="field">
                <span>点进去才会看到的 Description</span>
                <textarea data-preview-field="details">${escapeHtml((task.details || []).join("\n"))}</textarea>
              </label>
            </article>
          `
        )
        .join("")
    : "";
}

function collectPreviewTasks() {
  return Array.from(previewList.querySelectorAll(".preview-item"))
    .map((item) => {
      const getField = (field) => item.querySelector(`[data-preview-field="${field}"]`)?.value.trim() || "";
      return {
        categoryId: getField("categoryId") || "todo",
        sectionTitle: "",
        text: getField("text") || "待补充事项",
        details: getField("details")
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      };
    })
    .filter((task) => task.text);
}

function syncPreviewTasksFromDom() {
  pendingPreviewTasks = collectPreviewTasks();
}

function confirmPreviewTasks() {
  const previewTasks = collectPreviewTasks();
  if (!previewTasks.length) return;
  if (!state[activeDepartment]) state[activeDepartment] = createEmptyDepartment();

  previewTasks
    .slice()
    .reverse()
    .forEach((parsedTask) => {
      const categoryId = parsedTask.categoryId || "todo";
      const task = createTask(parsedTask, categoryId);
      recentTaskIds.add(task.id);
      state[activeDepartment][categoryId].unshift(task);
    });

  saveState();
  pendingPreviewTasks = [];
  previewPanel.hidden = true;
  previewList.innerHTML = "";
  summaryInput.value = "";
  showToast(`已加入 ${previewTasks.length} 个事项`);
  renderBoard();
  window.setTimeout(() => {
    recentTaskIds.clear();
    renderBoard();
  }, 1800);
}

function cancelPreview() {
  pendingPreviewTasks = [];
  previewPanel.hidden = true;
  previewList.innerHTML = "";
}

function renderDepartments() {
  const departmentButtons = departments
    .map((department) => {
      const mood = getDepartmentMood(department);
      return `
        <button class="department-tab${currentView === "board" && department === activeDepartment ? " active" : ""}" type="button" data-department="${department}">
          <span>${department}</span>
          <small class="${mood.className}">${mood.label}</small>
        </button>
      `;
    })
    .join("");
  departmentTabs.innerHTML = `
    ${departmentButtons}
    <button class="coco-pending-button${currentView === "coco" ? " active" : ""}" id="cocoPendingButton" type="button" data-coco-pending>
      Coco Pending <span id="cocoPendingBadge">0</span>
    </button>
  `;
  activeDepartmentTitle.textContent = activeDepartment;
  boardDepartmentTitle.textContent = `${activeDepartment} Department`;
  renderActiveDepartmentStats();
  renderCocoPendingBadge();
}

function renderBoard() {
  renderDepartments();
  setViewVisibility();
  if (currentView === "coco") {
    renderCocoPendingView();
    return;
  }

  const departmentBoard = state[activeDepartment] || createEmptyDepartment();

  listGrid.innerHTML = categories
    .map((category) => {
      const tasks = sortTasksByPriority((departmentBoard[category.id] || []).filter((task) => !task.done));
      const taskHtml = tasks.length
        ? tasks
            .map(
              (task) => `
                <div class="${getTaskCardClass(task)}">
                  <input type="checkbox" data-category="${category.id}" data-task="${task.id}" ${task.done ? "checked" : ""} />
                  <button class="task-open" type="button" data-department="${activeDepartment}" data-category="${category.id}" data-task="${task.id}">
                    <span class="task-title-line">${renderTaskTitle(task)}</span>
                    <span class="task-source">
                      <span>${escapeHtml(task.meetingTitle || "Untitled Meeting")}</span>
                      <span class="priority-pill ${getPriorityClass(task.priority)}">${escapeHtml(priorityLabels[task.priority] || "Normal")}</span>
                      <span>${escapeHtml(formatUpdatedAt(task.updatedAt))}</span>
                    </span>
                    ${task.notes ? `<span class="task-note-peek">${escapeHtml(getNotePreview(task.notes))}</span>` : ""}
                  </button>
                </div>
              `
            )
            .join("")
        : `<div class="empty-state">${escapeHtml(getEmptyStateText(category.id))}</div>`;

      return `
        <article class="task-list category-${category.id}">
          <div class="list-title">
            <div>
              <strong>${escapeHtml(category.title)}</strong>
              <p class="eyebrow">${escapeHtml(category.hint)}</p>
            </div>
            <span class="count-pill">${tasks.length}</span>
          </div>
          <div class="task-items">${taskHtml}</div>
        </article>
      `;
    })
    .join("");
  renderCompletedTasks(departmentBoard);
}

function getDepartmentCounts(department) {
  const board = state[department] || createEmptyDepartment();
  const openCount = categories.reduce(
    (sum, category) => sum + (board[category.id] || []).filter((task) => !task.done).length,
    0
  );
  const pendingCount = (board.pending || []).filter((task) => !task.done).length;
  const issueCount = (board.issues || []).filter((task) => !task.done).length;
  const doneCount = categories.reduce(
    (sum, category) => sum + (board[category.id] || []).filter((task) => task.done).length,
    0
  );
  return { openCount, pendingCount, issueCount, doneCount };
}

function getDepartmentMood(department) {
  const counts = getDepartmentCounts(department);
  if (counts.pendingCount) return { label: `${counts.pendingCount} Coco`, className: "mood-alert" };
  if (counts.issueCount) return { label: `${counts.issueCount} issue`, className: "mood-alert" };
  if (counts.openCount) return { label: `${counts.openCount} open`, className: "mood-live" };
  return { label: "clear", className: "mood-clear" };
}

function renderActiveDepartmentStats() {
  const counts = getDepartmentCounts(activeDepartment);
  activeDepartmentStats.innerHTML = `
    <span><strong>${counts.openCount}</strong> open</span>
    <span class="${counts.pendingCount ? "stat-alert" : ""}"><strong>${counts.pendingCount}</strong> pending</span>
    <span class="${counts.issueCount ? "stat-alert" : ""}"><strong>${counts.issueCount}</strong> issue</span>
  `;
}

function setViewVisibility() {
  const isCocoView = currentView === "coco";
  inputPanel.hidden = isCocoView;
  boardHeader.hidden = isCocoView;
  listGrid.hidden = isCocoView;
  completedSection.hidden = isCocoView;
  cocoPendingView.hidden = !isCocoView;
}

function getCocoPendingTasks() {
  return sortTasksByPriority(
    departments.flatMap((department) =>
      (state[department]?.pending || [])
      .filter((task) => !task.done)
      .map((task) => ({ ...task, department, categoryId: "pending" }))
    )
  );
}

function renderCocoPendingBadge() {
  const count = getCocoPendingTasks().length;
  const badge = document.querySelector("#cocoPendingBadge");
  const button = document.querySelector("#cocoPendingButton");
  if (badge) badge.textContent = count;
  if (button) {
    button.classList.toggle("has-items", count > 0);
    if (lastCocoPendingCount !== null && count !== lastCocoPendingCount) {
      button.classList.remove("badge-bounce");
      void button.offsetWidth;
      button.classList.add("badge-bounce");
    }
  }
  lastCocoPendingCount = count;
}

function renderCocoPendingView() {
  const pendingTasks = getCocoPendingTasks();
  cocoPendingTotal.textContent = pendingTasks.length;
  cocoPendingList.innerHTML = pendingTasks.length
    ? pendingTasks
        .map(
          (task) => `
            <article class="${getTaskCardClass(task, "coco-pending-card")}">
              <div class="coco-card-top">
                <span class="department-pill">${escapeHtml(task.department)}</span>
                <span class="priority-pill ${getPriorityClass(task.priority)}">${escapeHtml(priorityLabels[task.priority] || "Normal")}</span>
              </div>
              <button class="task-open coco-task-open" type="button" data-department="${escapeAttribute(task.department)}" data-category="pending" data-task="${escapeAttribute(task.id)}">
                <span class="task-title-line">${renderTaskTitle(task)}</span>
                <span class="task-source">
                  <span>${escapeHtml(task.meetingTitle || "Untitled Meeting")}</span>
                  ${task.due ? `<span>Due ${escapeHtml(task.due)}</span>` : ""}
                  <span>${escapeHtml(formatUpdatedAt(task.updatedAt))}</span>
                </span>
              </button>
              ${task.notes ? `<p class="coco-note-preview">${escapeHtml(task.notes.slice(0, 180))}</p>` : ""}
              <label class="coco-done">
                <input type="checkbox" data-department="${escapeAttribute(task.department)}" data-category="pending" data-task="${escapeAttribute(task.id)}" />
                <span>已处理</span>
              </label>
            </article>
          `
        )
        .join("")
    : '<div class="empty-state">No Coco decision needed. Clear for now.</div>';
}

function renderCompletedTasks(departmentBoard) {
  const completedTasks = categories.flatMap((category) =>
    (departmentBoard[category.id] || [])
      .filter((task) => task.done)
      .map((task) => ({ ...task, categoryId: category.id, categoryTitle: category.title }))
  );

  completedCount.textContent = completedTasks.length;
  completedList.innerHTML = completedTasks.length
    ? completedTasks
        .map(
          (task) => `
            <div class="task-item done completed-task">
              <input type="checkbox" data-category="${task.categoryId}" data-task="${task.id}" checked />
              <button class="task-open" type="button" data-department="${activeDepartment}" data-category="${task.categoryId}" data-task="${task.id}">
                <span class="task-title-line">${renderTaskTitle(task)}</span>
                <span class="task-source">
                  <span>${escapeHtml(task.meetingTitle || "Untitled Meeting")}</span>
                  <span class="priority-pill ${getPriorityClass(task.priority)}">${escapeHtml(priorityLabels[task.priority] || "Normal")}</span>
                  <span>${escapeHtml(formatUpdatedAt(task.updatedAt))}</span>
                </span>
                <span class="completed-category">${escapeHtml(task.categoryTitle)}</span>
              </button>
            </div>
          `
        )
        .join("")
    : '<div class="empty-state">Done list is empty for now.</div>';
}

function getTask(department, categoryId, taskId) {
  const departmentBoard = state[department] || createEmptyDepartment();
  const tasks = departmentBoard[categoryId] || [];
  return tasks.find((task) => task.id === taskId);
}

function openTaskModal(categoryId, taskId, department = activeDepartment) {
  const task = getTask(department, categoryId, taskId);
  if (!task) return;

  activeTaskRef = { department, categoryId, taskId };
  modalDepartment.textContent = `${department} · ${categories.find((category) => category.id === categoryId)?.title || ""}`;
  modalTaskText.value = task.text || "";
  modalPriority.value = task.priority || "normal";
  modalMeetingTitle.value = task.meetingTitle || "";
  modalDue.value = task.due || "";
  modalNotes.value = task.notes || "";
  modalCategory.innerHTML = categories
    .map(
      (category) =>
        `<option value="${category.id}" ${category.id === categoryId ? "selected" : ""}>${escapeHtml(category.title)}</option>`
    )
    .join("");
  taskModal.showModal();
}

function closeTaskModal() {
  activeTaskRef = null;
  taskModal.close();
}

function saveModalTask() {
  if (!activeTaskRef) return;
  const { department, categoryId, taskId } = activeTaskRef;
  const departmentBoard = state[department];
  const currentTasks = departmentBoard[categoryId] || [];
  const taskIndex = currentTasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return;

  const task = currentTasks[taskIndex];
  task.text = modalTaskText.value.trim() || task.text;
  task.sectionTitle = "";
  task.priority = modalPriority.value || "normal";
  task.meetingTitle = modalMeetingTitle.value.trim() || "Untitled Meeting";
  task.due = modalDue.value.trim();
  task.notes = modalNotes.value.trim();
  task.updatedAt = new Date().toISOString();

  const nextCategoryId = modalCategory.value;
  if (nextCategoryId !== categoryId) {
    task.category = nextCategoryId;
    currentTasks.splice(taskIndex, 1);
    departmentBoard[nextCategoryId].unshift(task);
    activeTaskRef = { department, categoryId: nextCategoryId, taskId };
  }

  saveState();
  renderBoard();
  closeTaskModal();
}

function deleteModalTask() {
  if (!activeTaskRef) return;
  const { department, categoryId, taskId } = activeTaskRef;
  const tasks = state[department][categoryId] || [];
  state[department][categoryId] = tasks.filter((task) => task.id !== taskId);
  saveState();
  renderBoard();
  closeTaskModal();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("\n", "&#10;");
}

function renderTaskTitle(task) {
  const text = normalizeText(task.text);
  return `<span class="task-text">${escapeHtml(text)}</span>`;
}

function sortTasksByPriority(tasks) {
  const priorityRank = { high: 0, normal: 1, low: 2 };
  return tasks.slice().sort((a, b) => {
    const priorityDiff = (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
    if (priorityDiff) return priorityDiff;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function getEmptyStateText(categoryId) {
  if (categoryId === "todo") return "Clear for now. No action needed.";
  if (categoryId === "pending") return "No Coco decision needed.";
  if (categoryId === "issues") return "No blockers. Good.";
  return "Nothing here yet.";
}

function getNotePreview(notes) {
  const firstLine = String(notes || "")
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstLine) return "";
  return firstLine.length > 96 ? `${firstLine.slice(0, 96)}...` : firstLine;
}

function formatUpdatedAt(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Updated now";
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return "Updated today";
  if (diffDays === 1) return "Updated 1d ago";
  if (diffDays < 7) return `Updated ${diffDays}d ago`;
  return `Updated ${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
}

function getPriorityClass(priority) {
  if (priority === "high") return "priority-high";
  if (priority === "low") return "priority-low";
  return "priority-normal";
}

function getPriorityItemClass(priority) {
  if (priority === "high") return "priority-item-high";
  if (priority === "low") return "priority-item-low";
  return "priority-item-normal";
}

function getTaskCardClass(task, baseClass = "task-item") {
  return [
    baseClass,
    getPriorityItemClass(task.priority),
    task.done ? "done" : "",
    recentTaskIds.has(task.id) ? "task-new" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

departmentTabs.addEventListener("click", (event) => {
  const pendingButton = event.target.closest("[data-coco-pending]");
  if (pendingButton) {
    currentView = "coco";
    cancelPreview();
    renderBoard();
    return;
  }

  const button = event.target.closest(".department-tab");
  if (!button) return;
  activeDepartment = button.dataset.department;
  currentView = "board";
  renderBoard();
});

document.addEventListener("change", (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox || !checkbox.dataset.category || !checkbox.dataset.task) return;

  const department = checkbox.dataset.department || activeDepartment;
  const departmentBoard = state[department];
  const tasks = departmentBoard[checkbox.dataset.category] || [];
  const task = tasks.find((item) => item.id === checkbox.dataset.task);
  if (!task) return;
  if (checkbox.checked && !task.done) {
    const card = checkbox.closest(".task-item, .coco-pending-card");
    if (card) card.classList.add("task-completing");
    showToast("Done. Moving to completed.");
    window.setTimeout(() => {
      task.done = true;
      task.updatedAt = new Date().toISOString();
      saveState();
      renderBoard();
    }, 240);
    return;
  }
  task.done = checkbox.checked;
  task.updatedAt = new Date().toISOString();
  saveState();
  renderBoard();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".task-open");
  if (!button) return;
  openTaskModal(button.dataset.category, button.dataset.task, button.dataset.department || activeDepartment);
});

organizeButton.addEventListener("click", organizeSummary);
clearInputButton.addEventListener("click", () => {
  summaryInput.value = "";
  cancelPreview();
});
confirmPreviewButton.addEventListener("click", confirmPreviewTasks);
cancelPreviewButton.addEventListener("click", cancelPreview);
previewList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-preview-remove]");
  if (!removeButton) return;
  syncPreviewTasksFromDom();
  const index = Number(removeButton.dataset.previewRemove);
  pendingPreviewTasks.splice(index, 1);
  renderPreview();
});
closeModalButton.addEventListener("click", closeTaskModal);
cancelModalButton.addEventListener("click", closeTaskModal);
saveTaskButton.addEventListener("click", saveModalTask);
deleteTaskButton.addEventListener("click", deleteModalTask);

taskModal.addEventListener("click", (event) => {
  if (event.target === taskModal) closeTaskModal();
});

meetingDate.value = getToday();
renderBoard();
loadSheetState();
