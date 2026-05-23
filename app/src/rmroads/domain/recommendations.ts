import type {
  ExceptionItem,
  Recommendation,
  RecommendationScenario,
  ScenarioAction,
  Shipment,
} from "./types";

export function generateRecommendation(exception: ExceptionItem, shipment: Shipment): Recommendation {
  const primaryAction = choosePrimaryAction(exception, shipment);

  return {
    exceptionId: exception.id,
    shipmentId: shipment.id,
    primaryAction,
    confidence: getConfidence(exception),
    summary: buildSummary(exception, primaryAction),
    assumptions: [
      `Risk score is ${exception.riskScore}/100 from active disruption events and shipment priority.`,
      `Shipment value is ${formatCurrency(shipment.value)} and priority is ${shipment.priority}.`,
      "Recommendation is decision support only and requires planner approval.",
    ],
    scenarios: buildScenarios(exception, shipment, primaryAction),
  };
}

export function choosePrimaryAction(exception: ExceptionItem, shipment: Shipment): ScenarioAction {
  if (exception.riskLevel === "critical" && shipment.value >= 100000) return "expedite";
  if (exception.riskLevel === "critical") return "reroute";
  if (exception.riskLevel === "high" && shipment.priority !== "standard") return "split";
  if (exception.riskLevel === "high") return "notify";
  return "watch";
}

function buildScenarios(
  exception: ExceptionItem,
  shipment: Shipment,
  primaryAction: ScenarioAction,
): RecommendationScenario[] {
  const base: Array<Omit<RecommendationScenario, "recommended">> = [
    {
      action: "watch",
      label: "Watch",
      etaImpact: "No immediate ETA recovery",
      costBand: "$0",
      customerRisk: exception.riskLevel === "critical" ? "High" : "Medium",
      complexity: "Low",
      rationale: "Keep the shipment under review while disruption confidence is still evolving.",
    },
    {
      action: "notify",
      label: "Notify Customer",
      etaImpact: "No physical recovery",
      costBand: "$0 - $250",
      customerRisk: "Reduced surprise risk",
      complexity: "Low",
      rationale: "Prepare proactive customer messaging before the ETA miss becomes visible externally.",
    },
    {
      action: "reroute",
      label: "Reroute",
      etaImpact: "Recover 1-4 days",
      costBand: estimateCost(shipment.value, 0.04, 2500),
      customerRisk: "Medium",
      complexity: "Medium",
      rationale: "Move the shipment away from the affected lane or carrier where capacity is available.",
    },
    {
      action: "split",
      label: "Split Shipment",
      etaImpact: "Recover critical units",
      costBand: estimateCost(shipment.value, 0.025, 1500),
      customerRisk: "Medium",
      complexity: "Medium",
      rationale: "Prioritize the highest-value or most stockout-sensitive units instead of moving everything.",
    },
    {
      action: "expedite",
      label: "Expedite",
      etaImpact: "Recover 2-6 days",
      costBand: estimateCost(shipment.value, 0.08, 6000),
      customerRisk: "Low",
      complexity: "High",
      rationale: "Use premium capacity when customer or inventory impact justifies the cost.",
    },
  ];

  return base
    .map((scenario) => ({
      ...scenario,
      recommended: scenario.action === primaryAction,
    }))
    .sort((a, b) => Number(b.recommended) - Number(a.recommended));
}

function buildSummary(exception: ExceptionItem, primaryAction: ScenarioAction) {
  const actionLabel = primaryAction.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return `${actionLabel} is recommended because ${exception.shipmentId} is ${exception.riskLevel} risk: ${exception.reason}`;
}

function getConfidence(exception: ExceptionItem) {
  if (exception.riskLevel === "critical") return "High";
  if (exception.riskLevel === "high") return "Medium";
  return "Low";
}

function estimateCost(value: number, ratio: number, minimum: number) {
  const estimate = Math.max(Math.round(value * ratio), minimum);
  const low = Math.round(estimate * 0.75);
  const high = Math.round(estimate * 1.25);
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
