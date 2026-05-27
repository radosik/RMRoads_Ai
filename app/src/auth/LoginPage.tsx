import { LoginForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { useTranslation, Trans } from "react-i18next";
import { AuthPageLayout } from "./AuthPageLayout";
import { useRedirectIfLoggedIn } from "./hooks/useRedirectIfLoggedIn";

export default function Login() {
  useRedirectIfLoggedIn();
  const { t } = useTranslation();

  return (
    <AuthPageLayout>
      <LoginForm />
      <br />
      <span className="text-sm font-medium text-foreground">
        <Trans
          i18nKey="auth.login.noAccount"
          components={{
            signupLink: (
              <WaspRouterLink to={routes.SignupRoute.to} className="underline" />
            ),
          }}
        />
      </span>
      <br />
      <span className="text-sm font-medium text-foreground">
        <Trans
          i18nKey="auth.login.forgotPassword"
          components={{
            resetLink: (
              <WaspRouterLink
                to={routes.RequestPasswordResetRoute.to}
                className="underline"
              />
            ),
          }}
        />
      </span>
    </AuthPageLayout>
  );
}
