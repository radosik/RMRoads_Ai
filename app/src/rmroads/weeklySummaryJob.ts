import { emailSender } from "wasp/server/email";
import { buildPilotSummaryEmail, shouldSendWeeklySummary } from "./domain/pilotSummary";
import { parseAlertRecipients } from "./domain/workspaceReadiness";

export const sendRMRoadsWeeklySummaries = async (
  _args: never,
  context: any,
) => {
  const organizations = await context.entities.Organization.findMany({
    where: { weeklySummaryEmailsEnabled: true },
    include: {
      shipmentImports: { orderBy: { createdAt: "desc" }, take: 1 },
      shipmentExceptions: {
        orderBy: { createdAt: "desc" },
        include: { shipment: true },
      },
      criticalAlerts: { orderBy: { createdAt: "desc" }, take: 25 },
      disruptionEvents: true,
      _count: {
        select: {
          shipments: true,
          shipmentExceptions: true,
        },
      },
    },
  });

  const now = new Date();
  for (const organization of organizations) {
    if (!shouldSendWeeklySummary(organization.weeklySummaryLastSentAt, now)) continue;

    const recipients = parseAlertRecipients(organization.weeklySummaryRecipients);
    if (!recipients.length) {
      await context.entities.Organization.update({
        where: { id: organization.id },
        data: { weeklySummaryEmailStatus: "failed_no_recipients" },
      });
      continue;
    }

    const decisions = await context.entities.ExceptionDecision.findMany({
      where: {
        shipmentException: {
          organizationId: organization.id,
        },
      },
      include: {
        decidedBy: true,
        shipmentException: {
          include: { shipment: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const approvedCount = decisions.filter((decision: any) => decision.status === "approved").length;
    const deferredCount = decisions.filter((decision: any) => decision.status === "deferred").length;
    const rejectedCount = decisions.filter((decision: any) => decision.status === "rejected").length;
    const averageRiskScore = decisions.length
      ? Math.round(decisions.reduce((sum: number, decision: any) => sum + (decision.shipmentException?.riskScore || 0), 0) / decisions.length)
      : 0;
    const totalValue = organization.shipmentExceptions.reduce(
      (sum: number, exception: any) => sum + (exception.shipment?.value || 0),
      0,
    );
    const estimatedProtectedValue = decisions.reduce((sum: number, decision: any) => {
      if (decision.status !== "approved") return sum;
      return sum + Math.round((decision.shipmentException?.shipment?.value || 0) * 0.05);
    }, 0);
    const email = buildPilotSummaryEmail({
      organizationName: organization.name,
      shipmentCount: organization._count.shipments,
      eventCount: organization.disruptionEvents.filter((event: any) => event.status === "active").length,
      exceptionCount: organization._count.shipmentExceptions,
      criticalExceptionCount: organization.shipmentExceptions.filter((exception: any) => exception.riskLevel === "critical").length,
      totalValue,
      reviewedCount: decisions.length,
      approvedCount,
      deferredCount,
      rejectedCount,
      averageRiskScore,
      estimatedProtectedValue,
      shipments: [],
      exceptions: organization.shipmentExceptions.map((exception: any) => ({
        id: exception.id,
        shipmentId: exception.shipment?.externalId || exception.id,
        customer: exception.shipment?.customer || "Unknown customer",
        lane: exception.shipment ? `${exception.shipment.origin} -> ${exception.shipment.destination}` : "Unknown lane",
        eta: exception.shipment?.eta?.toISOString?.().slice(0, 10) || "",
        priority: exception.shipment?.priority || "standard",
        value: exception.shipment?.value || 0,
        riskScore: exception.riskScore,
        riskLevel: exception.riskLevel,
        reason: exception.reason,
        status: exception.status,
        owner: exception.ownerName || "",
      })),
      decisions: [],
      alerts: organization.criticalAlerts.map((alert: any) => ({
        id: alert.id,
        createdAt: alert.createdAt.toISOString(),
        sentAt: alert.sentAt ? alert.sentAt.toISOString() : "",
        deliveryStatus: alert.deliveryStatus,
        exceptionId: alert.shipmentExceptionId,
        shipmentId: "",
        customer: "",
        riskLevel: "critical",
        riskScore: 0,
        message: alert.message,
      })),
      importHistory: organization.shipmentImports.map((entry: any) => ({
        id: entry.id,
        importedAt: entry.createdAt.toISOString(),
        sourceName: entry.sourceName,
        acceptedCount: entry.acceptedCount,
        rejectedCount: entry.rejectedCount,
        duplicateCount: entry.duplicateCount,
      })),
    }, now);

    try {
      await Promise.all(
        recipients.map((recipient) =>
          emailSender.send({
            to: recipient,
            subject: email.subject,
            text: email.text,
            html: email.html,
          }),
        ),
      );
      await context.entities.Organization.update({
        where: { id: organization.id },
        data: {
          weeklySummaryLastSentAt: now,
          weeklySummaryEmailStatus: "sent",
        },
      });
    } catch (error) {
      console.error("Failed to send RMRoads weekly summary", error);
      await context.entities.Organization.update({
        where: { id: organization.id },
        data: { weeklySummaryEmailStatus: "failed" },
      });
    }
  }
};
