import { VerifyEmailForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Trans } from "react-i18next";
import { AuthPageLayout } from "../AuthPageLayout";

export function EmailVerificationPage() {
  return (
    <AuthPageLayout>
      <VerifyEmailForm />
      <br />
      <span className="text-sm font-medium text-foreground">
        <Trans
          i18nKey="auth.emailVerification.allOkay"
          components={{
            loginLink: <WaspRouterLink to={routes.LoginRoute.to} className="underline" />,
          }}
        />
      </span>
    </AuthPageLayout>
  );
}
