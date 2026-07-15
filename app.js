const departments = ["Team"];
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
const minutesStorageKey = "coforyou-meeting-minutes-v1";
const liveStorageKey = "coforyou-live-meeting-v1";
const participantStorageKey = "coforyou-meeting-participant-v1";
const paletteStorageKey = "coforyou-meeting-board-palette-v2";
// Paste the Google Apps Script Web App URL here after deployment.
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyUz6zHDX9XzY1PpC0tHdZJg8dAh4Bk3IK0559zQGGzWVlXs3fcaK5RX-tE0lYoOdeLFg/exec";
let activeDepartment = departments[0];
let activeTaskRef = null;
let currentView = "board";
let pageMode = "home";
let state = ensureStateShape(loadState());
let meetingMinutes = ensureMinutesShape(loadMinutes());
let liveParticipants = ensureLiveParticipants(loadLiveParticipants());
let sheetSaveTimer = null;
let sheetRefreshTimer = null;
let liveSaveTimer = null;
let pendingPreviewTasks = [];
let recentTaskIds = new Set();
let lastCocoPendingCount = null;
let currentParticipantId = localStorage.getItem(participantStorageKey) || "";

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
const livePanel = document.querySelector("#livePanel");
const participantName = document.querySelector("#participantName");
const liveMeetingTitle = document.querySelector("#liveMeetingTitle");
const liveMeetingDate = document.querySelector("#liveMeetingDate");
const liveMinutesDraft = document.querySelector("#liveMinutesDraft");
const joinLiveMeetingButton = document.querySelector("#joinLiveMeetingButton");
const endLiveMeetingButton = document.querySelector("#endLiveMeetingButton");
const saveLiveMinutesButton = document.querySelector("#saveLiveMinutesButton");
const liveSelfStatus = document.querySelector("#liveSelfStatus");
const liveIndicator = document.querySelector("#liveIndicator");
const liveIndicatorText = document.querySelector("#liveIndicatorText");
const liveParticipantCount = document.querySelector("#liveParticipantCount");
const liveMonitorList = document.querySelector("#liveMonitorList");
const openMonitorButton = document.querySelector("#openMonitorButton");
const openRecordsButton = document.querySelector("#openRecordsButton");
const closeMonitorButton = document.querySelector("#closeMonitorButton");
const closeRecordsButton = document.querySelector("#closeRecordsButton");
const monitorPage = document.querySelector("#monitorPage");
const recordsPage = document.querySelector("#recordsPage");
const minutesPanel = document.querySelector("#minutesPanel");
const minutesTitle = document.querySelector("#minutesTitle");
const minutesDate = document.querySelector("#minutesDate");
const minutesInput = document.querySelector("#minutesInput");
const saveMinutesButton = document.querySelector("#saveMinutesButton");
const clearMinutesButton = document.querySelector("#clearMinutesButton");
const toggleMinutesArchiveButton = document.querySelector("#toggleMinutesArchiveButton");
const minutesCount = document.querySelector("#minutesCount");
const topRecordsCount = document.querySelector("#topRecordsCount");
const homeButton = document.querySelector("#homeButton");
const minutesList = document.querySelector("#minutesList");
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
const minutesModal = document.querySelector("#minutesModal");
const minutesModalDepartment = document.querySelector("#minutesModalDepartment");
const minutesModalTitle = document.querySelector("#minutesModalTitle");
const minutesModalMeta = document.querySelector("#minutesModalMeta");
const minutesModalSummary = document.querySelector("#minutesModalSummary");
const minutesModalBody = document.querySelector("#minutesModalBody");
const closeMinutesModalButton = document.querySelector("#closeMinutesModalButton");
const closeMinutesModalFooterButton = document.querySelector("#closeMinutesModalFooterButton");
const toast = document.querySelector("#toast");
const paletteSelect = document.querySelector("#paletteSelect");

function getToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function loadPalette() {
  const savedPalette = localStorage.getItem(paletteStorageKey);
  const allowedPalettes = ["cream", "mono", "sunny", "colorful", "green", "blue"];
  return allowedPalettes.includes(savedPalette) ? savedPalette : "cream";
}

function applyPalette(palette) {
  const nextPalette = ["cream", "mono", "sunny", "colorful", "green", "blue"].includes(palette) ? palette : "cream";
  document.body.dataset.palette = nextPalette;
  localStorage.setItem(paletteStorageKey, nextPalette);
  if (paletteSelect) paletteSelect.value = nextPalette;
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
  const nextState = savedState && typeof savedState === "object" && !Array.isArray(savedState) ? savedState : {};
  departments.forEach((department) => {
    if (!nextState[department] || typeof nextState[department] !== "object" || Array.isArray(nextState[department])) {
      nextState[department] = createEmptyDepartment();
    }
    categories.forEach((category) => {
      if (!Array.isArray(nextState[department][category.id])) nextState[department][category.id] = [];
      nextState[department][category.id] = nextState[department][category.id].filter(
        (task) => task && typeof task === "object"
      );
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
  localStorage.setItem(minutesStorageKey, JSON.stringify(meetingMinutes));
  localStorage.setItem(liveStorageKey, JSON.stringify(liveParticipants));
}

function loadMinutes() {
  try {
    const saved = JSON.parse(localStorage.getItem(minutesStorageKey));
    if (saved) return saved;
  } catch (error) {
    // Ignore broken local minutes and rebuild below.
  }
  return [];
}

function ensureMinutesShape(savedMinutes) {
  if (!Array.isArray(savedMinutes)) return [];
  return savedMinutes
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      department: departments.includes(item.department) ? item.department : departments[0],
      title: item.title || item.meetingTitle || "Untitled Meeting Minutes",
      meetingDate: item.meetingDate || item.date || "",
      participantName: item.participantName || item.owner || "",
      minutes: item.minutes || item.content || "",
      summary: item.summary || "",
      createdAt: item.createdAt || new Date().toISOString(),
      locked: true,
    }))
    .filter((item) => item.title && item.minutes);
}

function loadLiveParticipants() {
  try {
    const saved = JSON.parse(localStorage.getItem(liveStorageKey));
    if (saved) return saved;
  } catch (error) {
    // Ignore broken live meeting data and rebuild below.
  }
  return [];
}

function ensureLiveParticipants(savedParticipants) {
  if (!Array.isArray(savedParticipants)) return [];
  return savedParticipants
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      meetingId: item.meetingId || createMeetingId(item.department, item.meetingDate, item.meetingTitle),
      department: departments.includes(item.department) ? item.department : departments[0],
      participantName: item.participantName || item.name || "",
      meetingTitle: item.meetingTitle || "Untitled Meeting",
      meetingDate: item.meetingDate || getToday(),
      draft: item.draft || "",
      summary: item.summary || "",
      wordCount: Number(item.wordCount || countWords(item.draft || "")),
      joinedAt: item.joinedAt || new Date().toISOString(),
      lastTypingAt: item.lastTypingAt || "",
      savedAt: item.savedAt || "",
      endedAt: item.endedAt || "",
      status: item.status || (item.savedAt ? "saved" : "joined"),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }))
    .filter((item) => item.participantName);
}

function flattenLiveParticipants() {
  return ensureLiveParticipants(liveParticipants).map((item) => ({
    id: item.id,
    meetingId: item.meetingId,
    department: item.department,
    participantName: item.participantName,
    meetingTitle: item.meetingTitle,
    meetingDate: item.meetingDate,
    draft: item.draft,
    summary: item.summary,
    wordCount: item.wordCount || countWords(item.draft),
    joinedAt: item.joinedAt,
    lastTypingAt: item.lastTypingAt,
    savedAt: item.savedAt,
    endedAt: item.endedAt || "",
    status: item.status,
    updatedAt: item.updatedAt || new Date().toISOString(),
  }));
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

function flattenMinutes() {
  return ensureMinutesShape(meetingMinutes).map((item) => ({
    id: item.id,
    department: item.department,
    title: item.title,
    meetingDate: item.meetingDate,
    participantName: item.participantName || "",
    minutes: item.minutes,
    summary: item.summary || "",
    createdAt: item.createdAt,
    locked: true,
  }));
}

function countStateTasks(boardState) {
  return departments.reduce(
    (departmentTotal, department) =>
      departmentTotal +
      categories.reduce(
        (categoryTotal, category) => categoryTotal + (boardState[department]?.[category.id] || []).length,
        0
      ),
    0
  );
}

function chooseNewerItem(currentItem, nextItem) {
  const currentTime = new Date(currentItem?.updatedAt || currentItem?.createdAt || 0).getTime() || 0;
  const nextTime = new Date(nextItem?.updatedAt || nextItem?.createdAt || 0).getTime() || 0;
  return nextTime >= currentTime ? nextItem : currentItem;
}

function mergeStates(sheetState, localState) {
  const merged = ensureStateShape({});
  departments.forEach((department) => {
    categories.forEach((category) => {
      const byId = new Map();
      [...(sheetState[department]?.[category.id] || []), ...(localState[department]?.[category.id] || [])].forEach(
        (task) => {
          if (!task || !task.id) return;
          byId.set(task.id, byId.has(task.id) ? chooseNewerItem(byId.get(task.id), task) : task);
        }
      );
      merged[department][category.id] = Array.from(byId.values());
    });
  });
  return ensureStateShape(merged);
}

function mergeMinutes(sheetMinutes, localMinutes) {
  const byId = new Map();
  [...ensureMinutesShape(sheetMinutes), ...ensureMinutesShape(localMinutes)].forEach((item) => {
    if (!item.id) return;
    byId.set(item.id, byId.has(item.id) ? chooseMinuteItem(byId.get(item.id), item) : item);
  });
  return ensureMinutesShape(Array.from(byId.values()));
}

function chooseMinuteItem(currentItem, nextItem) {
  const chosen = chooseNewerItem(currentItem, nextItem);
  const other = chosen === currentItem ? nextItem : currentItem;
  const sameMinutes = normalizeText(currentItem?.minutes) === normalizeText(nextItem?.minutes);
  if (!sameMinutes) return chosen;

  const chosenSummary = normalizeText(chosen.summary);
  const otherSummary = normalizeText(other?.summary);
  const chosenIsFallback = isFallbackSummary(chosenSummary);
  const otherIsFallback = isFallbackSummary(otherSummary);
  if (otherSummary && (!chosenSummary || (chosenIsFallback && !otherIsFallback))) {
    return { ...chosen, summary: otherSummary };
  }
  return chosen;
}

function isFallbackSummary(summary) {
  return /^(整理摘要|AI Summary)\s*-/i.test(String(summary || "").trim());
}

function mergeLiveParticipants(sheetParticipants, localParticipants) {
  const byId = new Map();
  [...ensureLiveParticipants(sheetParticipants), ...ensureLiveParticipants(localParticipants)].forEach((item) => {
    if (!item.id) return;
    byId.set(item.id, byId.has(item.id) ? chooseNewerItem(byId.get(item.id), item) : item);
  });
  return ensureLiveParticipants(Array.from(byId.values()));
}

function createMeetingId(department = activeDepartment, date = liveMeetingDate?.value || getToday(), title = liveMeetingTitle?.value || "") {
  const safeDepartment = normalizeDepartment(department) || activeDepartment || departments[0];
  const safeDate = date || getToday();
  const safeTitle = String(title || `${safeDepartment} Meeting`).trim().toLowerCase().replace(/\s+/g, "-");
  return `${safeDate}-${safeDepartment}-${safeTitle}`.replace(/[^a-z0-9\u4e00-\u9fa5-]/gi, "-");
}

function countWords(text) {
  const value = String(text || "").trim();
  if (!value) return 0;
  const chineseChars = (value.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latinWords = (value.replace(/[\u4e00-\u9fa5]/g, " ").match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || []).length;
  return chineseChars + latinWords;
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

function loadSheetState(options = {}) {
  if (!SHEET_API_URL) return;
  const { silent = false } = options;

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
    const sheetState = stateFromRows(rows);
    const mergedState = mergeStates(sheetState, state);
    const sheetMinutes = data && Array.isArray(data.minutes) ? data.minutes : [];
    const mergedMinutes = mergeMinutes(sheetMinutes, meetingMinutes);
    const sheetLiveParticipants = data && Array.isArray(data.liveParticipants) ? data.liveParticipants : [];
    const mergedLiveParticipants = mergeLiveParticipants(sheetLiveParticipants, liveParticipants);
    const shouldPushLocalBack =
      countStateTasks(mergedState) > countStateTasks(sheetState) ||
      mergedMinutes.length > ensureMinutesShape(sheetMinutes).length ||
      mergedLiveParticipants.length > ensureLiveParticipants(sheetLiveParticipants).length;
    state = mergedState;
    meetingMinutes = mergedMinutes;
    liveParticipants = mergedLiveParticipants;
    saveLocalState();
    renderBoard();
    if (shouldPushLocalBack) {
      queueSheetSave();
    }
    cleanup();
  };

  script.onerror = () => {
    cleanup();
    if (!silent) showToast("Sheet 暂时同步不到，先用本地资料");
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

function queueSheetRefresh(delay = 1800) {
  if (!SHEET_API_URL) return;
  window.clearTimeout(sheetRefreshTimer);
  sheetRefreshTimer = window.setTimeout(() => loadSheetState({ silent: true }), delay);
}

async function saveSheetState() {
  if (!SHEET_API_URL) return;

  const payload = JSON.stringify({ tasks: flattenState(), minutes: flattenMinutes(), liveParticipants: flattenLiveParticipants() });
  try {
    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({ payload }),
    });
    queueSheetRefresh();
  } catch (error) {
    showToast("Sheet 保存失败，已先存在本机");
  }
}

function getCurrentMeetingTitle() {
  return liveMeetingTitle.value.trim() || meetingTitle.value.trim() || `${activeDepartment} Meeting`;
}

function getCurrentLiveParticipant() {
  const meetingId = createMeetingId(activeDepartment, liveMeetingDate.value || getToday(), getCurrentMeetingTitle());
  if (currentParticipantId) {
    const existing = liveParticipants.find((item) => item.id === currentParticipantId);
    if (existing && existing.department === activeDepartment && existing.meetingId === meetingId) return existing;
  }
  return null;
}

function upsertLiveParticipant(partial = {}) {
  const name = participantName.value.trim();
  if (!name) {
    showToast("先填你的名字，Coco 才知道是谁在记录");
    participantName.focus();
    return null;
  }

  const now = new Date().toISOString();
  const meetingDateValue = liveMeetingDate.value || getToday();
  const meetingTitleValue = getCurrentMeetingTitle();
  const meetingId = createMeetingId(activeDepartment, meetingDateValue, meetingTitleValue);
  let participant = getCurrentLiveParticipant();

  if (!participant || participant.meetingId !== meetingId) {
    participant = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      meetingId,
      department: activeDepartment,
      participantName: name,
      meetingTitle: meetingTitleValue,
      meetingDate: meetingDateValue,
      draft: "",
      summary: "",
      wordCount: 0,
      joinedAt: now,
      lastTypingAt: "",
      savedAt: "",
      status: "joined",
      updatedAt: now,
    };
    liveParticipants.unshift(participant);
  }

  participant.department = activeDepartment;
  participant.participantName = name;
  participant.meetingTitle = meetingTitleValue;
  participant.meetingDate = meetingDateValue;
  participant.meetingId = meetingId;
  Object.assign(participant, partial);
  participant.wordCount = countWords(participant.draft);
  participant.updatedAt = now;

  currentParticipantId = participant.id;
  localStorage.setItem(participantStorageKey, currentParticipantId);
  saveLocalState();
  queueLiveSave();
  renderLiveRoom();
  return participant;
}

function joinLiveMeeting() {
  const participant = upsertLiveParticipant({
    draft: liveMinutesDraft.value,
    status: liveMinutesDraft.value.trim() ? "recording" : "joined",
    endedAt: "",
  });
  if (!participant) return;
  liveMinutesDraft.value = participant.draft || liveMinutesDraft.value;
}

function endLiveMeeting() {
  const participant = getCurrentLiveParticipant();
  if (!participant) {
    showToast("还没有加入这个 meeting");
    return;
  }
  participant.status = "ended";
  participant.endedAt = new Date().toISOString();
  participant.updatedAt = participant.endedAt;
  saveLocalState();
  queueLiveSave();
  renderLiveRoom();
}

function updateLiveDraft() {
  if (!participantName.value.trim()) {
    liveSelfStatus.hidden = false;
    liveSelfStatus.textContent = "先填名字";
    liveSelfStatus.className = "live-status-pill live-empty";
    return;
  }
  const existing = getCurrentLiveParticipant();
  if (!existing) {
    liveSelfStatus.hidden = false;
    liveSelfStatus.textContent = "还没进入";
    liveSelfStatus.className = "live-status-pill live-empty";
    renderLiveIndicator(null, { label: "还没进入", className: "live-empty" });
    return;
  }
  if (existing?.status === "ended") {
    renderLiveRoom();
    return;
  }
  const participant = upsertLiveParticipant({
    draft: liveMinutesDraft.value,
    lastTypingAt: new Date().toISOString(),
    status: "typing",
  });
  if (!participant) return;
  window.clearTimeout(updateLiveDraft.idleTimer);
  updateLiveDraft.idleTimer = window.setTimeout(() => {
    const current = getCurrentLiveParticipant();
    if (!current || current.status === "saved" || current.status === "ended") return;
    current.status = current.draft ? "recording" : "joined";
    current.updatedAt = new Date().toISOString();
    saveLocalState();
    queueLiveSave();
    renderLiveRoom();
  }, 2400);
}

function queueLiveSave() {
  window.clearTimeout(liveSaveTimer);
  liveSaveTimer = window.setTimeout(saveSheetState, 900);
}

function getActiveMeetingParticipants() {
  const meetingId = createMeetingId(activeDepartment, liveMeetingDate.value || getToday(), getCurrentMeetingTitle());
  return ensureLiveParticipants(liveParticipants)
    .filter((item) => item.meetingId === meetingId && item.department === activeDepartment && item.status !== "ended")
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

function getLiveStatusInfo(participant) {
  if (participant.status === "ended") return { label: "已结束", className: "live-ended" };
  if (participant.savedAt) return { label: "已保存", className: "live-saved" };
  if (participant.status === "typing") return { label: "正在记录", className: "live-typing" };
  if (!participant.draft) return { label: "未开始写", className: "live-empty" };
  const lastTime = new Date(participant.lastTypingAt || participant.updatedAt || 0).getTime();
  const idleMinutes = lastTime ? Math.floor((Date.now() - lastTime) / 60000) : 0;
  if (idleMinutes >= 3) return { label: `${idleMinutes} 分钟没动`, className: "live-idle" };
  return { label: "正在记录", className: "live-recording" };
}

function renderLiveRoom() {
  if (!livePanel) return;
  const current = getCurrentLiveParticipant();
  if (current) {
    participantName.value = current.participantName || participantName.value;
    liveMeetingTitle.value = current.meetingTitle || liveMeetingTitle.value;
    liveMeetingDate.value = current.meetingDate || liveMeetingDate.value || getToday();
    if (document.activeElement !== liveMinutesDraft) liveMinutesDraft.value = current.draft || "";
  }

  const selfInfo = current ? getLiveStatusInfo(current) : { label: "还没进入", className: "live-empty" };
  liveSelfStatus.hidden = Boolean(current);
  liveSelfStatus.textContent = selfInfo.label;
  liveSelfStatus.className = `live-status-pill ${selfInfo.className}`;
  renderLiveIndicator(current, selfInfo);

  const participants = getActiveMeetingParticipants();
  liveParticipantCount.textContent = participants.length;
  liveMonitorList.innerHTML = participants.length
    ? participants
        .map((item) => {
          const info = getLiveStatusInfo(item);
          const initial = getParticipantInitial(item.participantName);
          const notePreview = getNotePreview(item.draft) || item.draft.slice(0, 140);
          return `
            <article class="live-person ${info.className}">
              <div class="live-person-top">
                <div class="live-person-identity">
                  <span class="live-avatar">${escapeHtml(initial)}</span>
                  <div>
                    <strong>${escapeHtml(item.participantName)}</strong>
                    <small>${escapeHtml(item.meetingTitle || "Meeting")}</small>
                  </div>
                </div>
                <span class="live-status-pill ${info.className}">${escapeHtml(info.label)}</span>
              </div>
              <div class="live-person-meta">
                <span>加入 ${escapeHtml(formatLiveClock(item.joinedAt))}</span>
                <span>最后记录 ${escapeHtml(formatLiveClock(item.lastTypingAt || item.updatedAt))}</span>
                ${item.savedAt ? `<span>已保存 ${escapeHtml(formatLiveClock(item.savedAt))}</span>` : ""}
                ${item.endedAt ? `<span>结束 ${escapeHtml(formatLiveClock(item.endedAt))}</span>` : ""}
              </div>
              <div class="live-person-activity">
                <span>正在做什么</span>
                ${item.draft ? `<p>${escapeHtml(notePreview)}</p>` : '<p class="muted-copy">已加入，还没有开始写。</p>'}
              </div>
            </article>
          `;
        })
        .join("")
    : '<div class="empty-state">还没有人进入这个 meeting。</div>';
}

function renderLiveIndicator(current, info) {
  if (!liveIndicator || !liveIndicatorText) return;
  const isActive = current && ["joined", "typing", "recording"].includes(current.status);
  const isSaved = current && current.status !== "ended" && current.savedAt;
  const isEnded = current && current.status === "ended";
  liveIndicator.hidden = !current;
  liveIndicator.className = [
    "live-edge-indicator",
    isActive ? "live-active" : "",
    isSaved ? "live-saved" : "",
    isEnded ? "live-ended" : "",
    !current ? "live-offline" : "",
  ]
    .filter(Boolean)
    .join(" ");
  liveIndicatorText.textContent = isActive
    ? "实时记录中"
    : isSaved
      ? "已保存，未结束"
      : isEnded
        ? "已结束"
        : "未加入";
  if (endLiveMeetingButton) {
    endLiveMeetingButton.hidden = !(isActive || isSaved || isEnded);
    endLiveMeetingButton.textContent = isEnded ? "重新加入" : "结束";
    endLiveMeetingButton.classList.toggle("rejoin-mode", Boolean(isEnded));
  }
  if (joinLiveMeetingButton) {
    joinLiveMeetingButton.hidden = Boolean(current);
    joinLiveMeetingButton.textContent = "加入";
  }
}

function handleEndControlClick(event) {
  const current = getCurrentLiveParticipant();
  if (current?.status === "ended") {
    joinLiveMeeting();
    return;
  }
  endLiveMeeting();
}

function formatLiveTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "No update";
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  return date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" });
}

function getParticipantInitial(name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return "?";
  const firstPart = cleanName.split(/\s+/)[0] || cleanName;
  return Array.from(firstPart)[0]?.toUpperCase() || "?";
}

function formatLiveClock(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "--:--";
  const today = new Date();
  const sameDay = date.toLocaleDateString("en-CA") === today.toLocaleDateString("en-CA");
  const time = date.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (sameDay) return time;
  const day = date.toLocaleDateString("en-MY", { day: "2-digit", month: "2-digit" });
  return `${day} ${time}`;
}

function getLiveMinuteKey(values) {
  return [
    normalizeDepartment(values.department || activeDepartment),
    String(values.meetingDate || "").trim(),
    String(values.title || values.meetingTitle || "").trim().toLowerCase(),
    String(values.participantName || "").trim().toLowerCase(),
  ].join("|");
}

function findExistingMinuteIndex(participant) {
  const targetKey = getLiveMinuteKey({
    department: participant.department,
    meetingDate: participant.meetingDate,
    title: participant.meetingTitle,
    participantName: participant.participantName,
  });
  return meetingMinutes.findIndex((item) => getLiveMinuteKey(item) === targetKey);
}

function dedupeMeetingMinutes(minutes) {
  const byKey = new Map();
  ensureMinutesShape(minutes).forEach((item) => {
    const key = getLiveMinuteKey(item);
    const existing = byKey.get(key);
    if (!existing || String(item.createdAt || "").localeCompare(String(existing.createdAt || "")) > 0) {
      byKey.set(key, item);
    }
  });
  return Array.from(byKey.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function saveLiveMinutes(options = {}) {
  const { silent = false, auto = false } = options;
  const saveTime = new Date().toISOString();
  const participant = upsertLiveParticipant({
    draft: liveMinutesDraft.value.trim(),
    ...(auto ? {} : { lastTypingAt: saveTime }),
  });
  if (!participant || !participant.draft) {
    if (!silent) showToast("先写一点 meeting minutes 再保存");
    return;
  }

  const wasEnded = participant.status === "ended";
  const summary = generateMeetingSummary(participant.draft, participant.meetingTitle);
  const savedAt = saveTime;
  participant.summary = summary;
  participant.savedAt = savedAt;
  participant.status = wasEnded ? "ended" : "saved";
  participant.updatedAt = savedAt;

  const minuteRecord = {
    department: participant.department,
    title: participant.meetingTitle,
    meetingDate: participant.meetingDate,
    participantName: participant.participantName,
    minutes: participant.draft,
    summary,
    createdAt: savedAt,
    locked: true,
  };
  const existingIndex = findExistingMinuteIndex(participant);
  if (existingIndex >= 0) {
    meetingMinutes[existingIndex] = {
      ...meetingMinutes[existingIndex],
      ...minuteRecord,
      id: meetingMinutes[existingIndex].id,
    };
  } else {
    meetingMinutes.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...minuteRecord,
    });
  }
  meetingMinutes = dedupeMeetingMinutes(meetingMinutes);

  minutesTitle.value = "";
  minutesInput.value = "";
  minutesDate.value = getToday();
  minutesList.hidden = false;
  saveState();
  renderBoard();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function generateMeetingSummary(minutes, title = "Meeting") {
  const lines = normalizeText(minutes)
    .split(/\n|\r/g)
    .map((line) => cleanDescriptionLine(line))
    .filter(Boolean);
  const taskGroups = { todo: [], pending: [], issues: [] };
  lines.forEach((line) => {
    const categoryId = classifyLine(line);
    taskGroups[categoryId || "todo"].push(stripCategoryLabel(line));
  });

  const opening = lines.slice(0, 3).join(" / ");
  const summaryLines = [
    `整理摘要 - ${title}`,
    "",
    "会议重点：",
    opening ? `- ${opening}` : "- 这份会议记录没有足够内容，需要补充重点。",
    "",
    "Action Items：",
    ...(taskGroups.todo.length ? taskGroups.todo.slice(0, 8).map((item) => `- ${item}`) : ["- 暂时没有明确 action item。"]),
    "",
    "需要 Coco 确认：",
    ...(taskGroups.pending.length ? taskGroups.pending.slice(0, 8).map((item) => `- ${item}`) : ["- 暂时没有需要 Coco 决定的事项。"]),
    "",
    "Issues / Blockers：",
    ...(taskGroups.issues.length ? taskGroups.issues.slice(0, 8).map((item) => `- ${item}`) : ["- 暂时没有明显 blocker。"]),
  ];

  return summaryLines.join("\n");
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
    .map(
      (department) => `
        <button class="department-tab${currentView === "board" && department === activeDepartment ? " active" : ""}" type="button" data-department="${department}">
          <span>${department}</span>
        </button>
      `
    )
    .join("");
  departmentTabs.innerHTML = `
    ${departmentButtons}
    <button class="coco-pending-button${currentView === "coco" ? " active" : ""}" id="cocoPendingButton" type="button" data-coco-pending>
      Coco 要确认 <span id="cocoPendingBadge">0</span>
    </button>
  `;
  activeDepartmentTitle.textContent = activeDepartment;
  boardDepartmentTitle.textContent = `${activeDepartment} Department`;
  renderActiveDepartmentStats();
  renderCocoPendingBadge();
}

function renderBoard() {
  try {
    renderBoardContent();
  } catch (error) {
    console.error("Meeting board render failed. Resetting to a safe board.", error);
    state = ensureStateShape({});
    currentView = "board";
    saveLocalState();
    renderBoardContent();
    showToast("页面已重整回正常 board");
  }
}

function renderBoardContent() {
  state = ensureStateShape(state);
  renderDepartments();
  setViewVisibility();
  renderLiveRoom();
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
  renderMinutesArchive();
}

function navigatePage(nextMode, options = {}) {
  pageMode = ["home", "monitor", "records"].includes(nextMode) ? nextMode : "home";
  currentView = "board";
  if (!options.skipHash) {
    if (pageMode === "home") {
      history.pushState(null, "", `${window.location.pathname}${window.location.search}`);
    } else {
      history.pushState(null, "", `#${pageMode}`);
    }
  }
  renderBoard();
  window.scrollTo({ top: 0, behavior: "auto" });
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
  livePanel.hidden = isCocoView || pageMode !== "home";
  monitorPage.hidden = pageMode !== "monitor";
  recordsPage.hidden = pageMode !== "records";
  if (openRecordsButton) openRecordsButton.hidden = pageMode !== "home";
  inputPanel.hidden = true;
  minutesPanel.hidden = true;
  boardHeader.hidden = true;
  listGrid.hidden = true;
  completedSection.hidden = true;
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

function getDepartmentMinutes(department = activeDepartment) {
  return ensureMinutesShape(meetingMinutes)
    .filter((item) => item.department === department)
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

function renderMinutesArchive() {
  const minutes = getDepartmentMinutes();
  minutesCount.textContent = minutes.length;
  if (topRecordsCount) topRecordsCount.textContent = minutes.length;
  minutesList.classList.toggle("single-record", minutes.length === 1);
  minutesList.innerHTML = minutes.length
    ? minutes
        .map(
          (item) => `
            <button class="minutes-item" type="button" data-minutes-id="${escapeAttribute(item.id)}">
              <span class="minutes-item-top">
                <strong>${escapeHtml(item.title)}</strong>
                <em>${item.summary ? "已整理" : "原始记录"}</em>
              </span>
              <span class="minutes-item-meta">
                <span>${escapeHtml(item.meetingDate || "日期待补充")}</span>
                <span>${escapeHtml(item.participantName || "Recorder 待补充")}</span>
                <span>${escapeHtml(formatCreatedAt(item.createdAt))}</span>
              </span>
              <span class="minutes-item-preview">${escapeHtml(getMinutePreview(item))}</span>
              <span class="minutes-item-action">打开记录</span>
            </button>
          `
        )
        .join("")
    : '<div class="empty-state">这个部门暂时没有会议记录。</div>';
}

function getMinutePreview(item) {
  const source = item.summary || item.minutes || "";
  const lines = normalizeText(source)
    .split(/\n|\r/g)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .filter((line) => !/^(整理摘要|会议重点|Action Items|需要 Coco 确认|Issues \/ Blockers)[：:]?$/i.test(line));
  return lines.slice(0, 2).join(" / ") || "打开查看完整会议记录。";
}

function saveMeetingMinutes() {
  const title = minutesTitle.value.trim();
  const minutes = minutesInput.value.trim();
  if (!title || !minutes) {
    showToast("请先填写会议名字和会议记录");
    return;
  }
  const participant = participantName.value.trim();
  const summary = generateMeetingSummary(minutes, title);

  meetingMinutes.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    department: activeDepartment,
    title,
    meetingDate: minutesDate.value || getToday(),
    participantName: participant,
    minutes,
    summary,
    createdAt: new Date().toISOString(),
    locked: true,
  });
  meetingMinutes = ensureMinutesShape(meetingMinutes);
  minutesTitle.value = "";
  minutesInput.value = "";
  minutesDate.value = getToday();
  minutesList.hidden = false;
  saveState();
  renderMinutesArchive();
  showToast("会议记录已保存并锁定");
}

function openMinutesModal(minutesId) {
  const item = meetingMinutes.find((minutes) => minutes.id === minutesId);
  if (!item) return;
  minutesModalDepartment.textContent = `${item.department} · LOCKED`;
  minutesModalTitle.textContent = item.title;
  minutesModalMeta.innerHTML = `
    <span>${escapeHtml(item.meetingDate || "日期待补充")}</span>
    ${item.participantName ? `<span>Recorder: ${escapeHtml(item.participantName)}</span>` : ""}
    <span>${escapeHtml(formatCreatedAt(item.createdAt))}</span>
    <span>只读</span>
  `;
  minutesModalSummary.hidden = !item.summary;
  minutesModalSummary.innerHTML = item.summary
    ? `<p class="eyebrow">整理摘要</p><pre>${escapeHtml(item.summary)}</pre>`
    : "";
  minutesModalBody.textContent = item.minutes;
  minutesModal.showModal();
}

function closeMinutesModal() {
  minutesModal.close();
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

function formatCreatedAt(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Saved date 待补充";
  return `Saved ${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
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
  const previousDepartment = activeDepartment;
  activeDepartment = button.dataset.department;
  if (!liveMeetingTitle.value || liveMeetingTitle.value === `${previousDepartment} Meeting`) {
    liveMeetingTitle.value = `${activeDepartment} Meeting`;
    meetingTitle.value = liveMeetingTitle.value;
  }
  currentView = "board";
  renderBoard();
});

paletteSelect?.addEventListener("change", () => applyPalette(paletteSelect.value));

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
joinLiveMeetingButton.addEventListener("click", joinLiveMeeting);
endLiveMeetingButton?.addEventListener("click", handleEndControlClick);
saveLiveMinutesButton.addEventListener("click", saveLiveMinutes);
homeButton?.addEventListener("click", () => navigatePage("home"));
participantName.addEventListener("change", () => {
  const current = getCurrentLiveParticipant();
  if (current && current.status !== "ended") upsertLiveParticipant();
});
liveMeetingTitle.addEventListener("change", () => {
  meetingTitle.value = liveMeetingTitle.value;
  const current = getCurrentLiveParticipant();
  if (current && current.status !== "ended") upsertLiveParticipant();
  renderLiveRoom();
});
liveMeetingDate.addEventListener("change", () => {
  meetingDate.value = liveMeetingDate.value;
  const current = getCurrentLiveParticipant();
  if (current && current.status !== "ended") upsertLiveParticipant();
  renderLiveRoom();
});
liveMinutesDraft.addEventListener("input", updateLiveDraft);
openMonitorButton?.addEventListener("click", () => {
  navigatePage("monitor");
});
openRecordsButton?.addEventListener("click", () => {
  navigatePage("records");
});
closeMonitorButton?.addEventListener("click", () => {
  navigatePage("home");
});
closeRecordsButton?.addEventListener("click", () => {
  navigatePage("home");
});
saveMinutesButton.addEventListener("click", saveMeetingMinutes);
clearMinutesButton.addEventListener("click", () => {
  minutesTitle.value = "";
  minutesInput.value = "";
  minutesDate.value = getToday();
});
toggleMinutesArchiveButton.addEventListener("click", () => {
  minutesList.hidden = !minutesList.hidden;
  renderMinutesArchive();
});
minutesList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-minutes-id]");
  if (!button) return;
  openMinutesModal(button.dataset.minutesId);
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

closeMinutesModalButton.addEventListener("click", closeMinutesModal);
closeMinutesModalFooterButton.addEventListener("click", closeMinutesModal);
minutesModal.addEventListener("click", (event) => {
  if (event.target === minutesModal) closeMinutesModal();
});
window.addEventListener("popstate", () => {
  const hashMode = window.location.hash.replace("#", "");
  pageMode = ["monitor", "records"].includes(hashMode) ? hashMode : "home";
  renderBoard();
});

meetingDate.value = getToday();
minutesDate.value = getToday();
liveMeetingDate.value = getToday();
liveMeetingTitle.value = "Weekly Meeting";
meetingTitle.value = liveMeetingTitle.value;
pageMode = ["monitor", "records"].includes(window.location.hash.replace("#", ""))
  ? window.location.hash.replace("#", "")
  : "home";
applyPalette(loadPalette());
renderBoard();
loadSheetState();
window.setInterval(() => {
  const current = getCurrentLiveParticipant();
  if (current && current.status !== "saved") {
    current.updatedAt = new Date().toISOString();
    saveLocalState();
    queueLiveSave();
  }
  renderLiveRoom();
}, 10000);
window.setInterval(() => {
  const current = getCurrentLiveParticipant();
  if (!current || current.status === "ended" || !String(liveMinutesDraft.value || current.draft || "").trim()) return;
  saveLiveMinutes({ silent: true, auto: true });
}, 60000);
