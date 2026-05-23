import type { Shipment, ShipmentPriority } from "./types";

export const requiredShipmentCsvFields = [
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
] as const;

export type ImportError = {
  rowNumber: number | "Header" | "Duplicate";
  shipmentId: string;
  message: string;
};

export function parseCsv(csvText: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
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

export function validateShipmentRows(
  headers: string[],
  rows: Array<{ rowNumber: number; cells: string[] }>,
) {
  const missingHeaders = requiredShipmentCsvFields.filter((field) => !headers.includes(field));
  const validRows: Shipment[] = [];
  const errors: ImportError[] = [];

  if (missingHeaders.length > 0) {
    return {
      validRows,
      errors: [
        {
          rowNumber: "Header" as const,
          shipmentId: "-",
          message: `Missing required columns: ${missingHeaders.join(", ")}`,
        },
      ],
    };
  }

  rows.forEach(({ rowNumber, cells }) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index]?.trim() || "";
    });

    const missingFields = requiredShipmentCsvFields.filter((field) => !record[field]);
    const invalidValue = Number.isNaN(Number(record.value));
    const invalidPlannedDate = Number.isNaN(new Date(`${record.planned_ship_date}T00:00:00`).getTime());
    const invalidEta = Number.isNaN(new Date(`${record.eta}T00:00:00`).getTime());

    if (missingFields.length > 0 || invalidValue || invalidPlannedDate || invalidEta) {
      errors.push({
        rowNumber,
        shipmentId: record.shipment_id || "-",
        message: [
          missingFields.length ? `Missing ${missingFields.join(", ")}` : "",
          invalidValue ? "Value must be numeric" : "",
          invalidPlannedDate ? "planned_ship_date must be a valid date" : "",
          invalidEta ? "eta must be a valid date" : "",
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

  return removeDuplicateShipments(validRows, errors);
}

function removeDuplicateShipments(rows: Shipment[], existingErrors: ImportError[]) {
  const seen = new Set<string>();
  const validRows: Shipment[] = [];
  const errors = [...existingErrors];

  rows.forEach((shipment) => {
    if (seen.has(shipment.id)) {
      errors.push({
        rowNumber: "Duplicate",
        shipmentId: shipment.id,
        message: "Duplicate shipment_id in the same import. First valid row was kept.",
      });
      return;
    }

    seen.add(shipment.id);
    validRows.push(shipment);
  });

  return { validRows, errors };
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function normalizePriority(priority: string): ShipmentPriority {
  const normalized = priority.trim().toLowerCase();
  if (["critical", "high", "standard"].includes(normalized)) {
    return normalized as ShipmentPriority;
  }
  return "standard";
}
