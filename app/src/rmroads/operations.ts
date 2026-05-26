import { HttpError } from "wasp/server";
import { emailSender } from "wasp/server/email";
import type {
  AcceptRMRoadsWorkspaceInvitation,
  AssignRMRoadsExceptionOwner,
  CancelRMRoadsWorkspaceInvitation,
  CreateRMRoadsWorkspaceInvitation,
  DecideRMRoadsException,
  GetRMRoadsDashboard,
  GetRMRoadsPendingInvitations,
  GetRMRoadsRecommendationLog,
  GetRMRoadsTenantHealth,
  GetRMRoadsWorkspaceSettings,
  ImportRMRoadsShipmentCsv,
  ResendRMRoadsWorkspaceInvitation,
  UpsertRMRoadsDisruptionEvent,
  SeedRMRoadsDemoData,
  ToggleRMRoadsDisruptionEventStatus,
  UpdateRMRoadsDecisionOutcome,
  UpdateRMRoadsAlertSettings,
  UpdateRMRoadsWorkspaceSettings,
} from "wasp/server/operations";
import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import { parseCsv, validateShipmentRows, type ImportError } from "./domain/csv";
import { buildExceptionQueue } from "./domain/exceptions";
import {
  buildDecisionLogEntry,
  calculateDecisionMetrics,
} from "./domain/metrics";
import {
  emailInfoList,
  emailParagraph,
  emailRiskBadge,
  escapeHtml as escapeEmailHtml,
  wrapBrandedEmail,
} from "./domain/emailLayout";
import { generateRecommendation } from "./domain/recommendations";
import { generateLlmRecommendation, resolveLlmMode } from "./llmRecommendationProvider";
import { createDefaultEvents, isEventActiveForScoring, scoreShipments } from "./domain/risk";
import { sampleShipments } from "./domain/sampleData";
import {
  buildTenantReadinessIssues,
  canManageWorkspace,
  evaluateInvitationAcceptance,
} from "./domain/tenantSecurity";
import {
  canEnableCriticalAlerts,
  isValidInviteEmail,
  normalizeInviteEmail,
  parseAlertRecipients,
} from "./domain/workspaceReadiness";
import type {
  CriticalAlertEntry,
  DecisionLogEntry,
  DisruptionEvent,
  DecisionOutcomeStatus,
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
    weeklySummaryEmailsEnabled: boolean;
    weeklySummaryRecipients: string[];
    weeklySummaryLastSentAt: string;
    weeklySummaryEmailStatus: string;
    pilotMode: string;
    pilotSuccessMetric: string;
    pilotTargetDecisionHours: number;
    securityReviewCompleted: boolean;
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
  averageResponseHours: number;
};

type ShipmentCsvImportResult = {
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  errors: ImportError[];
  dashboard: RMRoadsDashboard;
};

type RMRoadsWorkspaceSettings = {
  organization: NonNullable<RMRoadsDashboard["organization"]>;
  members: {
    id: string;
    role: string;
    createdAt: string;
    email: string;
    username: string;
  }[];
  invitations: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    acceptedAt: string;
    cancelledAt: string;
    inviteEmailSentAt: string;
    inviteEmailStatus: string;
    sentBy: string;
  }[];
  manualInviteEmail: string;
};

type RMRoadsTenantHealthRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  pilotMode: string;
  pilotSuccessMetric: string;
  pilotTargetDecisionHours: number;
  securityReviewCompleted: boolean;
  alertEmailsEnabled: boolean;
  alertRecipientCount: number;
  pendingInvitationCount: number;
  memberCount: number;
  importCount: number;
  shipmentCount: number;
  exceptionCount: number;
  decisionCount: number;
  alertCount: number;
  latestImportAt: string;
  readinessStatus: string;
  readinessIssues: string[];
};

type RMRoadsPendingInvitation = {
  id: string;
  organizationName: string;
  organizationSlug: string;
  email: string;
  role: string;
  createdAt: string;
  sentBy: string;
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
  startsAt: z.string().max(40).optional().default(""),
  expiresAt: z.string().max(40).optional().default(""),
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

const updateDecisionOutcomeSchema = z.object({
  decisionId: z.string().min(1),
  outcomeStatus: z.enum(["pending", "monitoring", "successful", "failed"]),
  outcomeNote: z.string().max(1200).default(""),
});

const updateAlertSettingsSchema = z.object({
  alertEmailsEnabled: z.boolean(),
  alertRecipients: z.string().max(2000).default(""),
});

const updateWorkspaceSettingsSchema = updateAlertSettingsSchema.extend({
  name: z.string().trim().min(2).max(120),
  weeklySummaryEmailsEnabled: z.boolean().default(false),
  weeklySummaryRecipients: z.string().max(2000).default(""),
  pilotMode: z.enum(["demo", "paid_pilot", "production_readiness"]).default("demo"),
  pilotSuccessMetric: z.string().trim().min(5).max(280),
  pilotTargetDecisionHours: z.number().int().min(1).max(168),
  securityReviewCompleted: z.boolean(),
});

const createWorkspaceInvitationSchema = z.object({
  email: z.string().trim().min(3).max(180),
  role: z.enum(["admin", "planner", "viewer"]).default("planner"),
});

const cancelWorkspaceInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

const acceptWorkspaceInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

const resendWorkspaceInvitationSchema = z.object({
  invitationId: z.string().min(1),
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
  const activeEventCount = events.filter((event) => isEventActiveForScoring(event)).length;
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
      const storedOutput = decision.recommendationOutput as { source?: string } | null;
      const storedSource = storedOutput?.source;
      return buildDecisionLogEntry({
        id: decision.id,
        exception: exceptionItem,
        shipment: mapShipmentFromDb(exception.shipment),
        status: decision.status,
        scenarioAction: decision.scenarioAction,
        note: decision.note || "",
        outcomeStatus: (decision.outcomeStatus || "pending") as DecisionOutcomeStatus,
        outcomeNote: decision.outcomeNote || "",
        decidedBy: decision.decidedBy.email || decision.decidedBy.username || "Planner",
        decidedAt: decision.createdAt.toISOString(),
        exceptionCreatedAt: exception.createdAt.toISOString(),
        recommendationSource:
          storedSource === "llm-dummy" || storedSource === "llm-openai" || storedSource === "deterministic"
            ? storedSource
            : undefined,
      });
    }),
  ).sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  const decisionMetrics = calculateDecisionMetrics(decisions);

  return {
    organization,
    shipmentCount: scoredShipments.length,
    eventCount: activeEventCount,
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

export const getRMRoadsWorkspaceSettings: GetRMRoadsWorkspaceSettings<
  void,
  RMRoadsWorkspaceSettings
> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);

  const organization = await requireWorkspaceAdmin(context);
  const members = await context.entities.OrganizationMember.findMany({
    where: { organizationId: organization.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const invitations = await context.entities.WorkspaceInvitation.findMany({
    where: { organizationId: organization.id },
    include: { sentBy: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    organization,
    members: members.map((member: any) => ({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      email: member.user.email || "",
      username: member.user.username || "",
    })),
    invitations: invitations.map((invitation: any) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
      acceptedAt: invitation.acceptedAt ? invitation.acceptedAt.toISOString() : "",
      cancelledAt: invitation.cancelledAt ? invitation.cancelledAt.toISOString() : "",
      inviteEmailSentAt: invitation.inviteEmailSentAt ? invitation.inviteEmailSentAt.toISOString() : "",
      inviteEmailStatus: invitation.inviteEmailStatus,
      sentBy: invitation.sentBy.email || invitation.sentBy.username || "Workspace admin",
    })),
    manualInviteEmail: "support@rmroads.ai",
  };
};

export const getRMRoadsTenantHealth: GetRMRoadsTenantHealth<
  void,
  RMRoadsTenantHealthRow[]
> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  if (!context.user.isAdmin) throw new HttpError(403);

  const organizations = await context.entities.Organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          members: true,
          shipmentImports: true,
          shipments: true,
          shipmentExceptions: true,
          criticalAlerts: true,
          workspaceInvitations: {
            where: { status: "pending" },
          },
        },
      },
    },
  });

  const rows = await Promise.all(
    organizations.map(async (organization: any) => {
      const [decisionCount, latestImport] = await Promise.all([
        context.entities.ExceptionDecision.count({
          where: {
            shipmentException: {
              organizationId: organization.id,
            },
          },
        }),
        context.entities.ShipmentImport.findFirst({
          where: { organizationId: organization.id },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const alertRecipientCount = parseAlertRecipients(organization.alertRecipients).length;
      const readinessIssues = buildTenantReadinessIssues({
        alertEmailsEnabled: organization.alertEmailsEnabled,
        alertRecipientCount,
        decisionCount,
        importCount: organization._count.shipmentImports,
        pendingInvitationCount: organization._count.workspaceInvitations,
        securityReviewCompleted: organization.securityReviewCompleted,
        shipmentCount: organization._count.shipments,
      });

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt.toISOString(),
        pilotMode: organization.pilotMode,
        pilotSuccessMetric: organization.pilotSuccessMetric,
        pilotTargetDecisionHours: organization.pilotTargetDecisionHours,
        securityReviewCompleted: organization.securityReviewCompleted,
        alertEmailsEnabled: organization.alertEmailsEnabled,
        alertRecipientCount,
        pendingInvitationCount: organization._count.workspaceInvitations,
        memberCount: organization._count.members,
        importCount: organization._count.shipmentImports,
        shipmentCount: organization._count.shipments,
        exceptionCount: organization._count.shipmentExceptions,
        decisionCount,
        alertCount: organization._count.criticalAlerts,
        latestImportAt: latestImport?.createdAt?.toISOString() || "",
        readinessStatus: readinessIssues.length === 0 ? "ready" : "needs_review",
        readinessIssues,
      };
    }),
  );

  return rows;
};

type AdminRecommendationLogRow = {
  id: string;
  decidedAt: string;
  organizationName: string;
  organizationSlug: string;
  source: string;
  primaryAction: string;
  confidence: string;
  summary: string;
  rationale: string;
  exceptionLane: string;
  exceptionRiskLevel: string;
  decisionStatus: string;
  latencyMs: number | null;
};

type AdminRecommendationLogResponse = {
  totals: {
    deterministic: number;
    llmDummy: number;
    llmOpenai: number;
    unknown: number;
    overall: number;
  };
  recent: AdminRecommendationLogRow[];
  windowSize: number;
};

export const getRMRoadsRecommendationLog: GetRMRoadsRecommendationLog<
  void,
  AdminRecommendationLogResponse
> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  if (!context.user.isAdmin) throw new HttpError(403);

  const windowSize = 100;
  const decisions = await context.entities.ExceptionDecision.findMany({
    orderBy: { createdAt: "desc" },
    take: windowSize,
    include: {
      shipmentException: {
        include: {
          organization: true,
          shipment: true,
        },
      },
    },
  });

  const totals = { deterministic: 0, llmDummy: 0, llmOpenai: 0, unknown: 0, overall: decisions.length };
  const recent: AdminRecommendationLogRow[] = decisions.map((decision: any) => {
    const output = (decision.recommendationOutput || {}) as Record<string, unknown>;
    const source = typeof output.source === "string" ? output.source : "unknown";
    if (source === "deterministic") totals.deterministic++;
    else if (source === "llm-dummy") totals.llmDummy++;
    else if (source === "llm-openai") totals.llmOpenai++;
    else totals.unknown++;

    const shipment = decision.shipmentException?.shipment;
    return {
      id: decision.id,
      decidedAt: decision.createdAt.toISOString(),
      organizationName: decision.shipmentException?.organization?.name || "Unknown workspace",
      organizationSlug: decision.shipmentException?.organization?.slug || "",
      source,
      primaryAction: typeof output.primaryAction === "string" ? output.primaryAction : "",
      confidence: typeof output.confidence === "string" ? output.confidence : "",
      summary: typeof output.summary === "string" ? output.summary : "",
      rationale: typeof output.rationale === "string" ? output.rationale : "",
      exceptionLane: shipment ? `${shipment.origin} -> ${shipment.destination}` : "",
      exceptionRiskLevel: decision.shipmentException?.riskLevel || "",
      decisionStatus: decision.status,
      latencyMs: typeof output.latencyMs === "number" ? output.latencyMs : null,
    };
  });

  return { totals, recent, windowSize };
};

export const getRMRoadsPendingInvitations: GetRMRoadsPendingInvitations<
  void,
  RMRoadsPendingInvitation[]
> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  if (!context.user.email) return [];

  const invitations = await context.entities.WorkspaceInvitation.findMany({
    where: {
      email: normalizeInviteEmail(context.user.email),
      status: "pending",
    },
    include: {
      organization: true,
      sentBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations.map((invitation: any) => ({
    id: invitation.id,
    organizationName: invitation.organization.name,
    organizationSlug: invitation.organization.slug,
    email: invitation.email,
    role: invitation.role,
    createdAt: invitation.createdAt.toISOString(),
    sentBy: invitation.sentBy.email || invitation.sentBy.username || "Workspace admin",
  }));
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

export const updateRMRoadsDecisionOutcome: UpdateRMRoadsDecisionOutcome<
  z.infer<typeof updateDecisionOutcomeSchema>,
  RMRoadsDashboard
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const { decisionId, outcomeStatus, outcomeNote } = ensureArgsSchemaOrThrowHttpError(updateDecisionOutcomeSchema, rawArgs);
  const organization = await getOrCreateUserOrganization(context);
  const decision = await context.entities.ExceptionDecision.findFirst({
    where: {
      id: decisionId,
      shipmentException: {
        organizationId: organization.id,
      },
    },
  });
  if (!decision) throw new HttpError(404, "Decision not found");

  await context.entities.ExceptionDecision.update({
    where: { id: decision.id },
    data: {
      outcomeStatus,
      outcomeNote: outcomeNote.trim(),
    },
  });

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
  const startsAt = parseOptionalDateArg(args.startsAt);
  const expiresAt = parseOptionalDateArg(args.expiresAt);
  if (startsAt && expiresAt && startsAt.getTime() >= expiresAt.getTime()) {
    throw new HttpError(400, "Signal expiration must be after the start time.");
  }

  if (args.id) {
    const existing = await context.entities.DisruptionEvent.findFirst({
      where: { id: args.id, organizationId: organization.id },
    });
    if (!existing) throw new HttpError(404, "Disruption event not found");
    await context.entities.DisruptionEvent.update({
      where: { id: args.id },
      data: {
        type: args.type,
        severity: args.severity,
        affectedText: args.affectedText,
        mode: args.mode || null,
        carrier: args.carrier || null,
        confidence: args.confidence,
        source: args.source,
        startsAt,
        expiresAt,
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
        startsAt,
        expiresAt,
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
  const llmMode = resolveLlmMode(process.env.RMROADS_LLM_RECOMMENDATIONS_MODE);
  try {
    const llmResult = await generateLlmRecommendation(
      {
        shipmentExternalId: shipment.id,
        customer: shipment.customer,
        lane: `${shipment.origin} -> ${shipment.destination}`,
        priority: shipment.priority,
        value: shipment.value,
        riskLevel: exception.riskLevel,
        riskScore: exception.riskScore,
        riskReason: exception.reason,
      },
      llmMode,
    );
    if (llmResult) {
      // Overwrite the narrative fields with the LLM output but keep the
      // deterministic scenarios — the LLM only proposes a primary action and
      // rationale, scenarios stay locally-computed for now.
      recommendation.primaryAction = llmResult.output.primaryAction;
      recommendation.confidence = llmResult.output.confidence;
      recommendation.summary = llmResult.output.summary;
      recommendation.rationale = llmResult.output.rationale;
      recommendation.assumptions = llmResult.output.assumptions;
      recommendation.source = llmResult.source;
      recommendation.latencyMs = llmResult.latencyMs;
    }
  } catch (err) {
    console.warn("[decideRMRoadsException] LLM recommendation failed, using deterministic", err);
  }

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
  if (!canEnableCriticalAlerts(args.alertEmailsEnabled, recipients)) {
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

export const updateRMRoadsWorkspaceSettings: UpdateRMRoadsWorkspaceSettings<
  z.infer<typeof updateWorkspaceSettingsSchema>,
  RMRoadsWorkspaceSettings
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const args = ensureArgsSchemaOrThrowHttpError(updateWorkspaceSettingsSchema, rawArgs);
  const organization = await requireWorkspaceAdmin(context);
  const recipients = parseAlertRecipients(args.alertRecipients);
  const weeklyRecipients = parseAlertRecipients(args.weeklySummaryRecipients);
  if (!canEnableCriticalAlerts(args.alertEmailsEnabled, recipients)) {
    throw new HttpError(400, "At least one alert recipient is required before enabling email alerts.");
  }
  if (!canEnableCriticalAlerts(args.weeklySummaryEmailsEnabled, weeklyRecipients)) {
    throw new HttpError(400, "At least one weekly summary recipient is required before enabling weekly summaries.");
  }

  await context.entities.Organization.update({
    where: { id: organization.id },
    data: {
      name: args.name,
      alertEmailsEnabled: args.alertEmailsEnabled,
      alertRecipients: recipients.join(", "),
      weeklySummaryEmailsEnabled: args.weeklySummaryEmailsEnabled,
      weeklySummaryRecipients: weeklyRecipients.join(", "),
      pilotMode: args.pilotMode,
      pilotSuccessMetric: args.pilotSuccessMetric,
      pilotTargetDecisionHours: args.pilotTargetDecisionHours,
      securityReviewCompleted: args.securityReviewCompleted,
    },
  });

  return getRMRoadsWorkspaceSettings(undefined, context);
};

export const createRMRoadsWorkspaceInvitation: CreateRMRoadsWorkspaceInvitation<
  z.infer<typeof createWorkspaceInvitationSchema>,
  RMRoadsWorkspaceSettings
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const args = ensureArgsSchemaOrThrowHttpError(createWorkspaceInvitationSchema, rawArgs);
  const organization = await requireWorkspaceAdmin(context);
  const email = normalizeInviteEmail(args.email);
  if (!isValidInviteEmail(email)) {
    throw new HttpError(400, "A valid teammate email is required.");
  }

  const existingMember = await context.entities.OrganizationMember.findFirst({
    where: {
      organizationId: organization.id,
      user: { email },
    },
  });
  if (existingMember) {
    throw new HttpError(400, "This user is already a workspace member.");
  }

  const existingInvitation = await context.entities.WorkspaceInvitation.findUnique({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email,
      },
    },
  });
  if (existingInvitation?.status === "accepted") {
    throw new HttpError(400, "This invitation was already accepted.");
  }

  const invitation = await context.entities.WorkspaceInvitation.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email,
      },
    },
    create: {
      organization: { connect: { id: organization.id } },
      sentBy: { connect: { id: context.user.id } },
      email,
      role: args.role,
      status: "pending",
      inviteEmailStatus: "pending",
    },
    update: {
      role: args.role,
      status: "pending",
      cancelledAt: null,
      inviteEmailStatus: "pending",
      inviteEmailProviderId: null,
    },
  });

  await sendWorkspaceInvitationEmail(context, invitation.id, {
    email,
    organizationName: organization.name,
    role: args.role,
    sentBy: context.user.email || context.user.username || "Workspace admin",
  });

  return getRMRoadsWorkspaceSettings(undefined, context);
};

export const resendRMRoadsWorkspaceInvitation: ResendRMRoadsWorkspaceInvitation<
  z.infer<typeof resendWorkspaceInvitationSchema>,
  RMRoadsWorkspaceSettings
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const { invitationId } = ensureArgsSchemaOrThrowHttpError(resendWorkspaceInvitationSchema, rawArgs);
  const organization = await requireWorkspaceAdmin(context);
  const invitation = await context.entities.WorkspaceInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: organization.id,
      status: "pending",
    },
  });
  if (!invitation) throw new HttpError(404, "Pending invitation not found.");

  await context.entities.WorkspaceInvitation.update({
    where: { id: invitation.id },
    data: {
      inviteEmailStatus: "pending",
      inviteEmailProviderId: null,
    },
  });

  await sendWorkspaceInvitationEmail(context, invitation.id, {
    email: invitation.email,
    organizationName: organization.name,
    role: invitation.role,
    sentBy: context.user.email || context.user.username || "Workspace admin",
  });

  return getRMRoadsWorkspaceSettings(undefined, context);
};

export const cancelRMRoadsWorkspaceInvitation: CancelRMRoadsWorkspaceInvitation<
  z.infer<typeof cancelWorkspaceInvitationSchema>,
  RMRoadsWorkspaceSettings
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const { invitationId } = ensureArgsSchemaOrThrowHttpError(cancelWorkspaceInvitationSchema, rawArgs);
  const organization = await requireWorkspaceAdmin(context);
  const invitation = await context.entities.WorkspaceInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: organization.id,
    },
  });
  if (!invitation) throw new HttpError(404, "Invitation not found.");

  await context.entities.WorkspaceInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });

  return getRMRoadsWorkspaceSettings(undefined, context);
};

export const acceptRMRoadsWorkspaceInvitation: AcceptRMRoadsWorkspaceInvitation<
  z.infer<typeof acceptWorkspaceInvitationSchema>,
  RMRoadsPendingInvitation[]
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);
  if (!context.user.email) throw new HttpError(400, "Your account needs an email address before accepting invitations.");

  const { invitationId } = ensureArgsSchemaOrThrowHttpError(acceptWorkspaceInvitationSchema, rawArgs);
  const email = normalizeInviteEmail(context.user.email);
  const invitation = await context.entities.WorkspaceInvitation.findFirst({
    where: {
      id: invitationId,
      email,
      status: "pending",
    },
  });
  if (!invitation) throw new HttpError(404, "Pending invitation not found.");

  const existingMembership = await context.entities.OrganizationMember.findFirst({
    where: { userId: context.user.id },
  });
  const acceptanceState = evaluateInvitationAcceptance({
    existingOrganizationId: existingMembership?.organizationId,
    invitationOrganizationId: invitation.organizationId,
  });
  if (acceptanceState === "blocked_by_existing_workspace") {
    throw new HttpError(400, "This account already belongs to another workspace. Contact support before accepting another invite.");
  }

  if (acceptanceState === "can_accept") {
    await context.entities.OrganizationMember.create({
      data: {
        organization: { connect: { id: invitation.organizationId } },
        user: { connect: { id: context.user.id } },
        role: invitation.role,
      },
    });
  }

  await context.entities.WorkspaceInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "accepted",
      acceptedAt: new Date(),
    },
  });

  return getRMRoadsPendingInvitations(undefined, context);
};

async function getUserOrganization(context: any) {
  const membership = await getUserOrganizationMembership(context);

  return membership?.organization
    ? {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        alertEmailsEnabled: membership.organization.alertEmailsEnabled,
        alertRecipients: parseAlertRecipients(membership.organization.alertRecipients),
        weeklySummaryEmailsEnabled: membership.organization.weeklySummaryEmailsEnabled,
        weeklySummaryRecipients: parseAlertRecipients(membership.organization.weeklySummaryRecipients),
        weeklySummaryLastSentAt: membership.organization.weeklySummaryLastSentAt
          ? membership.organization.weeklySummaryLastSentAt.toISOString()
          : "",
        weeklySummaryEmailStatus: membership.organization.weeklySummaryEmailStatus,
        pilotMode: membership.organization.pilotMode,
        pilotSuccessMetric: membership.organization.pilotSuccessMetric,
        pilotTargetDecisionHours: membership.organization.pilotTargetDecisionHours,
        securityReviewCompleted: membership.organization.securityReviewCompleted,
      }
    : null;
}

async function getUserOrganizationMembership(context: any) {
  return context.entities.OrganizationMember.findFirst({
    where: { userId: context.user.id },
    include: { organization: true },
  });
}

async function requireWorkspaceAdmin(context: any) {
  const organization = await getOrCreateUserOrganization(context);
  const membership = await getUserOrganizationMembership(context);
  if (!membership || membership.organizationId !== organization.id || !canManageWorkspace(membership.role)) {
    throw new HttpError(403, "Only workspace admins can update workspace settings.");
  }

  return organization;
}

async function getOrCreateUserOrganization(context: any) {
  const existing = await getUserOrganization(context);
  if (existing) return existing;

  if (await hasPendingWorkspaceInvitation(context)) {
    throw new HttpError(409, "Accept your pending workspace invitation before creating a new workspace.");
  }

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
    weeklySummaryEmailsEnabled: organization.weeklySummaryEmailsEnabled,
    weeklySummaryRecipients: parseAlertRecipients(organization.weeklySummaryRecipients),
    weeklySummaryLastSentAt: organization.weeklySummaryLastSentAt
      ? organization.weeklySummaryLastSentAt.toISOString()
      : "",
    weeklySummaryEmailStatus: organization.weeklySummaryEmailStatus,
    pilotMode: organization.pilotMode,
    pilotSuccessMetric: organization.pilotSuccessMetric,
    pilotTargetDecisionHours: organization.pilotTargetDecisionHours,
    securityReviewCompleted: organization.securityReviewCompleted,
  };
}

async function hasPendingWorkspaceInvitation(context: any) {
  if (!context.user.email) return false;

  const pendingInvitation = await context.entities.WorkspaceInvitation.findFirst({
    where: {
      email: normalizeInviteEmail(context.user.email),
      status: "pending",
    },
  });

  return Boolean(pendingInvitation);
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
    averageResponseHours: 0,
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
    startsAt: event.startsAt ? event.startsAt.toISOString().slice(0, 10) : "",
    expiresAt: event.expiresAt ? event.expiresAt.toISOString().slice(0, 10) : "",
  };
}

function parseOptionalDateArg(value: string | undefined) {
  if (!value) return null;

  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "Signal start and expiration dates must use YYYY-MM-DD format.");
  }

  return date;
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
      const message = `${exception.id} requires planner review: ${exception.reason}`;

      // Ensure the alert row exists. Upsert is idempotent against the
      // (organizationId, signature) unique constraint, so two parallel calls
      // here cannot both create.
      await context.entities.CriticalAlert.upsert({
        where: {
          organizationId_signature: {
            organizationId: organization.id,
            signature,
          },
        },
        create: {
          organization: { connect: { id: organization.id } },
          shipmentException: { connect: { id: persisted.id } },
          signature,
          message,
        },
        update: {},
      });

      if (!organization.alertEmailsEnabled || organization.alertRecipients.length === 0) return;

      // Atomically claim the send. Postgres ensures only one caller updates
      // a row from sentAt=null to a timestamp; concurrent racers get
      // count=0 and skip without sending. This replaces the previous
      // findUnique-then-update pattern, which read sentAt before any caller
      // had committed the update and let duplicates through under
      // back-to-back dashboard fetches.
      const claim = await context.entities.CriticalAlert.updateMany({
        where: {
          organizationId: organization.id,
          signature,
          sentAt: null,
        },
        data: {
          sentAt: new Date(),
          providerMessageId: "wasp-email-sender",
        },
      });
      if (claim.count === 0) return;

      try {
        await sendCriticalAlertEmail(organization.alertRecipients, exception, message);
      } catch (error) {
        console.error("Failed to send RMRoads critical alert email", error);
        // Mark provider failure but leave sentAt set so the alert is not
        // retried automatically — manual operator intervention (clearing
        // sentAt) is the explicit recovery path. Auto-retry would
        // reintroduce the dup risk.
        await context.entities.CriticalAlert.update({
          where: {
            organizationId_signature: {
              organizationId: organization.id,
              signature,
            },
          },
          data: { providerMessageId: "email-send-failed" },
        });
      }
    }),
  );
}

async function sendWorkspaceInvitationEmail(
  context: any,
  invitationId: string,
  invitation: {
    email: string;
    organizationName: string;
    role: string;
    sentBy: string;
  },
) {
  const invitationUrl = buildWorkspaceInvitationUrl();
  try {
    await emailSender.send({
      to: invitation.email,
      subject: `RMRoads AI workspace invitation: ${invitation.organizationName}`,
      text: [
        `${invitation.sentBy} invited you to join ${invitation.organizationName} in RMRoads AI.`,
        `Role: ${invitation.role}`,
        `Accept invitation: ${invitationUrl}`,
        "Sign in with this email address to accept the invitation.",
      ].join("\n"),
      html: wrapBrandedEmail({
        preheader: `${invitation.sentBy} invited you to ${invitation.organizationName}`,
        title: `You're invited to ${invitation.organizationName}`,
        intro: `${invitation.sentBy} added you to their RMRoads AI workspace. Accept to start reviewing exception queues and approving recovery actions.`,
        bodyHtml: emailInfoList([
          { label: "Workspace", value: escapeEmailHtml(invitation.organizationName) },
          { label: "Role", value: escapeEmailHtml(invitation.role) },
          { label: "Sign in with", value: escapeEmailHtml(invitation.email) },
        ]) + emailParagraph(
          `The button below opens the workspace invitation page. Sign in with <strong>${escapeEmailHtml(invitation.email)}</strong> to accept — the invite is bound to that address.`,
        ),
        primaryAction: { label: "Accept invitation", url: invitationUrl },
      }),
    });

    await context.entities.WorkspaceInvitation.update({
      where: { id: invitationId },
      data: {
        inviteEmailSentAt: new Date(),
        inviteEmailStatus: "sent",
        inviteEmailProviderId: "wasp-email-sender",
      },
    });
  } catch (error) {
    console.error("Failed to send RMRoads workspace invitation email", error);
    await context.entities.WorkspaceInvitation.update({
      where: { id: invitationId },
      data: {
        inviteEmailStatus: "failed",
        inviteEmailProviderId: "email-send-failed",
      },
    });
  }
}

function buildWorkspaceInvitationUrl() {
  const appUrl = process.env.RMROADS_APP_URL || process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/rmroads/invitations`;
}

async function sendCriticalAlertEmail(
  recipients: string[],
  exception: ExceptionItem,
  message: string,
) {
  const workspaceUrl = buildWorkspaceUrl();
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
          `Open workspace: ${workspaceUrl}`,
        ].join("\n"),
        html: wrapBrandedEmail({
          preheader: `${exception.shipmentId} requires planner review`,
          title: `Critical exception · ${exception.shipmentId}`,
          intro: escapeEmailHtml(message),
          bodyHtml:
            emailInfoList([
              { label: "Customer", value: escapeEmailHtml(exception.customer) },
              { label: "Lane", value: escapeEmailHtml(exception.lane) },
              {
                label: "Risk",
                value: emailRiskBadge(exception.riskLevel, `${exception.riskLevel.toUpperCase()} · ${exception.riskScore}/100`),
              },
              { label: "Reason", value: escapeEmailHtml(exception.reason) },
            ]) +
            emailParagraph(
              "Open the workspace exception queue to compare recovery scenarios and approve the response.",
            ),
          primaryAction: { label: "Open workspace", url: workspaceUrl },
        }),
      }),
    ),
  );
}

function buildWorkspaceUrl() {
  const appUrl = process.env.RMROADS_APP_URL || process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/rmroads`;
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
    deliveryStatus: alert.providerMessageId === "email-send-failed" ? "Failed" : alert.sentAt ? "Sent" : "Pending",
    exceptionId: `EX-${alert.shipmentException.shipment.externalId}`,
    shipmentId: alert.shipmentException.shipment.externalId,
    customer: alert.shipmentException.shipment.customer,
    riskLevel: alert.shipmentException.riskLevel,
    riskScore: alert.shipmentException.riskScore,
    message: alert.message,
  };
}
