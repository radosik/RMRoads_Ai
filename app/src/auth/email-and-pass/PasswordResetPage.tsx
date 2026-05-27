import { ResetPasswordForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Trans } from "react-i18next";
import { AuthPageLayout } from "../AuthPageLayout";

export function PasswordResetPage() {
  return (
    <AuthPageLayout>
      <ResetPasswordForm />
      <br />
      <span className="text-sm font-medium text-foreground">
        <Trans
          i18nKey="auth.passwordReset.allOkay"
          components={{
            loginLink: <WaspRouterLink to={routes.LoginRoute.to} />,
          }}
        />
      </span>
    </AuthPageLayout>
  );
}
