import type { ExceptionItem, ScoredShipment } from "./types";

export function buildExceptionQueue(scoredShipments: ScoredShipment[]): ExceptionItem[] {
  return scoredShipments
    .filter((shipment) => shipment.riskLevel !== "low")
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((shipment) => ({
      id: `EX-${shipment.id}`,
      shipmentId: shipment.id,
      customer: shipment.customer,
      lane: `${shipment.origin} -> ${shipment.destination}`,
      eta: shipment.eta,
      priority: shipment.priority,
      value: shipment.value,
      riskScore: shipment.riskScore,
      riskLevel: shipment.riskLevel as ExceptionItem["riskLevel"],
      reason: shipment.riskReasons[0] || "Shipment requires planner review.",
      status: "new",
    }));
}
