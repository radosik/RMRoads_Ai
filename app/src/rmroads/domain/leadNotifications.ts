import {
  emailInfoList,
  emailParagraph,
  emailSectionTitle,
  escapeHtml,
  wrapBrandedEmail,
} from "./emailLayout";

export type PilotLeadEmailInput = {
  name: string;
  workEmail: string;
  company: string;
  role: string;
  shipmentVolume: string;
  currentTools: string;
  disruptionPain: string;
  pilotGoal: string;
  adminUrl: string;
};

export function parseNotificationRecipients(value: string | undefined) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[,\n;]/)
        .map((item) => item.trim().toLowerCase())
        .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)),
    ),
  );
}

export function buildPilotLeadEmail(lead: PilotLeadEmailInput) {
  const subject = `New RMRoads AI pilot request: ${lead.company}`;
  const text = [
    `New RMRoads AI pilot request from ${lead.name} at ${lead.company}.`,
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.workEmail}`,
    `Company: ${lead.company}`,
    `Role: ${lead.role}`,
    `Shipment volume: ${lead.shipmentVolume}`,
    `Current tools: ${lead.currentTools}`,
    "",
    "Disruption pain:",
    lead.disruptionPain,
    "",
    "Pilot goal:",
    lead.pilotGoal,
    "",
    `Review lead: ${lead.adminUrl}`,
  ].join("\n");

  const body =
    emailInfoList([
      { label: "Contact", value: `${escapeHtml(lead.name)} · ${escapeHtml(lead.workEmail)}` },
      { label: "Company", value: escapeHtml(lead.company) },
      { label: "Role", value: escapeHtml(lead.role) },
      { label: "Shipment volume", value: escapeHtml(lead.shipmentVolume) },
      { label: "Current tools", value: escapeHtml(lead.currentTools) },
    ]) +
    emailSectionTitle("Disruption pain") +
    emailParagraph(escapeHtml(lead.disruptionPain)) +
    emailSectionTitle("Pilot goal") +
    emailParagraph(escapeHtml(lead.pilotGoal));

  const html = wrapBrandedEmail({
    preheader: `New pilot request from ${lead.name} at ${lead.company}`,
    title: `Pilot request from ${lead.company}`,
    intro: `${lead.name} just submitted a disruption audit request. Qualify and route from the admin pilot leads view.`,
    bodyHtml: body,
    primaryAction: { label: "Review lead in admin", url: lead.adminUrl },
  });

  return { subject, text, html };
}
