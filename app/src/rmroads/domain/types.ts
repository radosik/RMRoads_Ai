export type ShipmentPriority = "critical" | "high" | "standard";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type DisruptionSeverity = "low" | "medium" | "high" | "critical";
export type DisruptionStatus = "active" | "archived";
export type ExceptionStatus = "new" | "approved" | "deferred" | "rejected";
export type ScenarioAction = "watch" | "notify" | "reroute" | "split" | "expedite";

export type Shipment = {
  id: string;
  customer: string;
  origin: string;
  destination: string;
  mode: string;
  carrier: string;
  plannedShipDate: string;
  eta: string;
  priority: ShipmentPriority;
  value: number;
  skuGroup: string;
  destinationLocation: string;
};

export type DisruptionEvent = {
  id: string;
  type: string;
  severity: DisruptionSeverity;
  affectedText: string;
  mode: string;
  carrier: string;
  confidence: number;
  source: string;
  status: DisruptionStatus;
};

export type MatchedEvent = {
  id: string;
  type: string;
  severity: DisruptionSeverity;
  reason: string;
};

export type ScoredShipment = Shipment & {
  riskScore: number;
  riskLevel: RiskLevel;
  matchedEvents: MatchedEvent[];
  riskReasons: string[];
};

export type ExceptionItem = {
  id: string;
  shipmentId: string;
  customer: string;
  lane: string;
  eta: string;
  priority: ShipmentPriority;
  value: number;
  riskScore: number;
  riskLevel: Exclude<RiskLevel, "low">;
  reason: string;
  status: ExceptionStatus;
  owner?: string;
  decisionNote?: string;
  selectedScenarioAction?: ScenarioAction;
};

export type RecommendationScenario = {
  action: ScenarioAction;
  label: string;
  etaImpact: string;
  costBand: string;
  customerRisk: string;
  complexity: "Low" | "Medium" | "High";
  rationale: string;
  recommended: boolean;
};

export type Recommendation = {
  exceptionId: string;
  shipmentId: string;
  primaryAction: ScenarioAction;
  confidence: "Low" | "Medium" | "High";
  summary: string;
  assumptions: string[];
  scenarios: RecommendationScenario[];
};

export type ImportHistoryEntry = {
  id: string;
  importedAt: string;
  sourceName: string;
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
};

export type DecisionLogEntry = {
  id: string;
  exceptionId: string;
  shipmentId: string;
  customer: string;
  lane: string;
  status: ExceptionStatus;
  scenarioAction: ScenarioAction;
  owner: string;
  decidedBy: string;
  decidedAt: string;
  riskLevel: RiskLevel | "unknown";
  riskScore: number;
  estimatedProtectedValue: number;
  note: string;
};

export type CriticalAlertEntry = {
  id: string;
  createdAt: string;
  sentAt: string;
  deliveryStatus: string;
  exceptionId: string;
  shipmentId: string;
  customer: string;
  riskLevel: RiskLevel;
  riskScore: number;
  message: string;
};
