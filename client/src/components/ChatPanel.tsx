"use client";

import { useState } from "react";

import { sendChat, type ChatResponse, type InteractionRecord } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { addMessage, setError, setStatus } from "@/lib/slices/chatSlice";
import { setForm } from "@/lib/slices/interactionSlice";

const defaultSuggestions = [
  "Met Dr. Lee to discuss Zorvia. Positive feedback. Follow up next week.",
  "Call with Dr. Singh about trial eligibility. Send study deck.",
];

export default function ChatPanel() {
  const dispatch = useAppDispatch();
  const { messages, status, error } = useAppSelector((state) => state.chat);
  const [input, setInput] = useState("");
  const suggestion = defaultSuggestions[0];

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || status === "loading") {
      return;
    }

    dispatch(addMessage({ role: "user", content: trimmed }));
    dispatch(setStatus("loading"));
    setInput("");

    try {
      const response = await sendChat(trimmed);
      const assistantText = buildAssistantResponse(response);
      dispatch(addMessage({ role: "assistant", content: assistantText }));

      if (response?.data) {
        dispatch(setForm(toFormState(response.data)));
      }

      dispatch(setStatus("idle"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed";
      dispatch(setError(message));
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>Conversation</h2>
          <p className="panel-subtitle">
            Describe the interaction in natural language.
          </p>
        </div>
        <span className={`status status-${status}`}>
          {status === "loading" ? "Parsing" : "Ready"}
        </span>
      </div>

      <div className="chat-window">
        {messages.length === 0 ? (
          <p className="chat-empty">
            Example: <span>&quot;{suggestion}&quot;</span>
          </p>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`chat-message ${message.role}`}
          >
            <span className="chat-role">
              {message.role === "user" ? "Rep" : "AI"}
            </span>
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <textarea
          className="input textarea"
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type the interaction details..."
        />
        <button
          className="btn primary"
          onClick={handleSend}
          disabled={status === "loading"}
        >
          Send to AI
        </button>
      </div>

      <p className="helper">
        AI extraction will populate the structured form for review.
      </p>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}

function buildAssistantResponse(response: ChatResponse) {
  if (response?.status === "saved" && response?.data?.hcp_name) {
    return `Captured and saved interaction for ${response.data.hcp_name}. Review the form for edits.`;
  }
  if (response?.message) {
    return response.message;
  }
  return "Response received. Review the form for details.";
}

function toFormState(data: InteractionRecord) {
  return {
    hcp_name: data.hcp_name || "",
    product: data.product || "",
    summary: data.summary || "",
    follow_up: data.follow_up || "",
    sentiment: data.sentiment || "",
    interaction_type: data.interaction_type || "",
    occurred_at: data.occurred_at ? String(data.occurred_at).slice(0, 16) : "",
  };
}
