(function attachExportUtils(globalScope) {
  const contract = globalScope.RMRoadsDomainContract || require("./domain-contract.js");
  const { workspaceSchemaVersion, validateWorkspaceSnapshot } = contract;

  function toCsv(rows, columns) {
    const header = columns.map((column) => escapeCsvCell(column.label)).join(",");
    const body = rows.map((row) => columns.map((column) => escapeCsvCell(resolveValue(row, column.key))).join(","));
    return [header, ...body].join("\n");
  }

  function buildDecisionCsv(decisions) {
    return toCsv(decisions, [
      { key: "exceptionId", label: "exception_id" },
      { key: "shipmentId", label: "shipment_id" },
      { key: "customer", label: "customer" },
      { key: "lane", label: "lane" },
      { key: "status", label: "decision_status" },
      { key: "scenarioAction", label: "scenario_action" },
      { key: "owner", label: "owner" },
      { key: "riskLevel", label: "risk_level" },
      { key: "riskScore", label: "risk_score" },
      { key: "estimatedProtectedValue", label: "estimated_protected_value" },
      { key: "note", label: "decision_note" },
      { key: "decidedAt", label: "decided_at" },
    ]);
  }

  function buildWorkspaceSnapshot(state) {
    return {
      schemaVersion: workspaceSchemaVersion,
      exportedAt: new Date().toISOString(),
      shipments: state.shipments || [],
      importErrors: state.importErrors || [],
      disruptionEvents: state.disruptionEvents || [],
      exceptionDecisions: state.exceptionDecisions || {},
      exceptionAssignments: state.exceptionAssignments || {},
      selectedExceptionId: state.selectedExceptionId || "",
      selectedScenarioAction: state.selectedScenarioAction || "",
    };
  }

  function parseWorkspaceSnapshot(jsonText) {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Workspace import must be a JSON object.");
    }

    if (parsed.schemaVersion !== workspaceSchemaVersion) {
      throw new Error(`Unsupported workspace schema version: ${parsed.schemaVersion || "missing"}.`);
    }

    const validationErrors = validateWorkspaceSnapshot(parsed);
    if (validationErrors.length > 0) {
      throw new Error(`Workspace import failed validation: ${validationErrors.join(" ")}`);
    }

    return {
      shipments: Array.isArray(parsed.shipments) ? parsed.shipments : [],
      importErrors: Array.isArray(parsed.importErrors) ? parsed.importErrors : [],
      disruptionEvents: Array.isArray(parsed.disruptionEvents) ? parsed.disruptionEvents : [],
      exceptionDecisions:
        parsed.exceptionDecisions && typeof parsed.exceptionDecisions === "object" ? parsed.exceptionDecisions : {},
      exceptionAssignments:
        parsed.exceptionAssignments && typeof parsed.exceptionAssignments === "object" ? parsed.exceptionAssignments : {},
      selectedExceptionId: typeof parsed.selectedExceptionId === "string" ? parsed.selectedExceptionId : "",
      selectedScenarioAction: typeof parsed.selectedScenarioAction === "string" ? parsed.selectedScenarioAction : "",
    };
  }

  function escapeCsvCell(value) {
    const stringValue = String(value ?? "");
    if (!/[",\n\r]/.test(stringValue)) return stringValue;
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  function resolveValue(row, key) {
    return key.split(".").reduce((value, part) => value?.[part], row);
  }

  const api = {
    workspaceSchemaVersion,
    toCsv,
    buildDecisionCsv,
    buildWorkspaceSnapshot,
    parseWorkspaceSnapshot,
    escapeCsvCell,
  };

  globalScope.RMRoadsExport = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
