import { HttpError } from "wasp/server";
import { emailSender } from "wasp/server/email";
import type {
  AssignRMRoadsExceptionOwner,
  DecideRMRoadsException,
  GetRMRoadsDashboard,
  ImportRMRoadsShipmentCsv,
  UpsertRMRoadsDisruptionEvent,
  SeedRMRoadsDemoData,
  ToggleRMRoadsDisruptionEventStatus,
  UpdateRMRoadsAlertSettings,
} from "wasp/server/operations";
import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { parseCsv, validateShipmentRows, type ImportError } from "./domain/csv";
import { buildExceptionQueue } from "./domain/exceptions";
import {
  buildDecisionLogEntry,
  calculateDecisionMetrics,
} from "./domain/metrics";
import { generateRecommendation } from "./domain/recommendations";
import { createDefaultEvents, scoreShipments } from "./domain/risk";
import { sampleShipments } from "./domain/sampleData";
import type {
  CriticalAlertEntry,
  DecisionLogEntry,
  DisruptionEvent,
  ExceptionItem,
  ExceptionStatus,
  ImportHistoryEntry,
  Recommendation,
  ScenarioAction,
  ScoredShipment,
  Shipment,
} from "./domain/types";

type RMRoadsDashboard = {
  organization: {
    id: string;
    name: string;
    slug: string;
    alertEmailsEnabled: boolean;
    alertRecipients: string[];
  } | null;
  shipmentCount: number;
  eventCount: number;
  exceptionCount: number;
  criticalExceptionCount: number;
  totalValue: number;
  shipments: ScoredShipment[];
  exceptions: ExceptionItem[];
  importHistory: ImportHistoryEntry[];
  disruptionEvents: DisruptionEvent[];
  decisions: DecisionLogEntry[];
  alerts: CriticalAlertEntry[];
  reviewedCount: number;
  approvedCount: number;
  deferredCount: number;
  rejectedCount: number;
  averageRiskScore: number;
  estimatedProtectedValue: number;
};

type ShipmentCsvImportResult = {
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  errors: ImportError[];
  dashboard: RMRoadsDashboard;
};

const importShipmentCsvSchema = z.object({
  csvText: z.string().min(1),
  sourceName: z.string().min(1).max(160),
});

const upsertDisruptionEventSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1).max(120),
  severity: z.enum(["low", "medium", "high", "critical"]),
  affectedText: z.string().min(1).max(180),
  mode: z.string().max(80).optional().default(""),
  carrier: z.string().max(120).optional().default(""),
  confidence: z.number().int().min(1).max(100),
  source: z.string().min(1).max(160),
});

const toggleDisruptionEventStatusSchema = z.object({
  id: z.string().min(1),
});

const assignExceptionOwnerSchema = z.object({
  exceptionId: z.string().min(1),
  ownerName: z.string().max(120),
});

const decideExceptionSchema = z.object({
  exceptionId: z.string().min(1),
  status: z.enum(["approved", "deferred", "rejected"]),
  scenarioAction: z.enum(["watch", "notify", "reroute", "split", "expedite"]),
  note: z.string().max(2000).default(""),
});

const updateAlertSettingsSchema = z.object({
  alertEmailsEnabled: z.boolean(),
  alertRecipients: z.string().max(2000).default(""),
});

export const getRMRoadsDashboard: GetRMRoadsDashboard<
  void,
  RMRoadsDashboard
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const organization = await getUserOrganization(context);
  if (!organization) {
    return emptyDashboard();
  }

  const [dbShipments, dbEvents, dbImports, dbExceptions, dbAlerts] = await Promise.all([
    context.entities.Shipment.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    }),
    context.entities.DisruptionEvent.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
    }),
    context.entities.ShipmentImport.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    context.entities.ShipmentException.findMany({
      where: { organizationId: organization.id },
      include: {
        decisions: {
          orderBy: { createdAt: "desc" },
          include: { decidedBy: true },
        },
        shipment: true,
      },
    }),
    context.entities.CriticalAlert.findMany({
      where: { organizationId: organization.id },
      include: {
        shipmentException: {
          include: { shipment: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const shipments = dbShipments.map(mapShipmentFromDb);
  const events = dbEvents.map(mapDisruptionEventFromDb);
  const scoredShipments = scoreShipments(shipments, events);
  const persistedExceptions = new Map(dbExceptions.map((exception: any) => [`EX-${exception.shipment.externalId}`, exception]));
  const exceptions = buildExceptionQueue(scoredShipments).map((exception) => {
    const persisted = persistedExceptions.get(exception.id);
    const latestDecision = persisted?.decisions?.[0];
    return {
      ...exception,
      owner: persisted?.ownerName || "",
      status: (latestDecision?.status || persisted?.status || exception.status) as ExceptionStatus,
      decisionNote: latestDecision?.note || "",
      selectedScenarioAction: latestDecision?.scenarioAction || "",
    };
  });
  await syncPersistedExceptions(context, organization.id, dbShipments, exceptions);
  await syncCriticalAlerts(context, organization, exceptions);

  const decisions = dbExceptions.flatMap((exception: any) =>
    exception.decisions.map((decision: any) => {
      const exceptionItem = exceptions.find((item) => item.id === `EX-${exception.shipment.externalId}`) || {
        id: `EX-${exception.shipment.externalId}`,
        shipmentId: exception.shipment.externalId,
        customer: exception.shipment.customer,
        lane: `${exception.shipment.origin} -> ${exception.shipment.destination}`,
        eta: formatDate(exception.shipment.eta),
        priority: exception.shipment.priority,
        value: Number(exception.shipment.value),
        riskScore: exception.riskScore,
        riskLevel: exception.riskLevel,
        reason: exception.reason,
        status: decision.status,
        owner: exception.ownerName || "",
      };
      return buildDecisionLogEntry({
        id: decision.id,
        exception: exceptionItem,
        shipment: mapShipmentFromDb(exception.shipment),
        status: decision.status,
        scenarioAction: decision.scenarioAction,
        note: decision.note || "",
        decidedBy: decision.decidedBy.email || decision.decidedBy.username || "Planner",
        decidedAt: decision.createdAt.toISOString(),
      });
    }),
  ).sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  const decisionMetrics = calculateDecisionMetrics(decisions);

  return {
    organization,
    shipmentCount: scoredShipments.length,
    eventCount: events.length,
    exceptionCount: exceptions.length,
    criticalExceptionCount: exceptions.filter((exception) => exception.riskLevel === "critical").length,
    totalValue: scoredShipments.reduce((sum, shipment) => sum + shipment.value, 0),
    shipments: scoredShipments,
    exceptions,
    importHistory: dbImports.map(mapImportHistoryFromDb),
    disruptionEvents: events,
    decisions,
    alerts: dbAlerts.map(mapCriticalAlertFromDb),
    ...decisionMetrics,
  };
};

export const seedRMRoadsDemoData: SeedRMRoadsDemoData<
  void,
  RMRoadsDashboard
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const organization = await getOrCreateUserOrganization(context);
  const existingShipmentCount = await context.entities.Shipment.count({
    where: { organizationId: organization.id },
  });

  if (existingShipmentCount === 0) {
    const shipmentImport = await context.entities.ShipmentImport.create({
      data: {
        organization: { connect: { id: organization.id } },
        uploadedBy: { connect: { id: context.user.id } },
        sourceName: "Built-in sample data",
        acceptedCount: sampleShipments.length,
        rejectedCount: 0,
        duplicateCount: 0,
      },
    });

    await context.entities.Shipment.createMany({
      data: sampleShipments.map((shipment) => ({
        organizationId: organization.id,
        shipmentImportId: shipmentImport.id,
        externalId: shipment.id,
        customer: shipment.customer,
        origin: shipment.origin,
        destination: shipment.destination,
        mode: shipment.mode,
        carrier: shipment.carrier,
        plannedShipDate: new Date(`${shipment.plannedShipDate}T00:00:00`),
        eta: new Date(`${shipment.eta}T00:00:00`),
        priority: shipment.priority,
        value: shipment.value,
        skuGroup: shipment.skuGroup,
        destinationLocation: shipment.destinationLocation,
      })),
    });
  }

  const existingEventCount = await context.entities.DisruptionEvent.count({
    where: { organizationId: organization.id },
  });

  if (existingEventCount === 0) {
    await context.entities.DisruptionEvent.createMany({
      data: createDefaultEvents().map((event) => ({
        organizationId: organization.id,
        type: event.type,
        severity: event.severity,
        affectedText: event.affectedText,
        mode: event.mode || null,
        carrier: event.carrier || null,
        confidence: event.confidence,
        source: event.source,
        status: event.status,
      })),
    });
  }

  return getRMRoadsDashboard(undefined, context);
};

export const importRMRoadsShipmentCsv: ImportRMRoadsShipmentCsv<
  z.infer<typeof importShipmentCsvSchema>,
  ShipmentCsvImportResult
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { csvText, sourceName } = ensureArgsSchemaOrThrowHttpError(
    importShipmentCsvSchema,
    rawArgs,
  );
  const organization = await getOrCreateUserOrganization(context);
  const parsed = parseCsv(csvText);
  const validation = validateShipmentRows(parsed.headers, parsed.rows);
  const duplicateCount = validation.errors.filter((error) => error.rowNumber === "Duplicate").length;

  await context.entities.CriticalAlert.deleteMany({
    where: { organizationId: organization.id },
  });
  await context.entities.ExceptionDecision.deleteMany({
    where: {
      shipmentException: {
        organizationId: organization.id,
      },
    },
  });
  await context.entities.ShipmentException.deleteMany({
    where: { organizationId: organization.id },
  });
  await context.entities.Shipment.deleteMany({
    where: { organizationId: organization.id },
  });

  const shipmentImport = await context.entities.ShipmentImport.create({
    data: {
      organization: { connect: { id: organization.id } },
      uploadedBy: { connect: { id: context.user.id } },
      sourceName,
      acceptedCount: validation.validRows.length,
      rejectedCount: validation.errors.length,
      duplicateCount,
    },
  });

  if (validation.validRows.length > 0) {
    await context.entities.Shipment.createMany({
      data: validation.validRows.map((shipment) => ({
        organizationId: organization.id,
        shipmentImportId: shipmentImport.id,
        externalId: shipment.id,
        customer: shipment.customer,
        origin: shipment.origin,
        destination: shipment.destination,
        mode: shipment.mode,
        carrier: shipment.carrier,
        plannedShipDate: new Date(`${shipment.plannedShipDate}T00:00:00`),
        eta: new Date(`${shipment.eta}T00:00:00`),
        priority: shipment.priority,
        value: shipment.value,
        skuGroup: shipment.skuGroup,
        destinationLocation: shipment.destinationLocation,
      })),
    });
  }

  return {
    acceptedCount: validation.validRows.length,
    rejectedCount: validation.errors.length,
    duplicateCount,
    errors: validation.errors,
    dashboard: await getRMRoadsDashboard(undefined, context),
  };
};

export const upsertRMRoadsDisruptionEvent: UpsertRMRoadsDisruptionEvent<
  z.infer<typeof upsertDisruptionEventSchema>,
  RMRoadsDashboard
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const args = ensureArgsSchemaOrThrowHttpError(upsertDisruptionEventSchema, rawArgs);
  const organization = await getOrCreateUserOrganization(context);
  if (args.id) {
    await context.entities.DisruptionEvent.update({
      where: { id: args.id, organizationId: organization.id },
      data: {
        type: args.type,
        severity: args.severity,
        affectedText: args.affectedText,
        mode: args.mode || null,
        carrier: args.carrier || null,
        confidence: args.confidence,
        source: args.source,
      },
    });
  } else {
    await context.entities.DisruptionEvent.create({
      data: {
        organization: { connect: { id: organization.id } },
        type: args.type,
        severity: args.severity,
        affectedText: args.affectedText,
        mode: args.mode || null,
        carrier: args.carrier || null,
        confidence: args.confidence,
        source: args.source,
        status: "active",
      },
    });
  }

  return getRMRoadsDashboard(undefined, context);
};

export const toggleRMRoadsDisruptionEventStatus: ToggleRMRoadsDisruptionEventStatus<
  z.infer<typeof toggleDisruptionEventStatusSchema>,
  RMRoadsDashboard
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const { id } = ensureArgsSchemaOrThrowHttpError(toggleDisruptionEventStatusSchema, rawArgs);
  const organization = await getOrCreateUserOrganization(context);
  const event = await context.entities.DisruptionEvent.findFirst({
    where: { id, organizationId: organization.id },
  });
  if (!event) throw new HttpError(404, "Disruption event not found");

  await context.entities.DisruptionEvent.update({
    where: { id },
    data: { status: event.status === "active" ? "archived" : "active" },
  });

  return getRMRoadsDashboard(undefined, context);
};

export const assignRMRoadsExceptionOwner: AssignRMRoadsExceptionOwner<
  z.infer<typeof assignExceptionOwnerSchema>,
  RMRoadsDashboard
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const { exceptionId, ownerName } = ensureArgsSchemaOrThrowHttpError(assignExceptionOwnerSchema, rawArgs);
  const organization = await getOrCreateUserOrganization(context);
  const exception = await getPersistedExceptionByExternalId(context, organization.id, exceptionId);
  if (!exception) throw new HttpError(404, "Exception not found");

  await context.entities.ShipmentException.update({
    where: { id: exception.id },
    data: { ownerName: ownerName.trim() || null },
  });

  return getRMRoadsDashboard(undefined, context);
};

export const decideRMRoadsException: DecideRMRoadsException<
  z.infer<typeof decideExceptionSchema>,
  RMRoadsDashboard
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const { exceptionId, status, scenarioAction, note } = ensureArgsSchemaOrThrowHttpError(
    decideExceptionSchema,
    rawArgs,
  );
  if ((status === "deferred" || status === "rejected") && !note.trim()) {
    throw new HttpError(400, "Decision note is required for deferred or rejected recommendations.");
  }

  const organization = await getOrCreateUserOrganization(context);
  const dashboard = await getRMRoadsDashboard(undefined, context);
  const exception = dashboard.exceptions.find((item) => item.id === exceptionId);
  const shipment = dashboard.shipments.find((item) => item.id === exception?.shipmentId);
  if (!exception || !shipment) throw new HttpError(404, "Exception not found");

  const persistedException = await getPersistedExceptionByExternalId(context, organization.id, exceptionId);
  if (!persistedException) throw new HttpError(404, "Exception not persisted yet");

  const recommendation: Recommendation = generateRecommendation(exception, shipment);
  await context.entities.ExceptionDecision.create({
    data: {
      shipmentException: { connect: { id: persistedException.id } },
      decidedBy: { connect: { id: context.user.id } },
      status,
      scenarioAction,
      note,
      recommendationInput: {
        exception,
        shipment,
      },
      recommendationOutput: recommendation,
    },
  });
  await context.entities.ShipmentException.update({
    where: { id: persistedException.id },
    data: { status },
  });

  return getRMRoadsDashboard(undefined, context);
};

export const updateRMRoadsAlertSettings: UpdateRMRoadsAlertSettings<
  z.infer<typeof updateAlertSettingsSchema>,
  RMRoadsDashboard
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const args = ensureArgsSchemaOrThrowHttpError(updateAlertSettingsSchema, rawArgs);
  const organization = await getOrCreateUserOrganization(context);
  const recipients = parseAlertRecipients(args.alertRecipients);
  if (args.alertEmailsEnabled && recipients.length === 0) {
    throw new HttpError(400, "At least one alert recipient is required before enabling email alerts.");
  }

  await context.entities.Organization.update({
    where: { id: organization.id },
    data: {
      alertEmailsEnabled: args.alertEmailsEnabled,
      alertRecipients: recipients.join(", "),
    },
  });

  return getRMRoadsDashboard(undefined, context);
};

async function getUserOrganization(context: any) {
  const membership = await context.entities.OrganizationMember.findFirst({
    where: { userId: context.user.id },
    include: { organization: true },
  });

  return membership?.organization
    ? {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        alertEmailsEnabled: membership.organization.alertEmailsEnabled,
        alertRecipients: parseAlertRecipients(membership.organization.alertRecipients),
      }
    : null;
}

async function getOrCreateUserOrganization(context: any) {
  const existing = await getUserOrganization(context);
  if (existing) return existing;

  const userLabel = context.user.email || context.user.username || context.user.id.slice(0, 8);
  const organization = await context.entities.Organization.create({
    data: {
      name: `${userLabel} Workspace`,
      slug: `rmroads-${context.user.id}`,
      alertRecipients: context.user.email || "",
      members: {
        create: {
          user: { connect: { id: context.user.id } },
          role: "admin",
        },
      },
    },
  });

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    alertEmailsEnabled: organization.alertEmailsEnabled,
    alertRecipients: parseAlertRecipients(organization.alertRecipients),
  };
}

function emptyDashboard(): RMRoadsDashboard {
  return {
    organization: null,
    shipmentCount: 0,
    eventCount: 0,
    exceptionCount: 0,
    criticalExceptionCount: 0,
    totalValue: 0,
    shipments: [],
    exceptions: [],
    importHistory: [],
    disruptionEvents: [],
    decisions: [],
    alerts: [],
    reviewedCount: 0,
    approvedCount: 0,
    deferredCount: 0,
    rejectedCount: 0,
    averageRiskScore: 0,
    estimatedProtectedValue: 0,
  };
}

function mapShipmentFromDb(shipment: any): Shipment {
  return {
    id: shipment.externalId,
    customer: shipment.customer,
    origin: shipment.origin,
    destination: shipment.destination,
    mode: shipment.mode,
    carrier: shipment.carrier,
    plannedShipDate: formatDate(shipment.plannedShipDate),
    eta: formatDate(shipment.eta),
    priority: shipment.priority,
    value: Number(shipment.value),
    skuGroup: shipment.skuGroup,
    destinationLocation: shipment.destinationLocation,
  };
}

function mapDisruptionEventFromDb(event: any): DisruptionEvent {
  return {
    id: event.id,
    type: event.type,
    severity: event.severity,
    affectedText: event.affectedText,
    mode: event.mode || "",
    carrier: event.carrier || "",
    confidence: event.confidence,
    source: event.source,
    status: event.status,
  };
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function syncPersistedExceptions(
  context: any,
  organizationId: string,
  dbShipments: any[],
  exceptions: ExceptionItem[],
) {
  const shipmentsByExternalId = new Map(dbShipments.map((shipment) => [shipment.externalId, shipment]));

  await Promise.all(
    exceptions.map(async (exception) => {
      const shipment = shipmentsByExternalId.get(exception.shipmentId);
      if (!shipment) return;

      const existing = await context.entities.ShipmentException.findFirst({
        where: {
          organizationId,
          shipmentId: shipment.id,
        },
      });

      if (existing) {
        await context.entities.ShipmentException.update({
          where: { id: existing.id },
          data: {
            riskLevel: exception.riskLevel,
            riskScore: exception.riskScore,
            reason: exception.reason,
          },
        });
        return;
      }

      await context.entities.ShipmentException.create({
        data: {
          organization: { connect: { id: organizationId } },
          shipment: { connect: { id: shipment.id } },
          status: exception.status,
          ownerName: exception.owner || null,
          riskLevel: exception.riskLevel,
          riskScore: exception.riskScore,
          reason: exception.reason,
        },
      });
    }),
  );
}

async function syncCriticalAlerts(
  context: any,
  organization: NonNullable<RMRoadsDashboard["organization"]>,
  exceptions: ExceptionItem[],
) {
  const criticalOpenExceptions = exceptions.filter(
    (exception) =>
      exception.riskLevel === "critical" &&
      (exception.status === "new" || exception.status === "deferred"),
  );

  await Promise.all(
    criticalOpenExceptions.map(async (exception) => {
      const persisted = await getPersistedExceptionByExternalId(context, organization.id, exception.id);
      if (!persisted) return;

      const signature = `${exception.id}:${exception.riskScore}:${exception.status}`;
      const existingAlert = await context.entities.CriticalAlert.findUnique({
        where: {
          organizationId_signature: {
            organizationId: organization.id,
            signature,
          },
        },
      });

      const message = `${exception.id} requires planner review: ${exception.reason}`;
      const alert = existingAlert || await context.entities.CriticalAlert.create({
        data: {
          organization: { connect: { id: organization.id } },
          shipmentException: { connect: { id: persisted.id } },
          signature,
          message,
        },
      });

      if (!alert.sentAt && organization.alertEmailsEnabled && organization.alertRecipients.length > 0) {
        await sendCriticalAlertEmail(organization.alertRecipients, exception, message);
        await context.entities.CriticalAlert.update({
          where: {
            organizationId_signature: {
              organizationId: organization.id,
              signature,
            },
          },
          data: {
            sentAt: new Date(),
            providerMessageId: "wasp-email-sender",
          },
        });
      }
    }),
  );
}

async function sendCriticalAlertEmail(
  recipients: string[],
  exception: ExceptionItem,
  message: string,
) {
  await Promise.all(
    recipients.map((recipient) =>
      emailSender.send({
        to: recipient,
        subject: `Critical RMRoads AI alert: ${exception.shipmentId}`,
        text: [
          message,
          `Customer: ${exception.customer}`,
          `Lane: ${exception.lane}`,
          `Risk: ${exception.riskLevel} ${exception.riskScore}/100`,
          `Open workspace: /rmroads`,
        ].join("\n"),
        html: `
          <p>${escapeHtml(message)}</p>
          <ul>
            <li><strong>Customer:</strong> ${escapeHtml(exception.customer)}</li>
            <li><strong>Lane:</strong> ${escapeHtml(exception.lane)}</li>
            <li><strong>Risk:</strong> ${escapeHtml(exception.riskLevel)} ${exception.riskScore}/100</li>
          </ul>
          <p>Open the RMRoads AI workspace and review the exception queue.</p>
        `,
      }),
    ),
  );
}

function parseAlertRecipients(value: string | null | undefined) {
  return Array.from(
    new Set(
      (value || "")
        .split(/[\n,;]/)
        .map((recipient) => recipient.trim().toLowerCase())
        .filter((recipient) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)),
    ),
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getPersistedExceptionByExternalId(context: any, organizationId: string, exceptionId: string) {
  const shipmentExternalId = exceptionId.replace(/^EX-/, "");
  return context.entities.ShipmentException.findFirst({
    where: {
      organizationId,
      shipment: {
        externalId: shipmentExternalId,
      },
    },
  });
}

function mapImportHistoryFromDb(entry: any): ImportHistoryEntry {
  return {
    id: entry.id,
    importedAt: entry.createdAt.toISOString(),
    sourceName: entry.sourceName,
    acceptedCount: entry.acceptedCount,
    rejectedCount: entry.rejectedCount,
    duplicateCount: entry.duplicateCount,
  };
}

function mapCriticalAlertFromDb(alert: any): CriticalAlertEntry {
  return {
    id: alert.id,
    createdAt: alert.createdAt.toISOString(),
    sentAt: alert.sentAt ? alert.sentAt.toISOString() : "",
    exceptionId: `EX-${alert.shipmentException.shipment.externalId}`,
    shipmentId: alert.shipmentException.shipment.externalId,
    customer: alert.shipmentException.shipment.customer,
    riskLevel: alert.shipmentException.riskLevel,
    riskScore: alert.shipmentException.riskScore,
    message: alert.message,
  };
}
