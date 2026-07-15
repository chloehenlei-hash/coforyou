const SHEET_NAME = "Meeting Board";
const MINUTES_SHEET_NAME = "Meeting Minutes";
const LIVE_SHEET_NAME = "Live Meeting";
const COCO_EMAIL = "PASTE_COCO_EMAIL_HERE";
const HEADERS = [
  "id",
  "department",
  "category",
  "text",
  "sectionTitle",
  "owner",
  "due",
  "meetingTitle",
  "meetingDate",
  "priority",
  "notes",
  "done",
  "cocoEmailSentAt",
  "updatedAt",
];
const MINUTES_HEADERS = [
  "id",
  "department",
  "title",
  "meetingDate",
  "minutes",
  "createdAt",
  "locked",
  "participantName",
  "summary",
];
const LIVE_HEADERS = [
  "id",
  "meetingId",
  "department",
  "participantName",
  "meetingTitle",
  "meetingDate",
  "draft",
  "summary",
  "wordCount",
  "joinedAt",
  "lastTypingAt",
  "savedAt",
  "endedAt",
  "status",
  "updatedAt",
];

function doGet(event) {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).filter((row) => row.some(Boolean));
  const tasks = rows.map((row) =>
    HEADERS.reduce((task, header, index) => {
      task[header] = row[index] === undefined ? "" : row[index];
      return task;
    }, {})
  );
  const minutesSheet = getMinutesSheet();
  const minutesValues = minutesSheet.getDataRange().getValues();
  const minutesRows = minutesValues.slice(1).filter((row) => row.some(Boolean));
  const minutes = minutesRows.map((row) =>
    MINUTES_HEADERS.reduce((item, header, index) => {
      item[header] = row[index] === undefined ? "" : row[index];
      return item;
    }, {})
  );
  const liveSheet = getLiveSheet();
  const liveValues = liveSheet.getDataRange().getValues();
  const liveRows = liveValues.slice(1).filter((row) => row.some(Boolean));
  const liveParticipants = liveRows.map((row) =>
    LIVE_HEADERS.reduce((item, header, index) => {
      item[header] = row[index] === undefined ? "" : row[index];
      return item;
    }, {})
  );

  return jsonResponse({ tasks, minutes, liveParticipants }, event.parameter.callback);
}

function doPost(event) {
  const payloadText = event.parameter.payload || (event.postData && event.postData.contents) || "{}";
  const payload = JSON.parse(payloadText);
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const minutes = Array.isArray(payload.minutes) ? payload.minutes.map(ensureMinuteSummary) : [];
  const liveParticipants = Array.isArray(payload.liveParticipants) ? payload.liveParticipants : [];
  const sheet = getSheet();
  const rows = tasks.map((task) => HEADERS.map((header) => normalizeCell(task[header])));

  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  }

  const minutesSheet = getMinutesSheet();
  const minutesRows = minutes.map((item) => MINUTES_HEADERS.map((header) => normalizeCell(item[header])));
  minutesSheet.clearContents();
  minutesSheet.getRange(1, 1, 1, MINUTES_HEADERS.length).setValues([MINUTES_HEADERS]);
  if (minutesRows.length) {
    minutesSheet.getRange(2, 1, minutesRows.length, MINUTES_HEADERS.length).setValues(minutesRows);
  }

  const liveSheet = getLiveSheet();
  const mergedLiveParticipants = mergeLiveParticipants(readSheetObjects(liveSheet, LIVE_HEADERS), liveParticipants);
  const liveRows = mergedLiveParticipants.map((item) => LIVE_HEADERS.map((header) => normalizeCell(item[header])));
  liveSheet.clearContents();
  liveSheet.getRange(1, 1, 1, LIVE_HEADERS.length).setValues([LIVE_HEADERS]);
  if (liveRows.length) {
    liveSheet.getRange(2, 1, liveRows.length, LIVE_HEADERS.length).setValues(liveRows);
  }

  return jsonResponse({ ok: true, count: rows.length, minutesCount: minutesRows.length, liveCount: liveRows.length });
}

function sendCocoPendingEmailReminders() {
  if (!COCO_EMAIL || COCO_EMAIL === "PASTE_COCO_EMAIL_HERE") {
    throw new Error("Please set COCO_EMAIL before enabling reminders.");
  }

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const headerRow = values[0];
  const column = getColumnMap(headerRow);
  const pendingRows = [];
  const now = new Date();

  values.slice(1).forEach((row, index) => {
    const category = String(row[column.category] || "").toLowerCase();
    const done = String(row[column.done] || "").toLowerCase();
    const sentAt = row[column.cocoEmailSentAt];
    if (category !== "pending" || done === "true" || sentAt) return;

    pendingRows.push({
      rowNumber: index + 2,
      department: row[column.department] || "Department 待补充",
      text: row[column.text] || "事项待补充",
      meetingTitle: row[column.meetingTitle] || "Meeting 待补充",
      due: row[column.due] || "Due Date 待补充",
      priority: row[column.priority] || "Normal",
      notes: row[column.notes] || "",
    });
  });

  if (!pendingRows.length) return;

  const subject = `🔴🔴🔴 COCO PENDING 需要确认 (${pendingRows.length}) 🔴🔴🔴`;
  const body = [
    "Coco，有新的 Pending 需要你确认：",
    "",
    ...pendingRows.map((task, index) =>
      [
        `${index + 1}. ${task.text}`,
        `Department: ${task.department}`,
        `Meeting: ${task.meetingTitle}`,
        `Priority: ${task.priority}`,
        `Due Date: ${task.due}`,
        task.notes ? `Notes: ${task.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    ),
    "",
    "请打开 Coforyou Meeting Board 查看和处理。",
  ].join("\n\n");

  MailApp.sendEmail(COCO_EMAIL, subject, body);

  pendingRows.forEach((task) => {
    sheet.getRange(task.rowNumber, column.cocoEmailSentAt + 1).setValue(now);
  });
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => currentHeaders[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  return sheet;
}

function getMinutesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(MINUTES_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(MINUTES_SHEET_NAME);

  const currentHeaders = sheet.getRange(1, 1, 1, MINUTES_HEADERS.length).getValues()[0];
  const needsHeaders = MINUTES_HEADERS.some((header, index) => currentHeaders[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, MINUTES_HEADERS.length).setValues([MINUTES_HEADERS]);
  }

  return sheet;
}

function getLiveSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(LIVE_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(LIVE_SHEET_NAME);

  const currentHeaders = sheet.getRange(1, 1, 1, LIVE_HEADERS.length).getValues()[0];
  const needsHeaders = LIVE_HEADERS.some((header, index) => currentHeaders[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, LIVE_HEADERS.length).setValues([LIVE_HEADERS]);
  }

  return sheet;
}

function readSheetObjects(sheet, headers) {
  const values = sheet.getDataRange().getValues();
  return values
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row) =>
      headers.reduce((item, header, index) => {
        item[header] = row[index] === undefined ? "" : row[index];
        return item;
      }, {})
    );
}

function mergeLiveParticipants(currentRows, incomingRows) {
  const byId = {};
  currentRows.concat(incomingRows).forEach((item) => {
    if (!item || !item.id) return;
    if (!byId[item.id] || getTime(item.updatedAt) >= getTime(byId[item.id].updatedAt)) {
      byId[item.id] = item;
    }
  });
  return Object.keys(byId).map((id) => byId[id]);
}

function ensureMinuteSummary(item) {
  if (!item || !item.minutes) return item;
  const aiSummary = generateGeminiSummary(item.minutes, item.title || "Meeting");
  if (aiSummary) {
    return Object.assign({}, item, { summary: aiSummary });
  }
  if (item.summary) return item;
  return Object.assign({}, item, {
    summary: generateRuleBasedSummary(item.minutes, item.title || "Meeting"),
  });
}

function generateAiSummary(minutes, title) {
  const geminiSummary = generateGeminiSummary(minutes, title);
  if (geminiSummary) return geminiSummary;
  return generateRuleBasedSummary(minutes, title);
}

function generateGeminiSummary(minutes, title) {
  const key = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!key) return "";

  const prompt = [
    "你是 Coforyou 的会议记录助理。请用中文整理以下 meeting minutes。",
    "输出格式必须是：会议重点、Action Items、需要 Coco 确认、Issues / Blockers。",
    `Meeting: ${title}`,
    "",
    minutes,
  ].join("\n");

  try {
    const response = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "post",
        contentType: "application/json",
        muteHttpExceptions: true,
        payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = JSON.parse(response.getContentText());
    return data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts.map((part) => part.text || "").join("\n").trim()
      : "";
  } catch (error) {
    return "";
  }
}

function generateRuleBasedSummary(minutes, title) {
  const lines = String(minutes || "")
    .split(/\n|\r/g)
    .map((line) => line.trim().replace(/^[-*•·\d.)、\s]+/, ""))
    .filter(Boolean);
  const todo = [];
  const pending = [];
  const issues = [];

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (/pending|confirm|approval|decide|coco|确认|决定|待确认|老板/.test(lower)) {
      pending.push(line);
    } else if (/issue|blocker|stuck|delay|problem|cannot|can't|问题|卡住|延迟|没收到|缺/.test(lower)) {
      issues.push(line);
    } else {
      todo.push(line);
    }
  });

  return [
    `AI Summary - ${title}`,
    "",
    "会议重点：",
    lines.length ? `- ${lines.slice(0, 3).join(" / ")}` : "- 这份会议记录没有足够内容，需要补充重点。",
    "",
    "Action Items：",
    ...(todo.length ? todo.slice(0, 8).map((item) => `- ${item}`) : ["- 暂时没有明确 action item。"]),
    "",
    "需要 Coco 确认：",
    ...(pending.length ? pending.slice(0, 8).map((item) => `- ${item}`) : ["- 暂时没有需要 Coco 决定的事项。"]),
    "",
    "Issues / Blockers：",
    ...(issues.length ? issues.slice(0, 8).map((item) => `- ${item}`) : ["- 暂时没有明显 blocker。"]),
  ].join("\n");
}

function getTime(value) {
  const time = new Date(value || 0).getTime();
  return isNaN(time) ? 0 : time;
}

function normalizeCell(value) {
  if (value === true) return "TRUE";
  if (value === false) return "FALSE";
  return value === undefined || value === null ? "" : String(value);
}

function getColumnMap(headerRow) {
  return HEADERS.reduce((map, header) => {
    map[header] = headerRow.indexOf(header);
    return map;
  }, {});
}

function jsonResponse(data, callback) {
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)});`).setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }

  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
