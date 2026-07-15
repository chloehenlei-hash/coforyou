const SHEET_NAME = "Meeting Board";
const MINUTES_SHEET_NAME = "Meeting Minutes";
const LIVE_SHEET_NAME = "Live Meeting";
const COCO_EMAIL = "PASTE_COCO_EMAIL_HERE";
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";
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
  const liveParticipants = Array.isArray(payload.liveParticipants) ? payload.liveParticipants : [];
  const sheet = getSheet();
  const rows = tasks.map((task) => HEADERS.map((header) => normalizeCell(task[header])));

  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  }

  const minutesSheet = getMinutesSheet();
  const currentMinutes = readSheetObjects(minutesSheet, MINUTES_HEADERS);
  const minutes = Array.isArray(payload.minutes) ? mergeMinuteSummaries(currentMinutes, payload.minutes) : [];
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

  return jsonResponse({
    ok: true,
    count: rows.length,
    minutesCount: minutesRows.length,
    liveCount: liveRows.length,
    minutes,
    liveParticipants: mergedLiveParticipants,
  });
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

function mergeMinuteSummaries(currentRows, incomingRows) {
  const currentById = {};
  const currentByKey = {};
  currentRows.forEach((item) => {
    if (!item) return;
    if (item.id) currentById[item.id] = item;
    currentByKey[getMinuteKey(item)] = item;
  });

  return incomingRows.map((item) => {
    const existing = currentById[item.id] || currentByKey[getMinuteKey(item)];
    return ensureMinuteSummary(item, existing);
  });
}

function getMinuteKey(item) {
  return [
    item && item.department,
    item && item.meetingDate,
    item && item.title,
    item && item.participantName,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");
}

function ensureMinuteSummary(item, existing) {
  if (!item || !item.minutes) return item;
  const sameMinutes = existing && normalizeSummarySource(existing.minutes) === normalizeSummarySource(item.minutes);

  if (sameMinutes && existing.summary && !isFallbackSummary(existing.summary)) {
    return Object.assign({}, item, { summary: existing.summary });
  }

  const aiSummary = generateGeminiSummary(item.minutes, item.title || "Meeting");
  if (aiSummary) return Object.assign({}, item, { summary: aiSummary });
  if (item.summary && !isFallbackSummary(item.summary)) return item;
  if (sameMinutes && existing.summary) return Object.assign({}, item, { summary: existing.summary });
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
    "你是 Coforyou 的会议记录助理。请用中文把以下原始 meeting minutes 整理成更完整、更清楚、更适合管理层阅读的会议纪要。",
    "不要只是照抄原文。请归纳重点、补齐上下文、合并重复内容，并保留品牌名、人名、日期、金额、平台、deadline 等关键细节。",
    "如果原文没有写负责人或 deadline，请写「负责人待确认」或「Deadline 待确认」，不要乱编。",
    "输出格式必须完全跟着下面结构：",
    "会议重点：",
    "- 3 到 6 点，讲清楚会议在讨论什么、目前进度和已达成的决定。",
    "",
    "Action Items：",
    "- 每一点用「负责人 - 要做什么（Deadline: ...）」格式；没有负责人就写「负责人待确认」。",
    "",
    "需要 Coco 确认：",
    "- 只列需要 Coco 做决定、approve、确认方向或价格的事项。",
    "",
    "Issues / Blockers：",
    "- 列出卡住、资料不足、客户未回复、时间风险、执行风险。",
    "",
    "下一步：",
    "- 1 到 3 点，写会议结束后最应该马上做的事。",
    `Meeting: ${title}`,
    "",
    "原始 meeting minutes：",
    minutes,
  ].join("\n");

  try {
    return callGeminiInteractions(key, prompt) || callGeminiGenerateContent(key, prompt);
  } catch (error) {
    return "";
  }
}

function callGeminiInteractions(key, prompt) {
  const response = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-goog-api-key": key,
    },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: GEMINI_MODEL,
      input: prompt,
    }),
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) return "";
  const data = JSON.parse(response.getContentText());
  return String(data.output_text || "").trim();
}

function callGeminiGenerateContent(key, prompt) {
  const response = UrlFetchApp.fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:generateContent?key=${key}`,
    {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) return "";
  const data = JSON.parse(response.getContentText());
  return data.candidates && data.candidates[0] && data.candidates[0].content
    ? data.candidates[0].content.parts.map((part) => part.text || "").join("\n").trim()
    : "";
}

function normalizeSummarySource(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function isFallbackSummary(summary) {
  return /^(整理摘要|AI Summary)\s*-/i.test(String(summary || "").trim());
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
