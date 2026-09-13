"use strict";

const APP_VERSION = "1.2.0";
const STORAGE_KEY = "planpult-state-v1.2";

const DAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const DAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

const CATEGORIES = {
  correction: { label: "Korrektur", icon: "📝", factor: 1.25, color: "#b45f4f" },
  preparation: { label: "Vorbereitung", icon: "📚", factor: 1, color: "#567f9c" },
  followup: { label: "Nachbereitung", icon: "↺", factor: 0.9, color: "#6e8a78" },
  parents: { label: "Elternkommunikation", icon: "💬", factor: 1.15, color: "#a66f8d" },
  classlead: { label: "Klassenleitung", icon: "🧭", factor: 1.15, color: "#9a7943" },
  project: { label: "Fach / Projekt", icon: "🎼", factor: 1, color: "#6f69a4" },
  organization: { label: "Schulorganisation", icon: "🏫", factor: 1, color: "#65717c" },
  other: { label: "Sonstiges", icon: "＋", factor: 1, color: "#5f817a" },
};

const CORRECTION_TYPES = {
  de_5_7: { label: "Deutsch · Jg. 5–7", perStudent: 25, base: 0, evidence: "Empirisch gestützt", note: "NRW-Erhebung; kleine Stichprobe" },
  de_8: { label: "Deutsch · Jg. 8", perStudent: 35, base: 0, evidence: "Empirisch gestützt", note: "NRW-Erhebung; kleine Stichprobe" },
  de_9: { label: "Deutsch · Jg. 9", perStudent: 45, base: 0, evidence: "Empirisch · kleine Basis", note: "Selbstauskunft in einer kleinen NRW-Erhebung" },
  de_10: { label: "Deutsch · Jg. 10", perStudent: 45, base: 0, evidence: "Planwert · empirisch abgeleitet", note: "Anschlusswert aus Sek-I-Daten; textintensive Arbeiten ggf. höher" },
  de_ef: { label: "Deutsch · EF", perStudent: 50, base: 0, evidence: "Empirisch gestützt", note: "Ausgangswert nahe 49 Minuten" },
  de_gk: { label: "Deutsch · Q1/Q2 GK", perStudent: 60, base: 0, evidence: "Empirisch · kleine Basis", note: "Q1/Q2 in der Erhebung etwa 57–60 Minuten" },
  de_q1_lk: { label: "Deutsch · Q1 LK", perStudent: 65, base: 0, evidence: "Empirisch · kleine Basis", note: "Gerundeter Ausgangswert" },
  de_q2_lk: { label: "Deutsch · Q2 LK", perStudent: 75, base: 0, evidence: "Empirisch · kleine Basis", note: "Gerundeter Ausgangswert" },
  spa_seki: { label: "Spanisch · Sek I", perStudent: 40, base: 0, evidence: "Planwert · Proxy", note: "Abgeleitet aus modernen Fremdsprachen" },
  spa_ef: { label: "Spanisch · EF neu einsetzend", perStudent: 40, base: 0, evidence: "Planwert · Proxy", note: "Abgeleitet aus modernen Fremdsprachen" },
  spa_sekii: { label: "Spanisch · Sek II fortgeführt", perStudent: 55, base: 0, evidence: "Planwert · Proxy", note: "Abgeleitet aus modernen Fremdsprachen" },
  spa_vocab: { label: "Spanisch · Vokabeltest", perStudent: 1.5, base: 15, evidence: "Planwert", note: "1,5 Min. je Test plus 15 Min. Sockelzeit" },
  music_short: { label: "Musik · Kurztest", perStudent: 3, base: 15, evidence: "Planwert", note: "3 Min. je Test plus 15 Min. Sockelzeit" },
  music_open: { label: "Musik · Analyse / Hören", perStudent: 5, base: 15, evidence: "Planwert", note: "5 Min. je Arbeit plus 15 Min. Sockelzeit" },
  music_long: { label: "Musik · längere Arbeit", perStudent: 9, base: 20, evidence: "Planwert", note: "Mittelwert aus 8–10 Min. plus 20 Min. Sockelzeit" },
};

const FIXED_SCHEDULE = {
  1: [
    { period: "2. Std. · 9:10–9:55", className: "EF Spanisch G1", room: "B206" },
    { period: "4. Std. · 11:05–11:50", className: "Bereitschaft", room: "" },
    { period: "5.–6. Std. · 12:10–13:45", className: "10a Deutsch", room: "B006" },
  ],
  2: [
    { period: "2. Std. · 9:10–9:55", className: "EF Spanisch G1", room: "B206" },
    { period: "3.–4. Std. · 10:15–11:50", className: "EF Deutsch G2", room: "B206" },
    { period: "6. Std. · 13:00–13:45", className: "10a Deutsch", room: "B006" },
  ],
  3: [],
  4: [
    { period: "3.–4. Std. · 10:15–11:50", className: "5a Musik", room: "A207" },
    { period: "5.–6. Std. · 12:10–13:45", className: "EF Spanisch G1", room: "B206" },
  ],
  5: [
    { period: "2. Std. · 9:10–9:55", className: "EF Deutsch G2", room: "B206" },
    { period: "3.–4. Std. · 10:15–11:50", className: "7c Musik", room: "A207" },
    { period: "5.–6. Std. · 12:10–13:45", className: "10a Musik", room: "A207" },
  ],
};

const DEFAULT_STATE = {
  version: APP_VERSION,
  tasks: [],
  learned: {},
  preparedEvents: {},
  settings: {
    capacities: { 0: 0, 1: 150, 2: 150, 3: 360, 4: 150, 5: 120, 6: 0 },
    bufferPercent: 20,
    weekendProtected: true,
  },
  theme: "light",
};

let storageAvailable = true;
let state = loadState();
let viewMonday = startOfWeek(new Date());
let deferredInstallPrompt = null;
const schoolEvents = Array.isArray(window.PLANPULT_EVENTS) ? window.PLANPULT_EVENTS : [];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return cloneDefaultState();
    const parsed = JSON.parse(saved);
    return {
      ...cloneDefaultState(),
      ...parsed,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      learned: parsed.learned ?? {},
      preparedEvents: parsed.preparedEvents ?? {},
      settings: {
        ...DEFAULT_STATE.settings,
        ...(parsed.settings ?? {}),
        capacities: { ...DEFAULT_STATE.settings.capacities, ...(parsed.settings?.capacities ?? {}) },
      },
    };
  } catch (error) {
    storageAvailable = false;
    return cloneDefaultState();
  }
}

function saveState() {
  state.version = APP_VERSION;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch (error) {
    storageAvailable = false;
    showToast("Speichern ist blockiert – Änderungen gelten nur für diese Sitzung.");
  }
  renderStorageNotice();
}

function localDateString(date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function startOfWeek(date) {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

function formatDate(date, options = { day: "2-digit", month: "2-digit", year: "numeric" }) {
  return new Intl.DateTimeFormat("de-DE", options).format(date);
}

function formatMinutes(minutes) {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} Min.`;
  if (!rest) return `${hours} Std.`;
  return `${hours} Std. ${rest} Min.`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayString() {
  return localDateString(new Date());
}

function roundPlanningMinutes(minutes) {
  return Math.ceil(minutes / 30) * 30;
}

function correctionRate(typeKey) {
  const learned = state.learned[typeKey];
  if (learned?.samples > 0) return learned.sumPerStudent / learned.samples;
  return CORRECTION_TYPES[typeKey].perStudent;
}

function correctionCalculation(typeKey, count) {
  const type = CORRECTION_TYPES[typeKey];
  const rate = correctionRate(typeKey);
  const rawMinutes = rate * count + type.base;
  return { type, rate, rawMinutes, planningMinutes: roundPlanningMinutes(rawMinutes), personal: Boolean(state.learned[typeKey]?.samples) };
}

function learnCorrection(typeKey, count, actualTotalMinutes) {
  const type = CORRECTION_TYPES[typeKey];
  if (!type || count <= 0 || actualTotalMinutes <= 0) return;
  const personalPerStudent = Math.max(0, actualTotalMinutes - type.base) / count;
  const current = state.learned[typeKey] ?? { samples: 0, sumPerStudent: 0 };
  current.samples += 1;
  current.sumPerStudent += personalPerStudent;
  state.learned[typeKey] = current;
}

function taskWeight(task) {
  return task.minutes * (CATEGORIES[task.category]?.factor ?? 1);
}

function statusForRatio(ratio) {
  if (ratio < 0.55) return { label: "Luft vorhanden", color: "var(--green)", emoji: "🟢" };
  if (ratio < 0.75) return { label: "Gut gefüllt", color: "var(--yellow)", emoji: "🟡" };
  if (ratio < 0.9) return { label: "Hohe Belastung", color: "var(--orange)", emoji: "🟠" };
  return { label: ratio > 1 ? "Reserve reicht nicht" : "Voll ausgelastet", color: "var(--red)", emoji: "🔴" };
}

function dayCapacity(date) {
  const base = Number(state.settings.capacities[date.getDay()] ?? 0);
  return base * (1 - Number(state.settings.bufferPercent ?? 0) / 100);
}

function tasksOnDate(dateString) {
  return state.tasks.filter((task) => task.date === dateString);
}

function weightedMinutesOnDate(dateString) {
  return tasksOnDate(dateString).reduce((sum, task) => sum + taskWeight(task), 0);
}

function weekDates(monday = viewMonday) {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function renderAll() {
  applyTheme();
  renderQuickButtons();
  renderWeek();
  renderEvents();
  renderRules();
  renderLearnedValues();
  renderStorageNotice();
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme === "dark" ? "dark" : "light";
  $("meta[name='theme-color']").setAttribute("content", state.theme === "dark" ? "#141b19" : "#355c54");
}

function renderQuickButtons() {
  $("#quickButtons").innerHTML = Object.entries(CATEGORIES).map(([key, category]) => `
    <button class="quick-button" type="button" data-add-category="${key}">
      <span class="quick-icon" aria-hidden="true">${category.icon}</span>
      <span class="quick-label">${category.label}</span>
    </button>
  `).join("");
}

function renderWeek() {
  const dates = weekDates();
  const end = dates[6];
  const year = viewMonday.getFullYear() === end.getFullYear() ? viewMonday.getFullYear() : `${viewMonday.getFullYear()}/${end.getFullYear()}`;
  $("#weekHeading").textContent = `KW ${getIsoWeek(viewMonday)} · ${year}`;
  $("#weekRange").textContent = `${formatDate(viewMonday, { day: "2-digit", month: "long" })} – ${formatDate(end, { day: "2-digit", month: "long", year: "numeric" })}`;

  renderLoadSummary(dates);
  $("#weekGrid").innerHTML = dates.map(renderDayCard).join("");
  renderSuggestions();
}

function getIsoWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

function renderLoadSummary(dates) {
  const capacity = dates.reduce((sum, date) => sum + dayCapacity(date), 0);
  const planned = dates.reduce((sum, date) => sum + weightedMinutesOnDate(localDateString(date)), 0);
  const ratio = capacity ? planned / capacity : planned ? 1.2 : 0;
  const status = statusForRatio(ratio);
  const percent = Math.round(ratio * 100);
  document.documentElement.style.setProperty("--status-color", status.color);
  $("#loadSummary").innerHTML = `
    <div class="load-topline">
      <div><p class="eyebrow">Wochenbelastung</p><p class="load-label">${status.emoji} ${status.label}</p></div>
      <div class="load-percent">${percent}%</div>
    </div>
    <div class="progress" aria-label="${percent} Prozent ausgelastet"><span style="width:${Math.min(percent, 100)}%"></span></div>
    <p class="muted small">${formatMinutes(planned)} gewichtete Planung von ${formatMinutes(capacity)} nutzbarer Kapazität. Der ${state.settings.bufferPercent}%‑Puffer bleibt außen vor.</p>
  `;
}

function renderDayCard(date) {
  const dateString = localDateString(date);
  const tasks = tasksOnDate(dateString).sort((a, b) => Number(a.completed) - Number(b.completed) || a.createdAt - b.createdAt);
  const capacity = dayCapacity(date);
  const planned = weightedMinutesOnDate(dateString);
  const ratio = capacity ? planned / capacity : planned ? 1.2 : 0;
  const status = statusForRatio(ratio);
  const lessons = FIXED_SCHEDULE[date.getDay()] ?? [];
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return `
    <article class="day-card ${isWeekend ? "weekend" : ""}" style="--day-color:${status.color}">
      <div class="day-head">
        <div><h3>${DAY_NAMES[date.getDay()]}</h3><p class="day-date">${formatDate(date, { day: "2-digit", month: "2-digit" })}</p></div>
        <div class="day-load">${Math.round(ratio * 100)}%</div>
      </div>
      ${lessons.length ? `<div class="lesson-list">${lessons.map((lesson) => `<div class="lesson"><strong>${escapeHtml(lesson.className)}</strong>${escapeHtml(lesson.period)}${lesson.room ? ` · ${escapeHtml(lesson.room)}` : ""}</div>`).join("")}</div>` : ""}
      <div class="task-list">
        ${tasks.length ? tasks.map(renderTaskCard).join("") : `<div class="empty-day">${isWeekend && state.settings.weekendProtected ? "Geschützt – frei lassen" : "Noch keine Arbeitsblöcke"}</div>`}
      </div>
    </article>
  `;
}

function renderTaskCard(task) {
  const category = CATEGORIES[task.category] ?? CATEGORIES.other;
  const actualButton = task.correctionMeta && !task.correctionMeta.actualMinutes
    ? `<button type="button" data-actual-group="${task.groupId}">Ist-Zeit</button>`
    : "";
  return `
    <article class="task-card ${task.completed ? "completed" : ""}" style="--task-color:${category.color}">
      <p class="task-title">${category.icon} ${escapeHtml(task.title)}</p>
      <p class="task-meta">${formatMinutes(task.minutes)}${task.overbooked ? " · Reserve reicht nicht" : ""}${task.dueDate ? ` · Frist ${formatDate(parseDate(task.dueDate), { day: "2-digit", month: "2-digit" })}` : ""}</p>
      <div class="task-actions">
        <button type="button" data-toggle-task="${task.id}">${task.completed ? "Wieder öffnen" : "Erledigt"}</button>
        ${actualButton}
        <button type="button" data-edit-task="${task.id}">Bearbeiten</button>
        <button type="button" data-delete-task="${task.id}">Löschen</button>
      </div>
    </article>
  `;
}

function renderSuggestions() {
  const start = viewMonday;
  const end = addDays(viewMonday, 28);
  const keywords = /konferenz|eltern|pflegschaft|zp10|zke|noten|zeugnis|prüfung|klausur|adventsfeier|tofft|schulkonferenz/i;
  const suggestions = schoolEvents
    .filter((event) => {
      const date = parseDate(event.date);
      return date >= start && date <= end && keywords.test(event.title) && !state.preparedEvents[event.id];
    })
    .slice(0, 4);

  $("#suggestionsSection").classList.toggle("hidden", suggestions.length === 0);
  $("#suggestionsList").innerHTML = suggestions.map((event) => `
    <div class="suggestion">
      <div><p><strong>${escapeHtml(event.title)}</strong></p><p class="muted">Termin am ${formatDate(parseDate(event.date), { weekday: "short", day: "2-digit", month: "2-digit" })}</p></div>
      <button class="ghost" type="button" data-plan-event="${event.id}">Vorbereitung einplanen</button>
    </div>
  `).join("");
}

function renderEvents() {
  const query = $("#eventSearch")?.value.trim().toLocaleLowerCase("de") ?? "";
  const filtered = schoolEvents.filter((event) => !query || `${event.title} ${event.date}`.toLocaleLowerCase("de").includes(query));
  $("#eventList").innerHTML = filtered.length ? filtered.map((event) => `
    <article class="event-card">
      <div class="event-date">${formatDate(parseDate(event.date), { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</div>
      <p>${escapeHtml(event.title)}</p>
      <span class="audience-badge">${event.audience === "all" ? "betrifft alle" : event.audience === "group" ? "Teilgruppe" : "Hinweis"}</span>
    </article>
  `).join("") : `<div class="card muted">Keine passenden Termine gefunden.</div>`;
}

function renderRules() {
  const capacities = state.settings.capacities;
  $("#capacityInputs").innerHTML = [1, 2, 3, 4, 5, 6, 0].map((day) => `
    <label>${DAY_SHORT[day]}<input type="number" min="0" max="12" step="0.5" data-capacity-day="${day}" value="${(Number(capacities[day]) / 60).toFixed(1)}" /></label>
  `).join("");
  $("#bufferInput").value = state.settings.bufferPercent;
  $("#bufferOutput").value = `${state.settings.bufferPercent}%`;
  $("#weekendProtectedInput").checked = Boolean(state.settings.weekendProtected);
}

function renderLearnedValues() {
  const values = Object.entries(state.learned).filter(([, value]) => value?.samples > 0);
  $("#learnedValues").innerHTML = values.length ? `
    <table class="learned-table">
      <thead><tr><th>Kategorie</th><th>Persönlicher Mittelwert</th><th>Messungen</th></tr></thead>
      <tbody>${values.map(([key, value]) => `<tr><td>${escapeHtml(CORRECTION_TYPES[key]?.label ?? key)}</td><td>${(value.sumPerStudent / value.samples).toFixed(1).replace(".", ",")} Min./Arbeit</td><td>${value.samples}</td></tr>`).join("")}</tbody>
    </table>
  ` : `<p class="muted">Noch keine Ist-Zeit erfasst. Nach der ersten Korrektur wird dein persönlicher Wert hier sichtbar.</p>`;
}

function renderStorageNotice() {
  const node = $("#storageNotice");
  if (!node) return;
  node.textContent = storageAvailable
    ? "Aufgaben, Regeln und Lernwerte werden lokal in diesem Browser gespeichert."
    : "Der Browser blockiert die dauerhafte Speicherung. Die App bleibt für diese Sitzung nutzbar.";
}

function openTaskDialog(categoryKey, editTask = null) {
  const category = CATEGORIES[categoryKey] ?? CATEGORIES.other;
  $("#taskForm").reset();
  $("#taskFormError").classList.add("hidden");
  $("#editTaskId").value = editTask?.id ?? "";
  $("#taskCategory").value = categoryKey;
  $("#taskDialogEyebrow").textContent = category.label;
  $("#taskDialogTitle").textContent = editTask ? "Arbeitsblock bearbeiten" : `${category.label} hinzufügen`;
  $("#taskDate").value = editTask?.date ?? defaultTaskDate();
  $("#taskDueDate").value = editTask?.dueDate ?? "";
  $("#taskPriority").value = editTask?.priority ?? "normal";
  $("#autoDistribute").checked = !editTask;
  $("#distributeRow").classList.toggle("hidden", Boolean(editTask));

  const isCorrection = categoryKey === "correction" && !editTask;
  $("#genericTaskFields").classList.toggle("hidden", isCorrection);
  $("#correctionFields").classList.toggle("hidden", !isCorrection);
  $("#taskTitle").disabled = isCorrection;
  $("#taskMinutes").disabled = isCorrection;
  $("#correctionType").disabled = !isCorrection;
  $("#studentCount").disabled = !isCorrection;
  $("#actualHours").disabled = !isCorrection;
  $("#actualMinutes").disabled = !isCorrection;

  if (isCorrection) {
    $("#correctionType").innerHTML = Object.entries(CORRECTION_TYPES).map(([key, type]) => `<option value="${key}">${escapeHtml(type.label)}</option>`).join("");
    $("#studentCount").value = 28;
    $("#actualHours").value = 0;
    $("#actualMinutes").value = 0;
    updateCorrectionEstimate();
  } else {
    $("#taskTitle").value = editTask?.title ?? category.label;
    $("#taskMinutes").value = editTask?.minutes ?? 60;
  }

  $("#taskDialog").showModal();
}

function defaultTaskDate() {
  const today = parseDate(todayString());
  const weekEnd = addDays(viewMonday, 6);
  const selected = today >= viewMonday && today <= weekEnd ? today : viewMonday;
  return localDateString(selected);
}

function updateCorrectionEstimate() {
  const typeKey = $("#correctionType").value;
  const count = Math.max(1, Number($("#studentCount").value) || 1);
  const calculation = correctionCalculation(typeKey, count);
  $("#correctionEstimate").innerHTML = `
    <p><span class="evidence-badge">${escapeHtml(calculation.personal ? "Persönlicher Wert" : calculation.type.evidence)}</span></p>
    <p class="estimate-total">${formatMinutes(calculation.rawMinutes)} · als Planungsblock ${formatMinutes(calculation.planningMinutes)}</p>
    <p class="small">${count} × ${calculation.rate.toFixed(1).replace(".", ",")} Min.${calculation.type.base ? ` + ${calculation.type.base} Min. Sockelzeit` : ""}</p>
    <p class="muted small">${escapeHtml(calculation.personal ? `Bevorzugt aus ${state.learned[typeKey].samples} eigener Messung(en).` : calculation.type.note)}</p>
  `;
}

function handleTaskSubmit(event) {
  event.preventDefault();
  const editTaskId = $("#editTaskId").value;
  const category = $("#taskCategory").value;
  const date = $("#taskDate").value;
  const dueDate = $("#taskDueDate").value;
  const errorNode = $("#taskFormError");
  errorNode.classList.add("hidden");

  if (!date) return showTaskError("Bitte wähle einen Arbeitstag.");
  if (dueDate && dueDate < date) return showTaskError("Die Frist darf nicht vor dem gewählten Beginn liegen.");

  if (editTaskId) {
    const task = state.tasks.find((item) => item.id === editTaskId);
    if (!task) return showTaskError("Der Arbeitsblock wurde nicht gefunden.");
    task.title = $("#taskTitle").value.trim();
    task.minutes = Number($("#taskMinutes").value);
    task.date = date;
    task.dueDate = dueDate;
    task.priority = $("#taskPriority").value;
    saveAndRender("Arbeitsblock aktualisiert.");
    $("#taskDialog").close();
    return;
  }

  let title;
  let minutes;
  let correctionMeta = null;
  if (category === "correction") {
    const typeKey = $("#correctionType").value;
    const count = Math.max(1, Number($("#studentCount").value) || 1);
    const calculation = correctionCalculation(typeKey, count);
    title = calculation.type.label;
    minutes = calculation.planningMinutes;
    const actualTotal = (Number($("#actualHours").value) || 0) * 60 + (Number($("#actualMinutes").value) || 0);
    correctionMeta = { typeKey, count, standardRate: calculation.type.perStudent, base: calculation.type.base, estimatedMinutes: calculation.rawMinutes, actualMinutes: actualTotal || 0 };
    if (actualTotal > 0) learnCorrection(typeKey, count, actualTotal);
  } else {
    title = $("#taskTitle").value.trim();
    minutes = Number($("#taskMinutes").value);
  }

  if (!title) return showTaskError("Bitte gib einen Titel ein.");
  if (!Number.isFinite(minutes) || minutes < 15) return showTaskError("Bitte gib mindestens 15 Minuten ein.");

  const groupId = uid("group");
  const baseTask = { groupId, category, title, dueDate, priority: $("#taskPriority").value, correctionMeta, createdAt: Date.now(), completed: false };
  if ($("#autoDistribute").checked && dueDate) {
    const blocks = distributeTask(baseTask, minutes, date, dueDate);
    state.tasks.push(...blocks);
    const overload = blocks.some((block) => block.overbooked);
    saveAndRender(overload ? "Aufgabe verteilt; ein Rest übersteigt die Reserve." : `Aufgabe auf ${blocks.length} Blöcke verteilt.`);
  } else {
    state.tasks.push({ ...baseTask, id: uid("task"), date, minutes, overbooked: false });
    saveAndRender("Aufgabe eingeplant.");
  }
  $("#taskDialog").close();
}

function showTaskError(message) {
  const node = $("#taskFormError");
  node.textContent = message;
  node.classList.remove("hidden");
}

function distributeTask(baseTask, totalMinutes, startDate, dueDate) {
  const today = todayString();
  let cursor = parseDate(startDate < today ? today : startDate);
  const end = parseDate(dueDate);
  let remaining = totalMinutes;
  const blocks = [];

  while (cursor <= end && remaining > 0) {
    const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    if (!(state.settings.weekendProtected && isWeekend)) {
      const dateString = localDateString(cursor);
      const factor = CATEGORIES[baseTask.category]?.factor ?? 1;
      let available = Math.max(0, (dayCapacity(cursor) - weightedMinutesOnDate(dateString)) / factor);
      while (remaining > 0 && available >= 15) {
        const chunk = Math.min(90, remaining, Math.floor(available / 15) * 15);
        if (chunk < 15) break;
        blocks.push({ ...baseTask, id: uid("task"), date: dateString, minutes: chunk, overbooked: false });
        remaining -= chunk;
        available -= chunk;
      }
    }
    cursor = addDays(cursor, 1);
  }

  if (remaining > 0) {
    blocks.push({ ...baseTask, id: uid("task"), date: dueDate, minutes: remaining, overbooked: true });
  }
  return blocks;
}

function saveAndRender(message) {
  saveState();
  renderWeek();
  renderLearnedValues();
  if (message) showToast(message);
}

function toggleTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.completed = !task.completed;
  saveAndRender(task.completed ? "Erledigt markiert." : "Wieder geöffnet.");
}

function deleteTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (!confirm(`„${task.title}“ wirklich löschen?`)) return;
  state.tasks = state.tasks.filter((item) => item.id !== taskId);
  saveAndRender("Arbeitsblock gelöscht.");
}

function openActualDialog(groupId) {
  const blocks = state.tasks.filter((task) => task.groupId === groupId && task.correctionMeta);
  if (!blocks.length) return;
  const meta = blocks[0].correctionMeta;
  $("#actualGroupId").value = groupId;
  $("#actualDialogInfo").textContent = `${blocks[0].title} · ${meta.count} Arbeiten · geplant ${formatMinutes(blocks.reduce((sum, block) => sum + block.minutes, 0))}`;
  $("#groupActualHours").value = Math.floor((meta.actualMinutes || 0) / 60);
  $("#groupActualMinutes").value = (meta.actualMinutes || 0) % 60;
  $("#actualFormError").classList.add("hidden");
  $("#actualDialog").showModal();
}

function handleActualSubmit(event) {
  event.preventDefault();
  const groupId = $("#actualGroupId").value;
  const total = (Number($("#groupActualHours").value) || 0) * 60 + (Number($("#groupActualMinutes").value) || 0);
  const blocks = state.tasks.filter((task) => task.groupId === groupId && task.correctionMeta);
  if (!blocks.length || total <= 0) {
    $("#actualFormError").textContent = "Bitte gib eine tatsächliche Zeit größer als null ein.";
    $("#actualFormError").classList.remove("hidden");
    return;
  }
  const meta = blocks[0].correctionMeta;
  if (!meta.actualMinutes) learnCorrection(meta.typeKey, meta.count, total);
  blocks.forEach((task) => { task.correctionMeta.actualMinutes = total; });
  $("#actualDialog").close();
  saveAndRender("Persönlicher Korrekturwert gelernt.");
}

function planEventPreparation(eventId) {
  const event = schoolEvents.find((item) => item.id === eventId);
  if (!event) return;
  const eventDate = parseDate(event.date);
  const today = parseDate(todayString());
  const suggested = addDays(eventDate, -14);
  const start = suggested < today ? today : suggested;
  const due = addDays(eventDate, -1);
  const baseTask = {
    groupId: uid("group"),
    category: "preparation",
    title: `Vorbereitung: ${event.title}`,
    dueDate: localDateString(due),
    priority: "high",
    correctionMeta: null,
    createdAt: Date.now(),
    completed: false,
  };
  state.tasks.push(...distributeTask(baseTask, 60, localDateString(start), localDateString(due < start ? start : due)));
  state.preparedEvents[eventId] = true;
  saveAndRender("Vorbereitung mit Vorlauf eingeplant.");
}

function buildWeekBrief() {
  const dates = weekDates();
  const weekStart = localDateString(dates[0]);
  const weekEnd = localDateString(dates[6]);
  const tasks = state.tasks.filter((task) => task.date >= weekStart && task.date <= weekEnd);
  const open = tasks.filter((task) => !task.completed);
  const capacity = dates.reduce((sum, date) => sum + dayCapacity(date), 0);
  const planned = tasks.reduce((sum, task) => sum + taskWeight(task), 0);
  const status = statusForRatio(capacity ? planned / capacity : 0);
  const upcomingEnd = addDays(dates[6], 14);
  const upcoming = schoolEvents.filter((event) => parseDate(event.date) > dates[6] && parseDate(event.date) <= upcomingEnd).slice(0, 6);
  const grouped = Object.entries(CATEGORIES).map(([key, category]) => {
    const minutes = open.filter((task) => task.category === key).reduce((sum, task) => sum + task.minutes, 0);
    return minutes ? `${category.label}: ${formatMinutes(minutes)}` : null;
  }).filter(Boolean);

  return [
    `PLANPULT · WOCHENBRIEF KW ${getIsoWeek(viewMonday)}`,
    `${formatDate(dates[0])} bis ${formatDate(dates[6])}`,
    "",
    `Belastung: ${status.label} (${Math.round(capacity ? planned / capacity * 100 : 0)} %).`,
    `Offene Arbeitsblöcke: ${open.length}.`,
    grouped.length ? grouped.join(" · ") : "Keine offenen Arbeitsblöcke.",
    "",
    upcoming.length ? "Nächste 14 Tage:" : "In den nächsten 14 Tagen sind keine Schultermine hinterlegt.",
    ...upcoming.map((event) => `- ${formatDate(parseDate(event.date), { weekday: "short", day: "2-digit", month: "2-digit" })}: ${event.title}`),
    "",
    `Pufferregel: ${state.settings.bufferPercent} % bleiben frei; Wochenende ${state.settings.weekendProtected ? "geschützt" : "verfügbar"}.`,
    "Hilf mir, diese Woche realistisch und stressarm zu priorisieren.",
  ].join("\n");
}

function openWeekBrief() {
  $("#briefText").value = buildWeekBrief();
  $("#briefDialog").showModal();
}

async function copyBrief() {
  try {
    await navigator.clipboard.writeText($("#briefText").value);
    showToast("Wochenbrief kopiert.");
  } catch (error) {
    $("#briefText").select();
    document.execCommand("copy");
    showToast("Wochenbrief kopiert.");
  }
}

async function shareBrief() {
  if (navigator.share) {
    await navigator.share({ title: "Planpult Wochenbrief", text: $("#briefText").value }).catch(() => {});
  } else {
    await copyBrief();
  }
}

function openChatGpt() {
  const chatWindow = window.open("https://chatgpt.com/", "_blank", "noopener");
  copyBrief();
  if (!chatWindow) showToast("Wochenbrief kopiert. Öffne ChatGPT und füge ihn ein.");
}

function saveRules(event) {
  event.preventDefault();
  $$('[data-capacity-day]').forEach((input) => {
    state.settings.capacities[input.dataset.capacityDay] = Math.max(0, Number(input.value) * 60);
  });
  state.settings.bufferPercent = Number($("#bufferInput").value);
  state.settings.weekendProtected = $("#weekendProtectedInput").checked;
  saveAndRender("Regeln gespeichert.");
}

function resetRules() {
  if (!confirm("Arbeitskapazitäten und Puffer auf die Standardwerte zurücksetzen?")) return;
  state.settings = JSON.parse(JSON.stringify(DEFAULT_STATE.settings));
  saveState();
  renderAll();
  showToast("Standardregeln wiederhergestellt.");
}

function resetLearned() {
  if (!confirm("Nur deine persönlichen Korrekturwerte zurücksetzen? Aufgaben bleiben erhalten.")) return;
  state.learned = {};
  saveAndRender("Persönliche Korrekturwerte zurückgesetzt.");
}

function downloadBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `planpult-backup-${todayString()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function restoreBackup(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.tasks) || !parsed.settings) throw new Error("invalid");
    state = { ...cloneDefaultState(), ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings, capacities: { ...DEFAULT_STATE.settings.capacities, ...(parsed.settings.capacities ?? {}) } } };
    saveState();
    renderAll();
    showToast("Backup eingelesen.");
  } catch (error) {
    showToast("Dieses Backup konnte nicht gelesen werden.");
  }
}

function switchScreen(screenName) {
  $$(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === `${screenName}Screen`));
  $$(".nav-button").forEach((button) => button.classList.toggle("active", button.dataset.screen === screenName));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeDialog(button) {
  button.closest("dialog")?.close();
}

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-category]");
    if (addButton) openTaskDialog(addButton.dataset.addCategory);

    const toggleButton = event.target.closest("[data-toggle-task]");
    if (toggleButton) toggleTask(toggleButton.dataset.toggleTask);

    const editButton = event.target.closest("[data-edit-task]");
    if (editButton) {
      const task = state.tasks.find((item) => item.id === editButton.dataset.editTask);
      if (task) openTaskDialog(task.category, task);
    }

    const deleteButton = event.target.closest("[data-delete-task]");
    if (deleteButton) deleteTask(deleteButton.dataset.deleteTask);

    const actualButton = event.target.closest("[data-actual-group]");
    if (actualButton) openActualDialog(actualButton.dataset.actualGroup);

    const planButton = event.target.closest("[data-plan-event]");
    if (planButton) planEventPreparation(planButton.dataset.planEvent);

    if (event.target.closest(".close-dialog")) closeDialog(event.target.closest(".close-dialog"));
  });

  $$(".nav-button").forEach((button) => button.addEventListener("click", () => switchScreen(button.dataset.screen)));
  $("#previousWeek").addEventListener("click", () => { viewMonday = addDays(viewMonday, -7); renderWeek(); });
  $("#nextWeek").addEventListener("click", () => { viewMonday = addDays(viewMonday, 7); renderWeek(); });
  $("#todayButton").addEventListener("click", () => { viewMonday = startOfWeek(new Date()); renderWeek(); });
  $("#eventSearch").addEventListener("input", renderEvents);
  $("#taskForm").addEventListener("submit", handleTaskSubmit);
  $("#actualForm").addEventListener("submit", handleActualSubmit);
  $("#correctionType").addEventListener("change", updateCorrectionEstimate);
  $("#studentCount").addEventListener("input", updateCorrectionEstimate);
  $("#weekBriefButton").addEventListener("click", openWeekBrief);
  $("#copyBriefButton").addEventListener("click", copyBrief);
  $("#shareBriefButton").addEventListener("click", shareBrief);
  $("#chatGptButton").addEventListener("click", openChatGpt);
  $("#rulesForm").addEventListener("submit", saveRules);
  $("#bufferInput").addEventListener("input", () => { $("#bufferOutput").value = `${$("#bufferInput").value}%`; });
  $("#resetRulesButton").addEventListener("click", resetRules);
  $("#resetLearnedButton").addEventListener("click", resetLearned);
  $("#backupButton").addEventListener("click", downloadBackup);
  $("#restoreInput").addEventListener("change", (event) => { if (event.target.files[0]) restoreBackup(event.target.files[0]); event.target.value = ""; });
  $("#themeButton").addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; saveState(); applyTheme(); });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    $("#installButton").classList.remove("hidden");
  });
  $("#installButton").addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    $("#installButton").classList.add("hidden");
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(() => {}));
}

bindEvents();
renderAll();
registerServiceWorker();
