import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import {
  findSupportedChatModel,
  type SupportedChatModel,
  type SupportedChatModelId,
  type SupportedProvider,
} from "@helix/shared";
import type { LanguageModel } from "ai";

type AnthropicModelId = Extract<
  SupportedChatModel,
  { provider: "anthropic" }
>["id"];

type OpenAIModelId = Extract<SupportedChatModel, { provider: "openai" }>["id"];

type GoogleModelId = Extract<SupportedChatModel, { provider: "google" }>["id"];

type GroqModelId = Extract<SupportedChatModel, { provider: "groq" }>["id"];

export type ResolvedModel = {
  model: LanguageModel;
  provider: SupportedProvider;
  modelId: SupportedChatModelId;
};

function assertUnsupportedProvider(provider: never): never {
  throw new Error(`Unsupported provider: ${provider}`);
}

function resolveAnthropicModel(modelId: AnthropicModelId): ResolvedModel {
  return {
    model: anthropic(modelId),
    provider: "anthropic",
    modelId,
  };
}

function resolveOpenAIModel(modelId: OpenAIModelId): ResolvedModel {
  return {
    model: openai(modelId),
    provider: "openai",
    modelId,
  };
}

function resolveGoogleModel(modelId: GoogleModelId): ResolvedModel {
  return {
    model: google(modelId),
    provider: "google",
    modelId,
  };
}

function resolveGroqModel(modelId: GroqModelId): ResolvedModel {
  return {
    model: groq(modelId),
    provider: "groq",
    modelId,
  };
}

function resolveSupportedChatModel(model: SupportedChatModel): ResolvedModel {
  const provider = model.provider;

  switch (provider) {
    case "anthropic":
      return resolveAnthropicModel(model.id);
    case "openai":
      return resolveOpenAIModel(model.id);
    case "google":
      return resolveGoogleModel(model.id);
    case "groq":
      return resolveGroqModel(model.id);
    default:
      return assertUnsupportedProvider(provider);
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
