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
  const statusStyles: Record<typeof status, string> = {
    idle: "bg-slate-100 text-slate-600",
    loading: "bg-blue-50 text-blue-700",
    error: "bg-rose-50 text-rose-700",
  };

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
    <section className="flex flex-col gap-4 p-4 top-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            🤖 AI Assistant
          </h2>
          <p className="text-sm text-slate-600">
            Describe the interaction in natural language.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
        >
          {status === "loading" ? "Parsing" : "Ready"}
        </span>
      </div>

      <div className="flex h-96 flex-col gap-3 overflow-auto rounded-xl border border-slate-200 bg-white p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm italic text-slate-500 text-center">
              Start by describing the interaction.
              <br />
              For example: <span>&quot;{suggestion}&quot;</span>
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
                message.role === "user"
                  ? "border-blue-100 bg-blue-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <span className="mb-2 inline-flex text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {message.role === "user" ? "You" : "AI"}
              </span>
              <p className="text-slate-900">{message.content}</p>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type the interaction details..."
        />
        <button
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          onClick={handleSend}
          disabled={status === "loading"}
        >
          Send to AI
        </button>
      </div>

      <p className="text-xs text-slate-500">
        AI extraction will populate the structured form for review.
      </p>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </section>
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
    topics_discussed: data.summary || "",
    voice_note_consent: false,
    voice_note_summary: "",
    materials_shared: "",
    brochures_shared: false,
    q_search: "",
    samples_distributed: "",
    no_samples: false,
    sentiment: data.sentiment || "",
    outcomes: "",
    follow_up_actions: data.follow_up || "",
  };
}
