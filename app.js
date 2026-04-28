const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0I8Eh_0_9x-SJawrBKqEmD_uaLYlXPRG4Uqei6RaU2F90PFR9TzZhXszu1X-J5ffx0LGWKkQhx6op/pub?output=csv";

const fallbackEvents = [
  {
    month: "4月份",
    date: "13/4",
    type: "团购",
    brand: "BEGIN",
    status: "已谈好",
    platform: "Website",
    product: "Sushi bake tamago 太薄了",
    package: "待补充",
    previousSales: "",
    target: "",
    importantNotice: "",
    notes: "需要确认产品厚度与开卖素材。",
  },
  {
    month: "4月份",
    date: "24/5",
    type: "直播",
    brand: "PROYA",
    status: "已谈好",
    platform: "Website",
    product: "直播产品",
    package: "VIP / SVIP 产品",
    previousSales: "",
    target: "",
    importantNotice: "",
    notes: "15/4 信封订购；15/4 SVIP、VIP 产品。",
  },
  {
    month: "5月份",
    date: "1/5",
    type: "每月精选",
    brand: "MGP",
    status: "已谈好",
    platform: "Website",
    product: "每月精选",
    package: "待补充",
    previousSales: "",
    target: "",
    importantNotice: "",
    notes: "",
  },
  {
    month: "5月份",
    date: "8/5",
    type: "专场",
    brand: "Kiehl's",
    status: "已谈好",
    platform: "Website",
    product: "专场产品",
    package: "待补充",
    previousSales: "93k",
    target: "",
    importantNotice: "只能面交不能邮寄！！",
    notes: "第一场，4/5 开团。",
  },
  {
    month: "5月份",
    date: "18/5",
    type: "混场",
    brand: "Nothing better",
    status: "Potential",
    platform: "Lazada",
    product: "混场产品",
    package: "待补充",
    previousSales: "-",
    target: "80000",
    importantNotice: "",
    notes: "第二场，14/5 直播。",
  },
  {
    month: "5月份",
    date: "18/5",
    type: "混场",
    brand: "Popi",
    status: "已谈好",
    platform: "Website",
    product: "混场产品",
    package: "待补充",
    previousSales: "32k",
    target: "60000",
    importantNotice: "",
    notes: "第二场，14/5 直播。",
  },
  {
    month: "5月份",
    date: "28/5",
    type: "团购",
    brand: "Lactoday",
    status: "已谈好",
    platform: "Shopee / Lazada",
    product: "团购产品",
    package: "待补充",
    previousSales: "109k",
    target: "100000",
    importantNotice: "",
    notes: "第三场，24/5 开卖。",
  },
  {
    month: "5月份",
    date: "28/5",
    type: "团购",
    brand: "Cons",
    status: "已谈好",
    platform: "Website",
    product: "团购产品",
    package: "待补充",
    previousSales: "64k",
    target: "80000",
    importantNotice: "",
    notes: "第三场，24/5 开卖。",
  },
  {
    month: "5月份",
    date: "30/5",
    type: "混场",
    brand: "达肤妍",
    status: "已谈好",
    platform: "Shopee / Lazada",
    product: "混场产品",
    package: "待补充",
    previousSales: "26k",
    target: "100000",
    importantNotice: "",
    notes: "",
  },
  {
    month: "5月份",
    date: "30/5",
    type: "混场",
    brand: "Mistine",
    status: "Potential",
    platform: "Shopee / Lazada",
    product: "混场产品",
    package: "待补充",
    previousSales: "44k",
    target: "60000",
    importantNotice: "",
    notes: "",
  },
  {
    month: "5月份",
    date: "整月",
    type: "每月精选",
    brand: "Greenbio",
    status: "已谈好",
    platform: "Website",
    product: "每月精选",
    package: "待补充",
    previousSales: "36k",
    target: "30000",
    importantNotice: "",
    notes: "",
  },
  {
    month: "6月份",
    date: "待定",
    type: "线下活动",
    brand: "环保活动",
    status: "Potential",
    platform: "Offline",
    product: "护肤 / 化妆 / 护发原理分享",
    package: "待补充",
    previousSales: "",
    target: "",
    importantNotice: "",
    notes: "让大家更了解护肤、化妆、护发的原理。",
  },
  {
    month: "7月份",
    date: "待定",
    type: "周年庆",
    brand: "Olive young",
    status: "Potential",
    platform: "Website",
    product: "Anua / Olivelemon / 穴位贴",
    package: "待补充",
    previousSales: "",
    target: "",
    importantNotice: "",
    notes: "穴位贴是 4 月份 launch，可能还需要再看。",
  },
  {
    month: "10月份",
    date: "11月",
    type: "线下活动",
    brand: "待确认品牌",
    status: "Potential",
    platform: "Offline",
    product: "线下活动",
    package: "待补充",
    previousSales: "",
    target: "",
    importantNotice: "",
    notes: "",
  },
];

let events = [];
let selectedMonth = "";
let selectedDate = "全部";
let searchTerm = "";

const monthTabs = document.querySelector("#monthTabs");
const eventList = document.querySelector("#eventList");
const eventPanelTitle = document.querySelector("#eventPanelTitle");
const pipelineTable = document.querySelector("#pipelineTable");
const pipelineCount = document.querySelector("#pipelineCount");
const searchInput = document.querySelector("#searchInput");
const refreshButton = document.querySelector("#refreshButton");
const syncStatus = document.querySelector("#syncStatus");
const noticeTrack = document.querySelector("#noticeTrack");
const noticeList = document.querySelector("#noticeList");

function normalizeEvent(row) {
  return {
    month: row.month || row["月份"] || "",
    date: row.date || row["日期"] || row["开团至"] || "",
    type: row.type || row["活动"] || row["活动类型"] || "",
    brand: row.brand || row.brands || row["品牌"] || row["BRANDS"] || "",
    status: row.status || row["状态"] || "Potential",
    platform: row.platform || row["平台"] || row["开卖平台"] || "",
    product: row.product || row["产品"] || row["产品/配套"] || "",
    package: row.package || row["配套"] || "",
    previousSales: row.previousSales || row["Previous Sales"] || row["previous sales"] || "",
    target: row.target || row["TARGET"] || row["Target"] || "",
    importantNotice:
      row.importantNotice ||
      row["importantNotice"] ||
      row["重要通知"] ||
      row["品牌重要通知"] ||
      row["Important Notice"] ||
      "",
    notes: row.notes || row["重要事项"] || row["Details"] || row["备注"] || "",
  };
}

function parseCsv(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let quote = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quote && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quote = !quote;
    } else if (char === "," && !quote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quote) {
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
      }
      cell = "";
      row = [];
      if (char === "\r" && next === "\n") i += 1;
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows
    .filter((cells) => cells.some((value) => value.trim()))
    .map((cells) =>
      headers.reduce((item, header, index) => {
        item[header] = (cells[index] || "").trim();
        return item;
      }, {})
    );
}

function monthNumber(month) {
  const match = String(month).match(/\d+/);
  return match ? Number(match[0]) : 99;
}

function dateNumber(date) {
  const match = String(date).match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function formatMoney(value) {
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!numeric) return value || "-";
  return `RM ${numeric.toLocaleString("en-MY")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function currentMonthName() {
  const month = new Date().getMonth() + 1;
  return `${month}月份`;
}

function getMonths() {
  return [...new Set(events.map((event) => event.month).filter(Boolean))].sort(
    (a, b) => monthNumber(a) - monthNumber(b)
  );
}

function getFilteredEvents() {
  return events.filter((event) => {
    const inMonth = !selectedMonth || event.month === selectedMonth;
    const haystack = Object.values(event).join(" ").toLowerCase();
    const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
    return inMonth && matchesSearch;
  });
}

function renderMetrics() {
  const confirmed = events.filter((event) => event.status.includes("已谈好")).length;
  const potential = events.filter((event) => event.status.toLowerCase().includes("potential")).length;
  const thisMonth = events.filter((event) => event.month === currentMonthName()).length;
  const total = events.reduce((sum, event) => {
    const numeric = Number(String(event.target).replace(/[^0-9.-]/g, ""));
    return sum + (Number.isFinite(numeric) ? numeric : 0);
  }, 0);

  document.querySelector("#confirmedCount").textContent = confirmed;
  document.querySelector("#potentialCount").textContent = potential;
  document.querySelector("#currentMonthCount").textContent = thisMonth;
  document.querySelector("#totalTarget").textContent = formatMoney(total);
}

function renderMonths() {
  const months = getMonths();
  if (!selectedMonth) selectedMonth = months[0] || "";

  monthTabs.innerHTML = "";
  months.forEach((month) => {
    const button = document.createElement("button");
    button.className = `month-tab${month === selectedMonth ? " active" : ""}`;
    button.type = "button";
    button.textContent = month;
    button.addEventListener("click", () => {
      selectedMonth = month;
      selectedDate = "全部";
      render();
    });
    monthTabs.append(button);
  });
}

function renderDates() {
  selectedDate = "全部";
}

function groupEventsByDate(items) {
  return items.reduce((groups, event) => {
    const date = event.date || "待定";
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(event);
    return groups;
  }, new Map());
}

function sumTargets(items) {
  return items.reduce((sum, event) => {
    const numeric = Number(String(event.target).replace(/[^0-9.-]/g, ""));
    return sum + (Number.isFinite(numeric) ? numeric : 0);
  }, 0);
}

function getImportantNotices(items = events) {
  return items.filter((event) => event.importantNotice && event.importantNotice.trim());
}

function uniqueValues(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))];
}

function isConfirmedEvent(event) {
  return event.status.includes("已谈好") || event.status.toLowerCase().includes("confirmed");
}

function statusClass(event) {
  return isConfirmedEvent(event) ? "confirmed-brand" : "potential-brand";
}

function sortByBrandStatus(items) {
  return [...items].sort((a, b) => {
    if (isConfirmedEvent(a) === isConfirmedEvent(b)) return 0;
    return isConfirmedEvent(a) ? -1 : 1;
  });
}

function renderNoticeBoard() {
  const notices = getImportantNotices(events);

  if (!notices.length) {
    noticeTrack.textContent = "暂无重要通知";
    noticeList.innerHTML = '<div class="empty-state">目前没有品牌重要通知。</div>';
    return;
  }

  const marqueeText = notices
    .map((event) => `${event.brand}：${event.importantNotice}`)
    .join("     ·     ");
  noticeTrack.textContent = `${marqueeText}     ·     ${marqueeText}`;
  noticeList.innerHTML = notices
    .map(
      (event) => `
        <article class="notice-item">
          <div>
            <strong>${escapeHtml(event.brand || "未命名品牌")}</strong>
            <span>${escapeHtml(event.month || "-")} · ${escapeHtml(event.date || "-")} · ${escapeHtml(event.type || "-")}</span>
          </div>
          <p>${escapeHtml(event.importantNotice)}</p>
        </article>
      `
    )
    .join("");
}

function renderEvents() {
  const filtered = getFilteredEvents().sort((a, b) => dateNumber(a.date) - dateNumber(b.date));
  const grouped = [...groupEventsByDate(filtered).entries()].sort((a, b) => dateNumber(a[0]) - dateNumber(b[0]));
  eventPanelTitle.textContent = `${selectedMonth}排期`;
  eventList.innerHTML = "";

  if (!filtered.length) {
    eventList.innerHTML = '<div class="empty-state">暂时没有符合条件的活动。</div>';
    return;
  }

  grouped.forEach(([date, dateEvents], index) => {
    const target = sumTargets(dateEvents);
    const activityTypes = uniqueValues(dateEvents, "type");
    const sortedDateEvents = sortByBrandStatus(dateEvents);
    const brandTags = sortedDateEvents
      .map(
        (event) =>
          `<span class="summary-brand-pill ${statusClass(event)}">${escapeHtml(event.brand || "未命名品牌")}</span>`
      )
      .join("");
    const dateBlock = document.createElement("details");
    dateBlock.className = "date-accordion";
    dateBlock.open = index === 0 || Boolean(searchTerm);
    dateBlock.innerHTML = `
      <summary class="date-summary">
        <span class="date-mark">${escapeHtml(date)}</span>
        <span class="date-title">${brandTags || `${dateEvents.length} 个品牌`}</span>
        <span class="date-meta">${activityTypes
          .map((type) => `<span class="summary-type-pill">${escapeHtml(type)}</span>`)
          .join("")}</span>
        <span class="date-target">${formatMoney(target)}</span>
      </summary>
      <div class="brand-accordion-list"></div>
    `;

    const brandList = dateBlock.querySelector(".brand-accordion-list");
    sortedDateEvents.forEach((event, eventIndex) => {
      const isConfirmed = isConfirmedEvent(event);
      const brandBlock = document.createElement("details");
      brandBlock.className = "brand-disclosure";
      brandBlock.open = Boolean(searchTerm) && eventIndex === 0;
      brandBlock.innerHTML = `
        <summary class="brand-summary">
          <span class="type-pill">${escapeHtml(event.type || "活动")}</span>
          <strong class="brand-name ${statusClass(event)}">${escapeHtml(event.brand || "未命名品牌")}</strong>
          <span class="status-pill ${isConfirmed ? "confirmed" : "potential"}">${escapeHtml(event.status || "Potential")}</span>
          ${
            event.importantNotice
              ? '<button class="notice-button has-notice" type="button">重要通知</button>'
              : ""
          }
          <span class="brand-platform">${escapeHtml(event.platform || "-")}</span>
          <span class="brand-target">${formatMoney(event.target)}</span>
        </summary>
        <div class="brand-details">
          <span class="detail-status-pill ${isConfirmed ? "confirmed" : "potential"}">${escapeHtml(
            event.status || "Potential"
          )}</span>
          ${
            event.importantNotice
              ? `<div class="notice-alert"><strong>重要通知</strong><p>${escapeHtml(event.importantNotice)}</p></div>`
              : ""
          }
          <dl class="details-grid">
            <div>
              <dt>产品</dt>
              <dd>${escapeHtml(event.product || "-")}</dd>
            </div>
            <div>
              <dt>配套</dt>
              <dd>${escapeHtml(event.package || "-")}</dd>
            </div>
            <div>
              <dt>Previous</dt>
              <dd>${escapeHtml(event.previousSales || "-")}</dd>
            </div>
          </dl>
          <p class="notes">${escapeHtml(event.notes || "暂无重要事项。")}</p>
        </div>
      `;
      brandList.append(brandBlock);
    });
    eventList.append(dateBlock);
  });
}

function renderPipeline() {
  const filtered = getFilteredEvents();
  pipelineCount.textContent = `${filtered.length} 个品牌`;
  pipelineTable.innerHTML = "";

  filtered.forEach((event) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${event.month || "-"}</td>
      <td>${event.date || "-"}</td>
      <td>${event.type || "-"}</td>
      <td><strong>${event.brand || "-"}</strong></td>
      <td>${event.status || "-"}</td>
      <td>${event.platform || "-"}</td>
      <td>${[event.product, event.package].filter(Boolean).join("<br>") || "-"}</td>
      <td>${event.previousSales || "-"}</td>
      <td>${formatMoney(event.target)}</td>
      <td>${event.importantNotice || "-"}</td>
      <td>${event.notes || "-"}</td>
    `;
    pipelineTable.append(row);
  });
}

function render() {
  renderMetrics();
  renderNoticeBoard();
  renderMonths();
  renderDates();
  renderEvents();
  renderPipeline();
}

async function loadData() {
  if (!SHEET_CSV_URL) {
    events = fallbackEvents;
    syncStatus.textContent = "使用示例资料";
    render();
    return;
  }

  syncStatus.textContent = "同步中";
  try {
    const response = await fetch(`${SHEET_CSV_URL}${SHEET_CSV_URL.includes("?") ? "&" : "?"}v=${Date.now()}`);
    if (!response.ok) throw new Error("Sheet fetch failed");
    const text = await response.text();
    events = parseCsv(text).map(normalizeEvent);
    syncStatus.textContent = "已同步 Sheet";
  } catch (error) {
    events = fallbackEvents;
    syncStatus.textContent = "Sheet 失败，使用示例";
  }
  render();
}

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderEvents();
  renderPipeline();
});

refreshButton.addEventListener("click", loadData);

eventList.addEventListener("click", (event) => {
  const button = event.target.closest(".notice-button");
  if (!button || button.disabled) return;

  event.preventDefault();
  event.stopPropagation();

  const brandBlock = button.closest(".brand-disclosure");
  brandBlock.open = true;
  brandBlock.classList.add("notice-focus");
  window.setTimeout(() => brandBlock.classList.remove("notice-focus"), 900);
});

loadData();
