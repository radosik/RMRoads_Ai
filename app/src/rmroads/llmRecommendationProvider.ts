import {
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
    // Prompt is built but the API call is deliberately not wired yet. This
    // keeps the contract honest: nothing accidentally hits OpenAI before
    // prompt logging, retry, and sensitive-data review land per doc 14.
    const _prompt = buildLlmRecommendationPrompt(input);
    void _prompt;
    console.warn(
      "[llmRecommendations] mode=openai is scaffolded but not yet wired; falling back to deterministic.",
    );
    return null;
  }

  return null;
}

export function resolveLlmMode(rawMode: string | undefined): LlmProviderMode {
  if (rawMode === "dummy" || rawMode === "openai") return rawMode;
  return "off";
}
