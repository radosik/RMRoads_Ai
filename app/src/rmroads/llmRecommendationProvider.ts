import {
  anonymizeLlmInput,
  buildLlmRecommendationPrompt,
  generateDummyLlmRecommendation,
  isLlmRecommendationOutput,
  type LlmRecommendationInput,
  type LlmRecommendationOutput,
} from "./domain/llmRecommendations";

export type LlmProviderMode = "off" | "dummy" | "openai";

export type LlmProviderSuccess = {
  output: LlmRecommendationOutput;
  source: "llm-dummy" | "llm-openai";
  latencyMs: number;
};

export type LlmProviderResult = LlmProviderSuccess | null;

// Server-side entry point. Returns null whenever the LLM path should not
// produce a recommendation (mode off, missing config, validation failure,
// or transient error). The caller is expected to fall back to the
// deterministic generator on null.
//
// Mode behaviour:
//  - "off"     -> returns null without any work.
//  - "dummy"   -> returns a plausible, locally-computed output for wiring
//                 and tests. No external API call. Costs zero tokens.
//  - "openai"  -> NOT YET WIRED. Returns null with a console warning so we
//                 do not silently spend tokens before the prompt, retry,
//                 logging, and sensitive-data review work lands.
export async function generateLlmRecommendation(
  input: LlmRecommendationInput,
  mode: LlmProviderMode,
): Promise<LlmProviderResult> {
  if (mode === "off") return null;

  const start = Date.now();

  if (mode === "dummy") {
    const output = generateDummyLlmRecommendation(input);
    if (!isLlmRecommendationOutput(output)) {
      console.warn("[llmRecommendations] dummy output failed self-validation");
      return null;
    }
    return { output, source: "llm-dummy", latencyMs: Date.now() - start };
  }

  if (mode === "openai") {
    // Anonymize before the prompt is built so the call site has nothing
    // sensitive in scope by the time data is about to leave the box. Customer
    // names and lane endpoints become stable hash tokens; operational fields
    // (value, priority, risk reason) pass through.
    const sanitized = anonymizeLlmInput(input);
    const _prompt = buildLlmRecommendationPrompt(sanitized);
    void _prompt;
    // Real OpenAI SDK call is deliberately not wired yet. Keeping the call
    // out until retry + timeout behaviour and a workspace opt-in for sending
    // anonymized vs raw input land per doc 14.
    console.warn(
      "[llmRecommendations] mode=openai is scaffolded (with anonymization) but not yet wired; falling back to deterministic.",
    );
    return null;
  }

  return null;
}

export function resolveLlmMode(rawMode: string | undefined): LlmProviderMode {
  if (rawMode === "dummy" || rawMode === "openai") return rawMode;
  return "off";
}
