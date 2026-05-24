import { BarChart3, Radar, Shield, Workflow } from "lucide-react";
import { useState, type FormEvent } from "react";
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

const benefits = [
  {
    icon: Radar,
    title: "Live network mirroring",
    text: "Import historical or active shipment data to simulate your operational risk without changing live systems.",
  },
  {
    icon: BarChart3,
    title: "Vulnerability mapping",
    text: "Identify lanes, ports, carriers, and customers where manual response windows close too quickly.",
  },
  {
    icon: Workflow,
    title: "Planner approval workflow",
    text: "Compare recovery scenarios and keep every approve, defer, or reject decision in an audit trail.",
  },
];

export default function RMRoadsPilotPage() {
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
      setStatus(error.message || "Could not submit the pilot request.");
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
            Priority intake
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.7rem] lg:leading-[1.04]">
            Disruption Audit & Pilot Program
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
            Deploy RMRoads AI in your network for a 30-45 day controlled audit.
            Uncover hidden vulnerabilities, map recurring disruption vectors,
            and quantify the financial impact of missed recovery windows.
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <AuditMetric label="At-Risk Shipments Protected" value="14.2%" detail="Average identified in baseline audits" />
            <AuditMetric label="Protected Value" value="$2.4M" detail="Modeled annualized exposure per pilot" />
          </div>

          <div className="mt-10 grid gap-5 border-l border-border/50 pl-5">
            {benefits.map((benefit) => (
              <div className="flex gap-4" key={benefit.title}>
                <benefit.icon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">{benefit.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button className="rmr-label rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" asChild>
              <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>Open Workspace</WaspRouterLink>
            </Button>
            <Button className="rmr-label rounded" variant="outline" asChild>
              <WaspRouterLink to={routes.LandingPageRoute.to}>Back to Home</WaspRouterLink>
            </Button>
          </div>
        </div>

        <div className="rmr-panel relative min-w-0 overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-secondary to-accent" />
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Request Audit Configuration</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Complete the parameters below to initiate the pilot provisioning
              workflow.
            </p>
          </div>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={form.name} onChange={(value) => updateField("name", value)} />
              <Field label="Work Email" type="email" value={form.workEmail} onChange={(value) => updateField("workEmail", value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" value={form.company} onChange={(value) => updateField("company", value)} />
              <Field label="Role" value={form.role} onChange={(value) => updateField("role", value)} />
            </div>
            <Field label="Monthly Shipment Volume" value={form.shipmentVolume} onChange={(value) => updateField("shipmentVolume", value)} placeholder="Example: 8,000 shipments/month" />
            <Field label="Current TMS / Tools" value={form.currentTools} onChange={(value) => updateField("currentTools", value)} placeholder="SAP, Manhattan, Oracle, spreadsheets..." />
            <TextAreaField label="Primary Disruption Pain Point" value={form.disruptionPain} onChange={(value) => updateField("disruptionPain", value)} placeholder="Describe late detection, manual escalation, customer penalties, expedited freight, or planner workload." />
            <TextAreaField label="Primary Goal for Audit" value={form.pilotGoal} onChange={(value) => updateField("pilotGoal", value)} placeholder="What specific KPI or workflow should the pilot improve?" />
            {status ? (
              <p className="rounded border border-secondary/40 bg-secondary/10 p-3 text-sm font-semibold text-secondary">
                {status}
              </p>
            ) : null}
            <Button className="rmr-label h-11 rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Submitting..." : "Submit Audit Request"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Data is used only to qualify the pilot workflow.</p>
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
