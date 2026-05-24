import type {
  CriticalAlertEntry,
  DecisionLogEntry,
  ExceptionItem,
  ImportHistoryEntry,
  ScoredShipment,
} from "./types";

export type PilotSummaryInput = {
  organizationName: string;
  shipmentCount: number;
  eventCount: number;
  exceptionCount: number;
  criticalExceptionCount: number;
  totalValue: number;
  reviewedCount: number;
  approvedCount: number;
  deferredCount: number;
  rejectedCount: number;
  averageRiskScore: number;
  estimatedProtectedValue: number;
  shipments: ScoredShipment[];
  exceptions: ExceptionItem[];
  decisions: DecisionLogEntry[];
  alerts: CriticalAlertEntry[];
  importHistory: ImportHistoryEntry[];
};

export function buildPilotSummaryRows(summary: PilotSummaryInput, generatedAt = new Date()) {
  const activeExceptions = summary.exceptions.filter((exception) => exception.status === "new").length;
  const latestImport = summary.importHistory[0];
  const latestDecision = summary.decisions[0];
  const criticalAlertFailures = summary.alerts.filter((alert) => alert.deliveryStatus === "Failed").length;
  const topRisk = [...summary.exceptions]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map((exception) => `${exception.shipmentId} ${exception.customer} ${exception.riskScore}/100 ${exception.reason}`)
    .join(" | ");

  return [
    ["Section", "Metric", "Value"],
    ["Report", "Generated at", generatedAt.toISOString()],
    ["Workspace", "Organization", summary.organizationName || "Unassigned workspace"],
    ["Workspace", "Latest import", latestImport ? `${latestImport.sourceName} (${latestImport.acceptedCount} accepted)` : "No import yet"],
    ["Activity", "Shipments monitored", summary.shipmentCount],
    ["Activity", "Active disruption signals", summary.eventCount],
    ["Activity", "Open exceptions", activeExceptions],
    ["Activity", "Critical exceptions", summary.criticalExceptionCount],
    ["Risk", "Average reviewed risk score", summary.averageRiskScore],
    ["Risk", "Top risk shipments", topRisk || "No exceptions yet"],
    ["Decisions", "Reviewed decisions", summary.reviewedCount],
    ["Decisions", "Approved", summary.approvedCount],
    ["Decisions", "Deferred", summary.deferredCount],
    ["Decisions", "Rejected", summary.rejectedCount],
    ["Decisions", "Latest decision", latestDecision ? `${latestDecision.status} ${latestDecision.shipmentId} by ${latestDecision.decidedBy}` : "No decision yet"],
    ["Value", "Shipment value monitored", summary.totalValue],
    ["Value", "Estimated protected value", summary.estimatedProtectedValue],
    ["Alerts", "Critical alerts logged", summary.alerts.length],
    ["Alerts", "Critical alert failures", criticalAlertFailures],
  ];
}

export function buildPilotSummaryEmail(summary: PilotSummaryInput, generatedAt = new Date()) {
  const activeExceptions = summary.exceptions.filter((exception) => exception.status === "new").length;
  const criticalAlertFailures = summary.alerts.filter((alert) => alert.deliveryStatus === "Failed").length;
  const topRisks = [...summary.exceptions]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);
  const subject = `RMRoads AI weekly pilot summary: ${summary.organizationName || "Workspace"}`;
  const topRiskText = topRisks.length
    ? topRisks.map((exception) => `- ${exception.shipmentId}: ${exception.customer}, ${exception.riskScore}/100, ${exception.reason}`).join("\n")
    : "- No open exceptions";
  const text = [
    `Weekly RMRoads AI pilot summary for ${summary.organizationName || "Workspace"}`,
    `Generated: ${generatedAt.toISOString()}`,
    "",
    `Shipments monitored: ${summary.shipmentCount}`,
    `Active disruption signals: ${summary.eventCount}`,
    `Open exceptions: ${activeExceptions}`,
    `Critical exceptions: ${summary.criticalExceptionCount}`,
    `Reviewed decisions: ${summary.reviewedCount}`,
    `Approved / deferred / rejected: ${summary.approvedCount} / ${summary.deferredCount} / ${summary.rejectedCount}`,
    `Average reviewed risk score: ${summary.averageRiskScore}`,
    `Estimated protected value: ${summary.estimatedProtectedValue}`,
    `Critical alert failures: ${criticalAlertFailures}`,
    "",
    "Top risks:",
    topRiskText,
  ].join("\n");
  const topRiskHtml = topRisks.length
    ? topRisks.map((exception) => `<li><strong>${escapeHtml(exception.shipmentId)}</strong>: ${escapeHtml(exception.customer)}, ${exception.riskScore}/100, ${escapeHtml(exception.reason)}</li>`).join("")
    : "<li>No open exceptions</li>";
  const html = `
    <p>Weekly RMRoads AI pilot summary for <strong>${escapeHtml(summary.organizationName || "Workspace")}</strong></p>
    <p><strong>Generated:</strong> ${generatedAt.toISOString()}</p>
    <ul>
      <li><strong>Shipments monitored:</strong> ${summary.shipmentCount}</li>
      <li><strong>Active disruption signals:</strong> ${summary.eventCount}</li>
      <li><strong>Open exceptions:</strong> ${activeExceptions}</li>
      <li><strong>Critical exceptions:</strong> ${summary.criticalExceptionCount}</li>
      <li><strong>Reviewed decisions:</strong> ${summary.reviewedCount}</li>
      <li><strong>Approved / deferred / rejected:</strong> ${summary.approvedCount} / ${summary.deferredCount} / ${summary.rejectedCount}</li>
      <li><strong>Average reviewed risk score:</strong> ${summary.averageRiskScore}</li>
      <li><strong>Estimated protected value:</strong> ${summary.estimatedProtectedValue}</li>
      <li><strong>Critical alert failures:</strong> ${criticalAlertFailures}</li>
    </ul>
    <p><strong>Top risks:</strong></p>
    <ul>${topRiskHtml}</ul>
  `;

  return { subject, text, html };
}

export function shouldSendWeeklySummary(lastSentAt: Date | string | null | undefined, now = new Date()) {
  if (!lastSentAt) return true;

  const lastSent = typeof lastSentAt === "string" ? new Date(lastSentAt) : lastSentAt;
  if (Number.isNaN(lastSent.getTime())) return true;

  return getUtcWeekKey(lastSent) !== getUtcWeekKey(now);
}

function getUtcWeekKey(date: Date) {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = normalized.getUTCDay() || 7;
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((normalized.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${normalized.getUTCFullYear()}-${week}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
