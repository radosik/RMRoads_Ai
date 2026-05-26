import {
  emailRiskList,
  emailSectionTitle,
  emailStatGrid,
  escapeHtml,
  wrapBrandedEmail,
} from "./emailLayout";
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
  averageResponseHours?: number;
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
  const successfulOutcomes = summary.decisions.filter((decision) => decision.outcomeStatus === "successful").length;
  const failedOutcomes = summary.decisions.filter((decision) => decision.outcomeStatus === "failed").length;
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
    ["Decisions", "Average response hours", summary.averageResponseHours || 0],
    ["Decisions", "Approved", summary.approvedCount],
    ["Decisions", "Deferred", summary.deferredCount],
    ["Decisions", "Rejected", summary.rejectedCount],
    ["Decisions", "Latest decision", latestDecision ? `${latestDecision.status} ${latestDecision.shipmentId} by ${latestDecision.decidedBy}` : "No decision yet"],
    ["Outcomes", "Successful outcomes", successfulOutcomes],
    ["Outcomes", "Failed outcomes", failedOutcomes],
    ["Value", "Shipment value monitored", summary.totalValue],
    ["Value", "Estimated protected value", summary.estimatedProtectedValue],
    ["Alerts", "Critical alerts logged", summary.alerts.length],
    ["Alerts", "Critical alert failures", criticalAlertFailures],
  ];
}

export function buildPilotSummaryEmail(summary: PilotSummaryInput, generatedAt = new Date()) {
  const activeExceptions = summary.exceptions.filter((exception) => exception.status === "new").length;
  const criticalAlertFailures = summary.alerts.filter((alert) => alert.deliveryStatus === "Failed").length;
  const successfulOutcomes = summary.decisions.filter((decision) => decision.outcomeStatus === "successful").length;
  const failedOutcomes = summary.decisions.filter((decision) => decision.outcomeStatus === "failed").length;
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
    `Average response hours: ${summary.averageResponseHours || 0}`,
    `Approved / deferred / rejected: ${summary.approvedCount} / ${summary.deferredCount} / ${summary.rejectedCount}`,
    `Average reviewed risk score: ${summary.averageRiskScore}`,
    `Estimated protected value: ${summary.estimatedProtectedValue}`,
    `Successful outcomes: ${successfulOutcomes}`,
    `Failed outcomes: ${failedOutcomes}`,
    `Critical alert failures: ${criticalAlertFailures}`,
    "",
    "Top risks:",
    topRiskText,
  ].join("\n");
  const stats = [
    { label: "Shipments monitored", value: summary.shipmentCount },
    { label: "Active signals", value: summary.eventCount },
    { label: "Open exceptions", value: activeExceptions },
    { label: "Critical exceptions", value: summary.criticalExceptionCount },
    { label: "Reviewed decisions", value: summary.reviewedCount },
    { label: "Avg response hours", value: summary.averageResponseHours || 0 },
    { label: "Approved / deferred / rejected", value: `${summary.approvedCount} / ${summary.deferredCount} / ${summary.rejectedCount}` },
    { label: "Avg risk score", value: summary.averageRiskScore },
    { label: "Protected value (est.)", value: `$${summary.estimatedProtectedValue.toLocaleString("en-US")}` },
    { label: "Successful outcomes", value: successfulOutcomes },
    { label: "Failed outcomes", value: failedOutcomes },
    { label: "Alert delivery failures", value: criticalAlertFailures },
  ];
  const orgName = summary.organizationName || "Workspace";

  const html = wrapBrandedEmail({
    preheader: `Weekly pilot summary for ${orgName}`,
    title: `Weekly pilot summary · ${orgName}`,
    intro: `Generated ${generatedAt.toISOString()}. Review this week's activity, decision velocity, and top open risks before the operating cadence.`,
    bodyHtml:
      emailSectionTitle("Activity & decisions") +
      emailStatGrid(stats) +
      emailSectionTitle("Top open risks") +
      emailRiskList(topRisks),
    footerNote: criticalAlertFailures > 0
      ? `<strong style="color:#ffb4ab;">${criticalAlertFailures} critical alert${criticalAlertFailures === 1 ? "" : "s"} failed to deliver this week.</strong> Check the Critical Alert Log before the next pilot review.`
      : undefined,
  });

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

