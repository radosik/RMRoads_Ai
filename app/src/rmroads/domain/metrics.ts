import type { DecisionLogEntry, ExceptionItem, ScenarioAction, Shipment } from "./types";

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

  return {
    reviewedCount: decisions.length,
    approvedCount,
    deferredCount,
    rejectedCount,
    averageRiskScore,
    estimatedProtectedValue,
  };
}

export function buildDecisionLogEntry({
  id,
  exception,
  shipment,
  status,
  scenarioAction,
  note,
  decidedBy,
  decidedAt,
}: {
  id: string;
  exception: ExceptionItem;
  shipment: Shipment | undefined;
  status: "approved" | "deferred" | "rejected";
  scenarioAction: ScenarioAction;
  note: string;
  decidedBy: string;
  decidedAt: string;
}): DecisionLogEntry {
  const shipmentValue = shipment?.value || exception.value || 0;

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
    riskLevel: exception.riskLevel,
    riskScore: exception.riskScore,
    estimatedProtectedValue: estimateProtectedValue(shipmentValue, scenarioAction, status),
    note,
  };
}
