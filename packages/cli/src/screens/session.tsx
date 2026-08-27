import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import z from "zod";
import type { InferResponseType } from "hono/client";
import { UserMessage, BotMessage, ErrorMessage } from "../components/messages";
import { useToast } from "../providers/toast";
import { getErrorMessage } from "../lib/httpErrors";
import { apiClient } from "../lib/apiClient";
import { SessionShell } from "../components/sessionShell";
import prettyMs from "pretty-ms";
import {
  DEFAULT_CHAT_MODEL_ID,
  type SupportedChatModelId,
} from "@helix/shared";
import { useChat } from "../hooks/useChat";
import type { Message, ClientMessagePart } from "../hooks/useChat";
import { useKeyboard } from "@opentui/react";
import { MessageStatus } from "@helix/database/enums";
import { useKeyboardLayer } from "../providers/keyboardLayer";

type SessionData = InferResponseType<
  (typeof apiClient.sessions)[":id"]["$get"],
  200
>;

const sessionLocationSchema = z.object({
  Session: z.custom<SessionData>(
    (val) => val != null && typeof val === "object" && "id" in val,
  ),
});

function mapDbMessages(dbMessages: SessionData["messages"]): Message[] {
  return dbMessages.map((m): Message => {
    if (m.role === "ERROR") {
      return {
        id: m.id,
        role: "error",
        content: m.content,
      };
    }

    if (m.role === "USER") {
      return {
        id: m.id,
        role: "user",
        content: m.content,
        mode: m.mode,
        model: m.model as SupportedChatModelId,
      };
    }

    return {
      id: m.id,
      role: "assistant",
      content: m.content,
      mode: m.mode,
      model: m.model as SupportedChatModelId,
      parts: [
        {
          type: "text",
          text: m.content,
        },
      ],
      ...(m.duration != null ? { duration: prettyMs(m.duration * 1000) } : {}),
      interrupted: m.status === MessageStatus.INTERRUPTED,
    };
  });
}

function ChatMessage({ message }: { message: Message }) {
  if (message.role === "user") {
    return <UserMessage message={message.content} />;
  }

  if (message.role === "error") {
    return <ErrorMessage message={message.content} />;
  }

  return (
    <BotMessage
      parts={message.parts}
      mode={message.mode}
      model={message.model}
      duration={message.duration}
      streaming={false}
      interrupted={message.interrupted}
    />
  );
}

function SessionChat({ session }: { session: SessionData }) {
  const [initialMessages] = useState(() => mapDbMessages(session.messages));
  const { isTopLayer } = useKeyboardLayer();

  const { messages, streaming, submit, abort, interrupt } = useChat(
    session.id,
    initialMessages,
  );

  useEffect(() => {
    return () => abort();
  }, [abort]);

  useKeyboard((key) => {
    if (
      key.name === "escape" &&
      isTopLayer("base") &&
      streaming.status === "streaming"
    ) {
      key.preventDefault();
      interrupt();
    }
  });

  return (
    <SessionShell
      onSubmit={(text) =>
        submit({ userText: text, mode: "BUILD", model: DEFAULT_CHAT_MODEL_ID })
      }
      loading={streaming.status === "streaming"}
      interruptible={streaming.status === "streaming"}
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {streaming.status === "streaming" && streaming.parts.length > 0 && (
        <BotMessage
          parts={streaming.parts}
          mode={streaming.mode}
          model={streaming.model}
          streaming
        />
      )}
    </SessionShell>
  );
}

export function Session() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const preFetched = useMemo(() => {
    const parsed = sessionLocationSchema.safeParse(location.state);

    return parsed.success ? parsed.data.Session : null;
  }, [location.state]);

  const [session, setSession] = useState<SessionData | null>(preFetched);

  useEffect(() => {
    if (preFetched) {
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
  }, [id, preFetched, toast, navigate]);

  if (!session) {
    return <SessionShell onSubmit={() => {}} inputDisabled loading />;
  }

  return <SessionChat key={session.id} session={session} />;
}
