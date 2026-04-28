const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0I8Eh_0_9x-SJawrBKqEmD_uaLYlXPRG4Uqei6RaU2F90PFR9TzZhXszu1X-J5ffx0LGWKkQhx6op/pub?output=csv";
const OVERALL_TARGET = 11000000;
const FALLBACK_OVERALL_ACHIEVED = 700000;

const fallbackEvents = [
  {
    month: "4月份",
    date: "13/4",
    type: "团购",
    brand: "Lip Intimate",
    status: "已谈好",
    platform: "Website",
    product: "待补充",
    package: "待补充",
    previousSales: "47k",
    target: "80000",
    lastSales: "45862",
    latestSales: "50838",
    importantNotice: "",
    notes: "开团至 17/4。",
  },
  {
    month: "4月份",
    date: "13/4",
    type: "团购",
    brand: "Devie",
    status: "已谈好",
    platform: "Website",
    product: "待补充",
    package: "待补充",
    previousSales: "58k",
    target: "100000",
    lastSales: "54418",
    latestSales: "63602",
    importantNotice: "",
    notes: "开团至 17/4。",
  },
  {
    month: "4月份",
    date: "13/4",
    type: "团购",
    brand: "Begin",
    status: "已谈好",
    platform: "Website",
    product: "待补充",
    package: "待补充",
    previousSales: "111k",
    target: "80000",
    lastSales: "109061",
    latestSales: "114589",
    importantNotice: "",
    notes: "开团至 17/4。",
  },
  {
    month: "4月份",
    date: "24/4",
    type: "专场",
    brand: "Proya",
    status: "已谈好",
    platform: "Lazada",
    product: "待补充",
    package: "待补充",
    previousSales: "305k",
    target: "320000",
    lastSales: "264000",
    latestSales: "275000",
    importantNotice: "",
    notes: "开团至 28/4。",
  },
  {
    month: "4月份",
    date: "24/4",
    type: "专场",
    brand: "Red Chamber",
    status: "已谈好",
    platform: "Lazada",
    product: "待补充",
    package: "待补充",
    previousSales: "125k",
    target: "120000",
    lastSales: "47847",
    latestSales: "51715",
    importantNotice: "",
    notes: "开团至 28/4。",
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

const monthTabs = document.querySelector("#monthTabs");
const eventList = document.querySelector("#eventList");
const eventPanelTitle = document.querySelector("#eventPanelTitle");
const pipelineTable = document.querySelector("#pipelineTable");
const pipelineCount = document.querySelector("#pipelineCount");
const refreshButton = document.querySelector("#refreshButton");
const syncStatus = document.querySelector("#syncStatus");
const noticeList = document.querySelector("#noticeList");
const totalTarget = document.querySelector("#totalTarget");
const overallAchieved = document.querySelector("#overallAchieved");
const monthTargetInline = document.querySelector("#monthTargetInline");

function normalizeKey(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function getField(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== "") return row[alias];
  }

  const normalizedRow = Object.entries(row).reduce((map, [key, value]) => {
    map[normalizeKey(key)] = value;
    return map;
  }, {});

  for (const alias of aliases) {
    const value = normalizedRow[normalizeKey(alias)];
    if (value !== undefined && value !== "") return value;
  }

  return "";
}

function normalizeEvent(row) {
  return {
    month: getField(row, ["month", "月份"]),
    date: getField(row, ["date", "日期", "开团至"]),
    type: getField(row, ["type", "活动", "活动类型"]),
    brand: getField(row, ["brand", "brands", "品牌", "BRANDS"]),
    status: getField(row, ["status", "状态"]) || "Potential",
    platform: getField(row, ["platform", "平台", "开卖平台"]),
    product: getField(row, ["product", "产品", "产品/配套"]),
    package: getField(row, ["package", "配套"]),
    previousSales: getField(row, ["previousSales", "Previous Sales", "previous sales"]),
    target: getField(row, ["target", "TARGET", "Target"]),
    lastSales: getField(row, ["lastSales", "LAST", "Last", "last", "上次Sales", "上次 Sales"]),
    latestSales: getField(row, [
      "latestSales",
      "currentSales",
      "LATEST",
      "Latest",
      "latest",
      "目前Sales",
      "目前 Sales",
      "最新Sales",
      "最新 Sales",
      "Sales",
    ]),
    importantNotice: getField(row, ["importantNotice", "重要通知", "品牌重要通知", "Important Notice"]),
    notes: getField(row, ["notes", "重要事项", "Details", "备注"]),
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

function moneyNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw || !/[0-9]/.test(raw)) return 0;
  const multiplier = /k/i.test(raw) ? 1000 : 1;
  const numeric = Number(raw.replace(/[^0-9.-]/g, "")) * multiplier;
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatMoney(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";
  if (!/[0-9]/.test(raw)) return raw;
  const numeric = moneyNumber(raw);
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
    return inMonth;
  });
}

function animateMoney(element, target) {
  const duration = 1400;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = formatMoney(current);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  element.classList.remove("is-rolling");
  void element.offsetWidth;
  element.classList.add("is-rolling");
  requestAnimationFrame(step);
}

function renderMetrics(animateAchieved = false) {
  const metricMonth = selectedMonth || currentMonthName();
  const monthEvents = events.filter((event) => event.month === metricMonth);
  const monthTarget = sumTargets(monthEvents);
  const monthSales = sumLatestSales(monthEvents);
  const totalLatestSales = sumLatestSales(events);
  const achievedValue = totalLatestSales || FALLBACK_OVERALL_ACHIEVED;

  totalTarget.textContent = formatMoney(OVERALL_TARGET);
  monthTargetInline.innerHTML = `
    <strong class="month-sales-value">RM 0</strong>
    <span class="metric-divider">/</span>
    <strong>${formatMoney(monthTarget)}</strong>
  `;
  animateMoney(monthTargetInline.querySelector(".month-sales-value"), monthSales);
  if (animateAchieved) {
    animateMoney(overallAchieved, achievedValue);
  } else {
    overallAchieved.textContent = formatMoney(achievedValue);
  }
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
    return sum + moneyNumber(event.target);
  }, 0);
}

function sumLatestSales(items) {
  return items.reduce((sum, event) => {
    return sum + moneyNumber(event.latestSales);
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
    noticeList.innerHTML = '<div class="notice-marquee"><div class="notice-track">暂无重要通知</div></div>';
    return;
  }

  const marqueeText = notices
    .map((event) => `${event.brand || "未命名品牌"}：${event.importantNotice}`)
    .join("     ·     ");
  noticeList.innerHTML = `
    <div class="notice-marquee">
      <div class="notice-track">${escapeHtml(`${marqueeText}     ·     ${marqueeText}`)}</div>
    </div>
  `;
}

function renderEvents() {
  const filtered = getFilteredEvents().sort((a, b) => dateNumber(a.date) - dateNumber(b.date));
  const grouped = [...groupEventsByDate(filtered).entries()].sort((a, b) => dateNumber(a[0]) - dateNumber(b[0]));
  const eventIds = new Map(filtered.map((event, index) => [event, `brand-detail-${index}`]));
  eventPanelTitle.textContent = `${selectedMonth}排期`;
  eventList.innerHTML = "";

  if (!filtered.length) {
    eventList.innerHTML = '<div class="empty-state">暂时没有符合条件的活动。</div>';
    return;
  }

  const sortedMonthEvents = sortByBrandStatus(filtered);
  const brandNav = document.createElement("section");
  brandNav.className = "month-brand-nav";
  brandNav.innerHTML = `
    <div>
      <h3>开卖品牌</h3>
    </div>
    <div class="month-brand-list">
      ${sortedMonthEvents
        .map(
          (event) => `
            <button class="month-brand-link ${statusClass(event)}" type="button" data-target="${eventIds.get(event)}">
              ${escapeHtml(event.brand || "未命名品牌")}
            </button>
          `
        )
        .join("")}
    </div>
  `;
  eventList.append(brandNav);

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
    dateBlock.open = index === 0;
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
      brandBlock.id = eventIds.get(event);
      brandBlock.open = false;
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
            <div>
              <dt>目前 Sales</dt>
              <dd>${escapeHtml(event.latestSales || "-")}</dd>
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
      <td>${event.latestSales || "-"}</td>
      <td>${event.importantNotice || "-"}</td>
      <td>${event.notes || "-"}</td>
    `;
    pipelineTable.append(row);
  });
}

function render(animateAchieved = false) {
  renderNoticeBoard();
  renderMonths();
  renderMetrics(animateAchieved);
  renderDates();
  renderEvents();
  renderPipeline();
}

async function loadData() {
  if (!SHEET_CSV_URL) {
    events = fallbackEvents;
    syncStatus.textContent = "coforyou GOGOGO!";
    render(true);
    return;
  }

  syncStatus.textContent = "coforyou GOGOGO!";
  try {
    const response = await fetch(`${SHEET_CSV_URL}${SHEET_CSV_URL.includes("?") ? "&" : "?"}v=${Date.now()}`);
    if (!response.ok) throw new Error("Sheet fetch failed");
    const text = await response.text();
    events = parseCsv(text).map(normalizeEvent);
    syncStatus.textContent = "coforyou GOGOGO!";
  } catch (error) {
    events = fallbackEvents;
    syncStatus.textContent = "coforyou GOGOGO!";
  }
  render(true);
}

refreshButton.addEventListener("click", loadData);

eventList.addEventListener("click", (event) => {
  const brandLink = event.target.closest(".month-brand-link");
  if (brandLink) {
    const brandBlock = document.getElementById(brandLink.dataset.target);
    if (!brandBlock) return;
    const dateBlock = brandBlock.closest(".date-accordion");
    if (dateBlock) dateBlock.open = true;
    brandBlock.open = true;
    requestAnimationFrame(() => {
      brandBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    brandBlock.classList.add("notice-focus");
    window.setTimeout(() => brandBlock.classList.remove("notice-focus"), 900);
    return;
  }

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
