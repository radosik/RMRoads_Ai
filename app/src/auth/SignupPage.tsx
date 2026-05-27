import { SignupForm } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { useTranslation, Trans } from "react-i18next";
import { AuthPageLayout } from "./AuthPageLayout";
import { useRedirectIfLoggedIn } from "./hooks/useRedirectIfLoggedIn";

export function Signup() {
  useRedirectIfLoggedIn();
  const { t } = useTranslation();

  return (
    <AuthPageLayout>
      <SignupForm />
      <br />
      <span className="text-sm font-medium text-foreground">
        <Trans
          i18nKey="auth.signup.haveAccount"
          components={{
            loginLink: (
              <WaspRouterLink to={routes.LoginRoute.to} className="underline" />
            ),
          }}
        />
      </span>
      <br />
    </AuthPageLayout>
  );
}
