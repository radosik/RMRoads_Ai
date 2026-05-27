import { type Prisma } from "@prisma/client";
import { type User } from "wasp/entities";
import { HttpError, prisma } from "wasp/server";
import {
  type DeleteCurrentUserAccount,
  type GetPaginatedUsers,
  type UpdateIsUserAdminById,
} from "wasp/server/operations";
import * as z from "zod";
import { SubscriptionStatus } from "../payment/plans";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";

const updateUserAdminByIdInputSchema = z.object({
  id: z.string().nonempty(),
  isAdmin: z.boolean(),
});

type UpdateUserAdminByIdInput = z.infer<typeof updateUserAdminByIdInputSchema>;

export const updateIsUserAdminById: UpdateIsUserAdminById<
  UpdateUserAdminByIdInput,
  User
> = async (rawArgs, context) => {
  const { id, isAdmin } = ensureArgsSchemaOrThrowHttpError(
    updateUserAdminByIdInputSchema,
    rawArgs,
  );

  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }

  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation",
    );
  }

  return context.entities.User.update({
    where: { id },
    data: { isAdmin },
  });
};

type GetPaginatedUsersOutput = {
  users: Pick<
    User,
    | "id"
    | "email"
    | "username"
    | "subscriptionStatus"
    | "paymentProcessorUserId"
    | "isAdmin"
  >[];
  totalPages: number;
};

const getPaginatorArgsSchema = z.object({
  skipPages: z.number(),
  filter: z.object({
    emailContains: z.string().nonempty().optional(),
    isAdmin: z.boolean().optional(),
    subscriptionStatusIn: z
      .array(z.nativeEnum(SubscriptionStatus).nullable())
      .optional(),
  }),
});

type GetPaginatedUsersInput = z.infer<typeof getPaginatorArgsSchema>;

export const getPaginatedUsers: GetPaginatedUsers<
  GetPaginatedUsersInput,
  GetPaginatedUsersOutput
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(
      401,
      "Only authenticated users are allowed to perform this operation",
    );
  }

  if (!context.user.isAdmin) {
    throw new HttpError(
      403,
      "Only admins are allowed to perform this operation",
    );
  }

  const {
    skipPages,
    filter: {
      subscriptionStatusIn: subscriptionStatus,
      emailContains,
      isAdmin,
    },
  } = ensureArgsSchemaOrThrowHttpError(getPaginatorArgsSchema, rawArgs);

  const includeUnsubscribedUsers = !!subscriptionStatus?.some(
    (status) => status === null,
  );
  const desiredSubscriptionStatuses = subscriptionStatus?.filter(
    (status) => status !== null,
  );

  const pageSize = 10;

  const userPageQuery: Prisma.UserFindManyArgs = {
    skip: skipPages * pageSize,
    take: pageSize,
    where: {
      AND: [
        {
          email: {
            contains: emailContains,
            mode: "insensitive",
          },
          isAdmin,
        },
        {
          OR: [
            {
              subscriptionStatus: {
                in: desiredSubscriptionStatuses,
              },
            },
            {
              subscriptionStatus: includeUnsubscribedUsers ? null : undefined,
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      subscriptionStatus: true,
      paymentProcessorUserId: true,
    },
    orderBy: {
      username: "asc",
    },
  };

  const [pageOfUsers, totalUsers] = await prisma.$transaction([
    context.entities.User.findMany(userPageQuery),
    context.entities.User.count({ where: userPageQuery.where }),
  ]);
  const totalPages = Math.ceil(totalUsers / pageSize);

  return {
    users: pageOfUsers,
    totalPages,
  };
};

const deleteCurrentUserAccountInputSchema = z.object({
  confirmEmail: z.string().min(1, "Confirmation required"),
});

type DeleteCurrentUserAccountInput = z.infer<
  typeof deleteCurrentUserAccountInputSchema
>;

// Permanently deletes the caller's account along with their workspace
// memberships, sent invitations, decisions, and any organization they're
// the sole member of. The confirmEmail field must match the user's own
// email — this is a destructive, irreversible operation.
export const deleteCurrentUserAccount: DeleteCurrentUserAccount<
  DeleteCurrentUserAccountInput,
  { success: true }
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401, "Authentication required.");
  }

  const { confirmEmail } = ensureArgsSchemaOrThrowHttpError(
    deleteCurrentUserAccountInputSchema,
    rawArgs,
  );

  const userRecord = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: { id: true, email: true },
  });
  if (!userRecord) {
    throw new HttpError(404, "User not found.");
  }
  if (!userRecord.email || userRecord.email.toLowerCase() !== confirmEmail.trim().toLowerCase()) {
    throw new HttpError(
      400,
      "Confirmation email does not match the account email.",
    );
  }

  // Find organizations where this user is the sole member — those need to be
  // deleted alongside the user to avoid orphan workspaces with no admin.
  const memberships = await context.entities.OrganizationMember.findMany({
    where: { userId: userRecord.id },
    select: { organizationId: true },
  });
  const orphanOrgIds: string[] = [];
  for (const m of memberships) {
    const remaining = await context.entities.OrganizationMember.count({
      where: { organizationId: m.organizationId, NOT: { userId: userRecord.id } },
    });
    if (remaining === 0) orphanOrgIds.push(m.organizationId);
  }

  await prisma.$transaction(async (tx) => {
    // 1. Cancel pending invitations sent by this user.
    await tx.workspaceInvitation.updateMany({
      where: { sentById: userRecord.id, status: "pending" },
      data: { status: "cancelled", cancelledAt: new Date() },
    });

    // 2. Remove this user's memberships.
    await tx.organizationMember.deleteMany({
      where: { userId: userRecord.id },
    });

    // 3. For organizations where they were the sole member, cascade-clean
    //    the workspace and all its scoped data.
    for (const orgId of orphanOrgIds) {
      await tx.criticalAlert.deleteMany({ where: { organizationId: orgId } });
      await tx.exceptionDecision.deleteMany({
        where: { shipmentException: { organizationId: orgId } },
      });
      await tx.shipmentException.deleteMany({ where: { organizationId: orgId } });
      await tx.shipment.deleteMany({ where: { organizationId: orgId } });
      await tx.disruptionEvent.deleteMany({ where: { organizationId: orgId } });
      await tx.shipmentImport.deleteMany({ where: { organizationId: orgId } });
      await tx.workspaceInvitation.deleteMany({ where: { organizationId: orgId } });
      await tx.organization.delete({ where: { id: orgId } });
    }

    // 4. Decision rows for surviving workspaces stay (audit trail) but the
    //    decidedBy foreign key needs to be released. The decision keeps its
    //    note + status + outcome — just loses the per-user link.
    await tx.exceptionDecision.deleteMany({
      where: { decidedById: userRecord.id },
    });

    // 5. Finally, delete the user. Wasp's Auth cascade handles AuthIdentity,
    //    Session, etc.
    await tx.user.delete({ where: { id: userRecord.id } });
  });

  return { success: true };
};
