(function attachDomainContract(globalScope) {
  const workspaceSchemaVersion = 1;

  const shipmentFields = [
    "id",
    "customer",
    "origin",
    "destination",
    "mode",
    "carrier",
    "plannedShipDate",
    "eta",
    "priority",
    "value",
    "skuGroup",
    "destinationLocation",
  ];

  const disruptionEventFields = [
    "id",
    "type",
    "severity",
    "affectedText",
    "mode",
    "carrier",
    "confidence",
    "source",
    "status",
  ];

  const decisionFields = ["status", "scenarioAction", "note", "decidedAt"];

  function validateWorkspaceSnapshot(snapshot) {
    const errors = [];

    if (!snapshot || typeof snapshot !== "object") {
      return ["Workspace import must be a JSON object."];
    }

    if (snapshot.schemaVersion !== workspaceSchemaVersion) {
      errors.push(`Unsupported workspace schema version: ${snapshot.schemaVersion || "missing"}.`);
    }

    validateArray(snapshot.shipments, "shipments", errors);
    validateArray(snapshot.importErrors, "importErrors", errors);
    validateArray(snapshot.disruptionEvents, "disruptionEvents", errors);
    validateObject(snapshot.exceptionDecisions, "exceptionDecisions", errors);
    validateObject(snapshot.exceptionAssignments, "exceptionAssignments", errors);

    if (Array.isArray(snapshot.shipments)) {
      snapshot.shipments.forEach((shipment, index) => {
        validateRequiredFields(shipment, shipmentFields, `shipments[${index}]`, errors);
        if (shipment && typeof shipment.value !== "number") {
          errors.push(`shipments[${index}].value must be a number.`);
        }
      });
    }

    if (Array.isArray(snapshot.disruptionEvents)) {
      snapshot.disruptionEvents.forEach((event, index) => {
        validateRequiredFields(event, disruptionEventFields, `disruptionEvents[${index}]`, errors);
        if (event && typeof event.confidence !== "number") {
          errors.push(`disruptionEvents[${index}].confidence must be a number.`);
        }
      });
    }

    if (snapshot.exceptionDecisions && typeof snapshot.exceptionDecisions === "object") {
      Object.entries(snapshot.exceptionDecisions).forEach(([exceptionId, decision]) => {
        validateRequiredFields(decision, decisionFields, `exceptionDecisions.${exceptionId}`, errors);
      });
    }

    return errors;
  }

  function validateRequiredFields(value, fields, path, errors) {
    if (!value || typeof value !== "object") {
      errors.push(`${path} must be an object.`);
      return;
    }

    fields.forEach((field) => {
      if (!(field in value)) {
        errors.push(`${path}.${field} is required.`);
      }
    });
  }

  function validateArray(value, path, errors) {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array.`);
    }
  }

  function validateObject(value, path, errors) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${path} must be an object.`);
    }
  }

  const api = {
    workspaceSchemaVersion,
    shipmentFields,
    disruptionEventFields,
    decisionFields,
    validateWorkspaceSnapshot,
  };

  globalScope.RMRoadsDomainContract = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
