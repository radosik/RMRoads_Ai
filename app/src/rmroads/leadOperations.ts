import { HttpError } from "wasp/server";
import type {
  GetRMRoadsPilotLeads,
  SubmitRMRoadsPilotLead,
  UpdateRMRoadsPilotLeadStatus,
} from "wasp/server/operations";
import * as z from "zod";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";

const submitPilotLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  workEmail: z.string().trim().email().max(160),
  company: z.string().trim().min(2).max(160),
  role: z.string().trim().min(2).max(120),
  shipmentVolume: z.string().trim().min(1).max(120),
  currentTools: z.string().trim().min(2).max(240),
  disruptionPain: z.string().trim().min(10).max(1200),
  pilotGoal: z.string().trim().min(10).max(1200),
});

const updatePilotLeadStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["new", "contacted", "qualified", "rejected"]),
});

type PilotLeadResult = {
  id: string;
  message: string;
};

type PilotLeadListItem = {
  id: string;
  createdAt: string;
  name: string;
  workEmail: string;
  company: string;
  role: string;
  shipmentVolume: string;
  currentTools: string;
  disruptionPain: string;
  pilotGoal: string;
  status: string;
};

export const submitRMRoadsPilotLead: SubmitRMRoadsPilotLead<
  z.infer<typeof submitPilotLeadSchema>,
  PilotLeadResult
> = async (rawArgs, context) => {
  const lead = ensureArgsSchemaOrThrowHttpError(submitPilotLeadSchema, rawArgs);
  const recentDuplicate = await context.entities.PilotLead.findFirst({
    where: {
      workEmail: lead.workEmail.toLowerCase(),
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 30),
      },
    },
  });

  if (recentDuplicate) {
    throw new HttpError(429, "We already received a recent request from this email.");
  }

  const createdLead = await context.entities.PilotLead.create({
    data: {
      ...lead,
      workEmail: lead.workEmail.toLowerCase(),
    },
  });

  return {
    id: createdLead.id,
    message: "Pilot request received. We will follow up with next steps.",
  };
};

export const getRMRoadsPilotLeads: GetRMRoadsPilotLeads<
  void,
  PilotLeadListItem[]
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users can view pilot leads.");
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, "Only admins can view pilot leads.");
  }

  const leads = await context.entities.PilotLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return leads.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
  }));
};

export const updateRMRoadsPilotLeadStatus: UpdateRMRoadsPilotLeadStatus<
  z.infer<typeof updatePilotLeadStatusSchema>,
  PilotLeadListItem
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, "Only authenticated users can update pilot leads.");
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, "Only admins can update pilot leads.");
  }

  const { id, status } = ensureArgsSchemaOrThrowHttpError(
    updatePilotLeadStatusSchema,
    rawArgs,
  );
  const lead = await context.entities.PilotLead.update({
    where: { id },
    data: { status },
  });

  return {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
  };
};
