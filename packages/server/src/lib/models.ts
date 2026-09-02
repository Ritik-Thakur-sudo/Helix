import {
  anthropic,
  type AnthropicLanguageModelOptions,
} from "@ai-sdk/anthropic";
import { openai, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { groq, type GroqLanguageModelOptions } from "@ai-sdk/groq";
import {
  findSupportedChatModel,
  type SupportedChatModel,
  type SupportedChatModelId,
  type SupportedProvider,
} from "@helix/shared";
import type { LanguageModel, streamText } from "ai";

type AnthropicModelId = Extract<
  SupportedChatModel,
  { provider: "anthropic" }
>["id"];
type OpenAIModelId = Extract<SupportedChatModel, { provider: "openai" }>["id"];
type GeminiModelId = Extract<SupportedChatModel, { provider: "google" }>["id"];
type GroqModelId = Extract<SupportedChatModel, { provider: "groq" }>["id"];
type ProviderOptions = Parameters<typeof streamText>[0]["providerOptions"];
type AnthropicProviderOptions = {
  anthropic: Pick<AnthropicLanguageModelOptions, "thinking">;
};
type OpenAIProviderOptions = {
  openai: Pick<OpenAIResponsesProviderOptions, "reasoningSummary">;
};
type GoogleProviderOptions = {
  google: Pick<GoogleLanguageModelOptions, "thinkingConfig">;
};
type GroqProviderOptions = {
  groq: Pick<GroqLanguageModelOptions, "reasoningEffort" | "reasoningFormat">;
};

export type ResolvedModel = {
  model: LanguageModel;
  provider: SupportedProvider;
  modelId: SupportedChatModelId;
  providerOptions?: ProviderOptions;
};

const ANTHROPIC_PROVIDER_OPTIONS: Partial<
  Record<AnthropicModelId, AnthropicProviderOptions>
> = {
  "claude-opus-4-6": {
    anthropic: {
      thinking: {
        type: "enabled",
        budgetTokens: 10000,
      },
    },
  },
  "claude-sonnet-4-6": {
    anthropic: {
      thinking: {
        type: "enabled",
        budgetTokens: 10000,
      },
    },
  },
};

const OPENAI_PROVIDER_OPTIONS: Partial<
  Record<OpenAIModelId, OpenAIProviderOptions>
> = {
  "gpt-5.4": {
    openai: {
      reasoningSummary: "detailed",
    },
  },
};

const GOOGLE_PROVIDER_OPTIONS: Record<GeminiModelId, GoogleProviderOptions> = {
  "gemini-3.7-flash": {
    google: {
      thinkingConfig: {
        thinkingLevel: "high",
        includeThoughts: true,
      },
    },
  },
  "gemini-2.5-flash": {
    google: {
      thinkingConfig: {
        thinkingBudget: 10000,
        includeThoughts: true,
      },
    },
  },
  "gemini-2.5-flash-lite": {
    google: {
      thinkingConfig: {
        thinkingBudget: 10000,
        includeThoughts: true,
      },
    },
  },
};

const GROQ_PROVIDER_OPTIONS: Record<GroqModelId, GroqProviderOptions> = {
  "openai/gpt-oss-120b": {
    groq: {
      reasoningEffort: "high",
      reasoningFormat: "parsed",
    },
  },
  "openai/gpt-oss-20b": {
    groq: {
      reasoningEffort: "high",
      reasoningFormat: "parsed",
    },
  },
};

function assertUnsupportedProvider(provider: never): never {
  throw new Error(`Unsupported provider: ${provider}`);
}

function resolveAnthropicModel(modelId: AnthropicModelId): ResolvedModel {
  return {
    model: anthropic(modelId),
    provider: "anthropic",
    modelId,
    providerOptions: ANTHROPIC_PROVIDER_OPTIONS[modelId],
  };
}

function resolveOpenAIModel(modelId: OpenAIModelId): ResolvedModel {
  return {
    model: openai(modelId),
    provider: "openai",
    modelId,
    providerOptions: OPENAI_PROVIDER_OPTIONS[modelId],
  };
}

function resolveGoogleModel(modelId: GeminiModelId): ResolvedModel {
  return {
    model: google(modelId),
    provider: "google",
    modelId,
    providerOptions: GOOGLE_PROVIDER_OPTIONS[modelId],
  };
}

function resolveGroqModel(modelId: GroqModelId): ResolvedModel {
  return {
    model: groq(modelId),
    provider: "groq",
    modelId,
    providerOptions: GROQ_PROVIDER_OPTIONS[modelId],
  };
}

function resolveSupportedChatModel(model: SupportedChatModel): ResolvedModel {
  switch (model.provider) {
    case "anthropic":
      return resolveAnthropicModel(model.id);
    case "openai":
      return resolveOpenAIModel(model.id);
    case "google":
      return resolveGoogleModel(model.id);
    case "groq":
      return resolveGroqModel(model.id);
    default:
      return assertUnsupportedProvider(model);
  }
}

export function isSupportedChatModel(
  modelId: string,
): modelId is SupportedChatModelId {
  return findSupportedChatModel(modelId) != null;
}

export function resolveChatModel(modelId: string): ResolvedModel {
  const model = findSupportedChatModel(modelId);
  if (!model) {
    throw new Error(`Unsupported model: ${modelId}`);
  }

  return resolveSupportedChatModel(model);
}
