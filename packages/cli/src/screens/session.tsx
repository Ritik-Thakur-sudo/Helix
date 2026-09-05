import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import z from "zod";
import type { InferResponseType } from "hono/client";
import { UserMessage, BotMessage, ErrorMessage } from "../components/messages";
import { useToast } from "../providers/toast";
import { getErrorMessage } from "../lib/httpErrors";
import { apiClient } from "../lib/apiClient";
import { SessionShell } from "../components/sessionShell";
import { type SupportedChatModelId, type ModeType } from "@helix/shared";
import { useChat } from "../hooks/useChat";
import type { Message } from "../hooks/useChat";
import { useKeyboard } from "@opentui/react";
import { useKeyboardLayer } from "../providers/keyboardLayer";
import { usePromptConfig } from "../providers/promptConfig";

type SessionData = InferResponseType<
  (typeof apiClient.sessions)[":id"]["$get"],
  200
>;

const sessionLocationSchema = z.object({
  session: z.custom<SessionData>(
    (val) => val != null && typeof val === "object" && "id" in val,
  ),

  initialPrompt: z
    .object({
      message: z.string(),
      mode: z.custom<ModeType>(),
      model: z.custom<SupportedChatModelId>(),
    })
    .optional(),
});

function ChatMessage({ message }: { message: Message }) {
  if (message.role === "user") {
    const text = message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");

    return (
      <UserMessage message={text} mode={message.metadata?.mode ?? "BUILD"} />
    );
  }

  return (
    <BotMessage
      parts={message.parts}
      model={message.metadata?.model ?? "unknown"}
      mode={message.metadata?.mode ?? "BUILD"}
      durationMs={message.metadata?.durationMs}
      streaming={false}
    />
  );
}

function SessionChat({
  session,
  initialPrompt,
}: {
  session: SessionData;
  initialPrompt?: {
    message: string;
    mode: ModeType;
    model: SupportedChatModelId;
  };
}) {
  const [initialMessages] = useState(
    () => session.messages as unknown as Message[],
  );
  const { mode, model } = usePromptConfig();
  const { isTopLayer } = useKeyboardLayer();

  const { messages, status, submit, abort, interrupt, error } = useChat(
    session.id,
    initialMessages,
  );

  const hasSubmittedInitialPromptRef = useRef(false);

  // stop pending reply when user leaves this sessions.
  useEffect(() => {
    return () => {
      void abort();
    };
  }, [abort]);

  useKeyboard((key) => {
    if (key.name === "escape" && isTopLayer("base") && status === "streaming") {
      key.preventDefault();
      interrupt();
    }
  });

  useEffect(() => {
    if (!initialPrompt || hasSubmittedInitialPromptRef.current) {
      return;
    }

    hasSubmittedInitialPromptRef.current = true;

    void submit({
      userText: initialPrompt.message,
      mode: initialPrompt.mode,
      model: initialPrompt.model,
    });
  }, [initialPrompt, submit]);

  return (
    <SessionShell
      onSubmit={(text) =>
        submit({
          userText: text,
          mode,
          model,
        })
      }
      loading={status === "submitted" || status === "streaming"}
      interruptible={status === "submitted" || status === "streaming"}
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {error && <ErrorMessage message={error.message} />}
    </SessionShell>
  );
}

export function Session() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const prefetched = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);

    return parsed.success ? parsed.data : null;
  }, [location.state]);

  const [session, setSession] = useState<SessionData | null>(
    prefetched?.session ?? null,
  );

  useEffect(() => {
    if (prefetched?.session) {
      return;
    }

    setSession(null);

    if (!id) {
      return;
    }

    let ignore = false;
    const fetchSession = async () => {
      try {
        const res = await apiClient.sessions[":id"].$get({
          param: { id },
        });

        if (ignore) {
          return;
        }
        if (!res.ok) {
          throw new Error(await getErrorMessage(res));
        }

        const resolved = await res.json();
        setSession(resolved);
      } catch (error) {
        if (ignore) {
          return;
        }

        toast.show({
          variant: "error",
          message:
            error instanceof Error ? error.message : "Failed to load session",
        });
        navigate("/", { replace: true });
      }
    };

    fetchSession();
    return () => {
      ignore = true;
    };
  }, [id, prefetched, toast, navigate]);

  if (!session) {
    return <SessionShell onSubmit={() => {}} inputDisabled loading />;
  }
  return (
    <SessionChat
      key={session.id}
      session={session}
      initialPrompt={prefetched?.initialPrompt}
    />
  );
}
