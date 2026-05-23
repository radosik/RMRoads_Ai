(function attachMetricsUtils(globalScope) {
  const actionValueRatios = {
    expedite: 0.08,
    reroute: 0.05,
    split: 0.03,
    notify: 0.01,
    watch: 0,
  };

  function calculatePilotMetrics({ shipments, exceptionQueue, exceptionDecisions, exceptionAssignments = {} }) {
    const decisions = buildDecisionLog({ shipments, exceptionQueue, exceptionDecisions, exceptionAssignments });
    const approved = decisions.filter((decision) => decision.status === "approved");
    const deferred = decisions.filter((decision) => decision.status === "deferred");
    const rejected = decisions.filter((decision) => decision.status === "rejected");
    const estimatedProtectedValue = approved.reduce((sum, decision) => sum + decision.estimatedProtectedValue, 0);
    const averageRiskScore = decisions.length
      ? Math.round(decisions.reduce((sum, decision) => sum + decision.riskScore, 0) / decisions.length)
      : 0;

    return {
      reviewedCount: decisions.length,
      approvedCount: approved.length,
      deferredCount: deferred.length,
      rejectedCount: rejected.length,
      estimatedProtectedValue,
      averageRiskScore,
      decisions,
    };
  }

  function buildDecisionLog({ shipments, exceptionQueue, exceptionDecisions, exceptionAssignments = {} }) {
    return Object.entries(exceptionDecisions)
      .map(([exceptionId, decision]) => {
        const shipmentId = exceptionId.replace(/^EX-/, "");
        const shipment = shipments.find((item) => item.id === shipmentId);
        const exception = exceptionQueue.find((item) => item.id === exceptionId);
        const scenarioAction = decision.scenarioAction || "watch";
        const value = shipment?.value || exception?.value || 0;

        return {
          exceptionId,
          shipmentId,
          customer: shipment?.customer || exception?.customer || "Unknown",
          lane: exception?.lane || (shipment ? `${shipment.origin} → ${shipment.destination}` : "-"),
          status: decision.status,
          note: decision.note || "",
          owner: exceptionAssignments[exceptionId] || exception?.owner || "",
          scenarioAction,
          decidedAt: decision.decidedAt || "",
          riskScore: exception?.riskScore || 0,
          riskLevel: exception?.riskLevel || "unknown",
          estimatedProtectedValue: estimateProtectedValue(value, scenarioAction, decision.status),
        };
      })
      .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt)));
  }

  function estimateProtectedValue(value, scenarioAction, status) {
    if (status !== "approved") return 0;
    const ratio = actionValueRatios[scenarioAction] ?? 0;
    return Math.round(value * ratio);
  }

  const api = {
    calculatePilotMetrics,
    buildDecisionLog,
    estimateProtectedValue,
  };

  globalScope.RMRoadsMetrics = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
