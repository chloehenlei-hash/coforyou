const SHEET_NAME = "Meeting Board";
const HEADERS = [
  "id",
  "department",
  "category",
  "text",
  "owner",
  "due",
  "meetingTitle",
  "meetingDate",
  "priority",
  "notes",
  "done",
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

  return jsonResponse({ tasks }, event.parameter.callback);
}

function doPost(event) {
  const payloadText = event.parameter.payload || (event.postData && event.postData.contents) || "{}";
  const payload = JSON.parse(payloadText);
  const tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const sheet = getSheet();
  const rows = tasks.map((task) => HEADERS.map((header) => normalizeCell(task[header])));

  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  }

  return jsonResponse({ ok: true, count: rows.length });
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

function normalizeCell(value) {
  if (value === true) return "TRUE";
  if (value === false) return "FALSE";
  return value === undefined || value === null ? "" : String(value);
}

function jsonResponse(data, callback) {
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(data)});`).setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
  }

  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
