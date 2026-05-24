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
  const html = `
    <p>New RMRoads AI pilot request from <strong>${escapeHtml(lead.name)}</strong> at <strong>${escapeHtml(lead.company)}</strong>.</p>
    <ul>
      <li><strong>Email:</strong> ${escapeHtml(lead.workEmail)}</li>
      <li><strong>Role:</strong> ${escapeHtml(lead.role)}</li>
      <li><strong>Shipment volume:</strong> ${escapeHtml(lead.shipmentVolume)}</li>
      <li><strong>Current tools:</strong> ${escapeHtml(lead.currentTools)}</li>
    </ul>
    <p><strong>Disruption pain:</strong><br>${escapeHtml(lead.disruptionPain)}</p>
    <p><strong>Pilot goal:</strong><br>${escapeHtml(lead.pilotGoal)}</p>
    <p><a href="${escapeHtml(lead.adminUrl)}">Review lead in admin</a></p>
  `;

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
