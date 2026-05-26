import {
  anonymizeLlmInput,
  buildLlmRecommendationPrompt,
  generateDummyLlmRecommendation,
  isLlmRecommendationOutput,
  type LlmRecommendationInput,
  type LlmRecommendationOutput,
} from "./domain/llmRecommendations";

export type LlmProviderMode = "off" | "dummy" | "openai";

export type RetryAndTimeoutOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  backoffMs?: number;
};

// Wraps an async function with a per-attempt timeout and bounded retries.
// Used by the openai branch so transient failures (network blips, slow
// responses) do not silently drop a recommendation. Defaults are tuned for
// an interactive planner flow: 8s total per call, one retry, half-second
// backoff. Adjust at the call site as we learn more in production.
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  options: RetryAndTimeoutOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  const backoffMs = options.backoffMs ?? 500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_resolve, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`LLM call exceeded ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);
    } catch (err) {
      lastError = err;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
    if (attempt < maxAttempts && backoffMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  throw lastError;
}

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
    const prompt = buildLlmRecommendationPrompt(sanitized);
    try {
      const output = await withRetryAndTimeout(
        async () => {
          // TODO: real OpenAI SDK call goes here. Use `prompt.system` and
          // `prompt.user`, expect a JSON response, validate with
          // isLlmRecommendationOutput before returning. Until that lands we
          // throw so the retry/timeout path is exercised end-to-end and the
          // caller falls back to deterministic instead of producing fake
          // openai-tagged output.
          void prompt;
          throw new Error("mode=openai is scaffolded but the OpenAI call is not yet wired");
        },
        { timeoutMs: 8000, maxAttempts: 1 },
      );
      if (!isLlmRecommendationOutput(output)) {
        console.warn("[llmRecommendations] openai output failed self-validation");
        return null;
      }
      return { output, source: "llm-openai", latencyMs: Date.now() - start };
    } catch (err) {
      console.warn(
        "[llmRecommendations] mode=openai call failed; falling back to deterministic:",
        (err as Error).message,
      );
      return null;
    }
  }

  return null;
}

export function resolveLlmMode(rawMode: string | undefined): LlmProviderMode {
  if (rawMode === "dummy" || rawMode === "openai") return rawMode;
  return "off";
}
