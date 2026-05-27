import {
  type GetPasswordResetEmailContentFn,
  type GetVerificationEmailContentFn,
} from "wasp/server/auth";
import { wrapBrandedEmail, emailParagraph } from "../../rmroads/domain/emailLayout";

export const getVerificationEmailContent: GetVerificationEmailContentFn = ({
  verificationLink,
}) => ({
  subject: "Verify your RMRoads AI email",
  text: `Verify your RMRoads AI email by visiting this link: ${verificationLink}`,
  html: wrapBrandedEmail({
    preheader: "Confirm your email to finish signing in to RMRoads AI.",
    title: "Verify your email",
    intro: "Click the button below to confirm this email address and finish signing in. The link is single-use.",
    bodyHtml: emailParagraph(
      `If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all;font-size:13px;">${verificationLink}</span>`,
    ),
    primaryAction: { label: "Verify email", url: verificationLink },
    footerNote: "If you didn't sign up, you can safely ignore this email.",
  }),
});

export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({
  passwordResetLink,
}) => ({
  subject: "Reset your RMRoads AI password",
  text: `Reset your RMRoads AI password by visiting this link: ${passwordResetLink}`,
  html: wrapBrandedEmail({
    preheader: "Set a new password for your RMRoads AI account.",
    title: "Reset your password",
    intro: "Click the button below to set a new password for your RMRoads AI account. The link expires after a short period.",
    bodyHtml: emailParagraph(
      `If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all;font-size:13px;">${passwordResetLink}</span>`,
    ),
    primaryAction: { label: "Reset password", url: passwordResetLink },
    footerNote: "If you didn't request a password reset, you can safely ignore this email — your password won't change.",
  }),
});
