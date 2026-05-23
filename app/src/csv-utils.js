(function attachCsvUtils(globalScope) {
  const requiredFields = [
    "shipment_id",
    "customer",
    "origin",
    "destination",
    "mode",
    "carrier",
    "planned_ship_date",
    "eta",
    "priority",
    "value",
    "sku_group",
    "destination_location",
  ];

  function parseCsv(csvText) {
    const rows = [];
    let current = "";
    let row = [];
    let insideQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
      const char = csvText[index];
      const nextChar = csvText[index + 1];

      if (char === '"' && nextChar === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (char === "," && !insideQuotes) {
        row.push(current.trim());
        current = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !insideQuotes) {
        if (char === "\r" && nextChar === "\n") index += 1;
        row.push(current.trim());
        if (row.some(Boolean)) rows.push(row);
        row = [];
        current = "";
        continue;
      }

      current += char;
    }

    row.push(current.trim());
    if (row.some(Boolean)) rows.push(row);

    const headers = (rows.shift() || []).map(normalizeHeader);
    return {
      headers,
      rows: rows.map((cells, index) => ({
        rowNumber: index + 2,
        cells,
      })),
    };
  }

  function validateRows(headers, rows) {
    const missingHeaders = requiredFields.filter((field) => !headers.includes(field));
    const validRows = [];
    const errors = [];

    if (missingHeaders.length > 0) {
      return {
        validRows,
        errors: [
          {
            rowNumber: "Header",
            shipmentId: "-",
            message: `Missing required columns: ${missingHeaders.join(", ")}`,
          },
        ],
      };
    }

    rows.forEach(({ rowNumber, cells }) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = cells[index]?.trim() || "";
      });

      const missingFields = requiredFields.filter((field) => !record[field]);
      const invalidValue = Number.isNaN(Number(record.value));

      if (missingFields.length > 0 || invalidValue) {
        errors.push({
          rowNumber,
          shipmentId: record.shipment_id || "-",
          message: [
            missingFields.length ? `Missing ${missingFields.join(", ")}` : "",
            invalidValue ? "Value must be numeric" : "",
          ]
            .filter(Boolean)
            .join("; "),
        });
        return;
      }

      validRows.push({
        id: record.shipment_id,
        customer: record.customer,
        origin: record.origin,
        destination: record.destination,
        mode: record.mode,
        carrier: record.carrier,
        plannedShipDate: record.planned_ship_date,
        eta: record.eta,
        priority: normalizePriority(record.priority),
        value: Number(record.value),
        skuGroup: record.sku_group,
        destinationLocation: record.destination_location,
      });
    });

    return { validRows, errors };
  }

  function normalizeHeader(header) {
    return header.trim().toLowerCase().replace(/\s+/g, "_");
  }

  function normalizePriority(priority) {
    const normalized = priority.trim().toLowerCase();
    if (["critical", "high", "standard"].includes(normalized)) return normalized;
    return "standard";
  }

  const api = {
    requiredFields,
    parseCsv,
    validateRows,
    normalizeHeader,
    normalizePriority,
  };

  globalScope.RMRoadsCsv = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
