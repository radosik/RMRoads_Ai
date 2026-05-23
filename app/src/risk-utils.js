(function attachRiskUtils(globalScope) {
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

  function createDefaultEvents() {
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

  function scoreShipments(shipments, events) {
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
      const etaScore = getEtaScore(shipment.eta);
      const score = Math.min(100, Math.round(eventScore + priorityScore + valueScore + etaScore));
      const level = getRiskLevel(score);
      const reasons = buildReasons(shipment, matches, priorityScore, valueScore, etaScore);

      return {
        ...shipment,
        riskScore: score,
        riskLevel: level,
        matchedEvents: matches.map(({ event, match }) => ({
          id: event.id,
          type: event.type,
          severity: event.severity,
          reason: match.reason,
        })),
        riskReasons: reasons,
      };
    });
  }

  function buildExceptionQueue(scoredShipments) {
    return scoredShipments
      .filter((shipment) => shipment.riskLevel !== "low")
      .sort((a, b) => b.riskScore - a.riskScore)
      .map((shipment) => ({
        id: `EX-${shipment.id}`,
        shipmentId: shipment.id,
        customer: shipment.customer,
        lane: `${shipment.origin} → ${shipment.destination}`,
        eta: shipment.eta,
        priority: shipment.priority,
        value: shipment.value,
        riskScore: shipment.riskScore,
        riskLevel: shipment.riskLevel,
        reason: shipment.riskReasons[0] || "Shipment requires planner review.",
        status: "new",
      }));
  }

  function matchShipmentToEvent(shipment, event) {
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

  function getSeverityWeight(severity) {
    return severityWeights[severity] || severityWeights.medium;
  }

  function getValueScore(value) {
    if (value >= 200000) return 16;
    if (value >= 100000) return 12;
    if (value >= 50000) return 8;
    if (value >= 25000) return 4;
    return 2;
  }

  function getEtaScore(eta) {
    const etaDate = new Date(`${eta}T00:00:00`);
    if (Number.isNaN(etaDate.getTime())) return 0;

    const now = new Date("2026-05-23T00:00:00");
    const daysUntilEta = Math.ceil((etaDate - now) / 86_400_000);
    if (daysUntilEta <= 3) return 10;
    if (daysUntilEta <= 10) return 6;
    if (daysUntilEta <= 21) return 3;
    return 0;
  }

  function getRiskLevel(score) {
    if (score >= 75) return "critical";
    if (score >= 50) return "high";
    if (score >= 28) return "medium";
    return "low";
  }

  function buildReasons(shipment, matches, priorityScore, valueScore, etaScore) {
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

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function capitalize(value) {
    return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  const api = {
    createDefaultEvents,
    scoreShipments,
    buildExceptionQueue,
    matchShipmentToEvent,
    getRiskLevel,
  };

  globalScope.RMRoadsRisk = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
