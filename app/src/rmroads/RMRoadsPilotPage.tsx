import { BarChart3, Radar, Shield, Workflow } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { submitRMRoadsPilotLead } from "wasp/client/operations";
import { Button } from "../client/components/ui/button";
import { Input } from "../client/components/ui/input";
import { Label } from "../client/components/ui/label";
import { Textarea } from "../client/components/ui/textarea";

const initialForm = {
  name: "",
  workEmail: "",
  company: "",
  role: "",
  shipmentVolume: "",
  currentTools: "",
  disruptionPain: "",
  pilotGoal: "",
};

const benefitIcons = [Radar, BarChart3, Workflow] as const;
const benefitIds = ["network", "vulnerability", "approval"] as const;

export default function RMRoadsPilotPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("");
    setIsSubmitting(true);
    try {
      const result = await submitRMRoadsPilotLead(form);
      setStatus(result.message);
      setForm(initialForm);
    } catch (error: any) {
      setStatus(error.message || t("pilot.submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="rmr-grid-bg min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8 lg:py-20">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_12%_12%,rgba(76,215,246,0.14),transparent_28%),radial-gradient(circle_at_86%_64%,rgba(161,207,207,0.08),transparent_28%)]" />
      <section className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(24rem,0.8fr)]">
        <div className="min-w-0">
          <div className="rmr-label flex items-center gap-2 text-secondary">
            <span className="size-2 rounded-full bg-secondary rmr-glow" />
            {t("pilot.eyebrow")}
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.7rem] lg:leading-[1.04]">
            {t("pilot.title")}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            {t("pilot.intro")}
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <AuditMetric
              label={t("pilot.metrics.protected.label")}
              value={t("pilot.metrics.protected.value")}
              detail={t("pilot.metrics.protected.detail")}
            />
            <AuditMetric
              label={t("pilot.metrics.value.label")}
              value={t("pilot.metrics.value.value")}
              detail={t("pilot.metrics.value.detail")}
            />
          </div>

          <div className="mt-10 grid gap-5 border-l border-border/50 pl-5">
            {benefitIds.map((id, index) => {
              const Icon = benefitIcons[index];
              return (
                <div className="flex gap-4" key={id}>
                  <Icon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold">{t(`pilot.benefits.${id}.title`)}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {t(`pilot.benefits.${id}.text`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button className="rmr-label rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" asChild>
              <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>{t("pilot.openWorkspace")}</WaspRouterLink>
            </Button>
            <Button className="rmr-label rounded" variant="outline" asChild>
              <WaspRouterLink to={routes.LandingPageRoute.to}>{t("pilot.backHome")}</WaspRouterLink>
            </Button>
          </div>
        </div>

        <div className="rmr-panel relative min-w-0 overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-secondary to-accent" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold">{t("pilot.form.title")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("pilot.form.subtitle")}
            </p>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("pilot.form.fields.name")} value={form.name} onChange={(value) => updateField("name", value)} />
              <Field label={t("pilot.form.fields.workEmail")} type="email" value={form.workEmail} onChange={(value) => updateField("workEmail", value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("pilot.form.fields.company")} value={form.company} onChange={(value) => updateField("company", value)} />
              <Field label={t("pilot.form.fields.role")} value={form.role} onChange={(value) => updateField("role", value)} />
            </div>
            <Field
              label={t("pilot.form.fields.shipmentVolume")}
              value={form.shipmentVolume}
              onChange={(value) => updateField("shipmentVolume", value)}
              placeholder={t("pilot.form.fields.shipmentVolumePlaceholder")}
            />
            <Field
              label={t("pilot.form.fields.currentTools")}
              value={form.currentTools}
              onChange={(value) => updateField("currentTools", value)}
              placeholder={t("pilot.form.fields.currentToolsPlaceholder")}
            />
            <TextAreaField
              label={t("pilot.form.fields.disruptionPain")}
              value={form.disruptionPain}
              onChange={(value) => updateField("disruptionPain", value)}
              placeholder={t("pilot.form.fields.disruptionPainPlaceholder")}
            />
            <TextAreaField
              label={t("pilot.form.fields.pilotGoal")}
              value={form.pilotGoal}
              onChange={(value) => updateField("pilotGoal", value)}
              placeholder={t("pilot.form.fields.pilotGoalPlaceholder")}
            />
            {status ? (
              <p className="rounded border border-secondary/40 bg-secondary/10 p-3 text-sm font-semibold text-secondary">
                {status}
              </p>
            ) : null}
            <Button className="rmr-label h-11 rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" disabled={isSubmitting} type="submit">
              {isSubmitting ? t("pilot.form.submitting") : t("pilot.form.submit")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t("pilot.form.dataNote")}</p>
          </form>
        </div>
      </section>
    </main>
  );
}

function AuditMetric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="rounded border border-border/40 bg-card-subtle/80 p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <span className="rmr-label text-muted-foreground">{label}</span>
        <Shield className="size-5 shrink-0 text-secondary" />
      </div>
      <div className="rmr-data text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</div>
    </div>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <Label className="rmr-label text-muted-foreground">{label}</Label>
      <Input
        className="rounded border-border/60 bg-background/70 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <Label className="rmr-label text-muted-foreground">{label}</Label>
      <Textarea
        className="min-h-24 rounded border-border/60 bg-background/70 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-secondary"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required
        value={value}
      />
    </label>
  );
}
