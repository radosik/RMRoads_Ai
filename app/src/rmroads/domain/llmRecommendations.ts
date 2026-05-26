import type { ScenarioAction } from "./types";

export type LlmRecommendationInput = {
  shipmentExternalId: string;
  customer: string;
  lane: string;
  priority: string;
  value: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  riskReason: string;
};

export type LlmRecommendationOutput = {
  primaryAction: ScenarioAction;
  confidence: "Low" | "Medium" | "High";
  summary: string;
  rationale: string;
  assumptions: string[];
  alternatives: Array<{ action: ScenarioAction; rationale: string }>;
};

const SYSTEM_PROMPT = [
  "You are a supply chain disruption response assistant.",
  "Given a single at-risk shipment, recommend exactly one primary action from this set:",
  "wait, notify, reroute, split, expedite.",
  "Return strictly valid JSON matching the schema; no prose outside JSON.",
  "Be conservative: assumptions explicit, no guaranteed-savings language.",
  "The planner approves every action; you are decision support, not autopilot.",
].join(" ");

export function buildLlmRecommendationPrompt(input: LlmRecommendationInput): {
  system: string;
  user: string;
} {
  const userLines = [
    `Shipment: ${input.shipmentExternalId}`,
    `Customer: ${input.customer}`,
    `Lane: ${input.lane}`,
    `Priority: ${input.priority}`,
    `Value (USD): ${input.value}`,
    `Risk level: ${input.riskLevel}`,
    `Risk score (0-100): ${input.riskScore}`,
    `Risk reason: ${input.riskReason}`,
    "",
    "Respond with JSON of shape:",
    "{",
    '  "primaryAction": "wait" | "notify" | "reroute" | "split" | "expedite",',
    '  "confidence": "Low" | "Medium" | "High",',
    '  "summary": string,',
    '  "rationale": string,',
    '  "assumptions": string[],',
    '  "alternatives": Array<{ action: ScenarioAction, rationale: string }>',
    "}",
  ];
  return { system: SYSTEM_PROMPT, user: userLines.join("\n") };
}

const VALID_ACTIONS = new Set<ScenarioAction>([
  "watch",
  "notify",
  "reroute",
  "split",
  "expedite",
]);
const VALID_CONFIDENCES = new Set<LlmRecommendationOutput["confidence"]>([
  "Low",
  "Medium",
  "High",
]);

export function isLlmRecommendationOutput(value: unknown): value is LlmRecommendationOutput {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.summary !== "string" || typeof v.rationale !== "string") return false;
  // The prompt asks for {watch|notify|reroute|split|expedite} but tolerates the
  // older {wait} synonym from earlier prompt versions.
  const action = v.primaryAction === "wait" ? "watch" : v.primaryAction;
  if (!VALID_ACTIONS.has(action as ScenarioAction)) return false;
  if (!VALID_CONFIDENCES.has(v.confidence as LlmRecommendationOutput["confidence"])) return false;
  if (!Array.isArray(v.assumptions) || !v.assumptions.every((a) => typeof a === "string")) {
    return false;
  }
  if (
    !Array.isArray(v.alternatives) ||
    !v.alternatives.every(
      (alt) =>
        alt &&
        typeof alt === "object" &&
        VALID_ACTIONS.has((alt as { action: unknown }).action as ScenarioAction) &&
        typeof (alt as { rationale: unknown }).rationale === "string",
    )
  ) {
    return false;
  }
  return true;
}

// Deterministic fallback used both by the "dummy" provider mode and by tests.
// Mirrors the choosePrimaryAction heuristic so the dummy output stays plausible
// without needing a real LLM call.
export function generateDummyLlmRecommendation(input: LlmRecommendationInput): LlmRecommendationOutput {
  const primaryAction = pickActionForInput(input);
  const altPool: ScenarioAction[] = (["watch", "notify", "reroute", "split", "expedite"] as ScenarioAction[]).filter(
    (a) => a !== primaryAction,
  );
  return {
    primaryAction,
    confidence: input.riskLevel === "critical" ? "High" : input.riskLevel === "high" ? "Medium" : "Low",
    summary: `${capitalize(primaryAction)} is recommended for ${input.shipmentExternalId} (${input.riskLevel} risk, ${input.riskReason}).`,
    rationale: `Risk score ${input.riskScore}/100 against a ${input.priority} shipment for ${input.customer}. ${capitalize(primaryAction)} balances recovery against cost.`,
    assumptions: [
      "Recommendation is decision support; planner approval is required before any action.",
      `Assumes current disruption signal "${input.riskReason}" stays active for at least 24 hours.`,
      `Assumes customer ${input.customer} sensitivity matches its priority tag (${input.priority}).`,
    ],
    alternatives: altPool.slice(0, 2).map((action) => ({
      action,
      rationale: `Consider ${action} if the assumptions above change.`,
    })),
  };
}

function pickActionForInput(input: LlmRecommendationInput): ScenarioAction {
  if (input.riskLevel === "critical" && input.value >= 100000) return "expedite";
  if (input.riskLevel === "critical") return "reroute";
  if (input.riskLevel === "high" && input.priority !== "standard") return "split";
  if (input.riskLevel === "high") return "notify";
  return "watch";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
