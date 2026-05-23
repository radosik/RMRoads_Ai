const sampleCsv = `shipment_id,customer,origin,destination,mode,carrier,planned_ship_date,eta,priority,value,sku_group,destination_location
RM-1001,Northstar Retail,Shenzhen CN,Los Angeles CA,Ocean,Maersk,2026-05-10,2026-06-03,critical,128000,Electronics,LA DC
RM-1002,Helio Parts,Hamburg DE,Chicago IL,Ocean+Rail,Hapag-Lloyd,2026-05-11,2026-06-08,high,76000,Industrial Components,Chicago Hub
RM-1003,Evergreen Home,Savannah GA,Dallas TX,Truck,JB Hunt,2026-05-20,2026-05-25,standard,18500,Furniture,Dallas DC
RM-1004,Arc Supply,Busan KR,Seattle WA,Ocean,ONE,2026-05-12,2026-06-01,critical,94000,Semiconductors,Seattle DC
RM-1005,Peak Foods,Veracruz MX,Atlanta GA,Truck,Schneider,2026-05-19,2026-05-24,high,42000,Packaged Foods,Atlanta DC`;

const { parseCsv, validateRows } = window.RMRoadsCsv;
const { createDefaultEvents, scoreShipments, buildExceptionQueue } = window.RMRoadsRisk;
const { generateRecommendation } = window.RMRoadsRecommendation;
const { loadState, saveState, clearState } = window.RMRoadsStorage;
const { calculatePilotMetrics } = window.RMRoadsMetrics;
const { buildDecisionCsv, buildWorkspaceSnapshot, parseWorkspaceSnapshot } = window.RMRoadsExport;

const plannerOwners = ["Maya Chen", "Leo Martins", "Nina Patel", "Ops Review"];

let shipments = [];
let scoredShipments = [];
let importErrors = [];
let disruptionEvents = createDefaultEvents();
let exceptionQueue = [];
let selectedExceptionId = "";
let selectedScenarioAction = "";
let exceptionDecisions = {};
let exceptionAssignments = {};

const csvInput = document.querySelector("#csvInput");
const workspaceImportInput = document.querySelector("#workspaceImportInput");
const loadSampleButton = document.querySelector("#loadSampleButton");
const resetWorkspaceButton = document.querySelector("#resetWorkspaceButton");
const exportWorkspaceButton = document.querySelector("#exportWorkspaceButton");
const exportDecisionsButton = document.querySelector("#exportDecisionsButton");
const priorityFilter = document.querySelector("#priorityFilter");
const modeFilter = document.querySelector("#modeFilter");
const eventForm = document.querySelector("#eventForm");
const decisionForm = document.querySelector("#decisionForm");

restoreWorkspace();

csvInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  processCsv(text);
  csvInput.value = "";
});

loadSampleButton.addEventListener("click", () => processCsv(sampleCsv));
resetWorkspaceButton.addEventListener("click", resetWorkspace);
exportWorkspaceButton.addEventListener("click", exportWorkspace);
exportDecisionsButton.addEventListener("click", exportDecisionCsv);
workspaceImportInput.addEventListener("change", handleWorkspaceImport);
priorityFilter.addEventListener("change", renderShipments);
modeFilter.addEventListener("change", renderShipments);
eventForm.addEventListener("submit", handleEventSubmit);
decisionForm.addEventListener("submit", handleDecisionSubmit);

recalculateRisk();
hydrateModeFilter();
renderAll();

function processCsv(csvText) {
  const parsed = parseCsv(csvText);
  const validation = validateRows(parsed.headers, parsed.rows);

  shipments = validation.validRows;
  importErrors = validation.errors;

  recalculateRisk();
  hydrateModeFilter();
  persistWorkspace();
  renderAll();
}

function handleEventSubmit(event) {
  event.preventDefault();

  const nextNumber = disruptionEvents.length + 1;
  disruptionEvents.unshift({
    id: `EVT-${String(nextNumber).padStart(3, "0")}`,
    type: document.querySelector("#eventType").value.trim(),
    severity: document.querySelector("#eventSeverity").value,
    affectedText: document.querySelector("#eventAffectedText").value.trim(),
    mode: document.querySelector("#eventMode").value.trim(),
    carrier: document.querySelector("#eventCarrier").value.trim(),
    confidence: Number(document.querySelector("#eventConfidence").value),
    source: document.querySelector("#eventSource").value.trim(),
    status: "active",
  });

  eventForm.reset();
  document.querySelector("#eventType").value = "Port congestion";
  document.querySelector("#eventSeverity").value = "high";
  document.querySelector("#eventConfidence").value = "75";
  document.querySelector("#eventSource").value = "Manual pilot signal";

  recalculateRisk();
  persistWorkspace();
  renderAll();
}

function toggleEventStatus(eventId) {
  disruptionEvents = disruptionEvents.map((event) =>
    event.id === eventId
      ? {
          ...event,
          status: event.status === "active" ? "archived" : "active",
        }
      : event,
  );

  recalculateRisk();
  persistWorkspace();
  renderAll();
}

function resetWorkspace() {
  shipments = [];
  scoredShipments = [];
  importErrors = [];
  disruptionEvents = createDefaultEvents();
  exceptionQueue = [];
  selectedExceptionId = "";
  selectedScenarioAction = "";
  exceptionDecisions = {};
  exceptionAssignments = {};
  priorityFilter.value = "all";
  modeFilter.value = "all";
  clearState();
  recalculateRisk();
  hydrateModeFilter();
  renderAll();
}

async function handleWorkspaceImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imported = parseWorkspaceSnapshot(await file.text());
    shipments = imported.shipments;
    importErrors = imported.importErrors;
    disruptionEvents = imported.disruptionEvents.length ? imported.disruptionEvents : createDefaultEvents();
    exceptionDecisions = imported.exceptionDecisions;
    exceptionAssignments = imported.exceptionAssignments;
    selectedExceptionId = imported.selectedExceptionId;
    selectedScenarioAction = imported.selectedScenarioAction;
    recalculateRisk();
    hydrateModeFilter();
    persistWorkspace();
    renderAll();
  } catch (error) {
    importErrors = [
      {
        rowNumber: "Workspace",
        shipmentId: "-",
        message: error.message || "Workspace import failed.",
      },
    ];
    renderErrors();
  } finally {
    workspaceImportInput.value = "";
  }
}

function restoreWorkspace() {
  const state = loadState();
  if (!state) return;

  shipments = Array.isArray(state.shipments) ? state.shipments : [];
  importErrors = Array.isArray(state.importErrors) ? state.importErrors : [];
  disruptionEvents = Array.isArray(state.disruptionEvents) ? state.disruptionEvents : createDefaultEvents();
  exceptionDecisions = state.exceptionDecisions && typeof state.exceptionDecisions === "object" ? state.exceptionDecisions : {};
  exceptionAssignments =
    state.exceptionAssignments && typeof state.exceptionAssignments === "object" ? state.exceptionAssignments : {};
  selectedExceptionId = typeof state.selectedExceptionId === "string" ? state.selectedExceptionId : "";
  selectedScenarioAction = typeof state.selectedScenarioAction === "string" ? state.selectedScenarioAction : "";
}

function persistWorkspace() {
  saveState(getWorkspaceState());
}

function getWorkspaceState() {
  return {
    shipments,
    importErrors,
    disruptionEvents,
    exceptionDecisions,
    exceptionAssignments,
    selectedExceptionId,
    selectedScenarioAction,
    savedAt: new Date().toISOString(),
  };
}

function exportWorkspace() {
  const snapshot = buildWorkspaceSnapshot(getWorkspaceState());
  downloadText({
    filename: `rmroads-workspace-${getDateStamp()}.json`,
    mimeType: "application/json",
    text: `${JSON.stringify(snapshot, null, 2)}\n`,
  });
}

function exportDecisionCsv() {
  const metrics = calculatePilotMetrics({
    shipments: scoredShipments,
    exceptionQueue,
    exceptionDecisions,
    exceptionAssignments,
  });
  const csv = buildDecisionCsv(metrics.decisions);
  downloadText({
    filename: `rmroads-decisions-${getDateStamp()}.csv`,
    mimeType: "text/csv",
    text: `${csv}\n`,
  });
}

function recalculateRisk() {
  scoredShipments = scoreShipments(shipments, disruptionEvents);
  exceptionQueue = buildExceptionQueue(scoredShipments).map((exception) => {
    const decision = exceptionDecisions[exception.id];
    return {
      ...exception,
      owner: exceptionAssignments[exception.id] || "",
      status: decision?.status || exception.status,
      decisionNote: decision?.note || "",
      selectedScenarioAction: decision?.scenarioAction || "",
    };
  });

  if (selectedExceptionId && !exceptionQueue.some((exception) => exception.id === selectedExceptionId)) {
    selectedExceptionId = "";
    selectedScenarioAction = "";
  }
}

function renderAll() {
  renderSummary();
  renderErrors();
  renderEvents();
  renderShipments();
  renderExceptions();
  renderRecommendationPanel();
  renderPilotValue();
}

function hydrateModeFilter() {
  const current = modeFilter.value;
  const modes = Array.from(new Set(shipments.map((shipment) => shipment.mode))).sort();
  modeFilter.innerHTML = '<option value="all">All</option>';
  modes.forEach((mode) => {
    const option = document.createElement("option");
    option.value = mode;
    option.textContent = mode;
    modeFilter.appendChild(option);
  });
  modeFilter.value = modes.includes(current) ? current : "all";
}

function renderSummary() {
  const totalValue = shipments.reduce((sum, shipment) => sum + shipment.value, 0);
  const criticalCount = shipments.filter((shipment) => shipment.priority === "critical").length;
  const activeExceptions = exceptionQueue.filter((exception) => exception.status === "new" || exception.status === "deferred");
  const criticalRisk = activeExceptions.filter((exception) => exception.riskLevel === "critical").length;

  document.querySelector("#totalShipments").textContent = String(shipments.length);
  document.querySelector("#criticalShipments").textContent = String(criticalCount);
  document.querySelector("#totalValue").textContent = formatCurrency(totalValue);
  document.querySelector("#errorCount").textContent = String(importErrors.length);
  document.querySelector("#openExceptions").textContent = String(activeExceptions.length);
  document.querySelector("#criticalRisk").textContent = String(criticalRisk);
}

function renderErrors() {
  const panel = document.querySelector("#errorsPanel");
  const table = document.querySelector("#errorsTable");

  panel.classList.toggle("hidden", importErrors.length === 0);
  table.innerHTML = importErrors
    .map(
      (error) => `
        <tr>
          <td>${escapeHtml(String(error.rowNumber))}</td>
          <td>${escapeHtml(error.message)}</td>
          <td>${escapeHtml(error.shipmentId)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderEvents() {
  const table = document.querySelector("#eventsTable");

  if (!disruptionEvents.length) {
    table.innerHTML = '<tr><td colspan="8" class="empty-state">No disruption events created.</td></tr>';
    return;
  }

  table.innerHTML = disruptionEvents
    .map(
      (event) => `
        <tr>
          <td>
            <span class="shipment-id">${escapeHtml(event.type)}</span>
            <span class="subtle">${escapeHtml(event.source)}</span>
          </td>
          <td><span class="risk risk-${event.severity}">${escapeHtml(event.severity)}</span></td>
          <td>${escapeHtml(event.affectedText || "-")}</td>
          <td>${escapeHtml(event.mode || "Any")}</td>
          <td>${escapeHtml(event.carrier || "Any")}</td>
          <td>${escapeHtml(String(event.confidence))}%</td>
          <td><span class="status status-${event.status}">${escapeHtml(event.status)}</span></td>
          <td>
            <button class="text-button" type="button" data-event-id="${escapeHtml(event.id)}">
              ${event.status === "active" ? "Archive" : "Activate"}
            </button>
          </td>
        </tr>
      `,
    )
    .join("");

  table.querySelectorAll("[data-event-id]").forEach((button) => {
    button.addEventListener("click", () => toggleEventStatus(button.dataset.eventId));
  });
}

function renderShipments() {
  const priority = priorityFilter.value;
  const mode = modeFilter.value;
  const filtered = scoredShipments.filter((shipment) => {
    const priorityMatch = priority === "all" || shipment.priority === priority;
    const modeMatch = mode === "all" || shipment.mode === mode;
    return priorityMatch && modeMatch;
  });

  document.querySelector("#tableStatus").textContent = shipments.length
    ? `${filtered.length} of ${shipments.length} imported shipments shown.`
    : "No CSV imported yet. Load sample data or upload a shipment file.";

  const table = document.querySelector("#shipmentsTable");

  if (!scoredShipments.length) {
    table.innerHTML =
      '<tr><td colspan="9" class="empty-state">Upload a CSV to create the first shipment dashboard.</td></tr>';
    return;
  }

  if (!filtered.length) {
    table.innerHTML =
      '<tr><td colspan="9" class="empty-state">No shipments match the current filters.</td></tr>';
    return;
  }

  table.innerHTML = filtered
    .map(
      (shipment) => `
        <tr>
          <td>
            <span class="shipment-id">${escapeHtml(shipment.id)}</span>
            <span class="subtle">${escapeHtml(shipment.skuGroup)}</span>
          </td>
          <td>${escapeHtml(shipment.customer)}</td>
          <td>
            ${escapeHtml(shipment.origin)} → ${escapeHtml(shipment.destination)}
            <span class="subtle">${escapeHtml(shipment.destinationLocation)}</span>
          </td>
          <td>${escapeHtml(shipment.mode)}</td>
          <td>${escapeHtml(shipment.carrier)}</td>
          <td>
            ${escapeHtml(shipment.eta)}
            <span class="subtle">Ships ${escapeHtml(shipment.plannedShipDate)}</span>
          </td>
          <td><span class="priority priority-${shipment.priority}">${shipment.priority}</span></td>
          <td>
            <span class="risk risk-${shipment.riskLevel}">${shipment.riskLevel}</span>
            <span class="subtle">${shipment.riskScore}/100</span>
          </td>
          <td>${formatCurrency(shipment.value)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderExceptions() {
  const table = document.querySelector("#exceptionsTable");

  document.querySelector("#exceptionStatus").textContent = exceptionQueue.length
    ? `${exceptionQueue.length} open exceptions generated from active disruption events.`
    : "No exceptions generated. Import shipments and add matching disruption events.";

  if (!exceptionQueue.length) {
    table.innerHTML = '<tr><td colspan="9" class="empty-state">No exceptions yet.</td></tr>';
    return;
  }

  table.innerHTML = exceptionQueue
    .map(
      (exception) => `
        <tr>
          <td>
            <span class="shipment-id">${escapeHtml(exception.id)}</span>
            <span class="subtle">${escapeHtml(exception.shipmentId)}</span>
          </td>
          <td>${escapeHtml(exception.customer)}</td>
          <td>${escapeHtml(exception.lane)}</td>
          <td>${escapeHtml(exception.eta)}</td>
          <td>
            <span class="risk risk-${exception.riskLevel}">${exception.riskLevel}</span>
            <span class="subtle">${exception.riskScore}/100</span>
          </td>
          <td>${escapeHtml(exception.reason)}</td>
          <td>
            <select class="owner-select" data-owner-exception-id="${escapeHtml(exception.id)}">
              <option value="">Unassigned</option>
              ${plannerOwners
                .map(
                  (owner) =>
                    `<option value="${escapeHtml(owner)}" ${exception.owner === owner ? "selected" : ""}>${escapeHtml(owner)}</option>`,
                )
                .join("")}
            </select>
          </td>
          <td><span class="status status-${exception.status}">${escapeHtml(exception.status)}</span></td>
          <td>
            <button class="text-button" type="button" data-exception-id="${escapeHtml(exception.id)}">
              Review
            </button>
          </td>
        </tr>
      `,
    )
    .join("");

  table.querySelectorAll("[data-exception-id]").forEach((button) => {
    button.addEventListener("click", () => selectException(button.dataset.exceptionId));
  });
  table.querySelectorAll("[data-owner-exception-id]").forEach((select) => {
    select.addEventListener("change", () => assignExceptionOwner(select.dataset.ownerExceptionId, select.value));
  });
}

function assignExceptionOwner(exceptionId, owner) {
  if (owner) {
    exceptionAssignments[exceptionId] = owner;
  } else {
    delete exceptionAssignments[exceptionId];
  }

  recalculateRisk();
  persistWorkspace();
  renderAll();
}

function selectException(exceptionId) {
  selectedExceptionId = exceptionId;
  const exception = exceptionQueue.find((item) => item.id === selectedExceptionId);
  selectedScenarioAction = exception?.selectedScenarioAction || "";
  renderExceptions();
  renderRecommendationPanel();
  document.querySelector("#recommendationPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderRecommendationPanel() {
  const panel = document.querySelector("#recommendationPanel");
  const status = document.querySelector("#recommendationStatus");
  const summary = document.querySelector("#recommendationSummary");
  const scenarioGrid = document.querySelector("#scenarioGrid");
  const note = document.querySelector("#decisionNote");

  const exception = exceptionQueue.find((item) => item.id === selectedExceptionId);
  if (!exception) {
    panel.classList.add("hidden");
    status.textContent = "Select an exception to generate response scenarios.";
    summary.innerHTML = "";
    scenarioGrid.innerHTML = "";
    note.value = "";
    return;
  }

  const shipment = scoredShipments.find((item) => item.id === exception.shipmentId);
  const recommendation = generateRecommendation(exception, shipment);
  const selectedAction = selectedScenarioAction || recommendation.primaryAction;
  selectedScenarioAction = selectedAction;

  panel.classList.remove("hidden");
  status.textContent = `${exception.id} for ${exception.customer} is ready for planner decision${
    exception.owner ? ` by ${exception.owner}` : ""
  }.`;
  summary.innerHTML = `
    <div>
      <span class="risk risk-${exception.riskLevel}">${escapeHtml(exception.riskLevel)}</span>
      <span class="status status-new">${escapeHtml(recommendation.confidence)} confidence</span>
    </div>
    <h3>${escapeHtml(recommendation.summary)}</h3>
    <ul>
      ${recommendation.assumptions.map((assumption) => `<li>${escapeHtml(assumption)}</li>`).join("")}
    </ul>
  `;

  scenarioGrid.innerHTML = recommendation.scenarios
    .map(
      (scenario) => `
        <button
          class="scenario-card ${scenario.action === selectedAction ? "selected" : ""}"
          type="button"
          data-scenario-action="${escapeHtml(scenario.action)}"
        >
          <span>${scenario.recommended ? "Recommended" : "Option"}</span>
          <strong>${escapeHtml(scenario.label)}</strong>
          <dl>
            <div><dt>ETA</dt><dd>${escapeHtml(scenario.etaImpact)}</dd></div>
            <div><dt>Cost</dt><dd>${escapeHtml(scenario.costBand)}</dd></div>
            <div><dt>Risk</dt><dd>${escapeHtml(scenario.customerRisk)}</dd></div>
            <div><dt>Complexity</dt><dd>${escapeHtml(scenario.complexity)}</dd></div>
          </dl>
          <p>${escapeHtml(scenario.rationale)}</p>
        </button>
      `,
    )
    .join("");

  scenarioGrid.querySelectorAll("[data-scenario-action]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedScenarioAction = button.dataset.scenarioAction;
      renderRecommendationPanel();
    });
  });

  note.value = exceptionDecisions[exception.id]?.note || "";
}

function handleDecisionSubmit(event) {
  event.preventDefault();

  const submitter = event.submitter;
  const status = submitter?.dataset.decision;
  const exception = exceptionQueue.find((item) => item.id === selectedExceptionId);

  if (!status || !exception) return;

  const note = document.querySelector("#decisionNote").value.trim();
  exceptionDecisions[exception.id] = {
    status,
    note,
    scenarioAction: selectedScenarioAction,
    decidedAt: new Date().toISOString(),
  };

  recalculateRisk();
  persistWorkspace();
  renderAll();
}

function renderPilotValue() {
  const metrics = calculatePilotMetrics({
    shipments: scoredShipments,
    exceptionQueue,
    exceptionDecisions,
    exceptionAssignments,
  });

  document.querySelector("#reviewedCount").textContent = String(metrics.reviewedCount);
  document.querySelector("#approvedCount").textContent = String(metrics.approvedCount);
  document.querySelector("#deferredCount").textContent = String(metrics.deferredCount);
  document.querySelector("#rejectedCount").textContent = String(metrics.rejectedCount);
  document.querySelector("#averageRiskScore").textContent = String(metrics.averageRiskScore);
  document.querySelector("#estimatedProtectedValue").textContent = formatCurrency(metrics.estimatedProtectedValue);

  const table = document.querySelector("#decisionLogTable");
  if (!metrics.decisions.length) {
    table.innerHTML = '<tr><td colspan="8" class="empty-state">No planner decisions yet.</td></tr>';
    return;
  }

  table.innerHTML = metrics.decisions
    .map(
      (decision) => `
        <tr>
          <td>
            <span class="status status-${decision.status}">${escapeHtml(decision.status)}</span>
            <span class="subtle">${escapeHtml(formatDateTime(decision.decidedAt))}</span>
          </td>
          <td>
            ${escapeHtml(decision.customer)}
            <span class="subtle">${escapeHtml(decision.shipmentId)}</span>
          </td>
          <td>${escapeHtml(decision.lane)}</td>
          <td>${escapeHtml(formatAction(decision.scenarioAction))}</td>
          <td>${escapeHtml(decision.owner || "Unassigned")}</td>
          <td>
            <span class="risk risk-${decision.riskLevel}">${escapeHtml(decision.riskLevel)}</span>
            <span class="subtle">${escapeHtml(String(decision.riskScore))}/100</span>
          </td>
          <td>${formatCurrency(decision.estimatedProtectedValue)}</td>
          <td>${escapeHtml(decision.note || "-")}</td>
        </tr>
      `,
    )
    .join("");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAction(value) {
  return String(value || "watch")
    .split("-")
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadText({ filename, mimeType, text }) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
