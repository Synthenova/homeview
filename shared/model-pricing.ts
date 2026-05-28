type UsageShape = {
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
};

type ModelPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
};

const MODEL_PRICING: Record<string, ModelPricing> = {
  "openai/gpt-4o-mini": {
    inputPerMillion: 0.15,
    cachedInputPerMillion: 0.075,
    outputPerMillion: 0.6
  },
  "openai/gpt-4.1-mini": {
    inputPerMillion: 0.4,
    cachedInputPerMillion: 0.1,
    outputPerMillion: 1.6
  },
  "google/gemini-2.5-flash": {
    inputPerMillion: 0.3,
    outputPerMillion: 2.5
  }
};

function roundUsd(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export function estimateUsageCostUsd(model: string, usage: UsageShape) {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return null;

  const cachedInputTokens = Math.max(usage.cachedInputTokens ?? 0, 0);
  const totalInputTokens = Math.max(usage.inputTokens ?? 0, 0);
  const billableInputTokens = Math.max(totalInputTokens - cachedInputTokens, 0);
  const outputTokens = Math.max(usage.outputTokens ?? 0, 0);

  const inputCost = (billableInputTokens / 1_000_000) * pricing.inputPerMillion;
  const cachedInputCost = pricing.cachedInputPerMillion
    ? (cachedInputTokens / 1_000_000) * pricing.cachedInputPerMillion
    : 0;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerMillion;

  return roundUsd(inputCost + cachedInputCost + outputCost);
}
