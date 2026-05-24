import { CheckCircle2, ClipboardList, Route, ShieldAlert } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { submitRMRoadsPilotLead } from "wasp/client/operations";
import { Button } from "../client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../client/components/ui/card";
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
    <main className="bg-background min-h-screen">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.8fr)] lg:px-8 lg:py-16">
        <div className="min-w-0">
          <div className="text-muted-foreground text-sm font-semibold uppercase">
            RMRoads AI Pilot
          </div>
          <h1 className="text-foreground mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
            Find shipment exceptions before they become expensive escalations.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-3xl text-lg leading-8">
            RMRoads AI gives logistics and supply chain teams a focused pilot
            workflow: import active shipments, add disruption signals, review
            ranked exceptions, compare recovery actions, and approve decisions
            with an audit trail.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <PilotValue icon={<ClipboardList />} title="Import" text="Use CSV exports from your TMS, ERP, or planning tools." />
            <PilotValue icon={<ShieldAlert />} title="Prioritize" text="Rank risk by lane exposure, business value, urgency, and confidence." />
            <PilotValue icon={<CheckCircle2 />} title="Approve" text="Keep planners in control with scenario comparison and decision notes." />
          </div>

          <Card className="mt-8 min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>What a 30-45 day pilot validates</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>Whether your team can provide anonymized active shipment data without integrations.</p>
              <p>Which disruption types create the clearest operational and financial impact.</p>
              <p>Whether the exception queue identifies decisions planners would actually review.</p>
              <p>How much shipment value is protected by faster detection and response decisions.</p>
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <WaspRouterLink to={routes.SignupRoute.to}>Open Workspace</WaspRouterLink>
            </Button>
            <Button asChild variant="outline">
              <WaspRouterLink to={routes.LandingPageRoute.to}>Back to Home</WaspRouterLink>
            </Button>
          </div>
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Request a disruption audit</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={form.name} onChange={(value) => updateField("name", value)} />
                <Field label="Work email" type="email" value={form.workEmail} onChange={(value) => updateField("workEmail", value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company" value={form.company} onChange={(value) => updateField("company", value)} />
                <Field label="Role" value={form.role} onChange={(value) => updateField("role", value)} />
              </div>
              <Field label="Monthly shipment volume" value={form.shipmentVolume} onChange={(value) => updateField("shipmentVolume", value)} placeholder="Example: 8,000 shipments/month" />
              <Field label="Current planning tools" value={form.currentTools} onChange={(value) => updateField("currentTools", value)} placeholder="TMS, ERP, spreadsheets, 3PL portal..." />
              <TextAreaField label="Where disruptions hurt most" value={form.disruptionPain} onChange={(value) => updateField("disruptionPain", value)} placeholder="Describe late detection, manual escalation, customer penalties, expedited freight, or planner workload." />
              <TextAreaField label="What you want the pilot to prove" value={form.pilotGoal} onChange={(value) => updateField("pilotGoal", value)} placeholder="Example: identify high-risk shipments 24 hours earlier and reduce manual triage time." />
              {status ? <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{status}</p> : null}
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? "Submitting..." : "Submit Pilot Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function PilotValue({ icon, text, title }: { icon: ReactNode; text: string; title: string }) {
  return (
    <div className="rounded-md border border-border bg-card-subtle p-4 text-card-subtle-foreground">
      <div className="text-primary mb-3 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <div className="font-semibold">{title}</div>
      <p className="text-muted-foreground mt-2 text-sm leading-6">{text}</p>
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
      <Label>{label}</Label>
      <Input
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
      <Label>{label}</Label>
      <Textarea
        className="min-h-28"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required
        value={value}
      />
    </label>
  );
}
