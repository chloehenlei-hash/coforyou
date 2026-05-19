const departments = ["BD", "Operation", "Content", "CS"];
const priorityLabels = {
  high: "High",
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
let state = ensureStateShape(loadState());
let sheetSaveTimer = null;

const departmentTabs = document.querySelector("#departmentTabs");
const departmentSummary = document.querySelector("#departmentSummary");
const activeDepartmentTitle = document.querySelector("#activeDepartmentTitle");
const boardDepartmentTitle = document.querySelector("#boardDepartmentTitle");
const meetingTitle = document.querySelector("#meetingTitle");
const meetingDate = document.querySelector("#meetingDate");
const defaultPriority = document.querySelector("#defaultPriority");
const summaryInput = document.querySelector("#summaryInput");
const organizeButton = document.querySelector("#organizeButton");
const clearInputButton = document.querySelector("#clearInputButton");
const listGrid = document.querySelector("#listGrid");
const completedList = document.querySelector("#completedList");
const completedCount = document.querySelector("#completedCount");
const taskModal = document.querySelector("#taskModal");
const modalDepartment = document.querySelector("#modalDepartment");
const modalTaskText = document.querySelector("#modalTaskText");
const modalCategory = document.querySelector("#modalCategory");
const modalPriority = document.querySelector("#modalPriority");
const modalOwner = document.querySelector("#modalOwner");
const modalMeetingTitle = document.querySelector("#modalMeetingTitle");
const modalDue = document.querySelector("#modalDue");
const modalMeetingDate = document.querySelector("#modalMeetingDate");
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
        owner: task.owner || "",
        due: task.due || "",
        meetingTitle: task.meetingTitle || "",
        meetingDate: task.meetingDate || "",
        priority: task.priority || "normal",
        notes: task.notes || "",
        done: Boolean(task.done),
        updatedAt: new Date().toISOString(),
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
      owner: row.owner || "",
      due: row.due || "",
      meetingTitle: row.meetingTitle || "Untitled Meeting",
      meetingDate: row.meetingDate || getToday(),
      priority: row.priority || "normal",
      notes: row.notes || "",
      category: categoryId,
      done: parseBoolean(row.done),
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

function splitSummary(text) {
  return normalizeText(text)
    .split(/\n|•|·|。|；|;|\r/g)
    .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
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

function createTask(line, categoryId) {
  const text = stripCategoryLabel(line) || line;
  const title = meetingTitle.value.trim() || `${activeDepartment} Meeting`;
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    owner: findOwner(text),
    due: findDate(text),
    meetingTitle: title,
    meetingDate: meetingDate.value || getToday(),
    priority: defaultPriority.value || "normal",
    notes: "",
    category: categoryId,
    done: false,
  };
}

function organizeSummary() {
  const lines = splitSummary(summaryInput.value);
  if (!lines.length) return;

  if (!state[activeDepartment]) state[activeDepartment] = createEmptyDepartment();

  lines.forEach((line) => {
    const categoryId = classifyLine(line);
    state[activeDepartment][categoryId].unshift(createTask(line, categoryId));
  });

  saveState();
  summaryInput.value = "";
  showToast(`已整理 ${lines.length} 个事项`);
  renderBoard();
}

function renderDepartments() {
  departmentTabs.innerHTML = departments
    .map(
      (department) => `
        <button class="department-tab${department === activeDepartment ? " active" : ""}" type="button" data-department="${department}">
          ${department}
        </button>
      `
    )
    .join("");
  activeDepartmentTitle.textContent = activeDepartment;
  boardDepartmentTitle.textContent = `${activeDepartment} Department`;
}

function renderBoard() {
  renderDepartments();
  renderDepartmentSummary();
  const departmentBoard = state[activeDepartment] || createEmptyDepartment();

  listGrid.innerHTML = categories
    .map((category) => {
      const tasks = (departmentBoard[category.id] || []).filter((task) => !task.done);
      const taskHtml = tasks.length
        ? tasks
            .map(
              (task) => `
                <div class="task-item${task.done ? " done" : ""}">
                  <input type="checkbox" data-category="${category.id}" data-task="${task.id}" ${task.done ? "checked" : ""} />
                  <button class="task-open" type="button" data-category="${category.id}" data-task="${task.id}">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <span class="task-source">
                      <span>${escapeHtml(task.meetingTitle || "Untitled Meeting")}</span>
                      <span class="priority-pill ${getPriorityClass(task.priority)}">${escapeHtml(priorityLabels[task.priority] || "Normal")}</span>
                    </span>
                  </button>
                </div>
              `
            )
            .join("")
        : `<div class="empty-state">${escapeHtml(category.hint)}</div>`;

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

function renderDepartmentSummary() {
  departmentSummary.innerHTML = departments
    .map((department) => {
      const counts = getDepartmentCounts(department);
      return `
        <button class="summary-card${department === activeDepartment ? " active" : ""}${
          counts.pendingCount ? " has-pending" : ""
        }" type="button" data-department="${department}">
          <strong>${department}</strong>
          <span>${counts.openCount} open</span>
          <span>${counts.pendingCount} pending</span>
          <span>${counts.issueCount} issue</span>
        </button>
      `;
    })
    .join("");
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
              <button class="task-open" type="button" data-category="${task.categoryId}" data-task="${task.id}">
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-source">
                  <span>${escapeHtml(task.meetingTitle || "Untitled Meeting")}</span>
                  <span class="priority-pill ${getPriorityClass(task.priority)}">${escapeHtml(priorityLabels[task.priority] || "Normal")}</span>
                </span>
                <span class="completed-category">${escapeHtml(task.categoryTitle)}</span>
              </button>
            </div>
          `
        )
        .join("")
    : '<div class="empty-state">还没有完成事项。</div>';
}

function getTask(categoryId, taskId) {
  const departmentBoard = state[activeDepartment] || createEmptyDepartment();
  const tasks = departmentBoard[categoryId] || [];
  return tasks.find((task) => task.id === taskId);
}

function openTaskModal(categoryId, taskId) {
  const task = getTask(categoryId, taskId);
  if (!task) return;

  activeTaskRef = { categoryId, taskId };
  modalDepartment.textContent = `${activeDepartment} · ${categories.find((category) => category.id === categoryId)?.title || ""}`;
  modalTaskText.value = task.text || "";
  modalPriority.value = task.priority || "normal";
  modalOwner.value = task.owner || "";
  modalMeetingTitle.value = task.meetingTitle || "";
  modalDue.value = task.due || "";
  modalMeetingDate.value = task.meetingDate || getToday();
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
  const { categoryId, taskId } = activeTaskRef;
  const departmentBoard = state[activeDepartment];
  const currentTasks = departmentBoard[categoryId] || [];
  const taskIndex = currentTasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) return;

  const task = currentTasks[taskIndex];
  task.text = modalTaskText.value.trim() || task.text;
  task.priority = modalPriority.value || "normal";
  task.owner = modalOwner.value.trim();
  task.meetingTitle = modalMeetingTitle.value.trim() || "Untitled Meeting";
  task.due = modalDue.value.trim();
  task.meetingDate = modalMeetingDate.value || getToday();
  task.notes = modalNotes.value.trim();

  const nextCategoryId = modalCategory.value;
  if (nextCategoryId !== categoryId) {
    task.category = nextCategoryId;
    currentTasks.splice(taskIndex, 1);
    departmentBoard[nextCategoryId].unshift(task);
    activeTaskRef = { categoryId: nextCategoryId, taskId };
  }

  saveState();
  renderBoard();
  closeTaskModal();
}

function deleteModalTask() {
  if (!activeTaskRef) return;
  const { categoryId, taskId } = activeTaskRef;
  const tasks = state[activeDepartment][categoryId] || [];
  state[activeDepartment][categoryId] = tasks.filter((task) => task.id !== taskId);
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

function getPriorityClass(priority) {
  if (priority === "high") return "priority-high";
  if (priority === "low") return "priority-low";
  return "priority-normal";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

departmentTabs.addEventListener("click", (event) => {
  const button = event.target.closest(".department-tab");
  if (!button) return;
  activeDepartment = button.dataset.department;
  renderBoard();
});

departmentSummary.addEventListener("click", (event) => {
  const button = event.target.closest(".summary-card");
  if (!button) return;
  activeDepartment = button.dataset.department;
  renderBoard();
});

document.addEventListener("change", (event) => {
  const checkbox = event.target.closest('input[type="checkbox"]');
  if (!checkbox || !checkbox.dataset.category || !checkbox.dataset.task) return;

  const departmentBoard = state[activeDepartment];
  const tasks = departmentBoard[checkbox.dataset.category] || [];
  const task = tasks.find((item) => item.id === checkbox.dataset.task);
  if (!task) return;
  task.done = checkbox.checked;
  saveState();
  renderBoard();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(".task-open");
  if (!button) return;
  openTaskModal(button.dataset.category, button.dataset.task);
});

organizeButton.addEventListener("click", organizeSummary);
clearInputButton.addEventListener("click", () => {
  summaryInput.value = "";
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
