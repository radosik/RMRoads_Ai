import type { DecisionLogEntry, DecisionOutcomeStatus, ExceptionItem, ScenarioAction, Shipment } from "./types";

const actionValueRatios: Record<ScenarioAction, number> = {
  expedite: 0.08,
  reroute: 0.05,
  split: 0.03,
  notify: 0.01,
  watch: 0,
};

export function estimateProtectedValue(
  shipmentValue: number,
  scenarioAction: ScenarioAction,
  status: string,
) {
  if (status !== "approved") return 0;
  return Math.round(shipmentValue * (actionValueRatios[scenarioAction] || 0));
}

export function calculateDecisionMetrics(decisions: DecisionLogEntry[]) {
  const approvedCount = decisions.filter((decision) => decision.status === "approved").length;
  const deferredCount = decisions.filter((decision) => decision.status === "deferred").length;
  const rejectedCount = decisions.filter((decision) => decision.status === "rejected").length;
  const averageRiskScore = decisions.length
    ? Math.round(decisions.reduce((sum, decision) => sum + decision.riskScore, 0) / decisions.length)
    : 0;
  const estimatedProtectedValue = decisions.reduce(
    (sum, decision) => sum + decision.estimatedProtectedValue,
    0,
  );
  const decisionsWithResponseTime = decisions.filter((decision) => decision.responseHours > 0);
  const averageResponseHours = decisionsWithResponseTime.length
    ? Math.round(
        decisionsWithResponseTime.reduce((sum, decision) => sum + decision.responseHours, 0) /
          decisionsWithResponseTime.length,
      )
    : 0;

  return {
    reviewedCount: decisions.length,
    approvedCount,
    deferredCount,
    rejectedCount,
    averageRiskScore,
    estimatedProtectedValue,
    averageResponseHours,
  };
}

export function buildDecisionLogEntry({
  id,
  exception,
  shipment,
  status,
  scenarioAction,
  note,
  outcomeStatus = "pending",
  outcomeNote = "",
  decidedBy,
  decidedAt,
  exceptionCreatedAt,
}: {
  id: string;
  exception: ExceptionItem;
  shipment: Shipment | undefined;
  status: "approved" | "deferred" | "rejected";
  scenarioAction: ScenarioAction;
  note: string;
  outcomeStatus?: DecisionOutcomeStatus;
  outcomeNote?: string;
  decidedBy: string;
  decidedAt: string;
  exceptionCreatedAt?: string;
}): DecisionLogEntry {
  const shipmentValue = shipment?.value || exception.value || 0;
  const responseHours = calculateResponseHours(exceptionCreatedAt, decidedAt);

  return {
    id,
    exceptionId: exception.id,
    shipmentId: exception.shipmentId,
    customer: exception.customer,
    lane: exception.lane,
    status,
    scenarioAction,
    owner: exception.owner || "",
    decidedBy,
    decidedAt,
    responseHours,
    riskLevel: exception.riskLevel,
    riskScore: exception.riskScore,
    estimatedProtectedValue: estimateProtectedValue(shipmentValue, scenarioAction, status),
    note,
    outcomeStatus,
    outcomeNote,
  };
}

export function calculateResponseHours(startedAt: string | undefined, decidedAt: string) {
  if (!startedAt) return 0;

  const start = new Date(startedAt);
  const end = new Date(decidedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 3_600_000));
}
