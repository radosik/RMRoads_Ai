export type WorkspaceRole = "admin" | "planner" | "viewer" | string;

export type InvitationAcceptanceState =
  | "can_accept"
  | "already_member_of_invited_workspace"
  | "blocked_by_existing_workspace";

export function canManageWorkspace(role: WorkspaceRole | null | undefined) {
  return role === "admin";
}

export function canMutateWorkspaceData(role: WorkspaceRole | null | undefined) {
  return role === "admin" || role === "planner";
}

export function evaluateInvitationAcceptance({
  existingOrganizationId,
  invitationOrganizationId,
}: {
  existingOrganizationId: string | null | undefined;
  invitationOrganizationId: string;
}): InvitationAcceptanceState {
  if (!existingOrganizationId) return "can_accept";
  if (existingOrganizationId === invitationOrganizationId) return "already_member_of_invited_workspace";

  return "blocked_by_existing_workspace";
}

export function buildTenantReadinessIssues({
  alertEmailsEnabled,
  alertRecipientCount,
  decisionCount,
  importCount,
  pendingInvitationCount,
  securityReviewCompleted,
  shipmentCount,
}: {
  alertEmailsEnabled: boolean;
  alertRecipientCount: number;
  decisionCount: number;
  importCount: number;
  pendingInvitationCount: number;
  securityReviewCompleted: boolean;
  shipmentCount: number;
}) {
  const issues: string[] = [];

  if (!securityReviewCompleted) issues.push("Security review pending");
  if (shipmentCount === 0 || importCount === 0) issues.push("No shipment import validated");
  if (decisionCount === 0) issues.push("No planner decision recorded");
  if (alertEmailsEnabled && alertRecipientCount === 0) issues.push("Alerts enabled without recipients");
  if (pendingInvitationCount > 0) issues.push("Pending team invitations");

  return issues;
}
