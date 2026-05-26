import type { AuthUser } from "wasp/auth";
import { getRMRoadsRecommendationLog, useQuery } from "wasp/client/operations";
import { Card, CardContent, CardHeader, CardTitle } from "../../../client/components/ui/card";
import DefaultLayout from "../../layout/DefaultLayout";

function sourceBadge(source: string): { label: string; className: string } {
  if (source === "llm-openai") {
    return { label: "AI · OpenAI", className: "border-secondary/40 bg-secondary/15 text-secondary" };
  }
  if (source === "llm-dummy") {
    return { label: "AI · Dummy", className: "border-secondary/30 bg-secondary/10 text-secondary" };
  }
  if (source === "deterministic") {
    return { label: "Deterministic", className: "border-border/40 bg-card-subtle/60 text-muted-foreground" };
  }
  return { label: "Unknown", className: "border-border/40 bg-card-subtle/60 text-muted-foreground" };
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function MetricCard({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="rmr-label text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

function AdminRecommendations({ user }: { user: AuthUser }) {
  const logQuery = useQuery(getRMRoadsRecommendationLog);
  const data = logQuery.data;
  const totals = data?.totals;
  const rows = data?.recent || [];
  const llmShare = totals && totals.overall > 0
    ? Math.round(((totals.llmDummy + totals.llmOpenai) / totals.overall) * 100)
    : 0;

  return (
    <DefaultLayout user={user}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Recommendation Log</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inspect recent planner decisions across all workspaces. Use the source mix to monitor whether the LLM
            path is actually firing in dev (dummy) or production (openai), and the rationale column to review prompt
            quality before flipping the real provider on.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Recent decisions"
            value={totals?.overall ?? 0}
            detail={`window of last ${data?.windowSize ?? 0}`}
          />
          <MetricCard
            label="Deterministic"
            value={totals?.deterministic ?? 0}
            detail="static fallback path"
          />
          <MetricCard
            label="LLM (dummy + openai)"
            value={(totals?.llmDummy ?? 0) + (totals?.llmOpenai ?? 0)}
            detail={`${llmShare}% of window`}
          />
          <MetricCard
            label="Unknown source"
            value={totals?.unknown ?? 0}
            detail="missing or unrecognized tag"
          />
        </section>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Latest decisions</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {logQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading recommendation log...</p>
            ) : null}
            {logQuery.error ? (
              <p className="text-sm font-semibold text-destructive">Could not load recommendation log.</p>
            ) : null}
            {!logQuery.isLoading && rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No decisions recorded yet.</p>
            ) : null}
            {rows.length ? (
              <div className="max-w-full overflow-hidden rounded-md border border-border">
                <table className="w-full table-fixed text-left text-xs sm:text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="w-[14%] py-3 pl-2 pr-2 sm:pl-3">When</th>
                      <th className="w-[16%] py-3 pr-2">Workspace</th>
                      <th className="w-[14%] py-3 pr-2">Source</th>
                      <th className="w-[12%] py-3 pr-2">Action</th>
                      <th className="w-[10%] py-3 pr-2">Status</th>
                      <th className="w-[34%] py-3 pr-2">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const badge = sourceBadge(row.source);
                      return (
                        <tr className="border-b align-top last:border-b-0" key={row.id}>
                          <td className="py-4 pl-2 pr-2 sm:pl-3">
                            <span className="block">{formatTimestamp(row.decidedAt)}</span>
                            {row.latencyMs !== null ? (
                              <span className="block text-xs text-muted-foreground">{row.latencyMs} ms</span>
                            ) : null}
                          </td>
                          <td className="py-4 pr-2">
                            <span className="block font-semibold">{row.organizationName}</span>
                            <span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">
                              {row.exceptionLane}
                            </span>
                          </td>
                          <td className="py-4 pr-2">
                            <span
                              className={
                                "rmr-label inline-block rounded border px-2 py-0.5 " + badge.className
                              }
                            >
                              {badge.label}
                            </span>
                            {row.confidence ? (
                              <span className="mt-1 block text-xs text-muted-foreground">
                                Confidence: {row.confidence}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-4 pr-2 [overflow-wrap:anywhere]">{row.primaryAction || "—"}</td>
                          <td className="py-4 pr-2">{row.decisionStatus}</td>
                          <td className="py-4 pr-2 [overflow-wrap:anywhere]">
                            {row.summary ? <span className="block">{row.summary}</span> : null}
                            {row.rationale ? (
                              <span className="mt-1 block text-xs text-muted-foreground">{row.rationale}</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
}

export default AdminRecommendations;
