import type {
  DisruptionEvent,
  RiskLevel,
  ScoredShipment,
  Shipment,
} from "./types";

const severityWeights = {
  low: 12,
  medium: 24,
  high: 38,
  critical: 52,
};

const priorityWeights = {
  standard: 6,
  high: 18,
  critical: 28,
};

export function createDefaultEvents(): DisruptionEvent[] {
  return [
    {
      id: "EVT-001",
      type: "Port congestion",
      severity: "high",
      affectedText: "Los Angeles CA",
      mode: "Ocean",
      carrier: "",
      confidence: 82,
      source: "Manual pilot signal",
      status: "active",
    },
    {
      id: "EVT-002",
      type: "Carrier delay",
      severity: "medium",
      affectedText: "Schneider",
      mode: "Truck",
      carrier: "Schneider",
      confidence: 68,
      source: "Planner report",
      status: "active",
    },
  ];
}

export function scoreShipments(
  shipments: Shipment[],
  events: DisruptionEvent[],
  now = new Date("2026-05-23T00:00:00"),
): ScoredShipment[] {
  const activeEvents = events.filter((event) => event.status === "active");

  return shipments.map((shipment) => {
    const matches = activeEvents
      .map((event) => ({
        event,
        match: matchShipmentToEvent(shipment, event),
      }))
      .filter(({ match }) => match.score > 0);

    const eventScore = matches.reduce(
      (sum, { event, match }) => sum + getSeverityWeight(event.severity) * match.score,
      0,
    );
    const priorityScore = priorityWeights[shipment.priority] || priorityWeights.standard;
    const valueScore = getValueScore(shipment.value);
    const etaScore = getEtaScore(shipment.eta, now);
    const riskScore = Math.min(100, Math.round(eventScore + priorityScore + valueScore + etaScore));

    return {
      ...shipment,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      matchedEvents: matches.map(({ event, match }) => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        reason: match.reason,
      })),
      riskReasons: buildReasons(shipment, matches, priorityScore, valueScore, etaScore),
    };
  });
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 28) return "medium";
  return "low";
}

export function matchShipmentToEvent(shipment: Shipment, event: DisruptionEvent) {
  const affected = normalize(event.affectedText);
  const destination = normalize(shipment.destination);
  const origin = normalize(shipment.origin);
  const carrier = normalize(shipment.carrier);
  const mode = normalize(shipment.mode);
  const eventCarrier = normalize(event.carrier);
  const eventMode = normalize(event.mode);

  if (eventCarrier && carrier.includes(eventCarrier)) {
    return { score: 0.9, reason: `Carrier matches ${event.carrier}` };
  }

  if (affected && (destination.includes(affected) || origin.includes(affected))) {
    return { score: 0.82, reason: `Lane matches ${event.affectedText}` };
  }

  if (affected && carrier.includes(affected)) {
    return { score: 0.74, reason: `Carrier text matches ${event.affectedText}` };
  }

  if (eventMode && mode.includes(eventMode)) {
    return { score: 0.32, reason: `Mode matches ${event.mode}` };
  }

  return { score: 0, reason: "" };
}

function getSeverityWeight(severity: DisruptionEvent["severity"]) {
  return severityWeights[severity] || severityWeights.medium;
}

function getValueScore(value: number) {
  if (value >= 200000) return 16;
  if (value >= 100000) return 12;
  if (value >= 50000) return 8;
  if (value >= 25000) return 4;
  return 2;
}

function getEtaScore(eta: string, now: Date) {
  const etaDate = new Date(`${eta}T00:00:00`);
  if (Number.isNaN(etaDate.getTime())) return 0;

  const daysUntilEta = Math.ceil((etaDate.getTime() - now.getTime()) / 86_400_000);
  if (daysUntilEta <= 3) return 10;
  if (daysUntilEta <= 10) return 6;
  if (daysUntilEta <= 21) return 3;
  return 0;
}

function buildReasons(
  shipment: Shipment,
  matches: Array<{ event: DisruptionEvent; match: { reason: string } }>,
  priorityScore: number,
  valueScore: number,
  etaScore: number,
) {
  const reasons = matches.map(({ event, match }) => `${event.type}: ${match.reason}`);

  if (priorityScore >= priorityWeights.high) {
    reasons.push(`${capitalize(shipment.priority)} priority shipment`);
  }

  if (valueScore >= 8) {
    reasons.push(`${formatCurrency(shipment.value)} shipment value`);
  }

  if (etaScore >= 6) {
    reasons.push(`ETA is close: ${shipment.eta}`);
  }

  return reasons;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
